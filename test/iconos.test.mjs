import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargarContextoHabitos } from './helpers/sandbox.mjs';

const ctx = cargarContextoHabitos();
// Array.from normaliza arrays de otros realms (vm) al realm del test antes de comparar
const norm = (x) => Array.from(x || []);

test('extraerFechaUnica extrae el día U: de los momentos', () => {
    assert.equal(ctx.extraerFechaUnica(['U:2026-09-12', 'MAÑANA']), '2026-09-12');
    assert.equal(ctx.extraerFechaUnica(['MAÑANA']), '');
    assert.equal(ctx.extraerFechaUnica([]), '');
});

test('extraerFechasUnicas recoge todas las fechas U: ordenadas y únicas', () => {
    const r = ctx.extraerFechasUnicas(['U:2026-09-27', 'U:2026-09-12', 'TARDE', 'U:2026-09-12']);
    assert.deepEqual(norm(r), ['2026-09-12', '2026-09-27']);
    assert.deepEqual(norm(ctx.extraerFechasUnicas(['MAÑANA'])), []);
});

test('fechasUnicasDeHabito prioriza fechasUnicas, luego fechaUnica, luego momentos', () => {
    assert.deepEqual(norm(ctx.fechasUnicasDeHabito({ fechasUnicas: ['2026-09-27', '2026-09-12', '2026-09-12'] })), ['2026-09-12', '2026-09-27']);
    assert.deepEqual(norm(ctx.fechasUnicasDeHabito({ fechaUnica: '2026-09-12' })), ['2026-09-12']);
    assert.deepEqual(norm(ctx.fechasUnicasDeHabito({ momentos: ['U:2026-09-12', 'NOCHE'] })), ['2026-09-12']);
    assert.deepEqual(norm(ctx.fechasUnicasDeHabito({})), []);
    assert.deepEqual(norm(ctx.fechasUnicasDeHabito(null)), []);
});

test('habitEsUnaVez detecta tipo, flag y momentos U:', () => {
    assert.equal(ctx.habitEsUnaVez({ tipo: 'Una vez' }), true);
    assert.equal(ctx.habitEsUnaVez({ unaVez: true }), true);
    assert.equal(ctx.habitEsUnaVez({ momentos: ['U:2026-09-12'] }), true);
    assert.equal(ctx.habitEsUnaVez({ tipo: 'Ritual' }), false);
    assert.equal(ctx.habitEsUnaVez(null), false);
});

test('momentoDesdeHora clasifica la franja según la hora', () => {
    assert.equal(ctx.momentoDesdeHora('07:30'), 'MAÑANA');
    assert.equal(ctx.momentoDesdeHora('15:00'), 'TARDE');
    assert.equal(ctx.momentoDesdeHora('22:00'), 'NOCHE');
    assert.equal(ctx.momentoDesdeHora(''), 'CUALQUIER');
    assert.equal(ctx.momentoDesdeHora('xx'), 'CUALQUIER');
});

test('momentosDeUnaVezList genera los momentos U: + franja, ordenados y únicos', () => {
    assert.deepEqual(norm(ctx.momentosDeUnaVezList(['2026-09-27', '2026-09-12'], '07:30')), ['U:2026-09-12', 'U:2026-09-27', 'MAÑANA']);
    assert.deepEqual(norm(ctx.momentosDeUnaVezList('2026-09-12', '15:00')), ['U:2026-09-12', 'TARDE']);
    assert.deepEqual(norm(ctx.momentosDeUnaVez('2026-09-12', '15:00')), ['U:2026-09-12', 'TARDE']);
});
