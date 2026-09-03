import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerWww } from './helpers/sandbox.mjs';

const FUENTES_JS = ['app.js', 'js/core/session.js', 'js/domain/icons.js', 'js/domain/habits.js', 'js/social/chat.js', 'js/badges/badge-seal-art.js'];
const html = leerWww('index.html');
const todoJs = FUENTES_JS.map(f => leerWww(f)).join('\n');

function idsCreadosEnJs() {
    const ids = new Set();
    for (const f of FUENTES_JS) {
        const src = leerWww(f);
        const reA = /id="([A-Za-z0-9_-]+)"/g;
        const reB = /\.id\s*=\s*['"]([A-Za-z0-9_-]+)['"]/g;
        const reC = /setAttribute\(\s*['"]id['"]\s*,\s*['"]([A-Za-z0-9_-]+)['"]\s*\)/g;
        let m;
        while ((m = reA.exec(src))) ids.add(m[1]);
        while ((m = reB.exec(src))) ids.add(m[1]);
        while ((m = reC.exec(src))) ids.add(m[1]);
    }
    return ids;
}

test('todo getElementById con id literal existe en el HTML o se crea dinámicamente en el JS', () => {
    const usadas = new Set();
    for (const f of FUENTES_JS) {
        const re = /getElementById\s*\(\s*['"]([A-Za-z0-9_-]+)['"]\s*\)/g;
        let m;
        while ((m = re.exec(leerWww(f)))) usadas.add(m[1]);
    }
    const idsHtml = new Set();
    const re2 = /id="([A-Za-z0-9_-]+)"/g;
    let m2;
    while ((m2 = re2.exec(html))) idsHtml.add(m2[1]);
    const idsJs = idsCreadosEnJs();
    const faltan = [...usadas].filter(id => !idsHtml.has(id) && !idsJs.has(id));
    assert.deepEqual(faltan, [], `IDs usados en JS y ausentes tanto del HTML como del propio JS: ${faltan.join(', ')}`);
});

test('toda función llamada desde un handler inline existe en el JS', () => {
    const funciones = new Set();
    const re = /on(?:click|change|input|submit|keydown|keyup|focus|blur|load)="([A-Za-z_$][A-Za-z0-9_$]*)/g;
    let m;
    while ((m = re.exec(html))) funciones.add(m[1]);
    const BS = String.fromCharCode(92);
    const existe = (fn) => new RegExp(
        'function' + BS + 's+' + fn + BS + 'b' +
        '|' + fn + BS + 's*=' + BS + 's*(function|' + BS + '(|async)' +
        '|window' + BS + '.' + fn + BS + 's*=' +
        '|' + fn + BS + 's*:' + BS + 's*function'
    ).test(todoJs);
    const EXPRESIONES = new Set(['event', 'document', 'if', 'window', 'this', 'return']);
    const faltan = [...funciones].filter(fn => !EXPRESIONES.has(fn) && !existe(fn));
    assert.deepEqual(faltan, [], `Handlers sin función definida: ${faltan.join(', ')}`);
});
