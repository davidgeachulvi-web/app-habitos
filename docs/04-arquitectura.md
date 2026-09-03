# Awake — Paso 4: Arquitectura y Configuración

**Versión:** 1.2 · septiembre 2026 (alineada con el MVP v1.1 y la hoja de ruta v1.1)
**Alcance:** auditoría arquitectónica de la base existente al nivel de stack, capas, configuración y riesgos. La auditoría **módulo a módulo** (con lectura profunda de código y refactor) es el Paso 5; aquí se documenta lo verificado en estructura/archivos y lo pendiente de verificar.
**Historial:** v1.2 (sept 2026) — resultados de la auditoría de módulos (Paso 5) incorporados en § 9; peso real del visor 3D corregido (~487 KB, no ~800 KB). v1.1 (sept 2026) — corrección del supuesto de SDK del MVP (ADR 3), ADR 8 (límites freemium IN 9) y ADR 9 (telemetría del piloto 3.5), checklist F1 (telemetría, encuesta, límites), discrepancia de cifras de `app.js` registrada en § 9, glitch del diagrama corregido. v1.0 (sept 2026) — versión inicial.

**NOTA (03/09/2026 · auditoría externa):** las cifras de líneas y rutas de este documento son **históricas** y han quedado desfasadas del disco. Cifras verificadas hoy: `app.js` **10.041** líneas (no 9.473), `app.css` **6.546** (no 5.992), `index.html` **1.455** (no 1.342), `habits.js` **3.844** en `www/js/domain/habits.js` (no 3.714 en `www/js/habits.js`), `chat.js` **1.745** en `www/js/social/chat.js`. Inventario real y auditoría completa en `docs/07-auditoria-externa.md` (§ 2).

---

## 1. Resumen ejecutivo

Awake es una **SPA estática en JavaScript puro (sin framework, sin paso de build)** que se despliega en Vercel, funciona como PWA, y se empaqueta en Android/iOS con **Capacitor 8** (mismo `www/` en las tres plataformas). El backend es **Supabase** (Postgres + RLS + Realtime + una Edge Function), accedido con el **SDK JS de Supabase vía CDN** y REST desde el cliente (corrección v1.1: el v1.0 decía «sin SDK»). La analítica es **local-first** (localStorage, sin cookies). El idioma actual es español hardcodeado (i18n diferido).

Es una arquitectura deliberadamente mínima con dos deudas claras: **un monolito de 9.473 líneas** en `www/app.js` y **un CSS de 5.992 líneas** con estilos repetidos — ambos ya reconocidos como tareas de refactor en `docs/ROADMAP.md` (4.1 y 2.5).

## 2. Capas

```
┌─────────────────────────────────────────────────────────────┐
│  UI y estado           www/index.html · app.js (9.5k) · app.css (6k) │
│                         módulos de dominio: habits.js (187 KB)      │
│                         icons.js · chat.js (83 KB) · badge-*.js     │
│  PWA                    manifest.webmanifest · sw.js (vN) · iconos  │
│  Nativas                Capacitor 8 → android/ · ios/               │
├─────────────────────────────────────────────────────────────┤
│  Datos                  local-first (localStorage/anon) + sync vía                          │
│                         Supabase JS SDK (CDN) con adaptador de       │
│                         sesión propio (localStorage + IndexedDB +    │
│                         cookies)                                    │
│  Backend                Supabase: perfiles, habits, habit_logs,     │
│                         follows, likes, comments, messages,         │
│                         chat_reads, device_tokens, badges, media,   │
│                         wishes/prefs · RLS + Realtime + triggers    │
│                         Edge Function: notify-message               │
├─────────────────────────────────────────────────────────────┤
│  Despliegue             Vercel (proyecto «www») · pipeline:         │
│                         check-imports → bump-sw → deploy → cap:copy │
└─────────────────────────────────────────────────────────────┘
```

## 3. Stack y estructura verificada

