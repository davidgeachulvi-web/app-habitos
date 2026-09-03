import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargarContextoHabitos } from './helpers/sandbox.mjs';

const ctx = cargarContextoHabitos();

function dia(y, m, d) { return new Date(y, m - 1, d, 12, 0, 0); } // mediodía local para evitar desbordes

test('una vez con varias fechas: aparece en cada fecha elegida y no en otras', () => {
    const h = { tipo: 'Una vez', unaVez: true, fechasUnicas: ['2026-09-12', '2026-09-27'] };
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 9, 12)), true);
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 9, 27)), true);
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 9, 13)), false);
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 9, 26)), false);
});

test('una vez legacy: fechaUnica única', () => {
    const h = { unaVez: true, fechaUnica: '2026-09-12' };
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 9, 12)), true);
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 9, 13)), false);
});

test('una vez por momentos U: (compatibilidad nube)', () => {
    const h = { unaVez: true, momentos: ['U:2026-09-12', 'MAÑANA'] };
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 9, 12)), true);
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 9, 13)), false);
});

test('hábito 24/7 aparece cualquier día', () => {
    const h = { momentos: ['24/7'] };
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 9, 7)), true);
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 9, 13)), true);
});

test('hábito por días de la semana respeta getDay (1=lu, 3=mi, 5=vi)', () => {
    const h = { dias: [1, 3, 5] };
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 9, 7)), true);  // lunes
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 9, 8)), false); // martes
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 9, 9)), true);  // miércoles
});

test('sin días definidos aparece siempre', () => {
    assert.equal(ctx.habitProgramadoEnFecha({ dias: [] }, dia(2026, 9, 8)), true);
});

test('hábito creado en el futuro no aparece antes de su nacimiento', () => {
    const h = { momentos: ['MAÑANA'], dias: [1, 2, 3, 4, 5, 6, 0], createdAt: '2026-10-01T10:00:00' };
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 9, 12)), false);
    assert.equal(ctx.habitProgramadoEnFecha(h, dia(2026, 10, 5)), true);  // 5 oct = lunes
});

test('hábito nulo nunca está programado', () => {
    assert.equal(ctx.habitProgramadoEnFecha(null, dia(2026, 9, 12)), false);
});
