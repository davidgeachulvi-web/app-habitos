// AWAKE — gate de sintaxis de todos los JS de la app.
// Uso: node scripts/check-sintaxis.js
// Recorre los .js/.mjs del árbol www (excluye vendor) + scripts + test y
// ejecuta `node --check` sobre cada uno. Los módulos ES (solo los .js del
// grafo del visor 3D) se verifican copiándolos a un temporal .mjs porque
// el proyecto es type:commonjs.
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function listar(dir, ext, excluir = []) {
    const out = [];
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) return out;
    for (const f of fs.readdirSync(abs)) {
        if (excluir.includes(f)) continue;
        if (f.endsWith(ext)) out.push(path.join(dir, f));
    }
    return out.sort();
}

// Clásicos (CJS / script plano): node --check directo
const clasicos = [
    'www/app.js',
    'www/sw.js',
    'dev-server.js',
    ...listar('scripts', '.js', ['out']),
    ...listar('www/js/core', '.js'),
    ...listar('www/js/domain', '.js'),
    ...listar('www/js/social', '.js'),
    'www/js/badges/badge-seal-art.js',
];

// Módulos ES con extensión .js (grafo del visor 3D): requieren temporal .mjs
const esmJs = [
    'www/js/badges/badge-coin-3d.js',
    ...listar('www/js/badges/coin', '.js'),
];

// .mjs (tests y helpers): node --check directo
const mjs = [
    ...listar('test', '.mjs'),
    ...listar('test/helpers', '.mjs'),
];

let fallos = 0;

function check(ruta, { comoEsm = false } = {}) {
    const abs = path.join(ROOT, ruta);
    let args;
    let limpiar = null;
    if (comoEsm) {
        // Copia a .mjs temporal para que node lo parsee como módulo ES
        const tmp = path.join(os.tmpdir(), 'awake-check-' + path.basename(ruta) + '.mjs');
        fs.copyFileSync(abs, tmp);
        args = ['--check', tmp];
        limpiar = tmp;
    } else {
        args = ['--check', abs];
    }
    const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
    if (limpiar) { try { fs.unlinkSync(limpiar); } catch (e) {} }
    if (r.status !== 0) {
        fallos++;
        console.error(`✗ ${ruta}`);
        if (r.stderr) console.error(r.stderr.split('\n').slice(0, 6).join('\n'));
    } else {
        console.log(`✓ ${ruta}`);
    }
}

for (const f of clasicos) check(f);
for (const f of mjs) check(f);
for (const f of esmJs) check(f, { comoEsm: true });

if (fallos > 0) {
    console.error(`\nSintaxis: ${fallos} archivo(s) con errores.`);
    process.exit(1);
}
console.log(`\nSintaxis OK — ${clasicos.length + mjs.length + esmJs.length} archivos verificados.`);
