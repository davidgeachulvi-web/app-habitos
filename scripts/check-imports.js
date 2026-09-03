// Verifica el grafo de módulos del visor 3D antes de desplegar:
//  1) Sin imports "bare" (dependientes de <script type="importmap">, que
//     Safari < 16.4 ignora → rompería el visor en iOS antiguo).
//  2) Todos los archivos importados existen (evita que un módulo ausente
//     devuelva el fallback SPA (index.html, text/html) y falle la carga con
//     "Failed to fetch dynamically imported module" — bug real de sept 2026:
//     three.core.min.js (r185) nunca se copió al árbol estructurado y el
//     regex anterior no detectaba imports minificados sin espacios).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'www');
const ENTRY = 'js/badges/badge-coin-3d.js';

const visited = new Set();
const bare = [];
const faltan = [];

function leer(rel) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
        faltan.push(rel);
        return null;
    }
    return fs.readFileSync(abs, 'utf8');
}

function resolver(desde, spec) {
    if (spec.startsWith('./') || spec.startsWith('../')) {
        return path.posix.normalize(path.posix.join(path.posix.dirname(desde), spec));
    }
    return null; // bare, absoluto o URL
}

function esUrlOData(spec) {
    return /^(https?:|data:|blob:|chrome-extension:)/.test(spec);
}

function specsDe(src) {
    const specs = new Set();
    // import x from 'y' / import{x}from'y' / import * as X from 'y' (minificado sin espacios)
    const reImport = /(?:^|[;\n])\s*import[^'"]*?from\s*['"]([^'"]+)['"]/g;
    // import './y' (efecto lateral)
    const reSide = /(?:^|[;\n])\s*import\s*['"]([^'"]+)['"]/g;
    // export ... from 'y'
    const reExport = /(?:^|[;\n])\s*export\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
    // import('y') dinámico
    const reDyn = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
    let m;
    while ((m = reImport.exec(src))) specs.add(m[1]);
    while ((m = reSide.exec(src))) specs.add(m[1]);
    while ((m = reExport.exec(src))) specs.add(m[1]);
    while ((m = reDyn.exec(src))) specs.add(m[1]);
    return specs;
}

function walk(rel) {
    if (visited.has(rel)) return;
    visited.add(rel);
    const src = leer(rel);
    if (src == null) return;
    for (const spec of specsDe(src)) {
        const res = resolver(rel, spec);
        if (!res) {
            if (!esUrlOData(spec) && !spec.startsWith('/')) {
                bare.push({ desde: rel, spec });
            }
            continue;
        }
        walk(res);
    }
}

walk(ENTRY);

let exitCode = 0;
if (faltan.length) {
    exitCode = 1;
    console.error('check-imports: faltan archivos importados por el grafo del visor 3D:');
    for (const f of faltan) console.error(`  ${f}`);
    console.error('Sin ese archivo, el servidor devuelve el fallback SPA (HTML) y el import dinámico falla en producción.');
}
if (bare.length) {
    exitCode = 1;
    console.error('check-imports: se encontraron imports bare en el grafo del visor 3D:');
    for (const b of bare) console.error(`  ${b.desde} -> "${b.spec}"`);
    console.error('Estos imports solo se resuelven con <script type="importmap"> (iOS < 16.4 los ignora).');
}
if (exitCode === 0) {
    console.log(`check-imports: OK — ${visited.size} módulos revisados, 0 imports bare, 0 archivos faltantes.`);
}
process.exit(exitCode);
