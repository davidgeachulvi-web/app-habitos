import * as THREE from '../../vendor/three.module.min.js';

export const COIN_FIELD_R = 0.84;

export const COIN_RELIEF = {
    latheAmp: 0,
    latheStep: 0.032,
    satinAmp: 0,
    centerDish: { depth: 0.022, radius: 0.58, flatRatio: 0.72, fieldLift: 0.0075 }
};

export const RELIEF_FACE_INSET = 0.001;
export const BACK_RELIEF_PROTRUDE = 0.014;

export const COIN_CFG = {
    ridges: 180,
    tHeight: 0.15,
    radius: 1.0,
    groove: 0.008,
    relief: COIN_RELIEF,
    faldon: true,
    dentado: true,
    rim: true,
    rimRaise: 0.014,
    rimWidth: 0.02
};

export function isMobileCoinLOD() {
    if (typeof matchMedia === 'function' && matchMedia('(max-width: 768px)').matches) return true;
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return true;
    return false;
}

export function computeCenterDishZDisp(r, dishCfg, R_FIELD = COIN_FIELD_R) {
    if (!dishCfg?.depth || !dishCfg?.radius) return 0;
    const R_DISH = Math.min(dishCfg.radius, R_FIELD - 0.02);
    const flatR = R_DISH * (dishCfg.flatRatio ?? 0.68);
    let recess = 0;
    if (r < R_DISH) {
        if (r <= flatR) recess = dishCfg.depth;
        else {
            const t = 1 - (r - flatR) / (R_DISH - flatR);
            recess = dishCfg.depth * (t * t * (3 - 2 * t));
        }
    }
    const lift = (r > R_DISH + 1e-4 && r <= R_FIELD + 1e-4) ? (dishCfg.fieldLift ?? 0) : 0;
    return -recess + lift;
}

export function coinFaceZAtRadius(r, front, cfg = COIN_CFG) {
    const H = cfg.tHeight / 2;
    const d = computeCenterDishZDisp(r, cfg.relief?.centerDish);
    return front ? H + d : -H - d;
}

export function buildCoinSolid(cfg, opts = {}) {
    const { ridges, tHeight, radius, groove, relief, faldon, dentado, rim, rimRaise, rimWidth } = cfg;
    const H = tHeight / 2;
    const mobile = opts.mobile ?? isMobileCoinLOD();
    const ANG = Math.max(96, ridges * (mobile ? 4 : 6));
    const ridge = (theta) => {
        const f = (theta * ridges) / (Math.PI * 2);
        const u = f - Math.floor(f);
        const tri = 1 - Math.abs(2 * (u - 0.5));
        const circ = Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
        const prof = tri * tri * (3 - 2 * tri) * (0.7 + 0.3 * circ);
        return 1 - (groove / radius) * prof;
    };
    const R_FIELD = COIN_FIELD_R;
    const dishCfg = relief?.centerDish;
    const R_DISH = (dishCfg?.depth > 0 && dishCfg?.radius > 0) ? Math.min(dishCfg.radius, R_FIELD - 0.02) : 0;
    const R_DISH_FLAT = R_DISH ? R_DISH * (dishCfg.flatRatio ?? 0.68) : 0;
    const faceZDisp = (r) => computeCenterDishZDisp(r, dishCfg, R_FIELD);
    const R_EDGE = 0.955;
    const R_RIM2O = 0.995;
    const R_RIM2I = R_RIM2O - (rimWidth ?? 0.02);
    const RAISE2 = rimRaise;
    const eDent = !!dentado;
    const rows = [];
    rows.push({ r: 0, z: H, e: false });
    if (R_DISH_FLAT) rows.push({ r: R_DISH_FLAT, z: H, e: false });
    if (R_DISH) rows.push({ r: R_DISH, z: H, e: false });
    rows.push({ r: R_FIELD, z: H, e: false });
    if (faldon) rows.push({ r: R_EDGE, z: H, e: false });
    if (rim) {
        rows.push({ r: R_RIM2I, z: H, e: false });
        rows.push({ r: R_RIM2I, z: H + RAISE2, e: false });
        rows.push({ r: R_RIM2O, z: H + RAISE2, e: false });
        rows.push({ r: R_RIM2O, z: H, e: false });
    }
    const FRONT_LAST = rows.length - 1;
    rows.push({ r: radius, z: H, e: eDent });
    rows.push({ r: radius, z: 0, e: eDent });
    rows.push({ r: radius, z: -H, e: eDent });
    const EDGE_LAST = rows.length - 1;
    if (rim) {
        rows.push({ r: R_RIM2O, z: -H, e: false });
        rows.push({ r: R_RIM2O, z: -H - RAISE2, e: false });
        rows.push({ r: R_RIM2I, z: -H - RAISE2, e: false });
        rows.push({ r: R_RIM2I, z: -H, e: false });
    }
    if (faldon) rows.push({ r: R_EDGE, z: -H, e: false });
    rows.push({ r: R_FIELD, z: -H, e: false });
    if (R_DISH) rows.push({ r: R_DISH, z: -H, e: false });
    if (R_DISH_FLAT) rows.push({ r: R_DISH_FLAT, z: -H, e: false });
    rows.push({ r: 0, z: -H, e: false });
    const zDisp = (pt, r) => {
        const d = faceZDisp(r);
        if (!d) return 0;
        if (Math.abs(pt.z - H) < 1e-4) return d;
        if (Math.abs(pt.z + H) < 1e-4) return -d;
        return 0;
    };
    const pos = [];
    const uv = [];
    const rowStart = [];
    const rowN = [];
    const R = rows.length;
    for (let i = 0; i < R; i++) {
        const pt = rows[i];
        rowStart.push(pos.length / 3);
        if (i === 0) {
            const z = pt.z + zDisp(pt, 0);
            pos.push(0, 0, z);
            uv.push(0, 0);
            rowN.push(1);
            continue;
        }
        for (let j = 0; j < ANG; j++) {
            const theta = (j / ANG) * Math.PI * 2;
            const r = pt.r * (pt.e ? ridge(theta) : 1);
            const z = pt.z + zDisp(pt, r);
            pos.push(r * Math.cos(theta), r * Math.sin(theta), z);
            let v;
            if (i <= FRONT_LAST) v = r / radius;
            else if (i <= EDGE_LAST) v = 1.1 + (z + H) / (2 * H);
            else v = 2.2 + r / radius;
            uv.push(j / ANG, v);
        }
        rowN.push(ANG);
    }
    const idx = [];
    for (let i = 0; i < R - 1; i++) {
        const s0 = rowStart[i], s1 = rowStart[i + 1];
        if (rowN[i] === 1) {
            for (let j = 0; j < ANG; j++) {
                idx.push(s0, s1 + j, s1 + (j + 1) % ANG);
            }
        } else {
            for (let j = 0; j < ANG; j++) {
                const a = s0 + j, b = s0 + (j + 1) % ANG;
                const c = s1 + j, d = s1 + (j + 1) % ANG;
                idx.push(a, c, b, b, c, d);
            }
        }
    }
    let vol = 0;
    for (let k = 0; k < idx.length; k += 3) {
        const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
        vol += pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1])
            - pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c])
            + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c]);
    }
    if (vol < 0) {
        for (let k = 0; k < idx.length; k += 3) {
            const t = idx[k]; idx[k] = idx[k + 2]; idx[k + 2] = t;
        }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
}
