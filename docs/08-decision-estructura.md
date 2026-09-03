# AWAKE — Decisión de estructuración (08 · septiembre 2026)

**Versión:** 1.0 · 3 de septiembre de 2026
**Contexto del mantenedor:** una sola persona, sin formación formal en ingeniería de software, que genera y mantiene el código con asistencia de IA. Sin plan inmediato de crecimiento del equipo. El riesgo principal percibido: **bugs de lógica que la IA introduce y que pasan desapercibidos**.
**Documento de referencia:** `docs/07-auditoria-externa.md` (inventario real, hallazgos A-1…A-17, Opciones A y B con ventajas/inconvenientes).

---

## 1. Decisión

**Se adopta la Opción A — «Mismos mimbres, fronteras reales»: modularización ESM nativa sin build step**, ejecutada de forma incremental por dominios (plan S1–S7 de `docs/05-modulos.md`), con **Git + protección de `main` + CI como guardarraíles obligatorios** durante toda la migración.

La Opción B (Vite + TypeScript + Vitest) queda **descartada por ahora** y se re-evalúa si: (a) se incorpora una segunda persona al código, (b) la tasa de bugs por errores de tipos supera el coste de la migración, o (c) se prioriza i18n y el coste de la deuda de diseño supera al de migrar.

## 2. Por qué A es la elección correcta para este perfil

1. **Los errores se hacen visibles en desarrollo, no en producción.** Hoy el contrato entre scripts es implícito (orden de carga + globales): cuando la IA rompe una referencia, nada avisa y el fallo llega a un usuario. Con módulos ESM (`import`/`export`), cualquier símbolo mal nombrado o ruta rota produce un error inmediato y legible en consola/CI: *«X is not exported from Y»*. Ese mensaje es la «segunda revisión» que el mantenedor no necesita hacer a mano.
2. **Cero infraestructura nueva que mantener.** No hay bundler, compilador, config de TS ni pipeline nuevo que depurar cuando algo falle. El deploy, el service worker, Capacitor y Vercel siguen funcionando exactamente igual.
3. **Riesgo acotado y reversible.** La extracción es incremental (un dominio por semana, mover sin mejorar), con los 30 tests + smoke como red. Si una semana se complica, se para y lo ya extraído queda mejor que antes.
4. **Menos superficie de error para la IA.** Cada archivo pasa a tener dependencias *declaradas*; la IA (y el mantenedor) ven el grafo real sin tener que memorizar el orden de carga. Los módulos puros de dominio se pueden testear de verdad (hoy `app.js` es intestable: hallazgo A-9).
5. **La red de tests crece con el código.** Cada dominio extraído se vuelve importable en tests reales, eliminando duplicaciones como `test/helpers/stubs-fechas.js` (A-7).

## 3. Guardarraíles aplicados (innegociables durante la migración)

| Guardarraíl | Estado | Nota |
|---|---|---|
| Repositorio Git con historia | ✅ Aplicado (commits base + saneamiento + docs) | Ver `docs/07` § 9 |
| Remoto `app-habitos` | ✅ Aplicado | GitHub, cuenta del mantenedor · **público** (requisito del plan free de GitHub para poder proteger ramas) |
| Protección de `main` | ✅ Aplicado | Push directo bloqueado; **PR obligatorio + CI verde** |
| CI (GitHub Actions) | ✅ Aplicado | `npm test` + `check-sintaxis` + `check-imports` en cada push/PR |
| Gate local `npm run check` | ✅ Aplicado | Sintaxis + grafo 3D sin esperar al CI |

**Flujo de trabajo a partir de ahora (regla de oro):** ningún cambio —humano o de IA— entra en `main` sin pasar por un PR que el mantenedor revisa y que el CI valida. El mantenedor es el punto de control humano de cada cambio generado.

## 4. Plan de ejecución (Opción A, por dominios)

Secuencia heredada de `docs/05-modulos.md` § 5, con la regla **«extraer sin mejorar»** y **nunca mezclar refactor con features**:

1. **S1 · `state.js` + `auth.js`** — extraer la sesión inline de `app.js` y los globales críticos a módulos con tests (sandbox `vm` o imports reales).
2. **S2 · `notifications.js`** — recordatorios/avisos fuera de `habits.js`; tests de resumen semanal y racha en riesgo.
3. **S3 · `social.js`** — feed, likes, comentarios, publicaciones (el bloque mayor de `app.js`).
4. **S4 · `badges.js`** — colección + apertura 3D + arte.
5. **S5 · `settings.js`** — temas/fondos, ajustes de cuenta.
6. **S6 · `media.js`** — crop de avatar y subida de imágenes.
7. **S7 · `ui.js` + primitivas CSS** — saneamiento de `app.css` (objetivo ~30 % de reglas duplicadas eliminadas).

**Criterio de salida de cada semana:** módulos importables, `npm test` + `npm run check` verdes, sin cambios de comportamiento, PR revisado y mergeado. **Meta final (ROADMAP 4.1):** `app.js` como orquestador < 3.000 líneas, `index.html` cargando un solo punto de entrada ESM, y cada dominio testeable.

## 5. Qué NO se hará en esta migración

- No se introducirá build step, framework ni TypeScript (decisión § 1; re-evaluable).
- No se tocará `chat.js` funcionalmente (congelado por decisión de producto — ROADMAP 3.2): solo movimiento mecánico si el refactor lo exige.
- No se mezclarán features con extracciones (regla de oro). Si aparece una feature urgente, se hace aparte y se re-planifica la semana.
