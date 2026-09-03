/**
 * AWAKE — moneda 3D de insignias (Three.js procedural).
 * Todos los imports del grafo usan rutas relativas (sin import map),
 * para funcionar en cualquier Safari/iOS.
 *
 * B-35 (iOS): diagnóstico + resiliencia del contexto WebGL.
 *  - sonda única cacheada y con pérdida de contexto (sin fuga de
 *    contextos en iOS, que limita el número de contextos vivos).
 *  - el wrapper nunca lanza: los fallos se reportan por `opts.onFail`
 *    y quedan en `this.diag` para la capa de UI (app.js).
 */
import { CoinEngine } from './coin/coin-engine.js';

let PROBE = { ok: null, renderer: null, version: null, reason: null };

function trackDiag(name, props) {
    try {
        if (window.awakeAnalytics && window.awakeAnalytics.track) {
            window.awakeAnalytics.track(name, props || {});
        } else {
            console.info('[badge3d]', name, props || '');
        }
    } catch (e) {}
}

function probarWebGL2() {
    if (PROBE.ok != null) return PROBE.ok === true;
    PROBE = { ok: false, renderer: null, version: null, reason: null };
    try {
        if (typeof WebGL2RenderingContext === 'undefined') {
            PROBE.reason = 'no-webgl2-api';
            trackDiag('badge3d_caps', PROBE);
            return false;
        }
        const c = document.createElement('canvas');
        let gl = null;
        try { gl = c.getContext('webgl2', { antialias: false }); } catch (e) {}
        if (!gl) {
            PROBE.reason = 'context-null';
            trackDiag('badge3d_caps', PROBE);
            return false;
        }
        try {
            const info = gl.getExtension('WEBGL_debug_renderer_info');
            PROBE.renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || '') : '';
            PROBE.version = String(gl.getParameter(gl.VERSION) || '');
            const lose = gl.getExtension('WEBGL_lose_context');
            if (lose) lose.loseContext();
        } catch (e) {}
        PROBE.ok = true;
        trackDiag('badge3d_caps', PROBE);
    } catch (e) {
        PROBE.reason = 'exception: ' + (e && e.message ? e.message : String(e));
        trackDiag('badge3d_caps', PROBE);
    }
    return PROBE.ok === true;
}

function BadgeCoin3D(canvas, opts) {
    if (!(this instanceof BadgeCoin3D)) return new BadgeCoin3D(canvas, opts);
    opts = opts || {};
    this.canvas = canvas;
    this._engine = null;
    this._destroyed = false;
    this.encendida = opts.encendida !== false;
    this.metalId = opts.metalId || 1;
    this.themeId = opts.themeId || 0;
    this.diag = { ok: false, reason: null, tier: -1 };

    if (!probarWebGL2()) {
        this.diag.reason = PROBE.reason || 'webgl2-unavailable';
        trackDiag('badge3d_fail', { reason: this.diag.reason, fatal: true });
        if (typeof opts.onFail === 'function') opts.onFail({ reason: this.diag.reason, fatal: true });
        if (typeof opts.onReady === 'function') opts.onReady();
        return;
    }
    try {
        this._engine = new CoinEngine(canvas, opts);
        this.diag.ok = true;
        if (this._engine.diag) {
            this.diag.tier = this._engine.diag.tier;
            this.diag.detalle = this._engine.diag;
        }
    } catch (e) {
        this.diag.reason = (e && e.message) || String(e);
        trackDiag('badge3d_fail', { reason: this.diag.reason, fatal: true });
        if (typeof opts.onFail === 'function') opts.onFail({ reason: this.diag.reason, fatal: true });
        if (typeof opts.onReady === 'function') opts.onReady();
    }
}

BadgeCoin3D.prototype.setRotation = function (x, y) {
    if (this._engine) this._engine.setRotation(x, y);
};

BadgeCoin3D.prototype.setSize = function (size) {
    if (this._engine) this._engine.setSize(size);
};

BadgeCoin3D.prototype.render = function () {
    if (this._engine) this._engine.render();
};

BadgeCoin3D.prototype.isReady = function () {
    return !!(this._engine && this._engine._ready && !this._engine._contextLost);
};

BadgeCoin3D.prototype.destroy = function () {
    this._destroyed = true;
    if (this._engine) {
        try { this._engine.destroy(); } catch (e) {}
        this._engine = null;
    }
};

/** API estática para diagnóstico (app.js / overlay ?debug3d=1). */
BadgeCoin3D.probe = probarWebGL2;
BadgeCoin3D.diag = function () { return Object.assign({}, PROBE); };

window.BadgeCoin3D = BadgeCoin3D;

export { BadgeCoin3D, probarWebGL2 };
