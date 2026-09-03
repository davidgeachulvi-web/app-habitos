import * as THREE from '../three.module.min.js';
import { makeStudioEnv } from '../coin-studio.js';
import { RoomEnvironment } from '../RoomEnvironment.js';
import { STUDIO_DEFAULTS } from './coin-materials.js';

function frontFaceBlend(facing) {
    if (facing <= 0.65) return 0;
    return Math.min(1, (facing - 0.65) / 0.35);
}

export function createCoinStudio(renderer, scene) {
    const STUDIO = Object.assign({}, STUDIO_DEFAULTS);
    let envTexture = null;
    let envMode = 'awake';
    let studioBaseEnvIntensity = 0.88;
    const pmremGen = new THREE.PMREMGenerator(renderer);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, STUDIO.key);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 16;
    keyLight.shadow.camera.left = -2.5;
    keyLight.shadow.camera.right = 2.5;
    keyLight.shadow.camera.top = 2.5;
    keyLight.shadow.camera.bottom = -2.5;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.normalBias = 0.045;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8fa3ff, STUDIO.fill);
    fillLight.position.set(-4, 2, -3);
    scene.add(fillLight);

    const rakeLight = new THREE.DirectionalLight(0xffffff, STUDIO.rakeB);
    rakeLight.position.set(3.4, -0.6, -3.2);
    scene.add(rakeLight);

    const rakeLightBack = new THREE.DirectionalLight(0xffffff, STUDIO.rakeF);
    rakeLightBack.position.set(4.8, 0.06, 2.6);
    scene.add(rakeLightBack);

    const rakeCrossL = new THREE.DirectionalLight(0xfff6ec, 0);
    rakeCrossL.position.set(-5.2, 0.10, 3.2);
    scene.add(rakeCrossL);

    const rakeCrossR = new THREE.DirectionalLight(0xfff6ec, 0);
    rakeCrossR.position.set(5.2, 0.08, 3.2);
    scene.add(rakeCrossR);

    const frontDetailLight = new THREE.DirectionalLight(0xfff9f2, 0);
    frontDetailLight.position.set(0, 0.3, 6);
    scene.add(frontDetailLight);

    const hemiLight = new THREE.HemisphereLight(0xdce8ff, 0x1a1410, STUDIO.hemi);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xb8c8e8, STUDIO.rim);
    rimLight.position.set(-2.5, 1.2, 5.8);
    scene.add(rimLight);

    // Sin peana: la moneda flota sola en la simulación, con todas sus luces y
    // reflejos. Solo se conserva un disco de sombra invisible para que la
    // moneda siga proyectando su sombra suave sobre el vacío.
    const shadowDiscMat = new THREE.ShadowMaterial({ opacity: STUDIO.shadowOpacity });
    const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(3.4, 64), shadowDiscMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = -1.94;
    shadowDisc.receiveShadow = true;
    scene.add(shadowDisc);

    const _camDir = new THREE.Vector3();
    const _faceFront = new THREE.Vector3();
    const _faceBack = new THREE.Vector3();
    const _detailOff = new THREE.Vector3();

    function disposeEnv() {
        if (envTexture) {
            envTexture.dispose();
            envTexture = null;
        }
    }

    function applyStudio() {
        renderer.toneMappingExposure = STUDIO.exposure;
        keyLight.intensity = STUDIO.key;
        fillLight.intensity = STUDIO.fill;
        rakeLightBack.intensity = STUDIO.rakeF;
        rakeLight.intensity = STUDIO.rakeB;
        rimLight.intensity = STUDIO.rim;
        hemiLight.intensity = STUDIO.hemi;
        keyLight.castShadow = STUDIO.shadow;
        renderer.shadowMap.enabled = STUDIO.shadow;
        studioBaseEnvIntensity = (STUDIO.baseEnv || 0.86) * STUDIO.envMul;
        scene.environmentIntensity = studioBaseEnvIntensity;
        if (shadowDisc && shadowDisc.material) {
            shadowDisc.material.opacity = STUDIO.shadowOpacity;
        }
        const az = STUDIO.lightAz * Math.PI / 180;
        const el = STUDIO.lightEl * Math.PI / 180;
        const d = 7.4;
        keyLight.position.set(
            d * Math.cos(el) * Math.sin(az),
            d * Math.sin(el),
            d * Math.cos(el) * Math.cos(az)
        );
    }

    function rebuildEnvironment() {
        disposeEnv();
        if (envMode === 'room') {
            const room = new RoomEnvironment();
            envTexture = pmremGen.fromScene(room, 0.04).texture;
            room.traverse(o => {
                if (o.isMesh) {
                    o.geometry.dispose();
                    o.material.dispose();
                }
            });
        } else {
            envTexture = makeStudioEnv(renderer, {
                frontBoost: STUDIO.frontBoost,
                sideBoost: STUDIO.sideBoost,
                ceilingBoost: STUDIO.ceilingBoost,
                floorBoost: STUDIO.floorBoost
            });
        }
        scene.environment = envTexture;
        applyStudio();
    }

    function applyViewAdaptiveLighting(camera, coinGroup) {
        if (!coinGroup) return;
        const baseKey = STUDIO.key;
        const baseFill = STUDIO.fill;

        function resetDirectLights() {
            keyLight.intensity = baseKey;
            fillLight.intensity = baseFill;
            rakeLightBack.intensity = STUDIO.rakeF;
            rakeLight.intensity = STUDIO.rakeB;
            rakeCrossL.intensity = 0;
            rakeCrossR.intensity = 0;
            frontDetailLight.intensity = 0;
            scene.environmentIntensity = studioBaseEnvIntensity;
        }

        if (!STUDIO.viewAdaptive) {
            resetDirectLights();
            return;
        }

        camera.getWorldDirection(_camDir);
        _faceFront.set(0, 0, 1).applyQuaternion(coinGroup.quaternion);
        _faceBack.set(0, 0, -1).applyQuaternion(coinGroup.quaternion);
        const facingFront = Math.abs(_camDir.dot(_faceFront));
        const facingBack = Math.abs(_camDir.dot(_faceBack));

        let t = 0;
        let onFront = false;
        if (facingFront >= facingBack && facingFront > 0.65) {
            t = frontFaceBlend(facingFront);
            onFront = true;
        } else if (facingBack > 0.65) {
            t = frontFaceBlend(facingBack);
            onFront = false;
        }

        if (t <= 0) {
            resetDirectLights();
            return;
        }

        const keyCut = STUDIO.frontKeyCut != null ? STUDIO.frontKeyCut : 0.42;
        const fillCut = STUDIO.frontFillCut != null ? STUDIO.frontFillCut : 0.62;
        keyLight.intensity = baseKey * (1 - keyCut * t);
        fillLight.intensity = baseFill * (1 - fillCut * t);
        scene.environmentIntensity = studioBaseEnvIntensity * (1 - STUDIO.frontEnvCut * t);

        if (onFront) {
            rakeLightBack.intensity = STUDIO.rakeF + STUDIO.frontRakeBoost * t;
            rakeLight.intensity = STUDIO.rakeB * (1 - 0.35 * t);
            const cross = (STUDIO.frontCross != null ? STUDIO.frontCross : 1.05) * t;
            rakeCrossL.intensity = cross;
            rakeCrossR.intensity = cross * 0.92;
            _detailOff.set(-0.62, 0.24, 0.08).applyQuaternion(camera.quaternion);
            frontDetailLight.position.copy(camera.position).add(_detailOff);
            frontDetailLight.intensity = (STUDIO.frontDetail != null ? STUDIO.frontDetail : 0.62) * t;
        } else {
            rakeLight.intensity = STUDIO.rakeB + STUDIO.frontRakeBoost * t;
            rakeLightBack.intensity = STUDIO.rakeF * (1 - 0.35 * t);
            rakeCrossL.intensity = 0;
            rakeCrossR.intensity = 0;
            frontDetailLight.intensity = 0;
        }
    }

    async function loadPresets() {
        try {
            const url = new URL('./coin-presets.json', import.meta.url);
            const res = await fetch(url);
            if (res.ok) return await res.json();
        } catch (e) { /* offline fallback */ }
        return null;
    }

    function applyMetalPreset(presets, metalId) {
        if (!presets) return;
        if (presets.defaults) Object.assign(STUDIO, presets.defaults);
        const ids = ['hierro', 'bronce', 'cobre', 'plata', 'oro', 'platino'];
        const id = ids[Math.max(0, Math.min(5, (metalId || 1) - 1))];
        const p = presets.metals && presets.metals[id];
        if (p && p.studio) Object.assign(STUDIO, p.studio);
    }

    function dispose() {
        disposeEnv();
        pmremGen.dispose();
        if (shadowDisc) {
            if (shadowDisc.geometry) shadowDisc.geometry.dispose();
            if (shadowDisc.material) shadowDisc.material.dispose();
        }
    }

    return {
        STUDIO,
        applyStudio,
        rebuildEnvironment,
        applyViewAdaptiveLighting,
        loadPresets,
        applyMetalPreset,
        dispose
    };
}