| Área | Realidad verificada | Detalle |
|---|---|---|
| Frontend | **Vanilla ES modules, sin build** | `www/app.js` (9.473 líneas), `www/js/habits.js` (187 KB), `www/js/chat.js` (83 KB), `icons.js`, `badge-seal-art.js`, `badge-coin-3d.js`, `analytics.js` |
| 3D | Three.js **lazy-loaded** (~487 KB: `three.module.min.js` 357 KB + addons 120 KB — verificado en el Paso 5) + addons (OrbitControls, RoomEnvironment, SVGLoader) | `www/js/three.module.min.js`; renderer real verificado: `badge-coin-3d.js` → `coin/coin-engine.js` (Three.js r185 procedural). `coin-studio.js` **vivo** (B-20 refutado): `makeStudioEnv` importado por `coin-scene.js` y precacheado en `sw.js` |
| PWA | `manifest.webmanifest` + `sw.js` con bump automático | `scripts/bump-sw.js` incrementa la versión en cada deploy |
| Native | **Capacitor 8** configurado (appId `app.awake.habits`) | `android/` e `ios/` presentes; plugins: app, haptics, keyboard, local-notifications, status-bar |
| Backend | **Supabase** con **Supabase JS SDK 2.112.4** vía CDN (`index.html`) + adaptador de sesión propio inline en `app.js` (localStorage + IndexedDB + cookies, con migración de sesiones heredadas) | 22 scripts SQL catalogados (`supabase/sql/`, incluido el diagnóstico `00-diagnostico.sql`; runbook en `docs/sql-runbook.md`) + `supabase/functions/notify-message` |
| Analytics | local-first, 8 eventos | `www/js/analytics.js` (30 líneas); modo Plausible automático si existe `window.plausible` |
| Tests | `node:test`, 16 tests | `test/iconos.test.mjs`, `test/programacion.test.mjs`, `test/smoke.test.mjs` + `scripts/check-imports.js` |
| Despliegue | Vercel, proyecto **«www»** | Alias público `www-smoky-phi-21.vercel.app`; pipeline `deploy:web` encadena validación |

## 4. Flujo de datos

- **Local-first:** la app funciona anónima y sin conexión; los datos se guardan localmente y **sincronizan a Supabase al crear cuenta** (persistencia en la nube + capa social).
- **Autenticación:** Supabase Auth (email/contraseña) desde el cliente vía REST; sesión guardada localmente.
- **Seguridad:** el límite de seguridad es **RLS** (que ya tiene scripts por tabla); el resto (anon key) es público por diseño en Supabase. Pendiente de auditar en el Paso 5/ROADMAP 5.5: `chat_reads` (script pendiente de ejecutar), `device_tokens`, `follows`, `badges_unlocked`.

## 5. Configuración y pipeline

- `npm run deploy:web` → `check-imports.js` → `bump-sw.js` → `vercel deploy www --prod` → `cap:copy` (sincroniza `www/` en `ios/App/App/public` y `android/app/src/main/assets/public`). **El mismo comando despliega web y sincroniza nativo.**
- `scripts/strip-vercel.js` elimina artefactos de Vercel del `www/` copiado a nativo.
- Código de servicio local: `node dev-server.js` (SPA-fallback, endpooint `POST /__save/` para exportar GLB del prototipo).
- **Credenciales:** `www/.env.local` (anon key) — público por diseño, pero **verificar en Paso 5 que el patrón no exponga el service key ni secretos**.
- Prototipo/recursos: `proto/` (moneda 3D, `coin.html`, presets) — reubicado fuera de `www/`.

## 6. Decisiones de arquitectura (ADR resumido)

