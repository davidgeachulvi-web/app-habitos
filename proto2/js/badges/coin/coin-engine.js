import * as THREE from '../../vendor/three.module.min.js';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { buildCoinSolid, COIN_CFG, isMobileCoinLOD } from './coin-geometry.js';
import { metalMat, metalByLevel } from './coin-materials.js';
import {
    buildCoinReliefs, createReliefMeshes, formatUnlockDate
} from './coin-reliefs.js';
import { createCoinStudio } from './coin-scene.js';

const REST_POLAR = THREE.MathUtils.degToRad(81.8);
const REST_AZ = THREE.MathUtils.degToRad(-28.8);
const REST_DIST = 4.0;

/**
 * B-35 (iOS): resiliencia del contexto WebGL.
 * Modos de creación en escalera: si el dispositivo (Safari/iOS o WKWebView)
 * rechaza el modo con antialias, se reintenta con atributos reducidos. El
 * tier elegido condiciona el presupuesto de GPU (DPR y sombras).
 */
const RENDERER_TIERS = [
    { antialias: true, alpha: true, powerPreference: 'high-performance' },
    { antialias: false, alpha: true, powerPreference: 'default' },
    { antialias: false, alpha: false }
];
let lastGoodTier = -1;

function trackDiag(name, props) {
    try {
        if (window.awakeAnalytics && window.awakeAnalytics.track) {
            window.awakeAnalytics.track(name, props || {});
        } else {
            console.info('[badge3d]', name, props || '');
        }
    } catch (e) {}
}

function esIOS() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return true;
    // iPadOS 13+ se reporta como Macintosh con pantalla táctil.
    return /Macintosh/i.test(ua) && !!(navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
}

function memoriaBaja() {
    return !!(typeof navigator !== 'undefined' && navigator.deviceMemory && navigator.deviceMemory <= 4);
}

function dprObjetivo(tier) {
    const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
    let cap = 2;
    if (esIOS() || memoriaBaja()) cap = 1.5;
    if (tier === 1) cap = Math.min(cap, 1.75);
    if (tier === 2) cap = Math.min(cap, 1.25);
    return Math.min(dpr, cap);
}

export class CoinEngine {
    constructor(canvas, opts) {
        this.canvas = canvas;
        this.opts = opts || {};
        this._destroyed = false;
        this._contextLost = false;
        this._raf = 0;
        this._materials = [];
        this._coinMaterial = null;
        this._reliefMaterial = null;
        this._ready = false;

        const size = opts.size || 300;
        this._size = size;

        // --- Escalera de creación del renderer (B-35) -----------------------
        let tier = -1;
        let renderer = null;
        const startAt = lastGoodTier >= 0 ? lastGoodTier : 0;
        for (let i = startAt; i < RENDERER_TIERS.length; i++) {
            try {
                renderer = new THREE.WebGLRenderer(Object.assign({ canvas: canvas }, RENDERER_TIERS[i]));
                tier = i;
                break;
            } catch (e) {
                trackDiag('badge3d_tier_fail', { tier: i, error: (e && e.message) || String(e) });
            }
        }
        if (!renderer && startAt > 0) {
            // Si el mejor modo volvió a fallar, reintentar desde 0 (quizá ya
            // hay memoria libre tras un cierre anterior).
            for (let i = 0; i < startAt; i++) {
                try {
                    renderer = new THREE.WebGLRenderer(Object.assign({ canvas: canvas }, RENDERER_TIERS[i]));
                    tier = i;
                    break;
                } catch (e) {}
            }
        }
        if (!renderer) {
            throw new Error('WebGL2 no disponible: no se pudo crear el contexto del visor 3D (todos los modos probados).');
        }
        lastGoodTier = tier;
        this.renderer = renderer;

        const pixelRatio = dprObjetivo(tier);
        const ios = esIOS();
        const lowMem = memoriaBaja();
        const mobileLOD = isMobileCoinLOD();
        // iOS con memoria limitada o con AA descartado -> sombras ligeras.
        const budgetReducido = (ios || lowMem) && mobileLOD;
        const shadowMapSize = budgetReducido ? 1024 : 2048;
        const shadowsOn = tier < 2;

        this.diag = { tier, pixelRatio, ios, lowMem, shadowMapSize, shadowsOn };

        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(size, size, false);
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        this.renderer.shadowMap.enabled = shadowsOn;
        // Three r185 deprecó PCFSoftShadowMap: se usa PCFShadowMap (mismo resultado visual).
        if (shadowsOn) this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

        // --- Pérdida/restauración de contexto (B-35: iOS revoca contextos) --
        this._onCtxLost = (ev) => {
            try { if (ev && ev.preventDefault) ev.preventDefault(); } catch (e) {}
            if (this._destroyed) return;
            this._contextLost = true;
            if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; }
            trackDiag('badge3d_context_lost', {});
            if (typeof this.opts.onContextLost === 'function') this.opts.onContextLost();
        };
        this._onCtxRestored = (ev) => {
            if (this._destroyed) return;
            const estabaPerdido = this._contextLost;
            this._contextLost = false;
            if (!estabaPerdido) return;
            trackDiag('badge3d_context_restored', {});
            // El contenido GPU (entorno PMREM) se perdió con el contexto:
            // reconstruirlo antes de reanudar el bucle.
            try {
                this.studio.rebuildEnvironment();
                if (this._coinMaterial) this.studio.applyStudio();
            } catch (e) {}
            if (this._ready && !this._destroyed) this._loop();
            if (typeof this.opts.onContextRestored === 'function') this.opts.onContextRestored();
        };
        canvas.addEventListener('webglcontextlost', this._onCtxLost, false);
        canvas.addEventListener('webglcontextrestored', this._onCtxRestored, false);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        this._setCamera(size);

