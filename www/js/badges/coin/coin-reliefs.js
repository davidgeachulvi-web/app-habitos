import * as THREE from '../../vendor/three.module.min.js';
import { SVGLoader } from '../../vendor/SVGLoader.js';
import {
    COIN_CFG, RELIEF_FACE_INSET, BACK_RELIEF_PROTRUDE,
    coinFaceZAtRadius
} from './coin-geometry.js';
import { bakeReliefAO, reliefAOStrength } from './coin-materials.js';

export const THEMES = ['sello', 'dia', 'racha', 'memoria'];

export const GLYPHS = {
    sello: 'M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z',
    dia: 'M240,152H199.55a73.54,73.54,0,0,0,.45-8,72,72,0,0,0-144,0,73.54,73.54,0,0,0,.45,8H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM72,144a56,56,0,1,1,111.41,8H72.59A56.13,56.13,0,0,1,72,144Zm144,56a8,8,0,0,1-8,8H48a8,8,0,0,1,0-16H208A8,8,0,0,1,216,200ZM72.84,43.58a8,8,0,0,1,14.32-7.16l8,16a8,8,0,0,1-14.32,7.16Zm-56,48.84a8,8,0,0,1,10.74-3.57l16,8a8,8,0,0,1-7.16,14.31l-16-8A8,8,0,0,1,16.84,92.42Zm192,15.16a8,8,0,0,1,3.58-10.73l16-8a8,8,0,1,1,7.16,14.31l-16,8a8,8,0,0,1-10.74-3.58Zm-48-55.16,8-16a8,8,0,0,1,14.32,7.16l-8,16a8,8,0,1,1-14.32-7.16Z',
    racha: 'M183.89,153.34a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68ZM216,144a88,88,0,0,1-176,0c0-27.92,11-56.47,32.66-84.85a8,8,0,0,1,11.93-.89l24.12,23.41,22-60.41a8,8,0,0,1,12.63-3.41C165.21,36,216,84.55,216,144Zm-16,0c0-46.09-35.79-85.92-58.21-106.33L119.52,98.74a8,8,0,0,1-13.09,3L80.06,76.16C64.09,99.21,56,122,56,144a72,72,0,0,0,144,0Z',
    memoria: 'M208,56H180.28L166.65,35.56A8,8,0,0,0,160,32H96a8,8,0,0,0-6.65,3.56L75.71,56H48A24,24,0,0,0,24,80V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V80A24,24,0,0,0,208,56Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H80a8,8,0,0,0,6.66-3.56L100.28,48h55.43l13.63,20.44A8,8,0,0,0,176,72h32a8,8,0,0,1,8,8ZM128,88a44,44,0,1,0,44,44A44.05,44.05,0,0,0,128,88Zm0,72a28,28,0,1,1,28-28A28,28,0,0,1,128,160Z'
};

const GLYPH_RADIUS = 0.31;
const BACK_FONT_URL = new URL('../../../fonts/Cinzel-SemiBold.woff2', import.meta.url).href;
const BACK_LS_EM = 0.4;
const BACK_CANVAS = 2048;
const BACK_TARGET_W = 0.72;
const DATE_RADIUS = 0.88;
const DATE_ARC_DEG = 80;
const DATE_SPACING = 0.09;
const TOP_RADIUS = 0.84;
const TOP_ARC_DEG = 118;
const TOP_SPACING = 0.85;

const glyphOpts = {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.0075,
    bevelSize: 0.004,
    bevelSegments: 6,
    curveSegments: 16
};

const svgLoader = new SVGLoader();
let brandFamily = 'Cinzel, Georgia, serif';
let brandFontPromise = null;

function loadBrandFont() {
    if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
    if (typeof FontFace === 'undefined') return Promise.resolve();
    const face = new FontFace('CinzelCoin', 'url(' + BACK_FONT_URL + ')');
    return face.load().then(() => {
        document.fonts.add(face);
        brandFamily = 'CinzelCoin, Cinzel, Georgia, serif';
    }).catch(() => {
        brandFamily = 'Cinzel, Georgia, serif';
    });
}

export function ensureBrandFont() {
    if (!brandFontPromise) brandFontPromise = loadBrandFont();
    return brandFontPromise;
}

export function formatUnlockDate(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return null;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return dd + ' · ' + mm + ' · ' + d.getFullYear();
}

function scanAlphaBBox(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { width: W, height: H } = canvas;
    const d = ctx.getImageData(0, 0, W, H).data;
    let minX = W, minY = H, maxX = -1, maxY = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (d[(y * W + x) * 4 + 3] > 100) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }
    return { minX, minY, maxX, maxY };
}

