# AWAKE — Auditoría externa del código (07 · septiembre 2026)

**Versión:** 1.0 · 3 de septiembre de 2026
**Autor:** auditoría externa independiente (revisión íntegra del código en disco)
**Alcance:** revisión, análisis y estructuración del proyecto completo — frontend (`www/`), tests (`test/`), scripts (`scripts/`), backend (`supabase/`), docs (`docs/`), nativo (`android/`, `ios/`), pipeline y configuración raíz.
**Método:** lectura de código real en disco (no de la documentación), mediciones por herramientas (recuento de líneas, referencias cruzadas, diffs), ejecución de la suite de tests, y verificación de sincronización entre `www/` y las copias nativas.
**Estado de la sesión:** en esta misma sesión se ejecutaron los prerrequisitos de control aprobados (Git + commit base, saneamiento de la raíz); ver § 9.

---

## 1. Resumen ejecutivo

AWAKE es una **SPA en JavaScript puro sin framework y sin paso de build** (fuente de verdad en `www/`), desplegada en Vercel como PWA y empaquetada en Android/iOS con Capacitor 8. El backend es Supabase (Postgres + RLS + Realtime + una Edge Function Deno). Es una app de hábitos («rituales») con capa social (feed, follows, likes, comentarios, mensajes directos), insignias 3D (Three.js), recordatorios locales y analítica local-first.

**Valoración global: el proyecto es funcional, está documentado con una madurez inusual para código generado por IA y tiene una red de tests en verde (30/30), pero su estructura interna no protege esa funcionalidad.** Los riesgos principales son arquitectónicos, no de features:

1. **Contrato implícito por orden de carga y ámbito global** — los scripts de la app no se importan entre sí; comparten estado vía top-level `let`/`window` y funciones globales. Cualquier reordenación, renombrado o borrado rompe el arranque sin aviso del compilador (no hay compilador).
2. **Monolito `www/app.js` de 10.041 líneas** (creciendo; los docs citan 9.473) que mezcla UI, lógica de dominio, sesión, datos y sincronización.
3. **Estado global disperso y mutado desde muchos puntos** — causa raíz reconocida de los bugs de «combinación de fases» (B-46, B-55, B-57).
4. **Sin control de versiones ni CI hasta esta sesión** — imposible auditar el historial, revertir o blindar PRs.
5. **Árboles muertos en la raíz** (ya saneados en esta sesión, § 9) que duplicaban código y podían desplegarse por error.

**En positivo:** documentación de producto/arquitectura muy completa y honesta (`docs/`), backlog de bugs trazado y verificado (B-01…B-60), tests útiles de lógica pura y smoke estáticos, visor 3D con ESM real y lazy-load (patrón correcto que debería extenderse al resto), copias nativas sincronizadas por checksum, RLS documentada y sin secretos en el bundle.

**Conclusión de estructuración:** el proyecto necesita *fronteras reales entre módulos* (imports/exports explícitos, estado centralizado, capas UI/lógica/datos separadas). Este documento propone dos rutas para lograrlo (§ 6): **Opción A** (modularización ESM nativa sin build step, evolutiva) y **Opción B** (migración a Vite + TypeScript + Vitest, transformadora). Los prerrequisitos comunes están en § 7 y la recomendación provisional en § 8.

---

## 2. Inventario real verificado (3 de septiembre de 2026)