        this.studio = createCoinStudio(this.renderer, this.scene, { shadowMapSize, shadowsOn });
        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.enablePan = false;
        this.controls.enableZoom = true;
        this.controls.minDistance = 2.1;
        this.controls.maxDistance = 7;
        this.controls.minPolarAngle = THREE.MathUtils.degToRad(52);
        this.controls.maxPolarAngle = THREE.MathUtils.degToRad(118);
        this.controls.target.set(0, 0, 0);

        this.coinGroup = new THREE.Group();
        this.scene.add(this.coinGroup);

        this.coin = new THREE.Mesh(buildCoinSolid(COIN_CFG, { mobile: mobileLOD }));
        this.coin.name = 'moneda';
        this.coin.castShadow = shadowsOn;
        this.coin.receiveShadow = shadowsOn;

        this.parts = createReliefMeshes();
        this.coinGroup.add(this.coin, this.parts.glyph, this.parts.backRelief, this.parts.dateGrab, this.parts.topBrand);

        if (opts.rotX != null || opts.rotY != null) {
            this.coinGroup.rotation.x = opts.rotX != null ? opts.rotX * Math.PI / 180 : 0;
            this.coinGroup.rotation.y = opts.rotY != null ? opts.rotY * Math.PI / 180 : 0;
        }

