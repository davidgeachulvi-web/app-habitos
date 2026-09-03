import * as THREE from '../three.module.min.js';

export const METALS = [
    { id: 'hierro', name: 'HIERRO', color: 0x6E7882, roughness: 0.44, env: 0.86, fieldRoughBump: 0.02 },
    { id: 'bronce', name: 'BRONCE', color: 0x9E8344, roughness: 0.38, env: 0.74, fieldRoughBump: 0.01 },
    { id: 'cobre', name: 'COBRE', color: 0xC4845A, roughness: 0.22, env: 0.84, fieldRoughBump: 0.012 },
    { id: 'plata', name: 'PLATA', color: 0xF3F4F6, roughness: 0.12, env: 0.9, fieldRoughBump: 0.015 },
    { id: 'oro', name: 'ORO', color: 0xD4AF37, roughness: 0.16, env: 0.74, fieldRoughBump: 0.04 },
    { id: 'platino', name: 'PLATINO', color: 0xCDE9D8, roughness: 0.12, env: 0.78, fieldRoughBump: 0.04 }
];

export const STUDIO_DEFAULTS = {
    exposure: 0.76,
    key: 1.18,
    fill: 0.38,
    rakeF: 3.35,
    rakeB: 2.35,
    rim: 0.22,
    hemi: 0.07,
    envMul: 0.74,
    frontBoost: 0.50,
    sideBoost: 1.05,
    ceilingBoost: 0.88,
    floorBoost: 1.30,
    shadow: true,
    shadowOpacity: 0.32,
    fieldRoughnessMul: 1.08,
    reliefRoughnessMul: 1.62,
    reliefEnvMul: 0.70,
    reliefAO: 0.76,
    viewAdaptive: true,
    frontEnvCut: 0.38,
    frontRakeBoost: 1.85,
    frontDetail: 0.62,
    frontCross: 1.05,
    frontKeyCut: 0.42,
    frontFillCut: 0.62,
    lightAz: 58,
    lightEl: 34,
    baseEnv: 0.86
};

function smoothstep01(e0, e1, x) {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
}

export function bakeReliefAO(geo, strength = 0.55, reach = 0.45) {
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    if (!pos || !nor) return;
    const colors = new Float32Array(pos.count * 3);
    let zMin = Infinity, zMax = -Infinity;
    for (let i = 0; i < pos.count; i++) {
        const z = pos.getZ(i);
        if (z < zMin) zMin = z;
        if (z > zMax) zMax = z;
    }
    const dz = Math.max(1e-6, zMax - zMin);
    for (let i = 0; i < pos.count; i++) {
        const h = (pos.getZ(i) - zMin) / dz;
        const nz = Math.abs(nor.getZ(i));
        const wall = Math.max(0, 1 - nz);
        const fall = smoothstep01(1 - reach, 1, h);
        const ao = 1 - strength * wall * (1 - fall);
        colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = ao;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function desaturateColor(hex, factor) {
    const c = new THREE.Color(hex);
    const gray = c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
    c.r = THREE.MathUtils.lerp(gray, c.r, factor);
    c.g = THREE.MathUtils.lerp(gray, c.g, factor);
    c.b = THREE.MathUtils.lerp(gray, c.b, factor);
    return c;
}

export function metalMat(STUDIO, color, roughness, env, isRelief, fieldBump, locked = false) {
    let col = color;
    let rough = roughness;
    let envI = env;
    if (locked) {
        col = desaturateColor(color, 0.35).multiplyScalar(0.72).getHex();
        rough = Math.min(0.72, rough * 1.35 + 0.12);
        envI *= 0.55;
    }
    const bump = fieldBump || 0;
    const fieldR = Math.min(0.66, (rough + bump) * STUDIO.fieldRoughnessMul);
    const reliefR = Math.max(0.26, fieldR * STUDIO.reliefRoughnessMul);
    const r = isRelief ? reliefR : fieldR;
    const e = isRelief ? envI * STUDIO.reliefEnvMul : envI;
    const mat = new THREE.MeshPhysicalMaterial({
        color: col,
        metalness: 1.0,
        roughness: r,
        envMapIntensity: e,
        side: THREE.DoubleSide,
        flatShading: false,
        vertexColors: isRelief
    });
    mat.userData.baseEnv = e;
    return mat;
}

export function metalByLevel(metalId) {
    const idx = Math.max(1, Math.min(6, metalId || 1)) - 1;
    return { metal: METALS[idx], index: idx };
}

export function reliefAOStrength(STUDIO) {
    return STUDIO.reliefAO != null ? STUDIO.reliefAO : 0.68;
}