| Área | Archivo | Líneas | Señales de acoplamiento |
|---|---|---|---|
| Orquestador global | `www/app.js` | **10.041** | 488 funciones · 389 `getElementById` · 60 `addEventListener` · 80 llamadas Supabase · 219 handlers inline en el HTML que apuntan aquí |
| Dominio hábitos | `www/js/domain/habits.js` | **3.844** | 203 `getElementById` · 17 llamadas Supabase · lee `misHabitos`, `currentUser`, `selectedDate` de `app.js` |
| Chat DM (congelado) | `www/js/social/chat.js` | **1.745** | 47 `getElementById` · llama a funciones de `app.js` (`abrirModalAuth`…) |
| Iconos SVG | `www/js/domain/icons.js` | 550 | 0 DOM · catálogo Phosphor |
| Sesión Supabase | `www/js/core/session.js` | 185 | Cliente + adaptador de almacenamiento (localStorage/IDB/cookies) |
| Sonidos | `www/js/core/sonidos.js` | 73 | Motor por manifiesto |
| Analítica | `www/js/core/analytics.js` | 31 | local-first |
| Arte sellos | `www/js/badges/badge-seal-art.js` | 139 | 0 DOM |
| Visor 3D | `www/js/badges/badge-coin-3d.js` + `coin/*` | ~1.200 | **Único grafo con ESM real** (imports relativos, lazy-load) |
| Vendor | `www/js/vendor/*` | ~5.480 | Three.js + addons (sin mantenimiento propio) |
| PWA | `www/sw.js` | 97 | Shell manual + bump de versión por script |
| Vista | `www/index.html` | 1.455 | DOM estático + **219 atributos `on*=` inline** |
| Estilos | `www/app.css` | **6.546** | Monolito CSS con duplicados conocidos (ROADMAP 2.5) |
| Tests | `test/*.mjs` | 4 archivos | **30 tests** (`node:test` + sandbox `vm`) |
| Backend | `supabase/sql/*` | 25 scripts | Esquema + RLS + triggers |
| Edge Function | `supabase/functions/notify-message/index.ts` | 1 | Push FCM autenticado por JWT |
| Scripts pipeline | `scripts/*` | 12 archivos | bump-sw, check-imports, strip-vercel, generar-iconos… |

**Total en `www/`:** 47 archivos · ~2,8 MB. **Código app (sin vendor):** ~18.200 líneas JS/HTML/CSS.

> **Nota de deriva documental:** `docs/04-arquitectura.md` y `docs/05-modulos.md` citan cifras históricas (app.js 9.473, habits.js 3.714, CSS 5.992, index.html 1.342). Las cifras de esta tabla son las verificadas en disco hoy y son las que deben usarse en adelante.

---

## 3. Modelo de carga y arquitectura real

```
index.html (script tags en orden fijo, al final del body)
  ├─ js/core/session.js    → define supabaseClient + almacén de sesión (global)
  ├─ js/core/sonidos.js    → window.awakeSonidos + reproducirSonido()
  ├─ js/domain/icons.js    → catálogo de iconos
  ├─ js/social/chat.js     → funciones globales de chat (usa app.js)
  ├─ js/domain/habits.js   → funciones globales de hábitos (usa app.js)
  ├─ js/badges/badge-seal-art.js
  ├─ js/core/analytics.js  → window.awakeAnalytics
  └─ app.js (defer)        → monolito: estado, UI, Supabase, social, badges…
        └─ window.onload = async function() { … }   ← arranque real

visor 3D (único ESM): badge-coin-3d.js ──imports──▶ coin/coin-*.js  (import map "three")
```

**Consecuencias verificadas:**

- **No hay exports/imports entre los scripts de la app.** Todo el «contrato» es: *los scripts se cargan en este orden y comparten el scope global* (`function` y `let` top-level). El smoke test (`test/smoke.test.mjs`) existe precisamente para compensar esto: valida por regex que todo `getElementById('id')` tenga su `id` en el HTML y que toda función llamada desde un `on*=` inline exista en algún JS.
- **`habits.js` y `chat.js` dependen de `app.js` en ambas direcciones.** `habits.js` llama a `renderCalendarStrip`, `sincronizarFiltroVisualActivo` (definidas en `app.js`) y lee `misHabitos`/`currentUser`; `app.js` llama a `renderizarMiRutina`, `determinarMomentoActual`, etc. No hay capas: es una red de dependencias cruzadas entre tres archivos gigantes.
- **El estado vive en top-level `let` de `app.js`** (`misHabitos`, `currentUser`, `selectedDate`, `activeFilter`…) **y en `window`** (`registrosGlobalMap`, `cachePerfilesSocial`, `userHasAvatar`, `tempAvatarBase64`), con **resets repetidos en ~5 sitios** (app.js 213, 3128, 5179–5181, 5722, 6694) y sin un mecanismo de notificación de cambios.
- **219 handlers inline** (`onclick="…"`) en `index.html` más HTML generado por *template strings* con `on*=` — obligan a que las funciones sean globales y hacen imposible la validación estática de argumentos.
- **Un solo punto de arranque** (`window.onload` en `app.js`) que orquesta canvas de fondo, slider, pull-to-refresh, reloj del ritual, sesión Supabase, SW, recordatorios, insignias, social… (líneas 1746 en adelante).