function drawBrand(canvas, size, family) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '600 ' + size + 'px ' + family;
    const text = 'AWAKE';
    const adv = [];
    let total = 0;
    for (const ch of text) {
        const w = ctx.measureText(ch).width;
        adv.push(w);
        total += w;
    }
    total += BACK_LS_EM * size * (text.length - 1);
    const baseline = size * 0.75;
    let x = (canvas.width - total) / 2;
    for (let i = 0; i < text.length; i++) {
        ctx.fillText(text[i], x, baseline);
        x += adv[i] + BACK_LS_EM * size;
    }
}

function contoursFromCanvas(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { width: W, height: H } = canvas;
    const img = ctx.getImageData(0, 0, W, H).data;
    const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H && img[(y * W + x) * 4 + 3] > 100;
    const edges = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!inside(x, y)) continue;
        if (!inside(x, y - 1)) edges.push({ a: [x, y], b: [x + 1, y] });
        if (!inside(x + 1, y)) edges.push({ a: [x + 1, y], b: [x + 1, y + 1] });
        if (!inside(x, y + 1)) edges.push({ a: [x + 1, y + 1], b: [x, y + 1] });
        if (!inside(x - 1, y)) edges.push({ a: [x, y + 1], b: [x, y] });
    }
    const map = new Map();
    edges.forEach((e, i) => { const k = e.a[0] + ',' + e.a[1]; if (!map.has(k)) map.set(k, i); });
    const used = new Uint8Array(edges.length);
    const contours = [];
    for (let i = 0; i < edges.length; i++) {
        if (used[i]) continue;
        const contour = [];
        let cur = i, guard = 0;
        while (cur !== undefined && cur !== -1 && !used[cur] && guard < edges.length) {
            used[cur] = 1;
            const e = edges[cur];
            if (contour.length === 0) contour.push(e.a);
            contour.push(e.b);
            cur = map.get(e.b[0] + ',' + e.b[1]);
            guard++;
        }
        if (contour.length > 3) contours.push(contour);
    }
    return contours;
}

function distToSeg(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function rdp(pts, eps) {
    if (pts.length < 3) return pts;
    let maxD = 0, idx = 0;
    const a = pts[0], b = pts[pts.length - 1];
    for (let i = 1; i < pts.length - 1; i++) {
        const d = distToSeg(pts[i], a, b);
        if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > eps) {
        return rdp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(pts.slice(idx), eps));
    }
    return [pts[0], pts[pts.length - 1]];
}

function simplifyLoop(pts, eps) {
    const p = pts.filter((q, i) => i === 0 || q[0] !== pts[i - 1][0] || q[1] !== pts[i - 1][1]);
    if (p.length < 4) return p;
    let bi = 0, bj = 1, bd = -1;
    for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) {
        const d = (p[i][0] - p[j][0]) ** 2 + (p[i][1] - p[j][1]) ** 2;
        if (d > bd) { bd = d; bi = i; bj = j; }
    }
    const c1 = rdp(p.slice(bi).concat(p.slice(0, bj + 1)), eps);
    const c2 = rdp(p.slice(bj).concat(p.slice(0, bi + 1)), eps);
    return c1.slice(0, -1).concat(c2.slice(0, -1));
}

function signedArea(pts) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        s += a[0] * b[1] - b[0] * a[1];
    }
    return s / 2;
}

function buildBackShapes(contours, cx, cy, s) {
    const canv = contours.map(c => ({ c, a: signedArea(c) }));
    const outers = canv.filter(p => p.a > 0).map(p => ({ pts: p.c, holes: [] }));
    const holes = canv.filter(p => p.a <= 0).map(p => p.c);
    for (const h of holes) {
        const pt = h[0];
        let best = null;
        for (const o of outers) {
            let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
            for (const q of o.pts) {
                if (q[0] < minX) minX = q[0];
                if (q[0] > maxX) maxX = q[0];
                if (q[1] < minY) minY = q[1];
                if (q[1] > maxY) maxY = q[1];
            }
            if (pt[0] >= minX && pt[0] <= maxX && pt[1] >= minY && pt[1] <= maxY) {
                if (!best || (maxX - minX) < best.w) best = { o, w: maxX - minX };
            }
        }
        if (best) best.o.holes.push(h);
    }
    const conv = (c) => simplifyLoop(c, 0.9).map(p => [(p[0] - cx) * s, -(p[1] - cy) * s]);
    const shapes = [];
    for (const o of outers) {
        const pts = conv(o.pts);
        const shape = new THREE.Shape();
        pts.forEach((p, i) => (i === 0 ? shape.moveTo(p[0], p[1]) : shape.lineTo(p[0], p[1])));
        for (const h of o.holes) {
            const hp = conv(h);
            const path = new THREE.Path();
            hp.forEach((p, i) => (i === 0 ? path.moveTo(p[0], p[1]) : path.lineTo(p[0], p[1])));
            shape.holes.push(path);
        }
        shapes.push(shape);
    }
    return shapes;
}

