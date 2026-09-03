import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WWW = path.join(__dirname, '..', '..', 'www');

export function leerWww(rel) {
    return fs.readFileSync(path.join(WWW, rel), 'utf8');
}

// Carga icons.js + habits.js en un contexto vm con stubs mínimos de navegador.
// Los helpers de fecha (claveDiaLocal, parseIsoFechaLocal...) se leen de
// stubs-fechas.js (copia verbatim de app.js) para probar con la misma lógica.
export function cargarContextoHabitos() {
    const sandbox = {
        console, Date, Math, Set, Array, Object, String, Number, Boolean, JSON, RegExp,
        parseInt, parseFloat, isNaN, Infinity, NaN, setTimeout, clearTimeout,
        navigator: { userAgent: 'test' },
        location: { href: 'http://localhost/', search: '' },
        localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
        matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
        requestAnimationFrame: (cb) => setTimeout(cb, 0),
        cancelAnimationFrame: clearTimeout,
        fetch: async () => ({ ok: false, json: async () => ({}) }),
        document: {
            getElementById: () => null,
            querySelector: () => null,
            querySelectorAll: () => [],
            createElement: () => ({
                style: {},
                classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
                appendChild() {}, setAttribute() {}, getContext: () => null,
            }),
            addEventListener: () => {},
            body: {},
            documentElement: { style: {}, classList: { add() {}, remove() {}, contains() { return false; } } },
        },
    };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'stubs-fechas.js'), 'utf8'), sandbox, { filename: 'stubs-fechas.js' });
    vm.runInContext(leerWww('js/domain/icons.js'), sandbox, { filename: 'icons.js' });
    vm.runInContext(leerWww('js/domain/habits.js'), sandbox, { filename: 'habits.js' });
    return sandbox;
}
