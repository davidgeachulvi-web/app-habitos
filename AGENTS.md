# AGENTS.md — Guía de trabajo para sesiones de IA en AWAKE

> **Léeme completo antes de tocar nada.** Este archivo es el punto de entrada de cualquier sesión de IA
> (y del mantenedor). Los docs profundos están en `docs/`; el índice con lo que contiene cada uno está al final.
> Si este archivo y un doc se contradicen, **manda la realidad del código en disco** (verifica con `code_search`).

## 1. Qué es AWAKE

App de hábitos («rituales») con capa social. **SPA en JavaScript puro, sin framework y sin build step**,
servida desde `www/` como PWA, empaquetada con Capacitor 8 (Android/iOS) y backend Supabase
(Postgres + RLS + Realtime + 1 Edge Function Deno). Sin step de build: **lo que hay en `www/` es lo que corre**
en producción, en iOS y en Android (copias sincronizadas por `cap:copy`).

## 2. Comandos (raíz)

```bash
npm run dev           # servidor local de www/ (SPA-fallback) en :4173
npm test              # 30 tests (node:test)
npm run check         # gates locales: sintaxis de todos los JS + grafo del visor 3D
npm run deploy:web    # PRODUCCIÓN: check-imports → bump SW → vercel deploy → cap:copy
npm run cap:copy      # sincroniza www/ → ios/App/App/public y android/.../assets/public
node scripts/check-imports.js   # grafo del visor 3D (0 imports bare)
```

**Tras CADA cambio de código:** `npm test` + `npm run check` en verde. No hay typechecker ni linter;
estos dos comandos (más `node --check` interno) son toda la red de seguridad automatizada.

## 3. Estructura canónica (fuente de verdad: `www/`)

```
www/
  index.html            DOM estático + 219 handlers inline (onclick=...) — LOS IDS Y HANDLERS SON CONTRATO
  app.js                MONOLITO ~10.000 líneas: estado global, UI, sesión, Supabase, social, insignias, sync
  app.css               MONOLITO ~6.500 líneas (duplicados conocidos — refactor 2.5 pendiente)
  sw.js                 Service worker: shell precacheado manual + network-first (v170 en disco)
  js/core/              session.js (cliente Supabase + adaptador storage), sonidos.js, analytics.js
  js/domain/            habits.js (~3.800 líneas, lógica de rituales/rachas/calendario), icons.js (catálogo SVG)
  js/social/            chat.js (~1.700 líneas, CONGELADO — solo mantenimiento mecánico)
  js/badges/            visor 3D (único grafo ESM real: badge-coin-3d.js + coin/*.js) + badge-seal-art.js
  js/vendor/            Three.js r185 + addons (NO TOCAR, solo ruta de import)
docs/                   documentación (índice en § 8)
test/                   30 tests node:test (helpers sandbox vm + smoke de IDs/handlers)
scripts/                bump-sw, check-imports, check-sintaxis, strip-vercel, generar-iconos…
supabase/               sql/ (esquema+RLS, 25 scripts) + functions/notify-message (Deno)
```

**Regla de oro de estructura:** los scripts de la app **NO son módulos ES** (salvo el grafo del visor 3D).
Se cargan en orden fijo al final de `index.html` y comparten ámbito global (`function` y top-level `let`).
No hay `import`/`export` entre ellos. **Renombrar, reordenar o mover una función rompe el arranque sin aviso**
del compilador (no hay compilador). El plan para modularizar (Opción A) está en `docs/08-decision-estructura.md`.

## 4. Estado global y persistencia (lo que hay que respetar)

- **Estado en top-level `let` de `app.js`:** `misHabitos`, `misDeseos`, `currentUser`, `selectedDate`,
  `activeFilter`, `authMode`, prefs de sonido/vibración… y muchos más. Cualquier archivo puede leerlos.
- **Estado en `window`:** `registrosGlobalMap`, `cachePerfilesSocial`, `userHasAvatar`, `tempAvatarBase64`,
  `awakeAnalytics`, `awakeSonidos`, `BadgeCoin3D`…
- **Persistencia local por usuario:** `localStorage['monolith_app_state:{uid}']` (clave `AWAKE_STATE_KEY` +
  `claveEstadoLocal(uid)` en app.js) + **IndexedDB** `awake-persist` para la sesión de Supabase
  (`session.js`) + cookies heredadas migradas. Prefs sueltas: `awake_feedback_prefs`, `awake_bg_choice`,
  `awake_day_sealed_*`, `awake_onboarded`, `awake_first_seal`, `awake_marco`, `awake_ios_adapt`,
  `awake_analytics_log`, `awake_badges_unlocked`, `awake_chat_last_read`.
- **Política de sincronización:** local-first, last-write-wins **implícito** (sin resolución de conflictos).
- **Sesión Supabase:** `supabaseClient` global creado en `session.js`; el flujo de auth/UI/sync vive en `app.js`
  (`window.onload`, `restaurarSesionDesdeRespaldo`, `cargarDatosUsuarioSupabase`, modales de login).

