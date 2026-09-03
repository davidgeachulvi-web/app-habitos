import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargarContextoHabitos, leerWww } from './helpers/sandbox.mjs';

// B-04 / ROADMAP 1.5: tests de los recordatorios de ritual (1.2).
// Los mensajes de notificación se extrajeron a habits.js como funciones puras
// (mensajeResumenSemanal, mensajeRachaEnRiesgo); resumenSemanaRitual se prueba
// con el sandbox de siempre y stubs de las piezas que viven en app.js.

const ctx = cargarContextoHabitos();
// Stubs de app.js (no cargado en el sandbox) para los flujos que los necesitan.
ctx.habitosEnAgenda = () => [];
ctx.habitoPorNombre = () => null;
ctx.cleanHabitName = (n) => String(n == null ? '' : n);
ctx.habitEsAbstinencia = () => false;
ctx.esHabitoContinuo = () => false;
ctx.historialAgrupado = {};
ctx.weekStartDay = 1; // lunes por defecto (app.js:424)
ctx.logEsRecaida = () => false; // predicados de logs viven en app.js
ctx.logEsOmitido = () => false;

const html = leerWww('index.html');

// ---- mensajeResumenSemanal ----

test('resumen: semana sin sellos usa el mensaje motivador', () => {
    assert.equal(
        ctx.mensajeResumenSemanal(0, 0, 0),
        'Esta semana no hubo sellos. ¡La próxima la llenas! 💪'
    );
});

test('resumen: racha de 1 día usa singular', () => {
    assert.equal(
        ctx.mensajeResumenSemanal(2, 5, 1),
        'Sellaste 2 de 5 sellos · racha de 1 día. ¡Sigue así!'
    );
});

test('resumen: racha de varios días usa plural', () => {
    assert.equal(
        ctx.mensajeResumenSemanal(21, 21, 7),
        'Sellaste 21 de 21 sellos · racha de 7 días. ¡Sigue así!'
    );
});

test('resumen: racha 0 usa plural', () => {
    assert.equal(
        ctx.mensajeResumenSemanal(0, 3, 0),
        'Sellaste 0 de 3 sellos · racha de 0 días. ¡Sigue así!'
    );
});

test('resumen: semana completa (7/7) con racha', () => {
    assert.equal(
        ctx.mensajeResumenSemanal(7, 7, 3),
        'Sellaste 7 de 7 sellos · racha de 3 días. ¡Sigue así!'
    );
});

// ---- mensajeRachaEnRiesgo ----

test('riesgo: un pendiente usa aviso personal', () => {
    assert.equal(
        ctx.mensajeRachaEnRiesgo(1, 'Meditar'),
        'Sin sellar hoy: Meditar. ¡No dejes que la racha se rompa!'
    );
});

test('riesgo: un pendiente con nombre compuesto', () => {
    assert.equal(
        ctx.mensajeRachaEnRiesgo(1, 'Ejercicio mañana'),
        'Sin sellar hoy: Ejercicio mañana. ¡No dejes que la racha se rompa!'
    );
});

test('riesgo: dos pendientes cuentan y nombran', () => {
    assert.equal(
        ctx.mensajeRachaEnRiesgo(2, 'Meditar, Leer'),
        'Te quedan 2 sellos por cerrar hoy, entre ellos Meditar, Leer.'
    );
});

test('riesgo: cinco pendientes cuentan el total', () => {
    assert.equal(
        ctx.mensajeRachaEnRiesgo(5, 'Meditar, Leer'),
        'Te quedan 5 sellos por cerrar hoy, entre ellos Meditar, Leer.'
    );
});

// ---- resumenSemanaRitual ----

test('resumenSemanaRitual: sin hábitos todo a cero', () => {
    const r = ctx.resumenSemanaRitual();
    // Comparación por campos: los objetos del vm vienen de otro realm (no deepEqual).
    assert.equal(r.ok, 0);
    assert.equal(r.prog, 0);
    assert.equal(r.racha, 0);
});

test('resumenSemanaRitual: hábito sin sellar cuenta progreso sin aciertos', () => {
    ctx.habitosEnAgenda = () => [{ nombre: 'Meditar', momentos: ['MAÑANA'], enDescanso: false }];
    const r = ctx.resumenSemanaRitual();
    assert.equal(r.ok, 0);
    assert.ok(r.prog > 0, 'la semana en curso siempre tiene ≥ 1 día transcurrido');
    assert.equal(r.racha, 0);
    ctx.habitosEnAgenda = () => [];
});

// ---- HTML de ajustes (switches y horas de aviso, 1.2) ----

const BLOQUES_AVISO = ['manana', 'tarde', 'noche', 'riesgo', 'resumen'];

test('ajustes: los 5 switches de avisos existen con role=switch', () => {
    for (const b of BLOQUES_AVISO) {
        const m = html.match(new RegExp(`id="switch-digest-${b}"[^>]*role="switch"`));
        assert.ok(m, `falta switch-digest-${b} con role=switch`);
    }
});

test('ajustes: los 5 switches llaman a alternarDigestRitual con su bloque', () => {
    for (const b of BLOQUES_AVISO) {
        const m = html.match(new RegExp(`id="switch-digest-${b}"[^>]*onclick="[^"]*alternarDigestRitual\\('${b}'\\)"`));
        assert.ok(m, `switch-digest-${b} sin handler alternarDigestRitual('${b}')`);
    }
});

test('ajustes: los 5 botones de hora existen con aria-label', () => {
    for (const b of BLOQUES_AVISO) {
        const m = html.match(new RegExp(`id="digest-hora-${b}"[^>]*aria-label="[^"]+"`));
        assert.ok(m, `falta digest-hora-${b} con aria-label`);
    }
});
