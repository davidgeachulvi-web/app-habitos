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

export class CoinEngine {
    constructor(canvas, opts) {
        this.canvas = canvas;
        this.opts = opts || {};
        this._destroyed = false;
        this._raf = 0;
        this._materials = [];
        this._coinMaterial = null;
        this._reliefMaterial = null;
        this._ready = false;

        const size = opts.size || 300;
        this._size = size;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        this._setCamera(size);

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2));
        this.renderer.setSize(size, size, false);
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        this.renderer.shadowMap.enabled = true;
        // Three r185 deprecó PCFSoftShadowMap: se usa PCFShadowMap (mismo resultado visual).
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

        this.studio = createCoinStudio(this.renderer, this.scene);
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

        this.coin = new THREE.Mesh(buildCoinSolid(COIN_CFG, { mobile: isMobileCoinLOD() }));
        this.coin.name = 'moneda';
        this.coin.castShadow = true;
        this.coin.receiveShadow = true;

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
            this.studio.applyMetalPreset(presets, this.opts.metalId);
            this.studio.rebuildEnvironment();
            this._applyMetal(this.opts.metalId, this.opts.encendida !== false);
            if (this._destroyed) return;
            this._ready = true;
            this._loop();
            await buildCoinReliefs(this.parts, {
                themeId: this.opts.themeId,
                encendida: this.opts.encendida !== false,
                dateText: formatUnlockDate(this.opts.unlockedAt) || formatToday()
            }, this.studio.STUDIO);
            if (this._destroyed) return;
            if (typeof this.opts.onReady === 'function') this.opts.onReady();
        } catch (e) {
            console.error('CoinEngine boot', e);
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
        if (this._destroyed) return;
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
        if (!this._ready || this._destroyed) return;
        this.studio.applyViewAdaptiveLighting(this.camera, this.coinGroup);
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        this._destroyed = true;
        if (this._raf) cancelAnimationFrame(this._raf);
        this.controls.dispose();
        this.studio.dispose();
        const disposeGeo = (m) => {
            if (m && m.geometry) m.geometry.dispose();
        };
        disposeGeo(this.coin);
        disposeGeo(this.parts.glyph);
        disposeGeo(this.parts.backRelief);
        disposeGeo(this.parts.dateGrab);
        disposeGeo(this.parts.topBrand);
        this._materials.forEach(m => m && m.dispose());
        this.renderer.dispose();
    }
}

export { formatUnlockDate };

function formatToday() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return dd + ' · ' + mm + ' · ' + d.getFullYear();
}