---

## 4. Hallazgos priorizados

### 🔴 Críticos (bloquean la evolución segura)

| # | Hallazgo | Evidencia | Riesgo |
|---|---|---|---|
| A-1 | **Sin control de versiones ni CI** (hasta esta sesión) | No existía `.git`; sin historial, sin revert, sin PRs, sin gates automáticos | Cualquier cambio es irreversible a nivel práctico; la promoción a producción dependía de memoria |
| A-2 | **Contrato por orden de carga + globals** | Scripts sin imports/exports; smoke test por regex como única red | Mover/renombrar un archivo o función rompe el arranque en silencio (ya pasó: B-24 con rutas del visor 3D) |
| A-3 | **Monolito `app.js` (10.041 líneas) y CSS (6.546)** | 488 funciones; 389 lecturas DOM; 80 llamadas Supabase; UI+estado+datos+sesión mezclados | Cada feature nueva toca el archivo entero; bugs recientes (modal de tema, visor iOS) nacieron de falta de límites |
| A-4 | **Estado global disperso y mutado en múltiples puntos** | `window.*` + top-level lets + resets repetidos; sin store ni suscriptores | Bugs de combinación de fases (B-46, B-55, B-57 documentan la causa raíz) |

### 🟡 Altos

| # | Hallazgo | Evidencia | Riesgo |
|---|---|---|---|
| A-5 | **Sesión/auth repartida** entre `session.js` (almacenamiento + cliente) y `app.js` (restauración, login UI, sync) | `restaurarSesionDesdeRespaldo` (app.js 1867), modal auth (6350), logout (5238) | Dos lugares con lógica de sesión → deriva silenciosa |
| A-6 | **Dependencias bidireccionales entre archivos** | `habits.js` ↔ `app.js`; `chat.js` → `app.js` | Ningún dominio es extraíble o testeable por separado |
| A-7 | **Duplicación de helpers entre código y tests** | `test/helpers/stubs-fechas.js` dice «Copiado verbatim de app.js» | Si cambia la implementación en producción y no en el stub, los tests validan lógica distinta a la real |
| A-8 | **Lógica de sincronización last-write-wins implícita** | Sin política de resolución de conflictos documentada en código; colas optimistas parciales (chat, comentarios) | Pérdida silenciosa de datos en escrituras concurrentes (móvil + web) |
| A-9 | **`app.js` intestable hoy** | 389 lecturas DOM directas; todo global | La parte más crítica (sesión, sync, social) no tiene tests unitarios |

### 🟢 Medios (deuda e higiene)

| # | Hallazgo | Evidencia |
|---|---|---|
| A-10 | **Service worker con lista shell manual** | `www/sw.js` lista 27 rutas a mano; cada archivo nuevo hay que añadirlo (causó B-24) |
| A-11 | **Handlers inline (219) + HTML por string** | `onclick="…"` en `index.html` y en templates JS; sin validación de tipos |
| A-12 | **Dos servidores estáticos casi idénticos** | `dev-server.js` (4173, SPA-fallback) y `.preview-server.cjs` (8123) duplicados |
| A-13 | **`package.json` `main` roto** | Apunta a `index.js` inexistente (el arranque real es `npm run dev`) |
| A-14 | **Árboles muertos en la raíz** (saneado, § 9) | `legacy/www`, `proto`, `proto2`, `tmp-restaurar`, `backup-icono-anterior`, `scripts/out` (~11 MB, 164 archivos) |
| A-15 | **Docs desincronizados del disco** | Cifras y rutas históricas en `docs/04`, `docs/05` (§ 2) |
| A-16 | **Skew de versión SW entre `www/` (v170) y copias nativas (v169)** | `diff` de `www/sw.js` vs `ios/App/App/public/sw.js` y Android: solo difiere la versión; la copia nativa quedó desactualizada tras el último bump |
| A-17 | **Scripts de laboratorio en `scripts/`** | `marco-v4.html/js`, `qa-badges-visual.mjs`, `_fix-template.js` — utilidades de una sola vez sin documentar |

---

## 5. Lo que el proyecto hace bien (no romper)