function drawArcText(canvas, size, family, text, radiusUnit, arcDeg, spacing, top) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const R = radiusUnit * (canvas.width / 2);
    ctx.fillStyle = '#fff';
    ctx.font = '600 ' + size + 'px ' + family;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const chars = [...text];
    const adv = chars.map(ch => ctx.measureText(ch).width + spacing * size);
    const total = adv.reduce((a, b) => a + b, 0);
    const arcRad = arcDeg * Math.PI / 180;
    const tC = (top ? 270 : 90) * Math.PI / 180;
    const t0 = top ? tC - arcRad / 2 : tC + arcRad / 2;
    const t1 = top ? tC + arcRad / 2 : tC - arcRad / 2;
    let acc = 0;
    for (let i = 0; i < chars.length; i++) {
        const frac = (acc + adv[i] / 2) / total;
        const t = t0 + (top ? 1 : -1) * frac * (t0 < t1 ? t1 - t0 : t0 - t1);
        const x = cx + R * Math.cos(t);
        const y = cy + R * Math.sin(t);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(top ? t + Math.PI / 2 : t - Math.PI / 2);
        ctx.fillText(chars[i], 0, 0);
        ctx.restore();
        acc += adv[i];
    }
}

export function buildGlyphGeometry(sec, STUDIO) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">' +
        '<g transform="translate(0 256) scale(1 -1)"><path fill="#000" d="' + GLYPHS[sec] + '"/></g></svg>';
    const data = svgLoader.parse(svg);
    const shapes = [];
    for (const p of data.paths) shapes.push(...p.toShapes(true));
    const tmp = new THREE.ShapeGeometry(shapes, 16);
    tmp.computeBoundingBox();
    const tb = tmp.boundingBox;
    tmp.translate(-(tb.min.x + tb.max.x) / 2, -(tb.min.y + tb.max.y) / 2, 0);
    let maxR = 0;
    const tp = tmp.attributes.position;
    for (let i = 0; i < tp.count; i++) {
        const r = Math.hypot(tp.getX(i), tp.getY(i));
        if (r > maxR) maxR = r;
    }
    tmp.dispose();
    const s = GLYPH_RADIUS / maxR;
    const opts = Object.assign({}, glyphOpts, { bevelSize: 0.004 / s });
    const g = new THREE.ExtrudeGeometry(shapes, opts);
    g.computeBoundingBox();
    const bb = g.boundingBox;
    g.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, 0);
    g.applyMatrix4(new THREE.Matrix4().makeScale(s, s, 1));
    g.translate(0, 0, -g.boundingBox.min.z);
    g.computeVertexNormals();
    bakeReliefAO(g, reliefAOStrength(STUDIO), 0.54);
    return g;
}

function buildArcMeshGeometry(text, opts, STUDIO) {
    const { radius, arcDeg, spacing, top, sizeScale = 1 } = opts;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = BACK_CANVAS;
    const R = radius * (canvas.width / 2);
    const arcLen = R * (arcDeg * Math.PI / 180) * 0.94;
    const ctx0 = canvas.getContext('2d', { willReadFrequently: true });
    let size = 170;
    for (let t = 0; t < 20; t++) {
        ctx0.font = '600 ' + size + 'px ' + brandFamily;
        let w = 0;
        for (const ch of text) w += ctx0.measureText(ch).width + spacing * size;
        if (w <= arcLen) break;
        size *= arcLen / w;
    }
    size *= sizeScale;
    drawArcText(canvas, size, brandFamily, text, radius, arcDeg, spacing, top);
    const bbox = scanAlphaBBox(canvas);
    if (bbox.maxX < 0) return null;
    const contours = contoursFromCanvas(canvas);
    const shapes = buildBackShapes(contours, canvas.width / 2, canvas.height / 2, 1 / (canvas.width / 2));
    if (!shapes.length) return null;
    const geo = new THREE.ExtrudeGeometry(shapes, {
        depth: 0.008,
        bevelEnabled: true,
        bevelThickness: 0.005,
        bevelSize: 0.003,
        bevelSegments: 4,
        curveSegments: 12
    });
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.translate(0, 0, -geo.boundingBox.min.z);
    bakeReliefAO(geo, reliefAOStrength(STUDIO), 0.54);
    return geo;
}