| # | Decisión | Estado | Nota |
|---|---|---|---|
| 1 | **Sin build step** (ES modules + estáticos) | Existente, mantener para el MVP | Rápido y revisable; coste: sin tree-shaking ni typecheck. Re-evaluar en v1.1 con i18n/refactor. Requisitos del MVP § 6 (web-first móvil, modo anónimo, offline-ligero) cumplidos por diseño |
| 2 | **Empaquetado: Capacitor** (no TWA) | Existente | Ya integrado (Android+iOS) y necesario por local-notifications/haptics/keyboard. TWA descartado salvo problema con la WebView |
| 3 | **Backend: Supabase** | Existente, confirmado | SDK 2.112.4 vía CDN + adaptador de sesión propio inline en `app.js` (~400 líneas, candidato nº 1 de extracción a `state.js`/`auth.js` en el refactor 4.1). Sustituye al supuesto inicial de Firebase (descartado: no hay integración) |
| 4 | **Notificaciones: locales primero; push diferido** | Existente | Limitación honesta conocida (contenido fijado al programar); decisión 5.7 en F3 del roadmap |
| 5 | **Analítica local-first** | Existente | Sin cookies; migración trivial a Plausible si se quiere dashboard. Pendiente F1: eventos sociales (ADR 9) |
| 6 | **Sin store central de estado** | Deuda reconocida | ROADMAP 4.2 (createStore con suscriptores) |
| 7 | **3 copias de assets (web/iOS/Android)** | Existente | Sincronizadas por `cap:copy`; verificar `strip-vercel.js` y hacer diff en la beta (F4) |
| 8 | **Límites freemium preparados, sin cobro (MVP v1.1, IN 9)** | Pendiente — decidir en F1 | Config del plan gratuito (nº de rituales) en cliente + tabla de plan/entitlements en Supabase para el futuro; UX: aviso pospuesto al alcanzar el tope (Flujo A, `docs/03-flujos-ux.md`) |
| 9 | **Telemetría del piloto (tarea 3.5 del `docs/ROADMAP.md`)** | Pendiente — F1, antes de abrir la cohorte | Añadir `follow_created` y `post_published` a `analytics.js`; los 4 eventos core alimentan la encuesta in-app del primer mes (MVP v1.1 § 7.5) |

## 7. Riesgos técnicos

| Riesgo | Evidencia | Mitigación |
|---|---|---|
| Monolito `app.js` 9.473 líneas | Bugs recientes (modal de tema, visor iOS) con causa en falta de límites | Refactor 4.1 por dominios, un dominio por semana, tests como red |
| CSS 5.992 líneas duplicadas | Estilos copiados por regresión | Design system de primitivas (2.5) |
| RLS incompleta en tablas sociales | `chat_reads` con 401 por falta de GRANT; `device_tokens`, `follows` pendientes | Ejecutar scripts pendientes + auditoría 5.5 antes de promocionar (F3) |
| Dos proyectos Vercel («www» y «app-habitos»); `app-habitos.vercel.app` sirve una app ajena | Registrado en `docs/app-habitos.md` §4 | Unificar/cancelar heredados; dominio limpio antes de F5 |
| SSO/Deployment Protection en aliases no públicos | Acceso anónimo redirige a login | Decidir protección del alias público y documentarlo |
| Notificaciones locales con datos fijados | Nota honesta del ROADMAP 1.2 | Decisión de push (5.7); verificación en vivo documentada |
| 401 guest esperado en consola | Mencionado en ROADMAP 0.5/5.5 | Documentarlo (no es bug) en `docs/rls.md` |
| Estado de producción vs disco | ROADMAP 0.6 con acción "innegociable" pendiente | ✅ Resuelto (Paso 6, B-03): deploys ejecutados; producción sirve SW v151 con el árbol estructurado por dominios |

## 8. Checklist de configuración para lanzamiento (F4–F5)