1. **Documentación** — `docs/` cubre MVP, roadmap, flujos UX, arquitectura, módulos, RLS, runbook SQL y backlog B-*. Es raro y valioso; hay que mantenerla viva, no reescribirla.
2. **Backlog trazado y verificado** — B-01…B-60 con causa raíz, acción y verificación E2E. Disciplina de depuración excelente.
3. **Tests 30/30 en verde** — lógica pura de programación de hábitos, iconos, recordatorios y smoke estáticos con sandbox `vm`.
4. **Visor 3D como referencia de patrón correcto** — ESM real con imports relativos, guard WebGL2, lazy-load, `onFail`/`diag`, sin excepción lanzada; `check-imports.js` valida el grafo.
5. **Sin secretos en el bundle** — anon key pública por diseño; sin service keys; `.env*` excluido del deploy.
6. **RLS documentada y aplicada** — `docs/rls.md` con mapa por tabla y 401 guest esperado documentado.
7. **Copias nativas sincronizadas por checksum** — `cap:copy` + verificación (con el skew A-16 como excepción puntual).
8. **Analítica local-first** con salto automático a Plausible si existe `window.plausible`.
9. **Accesibilidad trabajada** — ARIA, contraste WCAG, `prefers-reduced-motion`, objetivos táctiles ≥ 44 px (B-07/B-08/B-09/B-26).

---

## 6. Dos formas de estructurar el proyecto

### Opción A — «Mismos mimbres, fronteras reales»: modularización ESM nativa sin build step

**Qué es.** Convertir los scripts globales de la app en **módulos ES con `import`/`export` explícitos**, manteniendo la arquitectura estática (sin bundler, sin framework, sin paso de build). El visor 3D ya demuestra que el patrón funciona en producción con Safari/iOS. Reorganización por capas dentro de `www/js/`:

```
www/js/
  core/     → fechas, storage, sesión (session.js), sonidos, analytics
  domain/   → lógica pura: programación de hábitos, rachas, insignias, mensajes
  data/     → repositorios Supabase + localStorage (única puerta a datos)
  state/    → store mínimo con suscriptores (createStore ~30 líneas)
  ui/       → render, modales, eventos (todo lo que toca el DOM)
  social/   → feed, follows, chat (estable)
  badges/   → visor 3D + arte (ya ESM)
  main.js   → único punto de entrada: arranca, inyecta estado, expone a window
              SOLO los símbolos que los 219 handlers inline necesitan
```

`index.html` pasa a cargar **un solo** `<script type="module" src="js/main.js">`; el resto se resuelve por el grafo de imports. `app.js` queda como orquestador < 3.000 líneas o desaparece. Cada dominio exporta funciones puras testeables; los handlers inline se migran a `addEventListener` por zonas (con un puente temporal `window.manejarX = …` en `main.js`).

**Ventajas**
- **Cero cambios de infraestructura**: deploy Vercel, SW, Capacitor y dev-server siguen igual; la app sigue siendo un conjunto de archivos estáticos.
- **Riesgo bajo y reversible**: extracción por dominio con tests como red; se puede parar en cualquier momento y lo ya hecho queda mejor que antes.
- **Aprovecha lo ya validado**: el visor 3D y `check-imports.js` demuestran que el ESM nativo funciona en las 3 plataformas; `check-imports` se extiende a toda la app.
- **Encaja con el plan existente** S1–S7 de `docs/05-modulos.md` (state+auth → notifications → social → badges → settings → media → ui/css).
- **Mantiene la simplicidad de inspección** (sin build: lo que ves en disco es lo que corre en producción).

**Inconvenientes**
- **Sigue sin typecheck ni linter**: errores de tipos/argumentos solo los atrapa el runtime o los tests; la disciplina de revisión debe ser manual.
- **El SW y el orden de carga siguen gestionándose a mano** (automatizable con un script que derive el grafo desde `main.js`, pero hay que escribirlo).
- **Puente con handlers inline**: los 219 `on*=` exigen exponer símbolos en `window` durante la transición (deuda temporal controlada).
- **La deuda de diseño de fondo no desaparece** (sin i18n, sin tipado, CSS monolito se ataca aparte en 2.5).
- **Esfuerzo de mantenimiento de la red**: los tests sandbox `vm` actuales deben migrar a importar los módulos reales.

**Esfuerzo estimado:** 4–8 semanas a tiempo parcial, un dominio por semana (según ROADMAP 4.1), con `npm test` + smoke + `check-imports` verdes tras cada semana.