        this._initPromise = this._boot();
    }

    _setCamera(size) {
        const dist = REST_DIST;
        const polar = REST_POLAR;
        const az = REST_AZ;
        this.camera.aspect = 1;
        this.camera.updateProjectionMatrix();
        this.camera.position.set(
            dist * Math.sin(polar) * Math.sin(az),
            dist * Math.cos(polar),
            dist * Math.sin(polar) * Math.cos(az)
        );
        this.camera.lookAt(0, 0, 0);
        if (this.renderer) this.renderer.setSize(size, size, false);
    }

    async _boot() {
        try {
            const presets = await this.studio.loadPresets();
            if (this._destroyed || this._contextLost) return;
            this.studio.applyMetalPreset(presets, this.opts.metalId);
            this.studio.rebuildEnvironment();
            this._applyMetal(this.opts.metalId, this.opts.encendida !== false);
            if (this._destroyed || this._contextLost) return;
            this._ready = true;
            this._loop();
            await buildCoinReliefs(this.parts, {
                themeId: this.opts.themeId,
                encendida: this.opts.encendida !== false,
                dateText: formatUnlockDate(this.opts.unlockedAt) || formatToday()
            }, this.studio.STUDIO);
            if (this._destroyed) return;
            trackDiag('badge3d_boot_ok', { tier: this.diag.tier });
            if (typeof this.opts.onReady === 'function') this.opts.onReady();
        } catch (e) {
            const reason = (e && e.message) || String(e);
            console.error('CoinEngine boot', e);
            trackDiag('badge3d_boot_fail', { reason });
            if (typeof this.opts.onFail === 'function') this.opts.onFail({ reason, fatal: false });
            if (typeof this.opts.onReady === 'function') this.opts.onReady();
        }
    }

    _applyMetal(metalId, encendida) {
        const { metal } = metalByLevel(metalId);
        this.studio.STUDIO.baseEnv = metal.env;
        const locked = !encendida;
        const ST = this.studio.STUDIO;
        const old = this._materials.slice();
        this._coinMaterial = metalMat(ST, metal.color, metal.roughness, metal.env, false, metal.fieldRoughBump, locked);
        this._reliefMaterial = metalMat(ST, metal.color, metal.roughness, metal.env, true, metal.fieldRoughBump, locked);
        this._materials = [this._coinMaterial, this._reliefMaterial];
        this.coin.material = this._coinMaterial;
        this.parts.glyph.material = this._reliefMaterial;
        this.parts.backRelief.material = this._reliefMaterial;
        this.parts.dateGrab.material = this._reliefMaterial;
        this.parts.topBrand.material = this._reliefMaterial;
        old.forEach(m => m && m.dispose());
        this.studio.applyStudio();
    }

    _loop() {
        if (this._destroyed || this._contextLost) return;
        this._raf = requestAnimationFrame(() => this._loop());
        this.controls.update();
        this.studio.applyViewAdaptiveLighting(this.camera, this.coinGroup);
        this.renderer.render(this.scene, this.camera);
    }

    setSize(size) {
        this._size = size;
        this._setCamera(size);
    }

    setRotation(x, y) {
        if (this.coinGroup) {
            this.coinGroup.rotation.x = x;
            this.coinGroup.rotation.y = y;
        }
    }

    render() {
        if (!this._ready || this._destroyed || this._contextLost) return;
        this.studio.applyViewAdaptiveLighting(this.camera, this.coinGroup);
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        this._destroyed = true;
        if (this._raf) cancelAnimationFrame(this._raf);
        try {
            if (this.canvas) {
                this.canvas.removeEventListener('webglcontextlost', this._onCtxLost, false);
                this.canvas.removeEventListener('webglcontextrestored', this._onCtxRestored, false);
            }
        } catch (e) {}
        try { this.controls.dispose(); } catch (e) {}
        try { this.studio.dispose(); } catch (e) {}
        const disposeGeo = (m) => {
            if (m && m.geometry) m.geometry.dispose();
        };
        disposeGeo(this.coin);
        disposeGeo(this.parts && this.parts.glyph);
        disposeGeo(this.parts && this.parts.backRelief);
        disposeGeo(this.parts && this.parts.dateGrab);
        disposeGeo(this.parts && this.parts.topBrand);
        this._materials.forEach(m => m && m.dispose());
        try { this.renderer.dispose(); } catch (e) {}
        // Liberar el backing store (presión de memoria en iOS); el contexto
        // del canvas NO se pierde a propósito para poder reutilizarlo en la
        // próxima apertura del visor.
        try {
            if (this.canvas && this.canvas.width > 8) {
                this.canvas.width = 8;
                this.canvas.height = 8;
            }
        } catch (e) {}
    }
}

export { formatUnlockDate };

function formatToday() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return dd + ' · ' + mm + ' · ' + d.getFullYear();
}