export function buildBackGeometry(STUDIO) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = BACK_CANVAS;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.font = '600 560px ' + brandFamily;
    let total = 0;
    for (const ch of 'AWAKE') total += ctx.measureText(ch).width;
    total += BACK_LS_EM * 560 * 3;
    const size = Math.max(120, (BACK_CANVAS * 0.92 / total) * 560);
    drawBrand(canvas, size, brandFamily);
    const bbox = scanAlphaBBox(canvas);
    const cx = (bbox.minX + bbox.maxX) / 2;
    const cy = (bbox.minY + bbox.maxY) / 2;
    const s = BACK_TARGET_W / (bbox.maxX - bbox.minX);
    const contours = contoursFromCanvas(canvas);
    const shapes = buildBackShapes(contours, cx, cy, s);
    if (!shapes.length) return null;
    const geo = new THREE.ExtrudeGeometry(shapes, {
        depth: 0.010,
        bevelEnabled: true,
        bevelThickness: 0.007,
        bevelSize: 0.004,
        bevelSegments: 6,
        curveSegments: 16
    });
    geo.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, -1));
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.translate(0, 0, -geo.boundingBox.min.z);
    bakeReliefAO(geo, reliefAOStrength(STUDIO), 0.54);
    return geo;
}

export function syncReliefHeights(parts) {
    const { glyph, backRelief, dateGrab, topBrand } = parts;
    if (glyph) glyph.position.z = coinFaceZAtRadius(0, true) - RELIEF_FACE_INSET;
    if (backRelief) backRelief.position.z = coinFaceZAtRadius(0, false) - BACK_RELIEF_PROTRUDE;
    if (dateGrab) dateGrab.position.z = coinFaceZAtRadius(DATE_RADIUS, true) - RELIEF_FACE_INSET;
    if (topBrand) topBrand.position.z = coinFaceZAtRadius(TOP_RADIUS, true) - RELIEF_FACE_INSET;
}

export async function buildCoinReliefs(parts, opts, STUDIO) {
    await ensureBrandFont();
    const theme = THEMES[opts.themeId] || 'sello';
    // La fecha se muestra SIEMPRE (como en el prototipo): la grabada al desbloquear,
    // o la fecha actual si la insignia aún no tiene fecha fija.
    const showDate = !!opts.dateText;

    if (parts.glyph) {
        if (parts.glyph.geometry) parts.glyph.geometry.dispose();
        parts.glyph.geometry = buildGlyphGeometry(theme, STUDIO);
        parts.glyph.visible = true;
    }
    if (parts.backRelief) {
        const bg = buildBackGeometry(STUDIO);
        if (bg) {
            if (parts.backRelief.geometry) parts.backRelief.geometry.dispose();
            parts.backRelief.geometry = bg;
            parts.backRelief.visible = true;
        }
    }
    if (parts.topBrand) {
        const tg = buildArcMeshGeometry('AWAKE', {
            radius: TOP_RADIUS, arcDeg: TOP_ARC_DEG, spacing: TOP_SPACING, top: true
        }, STUDIO);
        if (tg) {
            if (parts.topBrand.geometry) parts.topBrand.geometry.dispose();
            parts.topBrand.geometry = tg;
            parts.topBrand.visible = true;
        }
    }
    if (parts.dateGrab) {
        if (showDate) {
            const dg = buildArcMeshGeometry(opts.dateText, {
                radius: DATE_RADIUS, arcDeg: DATE_ARC_DEG, spacing: DATE_SPACING,
                top: false, sizeScale: 0.80
            }, STUDIO);
            if (dg) {
                if (parts.dateGrab.geometry) parts.dateGrab.geometry.dispose();
                parts.dateGrab.geometry = dg;
                parts.dateGrab.visible = true;
            }
        } else {
            parts.dateGrab.visible = false;
        }
    }
    syncReliefHeights(parts);
}

export function createReliefMeshes() {
    const mk = (name) => {
        const m = new THREE.Mesh(new THREE.BufferGeometry());
        m.name = name;
        m.castShadow = true;
        m.receiveShadow = true;
        return m;
    };
    return {
        glyph: mk('glifo'),
        backRelief: mk('awake'),
        dateGrab: mk('fecha'),
        topBrand: mk('awake-top')
    };
}