---

### Opción B — «Reconstrucción con herramientas modernas»: Vite + TypeScript + Vitest

**Qué es.** Introducir un toolchain real: **Vite** como bundler (entrada `src/` → `dist/`), **TypeScript estricto**, **Vitest** + happy-dom para tests, ESLint/Prettier, y service worker generado/versionado desde el build (`vite-plugin-pwa` o script propio). Estructura por *features* con capas internas:

```
src/
  app/            → arranque, routing de pestañas, main.ts
  habits/         → domain.ts (puro) · data.ts (Supabase/local) · ui.ts
  social/         → feed, follows, chat · domain/data/ui
  badges/         → lógica + visor 3D (lazy)
  settings/       → temas, prefs, cuenta
  core/           → fechas, storage, sesión, analytics, sonidos
  state/          → store tipado con suscriptores
  types/          → modelos compartidos (Habit, Log, Profile…)
dist/             → build estático que se despliega en Vercel y se copia a Capacitor
```

`www/` pasa a ser `dist/` (o `www/` generado por el build); el deploy encadena `vite build` → tests → `vercel deploy dist` → `cap:copy`.

**Ventajas**
- **TypeScript atrapa la clase de bugs que han golpeado** (fase/estado mal combinado, IDs mal escritos, formas de registro divergentes) en tiempo de compilación, no en producción.
- **Elimina el contrato por orden de carga**: el grafo de imports es explícito y el bundler lo valida; renombrar sin actualizar referencias falla en CI, no en runtime.
- **El SW se genera, no se mantiene a mano** (A-10 desaparece); `three` deja de pesar en el shell si se mantiene el lazy-load (tree-shaking).
- **Tests unitarios reales** sobre módulos importables; puerta a E2E (Playwright) y a migración incremental de handlers inline a listeners.
- **Mejor DX**: HMR en desarrollo, sourcemaps, tipado de Supabase (generado desde el esquema SQL), refactor asistido.
- **Escala para i18n** (ROADMAP 5.6) y para crecer el equipo sin fricción.

**Inconvenientes**
- **Migración larga y de mayor riesgo**: portar ~18.200 líneas de lógica entrelazada sin cambiar comportamiento exige red de tests previa y congelación de features durante semanas.
- **Cambia el pipeline entero** (build, deploy, PWA, Capacitor, dev-server) — ventana de inestabilidad y necesidad de re-verificar las 3 plataformas.
- **Overhead de configuración y curva**: TS, tipos de Supabase, config de Vite/PWA/CI — coste real para un proyecto de un solo mantenedor.
- **Se pierde la inspección directa** «lo que ves es lo que corre»: los bugs requieren leer código fuente + build.
- **Riesgo de reescritura disfrazada de refactor** si no se respeta la regla «extraer sin mejorar» (la tentación de «ya que toco, arreglo» es el mayor peligro).

**Esfuerzo estimado:** 3–6 meses a tiempo parcial para migración completa segura; o un piloto acotado (montar toolchain + migrar 1 dominio + CI) en 1–2 semanas para evaluar el encaje real.

---

### Tabla comparativa

| Criterio | Opción A (ESM nativo) | Opción B (Vite + TS) |
|---|---|---|
| Riesgo de regresión | Bajo (incremental, reversible) | Medio-alto (cambio de pipeline + port) |
| Protección contra bugs de lógica | Media (tests + revisión) | Alta (tipos + tests + CI) |
| Cambio de infraestructura | Ninguno | Completo (build, deploy, SW, Capacitor) |
| Velocidad de entrega de features durante el refactor | Se mantiene | Se ralentiza (congelación parcial) |
| Deuda de diseño de fondo | Permanece | Se liquida parcialmente (tipado, i18n-ready) |
| Esfuerzo total | 4–8 semanas | 3–6 meses (o piloto de 1–2 semanas) |
| Mantenimiento futuro (1 dev) | Sencillo pero manual | Más configuración, más seguridad |
| Encaje con docs existentes | Directo (S1–S7) | Requiere reescribir docs de arquitectura |

---

## 7. Prerrequisitos comunes (innegociables para ambas opciones)