- [ ] (F1) Telemetría de los 4 eventos core desplegada y verificada en preview antes de abrir la cohorte del piloto (tarea 3.5; ADR 9).
- [ ] (F1) Mecanismo de encuesta in-app del primer mes definido e instrumentado (MVP v1.1 § 7.5).
- [ ] (F1) Arquitectura de límites freemium decidida: config del plan gratuito + tabla de plan/entitlements, sin cobro real (IN 9; ADR 8).
- [ ] Verificar producción: `www-smoky-phi-21.vercel.app` sirve el `www/` de disco con el último SW.
- [ ] Aplicar y verificar scripts SQL pendientes (`chat_reads.sql`; revisar `device_tokens`, `follows`, `badges_unlocked`).
- [ ] Documentar RLS y el 401 guest esperado en `docs/rls.md`.
- [ ] Iconos PWA maskable + `apple-touch-icon` verificados en producción (4.4).
- [ ] Exportar/borrar datos operativos en Ajustes (5.4).
- [ ] AAB de release firmado; Data Safety de Google completado con el mapa real de datos.
- [ ] Política de privacidad con URL pública (el borrador se hará en el hilo de ASO/lanzamiento).
- [ ] Decidir alias/dominio público y desactivación de SSO para acceso anónimo estable.
- [ ] Diff web ↔ iOS ↔ Android (`ios/App/App/public`, `android/app/src/main/assets/public`) tras `cap:copy`.

## 9. Resultados de la verificación en el Paso 5 (auditoría por módulos)

1. ✅ **Renderer 3D real en producción:** `badge-coin-3d.js` → `coin/coin-engine.js` (Three.js r185 procedural, imports relativos sin import map, guard WebGL2, carga perezosa por `import()`; el precache del shell en `sw.js` es intencional para el visor offline).
2. ✅ **Credenciales:** anon key hardcodeada en app.js (pública por diseño — OK); **sin** service keys ni JWTs extra en el bundle; `www/.env.local` (VERCEL_OIDC_TOKEN) verificado sin uso (sin CI ni referencias) y **eliminado** (B-19 resuelto); excluido del deploy por `.vercelignore`.
3. ✅ **Persistencia local:** `monolith_app_state:{uid}` por usuario con migración legacy; sesión con migración localStorage→IndexedDB; prefs de ritual + `AWAKE_LAST_SYNC_KEY`; conflictos: last-write-wins implícito sin lógica de resolución.
4. ✅ **Estado global implícito confirmado:** `window.cachePerfilesSocial`, `window.registrosGlobalMap`, `userHasAvatar`, `tempAvatarBase64`, `misHabitos`, `currentThemeHue`, `selectedDate`, `activeFilter`, `currentUser`, `viewingUserId`, `chatLoadGeneration` (puntos de entrada del store 4.2).
5. ✅ **Catálogo de IDs/flujos:** cubierto por el smoke test (todo `getElementById` literal existe); 353 `getElementById` + 52 listeners + 498 funciones en app.js; plan de extracción S1–S7 en `docs/05-modulos.md`.
6. ✅ **`badges_unlocked` resuelto:** no es una tabla, es una **columna jsonb en `profiles`** (`supabase/sql/badges_unlocked.sql`); el código la usa; pendiente verificar que el script esté aplicado en Supabase (B-02).
7. ✅ **`notify-message` verificado:** push FCM de mensajes vía service key en servidor (patrón correcto), autentica al remitente por JWT, rate-limit 800 ms/usuario en memoria; tokens FCM sin purga y sin reintento (B-21); chat congelado → prioridad baja.
8. ✅ **Cifras unificadas:** app.js **9.473** (`docs/ROADMAP.md` 4.1 corregido); inventario de módulos corregido en `docs/05-modulos.md` (icons.js 549, analytics.js 31, visor 3D 1.195, three+addons ≈ 487 KB).

**Hallazgos nuevos (a backlog, Paso 6):** `awake-structured/` duplicado (B-18), `www/.env.local` a verificar (B-19), `coin-studio.js` refutado (B-20 — dependencia viva del visor), tokens FCM sin purga (B-21).