## 5. Cómo detectar errores (antes de dar un cambio por bueno)

1. **Consola en preview**: arranca `npm run dev`, abre la app, recorre el flujo tocado. La consola DEBE
   estar limpia salvo el **401 guest esperado** (ver `docs/rls.md` — no es bug).
2. **`npm test`**: los tests de lógica pura (programación de hábitos, rachas, recordatorios) y los smoke
   (todo `getElementById` y todo handler inline existen). Si tocas `app.js` o `habits.js`, ejecútalos sí o sí.
3. **`npm run check`**: sintaxis de todos los JS + `check-imports` del visor 3D. Si tocas rutas/archivos
   del 3D o creas un archivo JS nuevo, es obligatorio.
4. **Si creas o mueves un archivo servido**: añádelo a `www/sw.js` (lista `AWAKE_SHELL` y/o regex de
   `esRecursoShell`) o el modo offline romperá. Esto ya causó bugs reales (B-24).
5. **Bugs pasados con causa raíz documentada**: `docs/06-depuracion.md` (B-01…B-60) — léelo antes de
   tocar la zona correspondiente (insignias, sonidos, calendario, social…).
6. **Cifras del código**: `docs/04` y `docs/05` tienen cifras históricas (ver nota al inicio de cada uno);
   usa el inventario real de `docs/07-auditoria-externa.md` § 2 y verifica con `wc -l`/`code_search`.

## 6. Workflow (main protegida — NO hay push directo)

`main` está protegida en GitHub (PR obligatorio + CI verde + sin force-push). Los cambios — humanos o de IA —
entran así:

```bash
git switch -c feat/mi-cambio        # 1. rama desde main actualizada
# ...editar...  npm test && npm run check   # 2. gates locales en verde
git add <mis archivos> && git commit -m "..."   # 3. commit (nunca git add -A si hay ruido externo)
git push -u origin feat/mi-cambio   # 4. push
gh pr create --fill                 # 5. PR
# 6. esperar CI verde y merge (squash) — el mantenedor revisa en GitHub
```

Reglas:
- **Nunca** `git add -A` a ciegas: este checkout es compartido y a veces aparecen/desaparecen archivos
  externos (`proto/`, `scripts/_*.js`); añade siempre rutas explícitas de tus cambios.
- No commitear `.env*`, logs, `node_modules/`, `.freebuff/`, `.vercel/`.
- No mezclar refactor con features (regla de oro de `docs/05-modulos.md` § 6).
- Chat (`chat.js`) congelado: mover solo mecánicamente si un refactor lo exige, nunca «mejorarlo».
- Extracción sin cambio de comportamiento: mover funciones, no reescribirlas mientras se mueven.

## 7. Índice de documentación

| Doc | Contenido | Uso para la IA |
|---|---|---|
| `docs/01-definicion-mvp.md` | MVP: alcance, IN/OUT, límites | Qué decide el producto |
| `docs/02-roadmap.md` | Roadmap de producto v1.1 | Prioridades de producto |
| `docs/03-flujos-ux.md` | Flujos A–E (onboarding, ritual, social, cuenta, ajustes) | Comportamiento esperado |
| `docs/04-arquitectura.md` | Stack, capas, ADR, riesgos (cifras históricas) | Visión de conjunto |
| `docs/05-modulos.md` | Inventario de módulos + plan S1–S7 (cifras históricas) | Plan de modularización |
| `docs/06-depuracion.md` | Backlog B-01…B-60 con causa raíz y verificación | **Errores pasados, no repetir** |
| `docs/07-auditoria-externa.md` | Auditoría 03/09/2026: inventario REAL, hallazgos A-1…A-17, Opciones A/B | **Estado real + hallazgos** |
| `docs/08-decision-estructura.md` | Decisión: Opción A (ESM nativo) + guardarraíles + plan S1–S7 | **Qué y por qué** |
| `docs/09-contexto-ia.md` | Mapa lógico por dominio, verificación, señales de error | **Cómo funciona la app (este doc)** |
| `docs/10-registro-sesiones.md` | Bitácora de sesiones de IA (qué se hizo/cambió) | **Continuidad entre sesiones** |
| `docs/ROADMAP.md` | Roadmap de auditoría (fases 0–5) | Tareas técnicas pendientes |
| `docs/IMPLEMENTACIONES.md` | Informe antes/después de implementaciones | Histórico |
| `docs/rls.md` + `docs/sql-runbook.md` | RLS por tabla + runbook SQL | Backend/seguridad |
| `docs/app-habitos.md` | Notas históricas del proyecto | Contexto |

## 8. Convención de cierre de sesión

Al terminar cualquier sesión de trabajo en este repo, **añade una entrada a `docs/10-registro-sesiones.md`**
con: fecha, objetivo, qué se cambió (archivos), decisiones tomadas, gates verificados y pendiente/próximo paso.
Así la siguiente sesión de IA empieza con contexto y no hay que re-descubrir el estado.