1. **Git con commit base y rama `main` protegida** — ✅ ejecutado en esta sesión (§ 9). Siguiente paso natural: remoto privado + `git push` + protección de rama.
2. **CI mínimo** — en cada PR: `npm test`, sintaxis de todos los JS (`node --check`), `check-imports.js`, y (cuando exista) typecheck. Sin CI, los prerrequisitos pierden la mitad de su valor.
3. **Ampliar la red de tests antes de refactorizar** — prioridad: lógica pura de sesión/sync extraída, helpers de fecha sin duplicación (eliminar el «copiado verbatim» de A-7), y tests sobre las funciones puras que hoy viven dentro de `app.js`.
4. **Decidir y documentar la política de conflictos de datos** — hoy es last-write-wins implícito (A-8); documentarlo en `docs/rls.md`/arquitectura o implementar resolución explícita.
5. **Automatizar el SW** — derivar la lista shell del grafo real (o del build en la Opción B); cerrar A-10 y A-16 (resincronizar copias nativas con `npm run cap:copy`).
6. **Congelar features durante el refactor** (regla de oro ya escrita en `docs/05-modulos.md` § 6) — nunca mezclar refactor con features.
7. **Mantener `docs/` viva** — cada cambio estructural actualiza `docs/04`, `docs/05` y este documento.

---

## 8. Recomendación provisional

**Para un proyecto de un solo mantenedor, sin deuda de features pendiente y con el visor 3D como prueba de que el ESM nativo funciona: la Opción A es la recomendada como primer movimiento**, porque entrega control real (fronteras, estado central, dominios testeables) con riesgo acotado y sin tocar el pipeline que ya funciona.

**La Opción B se recomienda si** (a) se planea crecer el equipo, (b) la tasa de bugs de lógica por tipado empieza a costar más que la migración, o (c) se quiere i18n/features ambiciosas donde el coste de la deuda de diseño supere al de la migración. En ese caso, el camino pragmático es **A primero y B después**: modularizar en ESM nativo ya produce los límites y tests que hacen la migración a TS mucho más segura (un módulo con exports explícitos se porta a TS casi mecánicamente).

**Criterios de decisión concretos** (revisar en 1–2 meses):
- Si aparecen 2+ bugs de lógica por errores de tipos/estado → adelantar B.
- Si el refactor A avanza un dominio por semana con tests verdes → continuar A hasta el final.
- Si se incorpora una segunda persona al código → migrar a B (TS + CI) antes de que crezca la base.

---

## 9. Acciones ejecutadas en esta sesión (prerrequisitos aprobados)

1. **Git inicializado y commit base** (`66a265e`) — congela los 354 archivos del estado actual (incluidos los árboles muertos, para que su borrado sea recuperable). Excluidos por `.gitignore` reforzado: `node_modules/`, `.env*`, logs, `.freebuff/`, `.vercel/`, `scripts/out/`, build outputs nativos.
2. **Saneamiento de la raíz** (`22359cb`) — eliminados del working tree: `legacy/www`, `proto/`, `proto2/`, `tmp-restaurar/`, `backup-icono-anterior/`, `scripts/out/`, `dev-server.log`, `.preview-server.log` (164 archivos, recuperables desde el commit base).
3. **Verificación**: `npm test` 30/30 en verde; copias nativas `ios/` y `android/` intactas; working tree limpio.
4. **Hallazgo nuevo registrado**: A-16 (SW nativo v169 vs `www/` v170) — la próxima ejecución de `npm run cap:copy` lo resuelve.

**Pendiente (decisión del responsable):** remoto Git + protección de rama, CI, elección A/B (§ 6–8), y el plan de refactor detallado correspondiente.

---

## 10. Anexo — evidencia y comandos de verificación

```bash
npm test                          # 30/30
node scripts/check-imports.js     # grafo del visor 3D (0 imports bare)
node --check www/app.js           # sintaxis (aplica a cada JS)
diff -rq www ios/App/App/public   # sincronización nativa (esperado: .vercel, cordova.*, SW)
```

Mediciones clave citadas en § 2 (verificadas el 3 de septiembre de 2026):
`wc -l` sobre `www/app.js` (10.041), `habits.js` (3.844), `chat.js` (1.745), `app.css` (6.546), `index.html` (1.455); recuentos por `grep` de `getElementById` (389/203/47), `addEventListener` (60), handlers `on*=` en `index.html` (219), llamadas `supabaseClient.from/channel/auth` (80/17/5), funciones top-level en `app.js` (488).
