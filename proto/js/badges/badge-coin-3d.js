/**
 * AWAKE — moneda 3D de insignias (Three.js procedural).
 * Todos los imports del grafo usan rutas relativas (sin import map),
 * para funcionar en cualquier Safari/iOS.
 */
import { CoinEngine } from './coin/coin-engine.js';

function BadgeCoin3D(canvas, opts) {
    if (!(this instanceof BadgeCoin3D)) return new BadgeCoin3D(canvas, opts);
    opts = opts || {};
    this.canvas = canvas;
    this._engine = null;
    this._destroyed = false;
    this.encendida = opts.encendida !== false;
    this.metalId = opts.metalId || 1;
    this.themeId = opts.themeId || 0;

    if (!webgl2Disponible()) {
        console.warn('BadgeCoin3D: WebGL2 no disponible en este dispositivo; no se puede renderizar la moneda 3D.');
        if (typeof opts.onReady === 'function') opts.onReady();
        return;
    }

    try {
        this._engine = new CoinEngine(canvas, opts);
    } catch (e) {
        console.error('BadgeCoin3D:', e);
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

BadgeCoin3D.prototype.destroy = function () {
    this._destroyed = true;
    if (this._engine) {
        try { this._engine.destroy(); } catch (e) {}
        this._engine = null;
    }
};

function webgl2Disponible() {
    try {
        if (typeof WebGL2RenderingContext === 'undefined') return false;
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2'));
    } catch (e) {
        return false;
    }
}

window.BadgeCoin3D = BadgeCoin3D;
