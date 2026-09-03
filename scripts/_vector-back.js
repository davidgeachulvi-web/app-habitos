// Reverso con bordes vectoriales: sustituye el trazado de escalones de pixeles por
// marching squares con interpolacion subpixel del campo alfa (bordes rectos rectos,
// curvas suaves), sube la resolucion del canvas y afina la simplificacion.
const fs = require('fs');
const P = 'proto/coin.html';
let s = fs.readFileSync(P, 'utf8');
let n = 0;
function rep(oldStr, newStr, label) {
  if (!s.includes(oldStr)) { console.log('SKIP (no match): ' + label); return; }
  s = s.split(oldStr).join(newStr);
  n++;
  console.log('OK: ' + label);
}

// 1) BACK_CANVAS 2048 -> 4096 (mas detalle en los digitos pequenos de la fecha)
rep('const BACK_CANVAS = 2048;', 'const BACK_CANVAS = 4096;', 'BACK_CANVAS 4096');

// 2) contoursFromCanvas -> marching squares subpixel (mismo nombre y salida)
const oldFn = `function contoursFromCanvas(canvas) {
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
}`;
const newFn = `function contoursFromCanvas(canvas) {
    // Marching squares con interpolacion subpixel: los cruces de borde se interpolan
    // en el campo alfa (umbral 128), de modo que rectas salen rectas y curvas suaves
    // en vez de escalones de 1 pixel. Recorrido con relleno a la derecha (misma
    // convencion de orientacion que el trazador original: exterior positivo).
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const Wp = canvas.width, Hp = canvas.height;
    const img = ctx.getImageData(0, 0, Wp, Hp).data;
    const W = Wp + 2, H = Hp + 2;
    const a = new Float32Array(W * H); // campo con borde de 0
    for (let y = 0; y < Hp; y++) for (let x = 0; x < Wp; x++)
        a[(y + 1) * W + (x + 1)] = img[(y * Wp + x) * 4 + 3];
    const T = 128;
    const at = (x, y) => a[y * W + x];
    const cross = (v0, v1) => { const d = v1 - v0; return d === 0 ? 0.5 : Math.min(1, Math.max(0, (T - v0) / d)); };
    const segs = [];
    for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) {
        const vTL = at(x, y), vTR = at(x + 1, y), vBR = at(x + 1, y + 1), vBL = at(x, y + 1);
        const idx = (vTL >= T ? 8 : 0) | (vTR >= T ? 4 : 0) | (vBR >= T ? 2 : 0) | (vBL >= T ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const pT = [x + cross(vTL, vTR), y], pB = [x + cross(vBL, vBR), y + 1];
        const pL = [x, y + cross(vTL, vBL)], pR = [x + 1, y + cross(vTR, vBR)];
        const vC = (vTL + vTR + vBR + vBL) / 4;
        let pairs = null;
        switch (idx) {
            case 8:  pairs = [[pT, pL]]; break;
            case 4:  pairs = [[pT, pR]]; break;
            case 2:  pairs = [[pR, pB]]; break;
            case 1:  pairs = [[pB, pL]]; break;
            case 12: case 3: pairs = [[pL, pR]]; break;
            case 6:  case 9: pairs = [[pT, pB]]; break;
            case 5:  pairs = vC >= T ? [[pT, pL], [pR, pB]] : [[pT, pR], [pB, pL]]; break;
            case 10: pairs = vC >= T ? [[pT, pR], [pB, pL]] : [[pT, pL], [pR, pB]]; break;
        }
        for (const [P, Q] of pairs) {
            // orientar con relleno a la derecha: normal derecha (-dy, dx) hacia el relleno
            const dx = Q[0] - P[0], dy = Q[1] - P[1];
            const nx = -dy, ny = dx;
            // esquina rellena y vacia de referencia dentro de la celda
            const corners = [[x, y, vTL], [x + 1, y, vTR], [x + 1, y + 1, vBR], [x, y + 1, vBL]];
            let f = null, e = null;
            for (const c of corners) { if (c[2] >= T) { if (!f || c[2] > f[2]) f = c; } else if (!e || c[2] < e[2]) e = c; }
            if (!f || !e) { segs.push([P, Q]); continue; }
            const dF = nx * (f[0] - Q[0]) + ny * (f[1] - Q[1]);
            const dE = nx * (e[0] - Q[0]) + ny * (e[1] - Q[1]);
            segs.push(dF >= dE ? [P, Q] : [Q, P]);
        }
    }
    // enlazar segmentos dirigidos en lazos cerrados
    const key = (p) => Math.round(p[0] * 16) + '|' + Math.round(p[1] * 16);
    const startMap = new Map();
    segs.forEach((sg, i) => { const k = key(sg[0]); if (!startMap.has(k)) startMap.set(k, []); startMap.get(k).push(i); });
    const used = new Uint8Array(segs.length);
    const contours = [];
    for (let i = 0; i < segs.length; i++) {
        if (used[i]) continue;
        const loop = [];
        let cur = i, guard = 0;
        while (cur !== undefined && !used[cur] && guard < segs.length) {
            used[cur] = 1;
            const sg = segs[cur];
            loop.push(sg[0]);
            const cands = startMap.get(key(sg[1])) || [];
            let nxt;
            for (const ci of cands) if (!used[ci]) { nxt = ci; break; }
            cur = nxt;
            guard++;
        }
        if (loop.length > 3) contours.push(loop);
    }
    return contours;
}`;
rep(oldFn, newFn, 'contoursFromCanvas subpixel');

// 3) simplificacion mas fina: 0.9 -> 0.4 (conserva esquinas vivas sin ondular)
rep('const conv = (c) => simplifyLoop(c, 0.9).map(p => [(p[0] - cx) * s, -(p[1] - cy) * s]);',
    'const conv = (c) => simplifyLoop(c, 0.4).map(p => [(p[0] - cx) * s, -(p[1] - cy) * s]);',
    'RDP eps 0.4');

// 4) bisel del extrude de los arcos: 4 -> 6 segmentos (transicion mas suave)
rep(`    const geo = new THREE.ExtrudeGeometry(shapes, {
        depth: 0.008,
        bevelEnabled: true,
        bevelThickness: 0.005,
        bevelSize: 0.003,
        bevelSegments: 4,
        curveSegments: 12
    });`,
    `    const geo = new THREE.ExtrudeGeometry(shapes, {
        depth: 0.008,
        bevelEnabled: true,
        bevelThickness: 0.005,
        bevelSize: 0.003,
        bevelSegments: 6,
        curveSegments: 12
    });`,
    'bevelSegments 6 en arcos');

fs.writeFileSync(P, s);
console.log('ediciones: ' + n);
