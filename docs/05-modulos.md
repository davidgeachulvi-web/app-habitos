# Awake — Paso 5: Módulos y Funcionalidades

**Versión:** 1.2 · septiembre 2026
**Estado:** auditoría estructural completada, **verificación del checklist del Paso 4 (§ 9) ejecutada** (resultados en § 8) y **promoción del layout por dominios como fuente de verdad**.
**NOTA DE ESTRUCTURA (v1.2):** desde el 1 de septiembre de 2026 el árbol canónico es `www/` con layout por dominios (`js/core`, `js/domain`, `js/social`, `js/badges`, `js/vendor`) — antes `awake-structured/`, validado por el responsable de producto y promovido a `www/`. El layout plano anterior está archivado en `legacy/www/`. **Las rutas y números de línea de este documento (y del resto de docs) anteriores a esta versión son históricos**; el inventario real está en la sección 1 y en `www/README.md`.
**Historial:** v1.1 (sept 2026) — verificación § 9 completa: cifras confirmadas (app.js 9.473, habits.js 3.714, chat.js 1.745; funciones 498 ✓), tests 16/16 en verde ✓, inventario corregido (icons.js 549 líneas, analytics.js 31, visor 3D 1.195, three+addons ≈ 487 KB), `badges_unlocked` resuelto (columna jsonb en `profiles`), `notify-message` verificado, hallazgos nuevos (awake-structured duplicado, `www/.env.local` a verificar, coin-studio **verificado vivo** — B-20 refutado en el Paso 6, tokens FCM) → backlog del Paso 6 (B-18, B-19, B-21). v1.0 (sept 2026) — versión inicial.

---

## 1. Inventario de módulos actuales

| Módulo | Líneas | Funciones | Señales de acoplamiento | Responsabilidad |
|---|---|---|---|---|
| `www/app.js` | 9.473 | 498 | 52 `addEventListener`, 353 `getElementById`, 29 `console.error/warn` | Orquestador global: panel y rutina diaria, feed social, follows, likes, comentarios, publicaciones, perfil propio/ajeno, avatares (crop), onboarding, ajustes, temas/fondos, colección de insignias, historial, deseos, modales, **sesión Supabase inline (~400 líneas)** |
| `www/js/habits.js` | 3.714 | 188 | 196 `getElementById` | Dominio hábitos/ritual: agenda por franjas (MAÑANA/TARDE/NOCHE/24·7), calendario, rachas, sellos, temporizador, recordatorios, "día sellado", resumen semanal |
| `www/js/chat.js` | 1.745 | 92 | 47 `getElementById`, 16 listeners, polling/broadcast | Mensajes directos (congelados por decisión — ROADMAP 3.2): bandeja, hilos, lecturas, audio |
| `www/js/icons.js` | 549 | 27 | 0 DOM | Catálogo de iconos SVG (paths Phosphor) para rituales — 79 KB |
| `www/js/badge-seal-art.js` | 8.5 KB | 8 | 0 DOM | Arte 2D de sellos de insignias (metales, relieves) |
| `www/js/badge-coin-3d.js` + `www/js/coin/*` | 62 + 1.133 | 6 + ~15 | 0 DOM | Visor 3D de la insignia: **Three.js r185 procedural** (engine, geometry, materials, reliefs, scene, presets); lazy-load + guard WebGL2. Wrapper verificado: imports relativos, expone `window.BadgeCoin3D` |
| `www/js/analytics.js` | 31 | 3 | 0 DOM | Analítica local-first, 8 eventos |
| `www/js/three.module.min.js` + addons | ~487 KB (357 KB + 120 KB) | — | — | Librería WebGL (sin mantenimiento propio); tamaño verificado en el Paso 5 |
| `www/sw.js` | 88 | — | — | Shell PWA: precache + network-first + notificaciones |
| `www/index.html` + `app.css` | 1.342 / 5.992 | — | — | DOM estático de la SPA y estilos (CSS monolito con duplicados — ROADMAP 2.5) |

**Modelo de carga:** todo son scripts globales en orden fijo (`icons → chat → habits → badge-seal-art → analytics → app.js defer`) + Supabase SDK 2.112.4 por CDN + `importmap` para `three`. **No hay módulos ES entre el código de la app** (salvo el grafo del visor 3D, que sí usa `import` relativos).

## 2. Trazabilidad MVP → módulos

| Funcionalidad (MVP 4.1) | Soporte principal |
|---|---|
| Ritual del día y sellos | `habits.js` + `app.js` (panel, racha, día sellado) |
| Sellos cronometrados | `habits.js` (temporizador) |
| Cuenta y nube | sesión inline en `app.js` + Supabase Auth (profiles) |
| Social: seguidores y actividad reciente | `app.js` + Supabase Realtime |
| Publicaciones (foto/nota/privacidad) | `app.js` (feed/likes/comentarios) + `awake_media` |
| Recordatorios (franja, racha en riesgo, semanal) | `habits.js` + LocalNotifications (Capacitor) |
| Perfil y ajustes | `app.js` (perfil, avatares) |
| Insignias y vitrina 3D | `badge-coin-3d.js` + `coin/*` + `badge-seal-art.js` |
| Offline y analítica | `sw.js` + localStorage/IndexedDB + `analytics.js` |

**Lectura:** el "núcleo del MVP" vive repartido entre el monolito (`app.js`) y dos dominios de facto (`habits.js`, `chat.js`). El mayor déficit de modularidad está en `app.js`, que mezcla UI, lógica, datos y sesión.

## 3. Diagnóstico de acoplamiento

1. **Contrato implícito por orden de carga**: ninguna función se exporta; las dependencias entre scripts son globales. Mover o renombrar algo rompe el arranque sin avisar (mitigado por el smoke test de IDs/handlers).
2. **Estado global disperso**: `window.registrosGlobalMap`, `window.cachePerfilesSocial`, `userHasAvatar`, `tempAvatarBase64` + variables de módulo (`selectedDate`, `activeFilter`, `currentUser`, `viewingUserId`, `chatLoadGeneration`...). Es la causa raíz reconocida de bugs de combinación de fases (ROADMAP 4.2).
3. **UI y lógica entrelazadas**: `app.js` (353) y `habits.js` (196) leen el DOM directamente; las funciones puras (programación de hábitos, fechas, rachas) están mezcladas con renderizado.
4. **Sin marcadores TODO/FIXME en el código**: la deuda es invisible; hay que medirla (monolito, CSS, `console.error/warn`) en vez de buscarla etiquetada.
5. **Chat congelado pero vivo**: `chat.js` usa polling/broadcast propios y llama a funciones de `app.js` (capas, modales) — al congelarlo hay que evitar que cualquier refactor lo rompa (solo movimiento mecánico, sin mejoras).

## 4. Objetivo: dominios propuestos

| Dominio nuevo | Contenido | Fuente principal | Sabana ROADMAP |
|---|---|---|---|
| `state.js` | Store mínimo con suscriptores (hábitos del día, tema/hue, insignias, sesión) | `app.js` globales + `window.*` | 4.2 |
| `auth.js` | Sesión Supabase: login/registro, restore, migración cookies→IDB | `app.js` inline (~400 líneas) | 4.1 (s1) |
| `habits.js` (saneado) | Lógica pura separada del DOM; render se queda en `app.js`/`ui.js` | existente | 4.1 |
| `notifications.js` | LocalNotifications: franjas, racha en riesgo, resumen semanal | `habits.js` | 4.1 + 1.5 (tests) |
| `social.js` | Feed, follows, likes, comentarios, perfiles ajenos (sin chat) | `app.js` | 4.1 |
| `badges.js` | Colección, apertura 3D, arte (visor + sellos) | `app.js` + `badge-*` | 4.1 |
| `settings.js` | Ajustes, tema/hue, fondos, cuenta y privacidad | `app.js` | 4.1 |
| `media.js` | Crop de avatar + media de publicaciones | `app.js` | 4.1 |
| `chat.js` (estable) | Solo mantenimiento; congelado funcionalmente | existente | 3.2 |
| `ui.js` | Primitivas DOM/CSS compartidas (design system) | `app.js` + `app.css` | 2.5 |
| `analytics.js` | Sin cambios | existente | — |

## 5. Plan de extracción (un dominio por semana, con tests como red)

1. **S1 · `state.js` + `auth.js`**: extraer la sesión inline (comportamiento idéntico) y los globales críticos; tests con sandbox `vm` (patrón ya usado en `test/`).
2. **S2 · `notifications.js`**: mover recordatorios/avisos; **aprovechar para crear los tests de 1.5** (resumen semanal, racha en riesgo, HTML de ajustes).
3. **S3 · `social.js`**: feed, likes, comentarios, publicaciones (el bloque más grande de `app.js`; extracción por mover-función, sin cambiar lógica).
4. **S4 · `badges.js`**: colección + apertura 3D + arte de sellos.
5. **S5 · `settings.js`**: temas/fondos (zona del bug del modal ya corregido), ajustes de cuenta.
6. **S6 · `media.js`**: crop de avatar y subida de imágenes.
7. **S7 · `ui.js` + primitivas CSS** (2.5): saneamiento de `app.css` con primitivas, eliminando duplicados (~30% objetivo).

**Meta de salida (ROADMAP 4.1):** `app.js` como orquestador < 3.000 líneas; cada dominio importable y testeable; `npm test` + smoke + `check-imports` en verde tras **cada** semana.

## 6. Reglas de oro

1. **Extracción sin cambio de comportamiento**: mover funciones, no "mejorarlas" mientras se mueven.
2. **Nunca mezclar refactor con features**: si aparece una feature urgente, se hace aparte y se re-planifica la semana.
3. **Chat congelado**: el refactor trata `chat.js` como caja negra (compatibilidad de las funciones globales que `app.js` le llama).
4. **Los tests son la red**: antes de tocar un dominio, asegurar cobertura de sus funciones puras; después, `npm test` completo.
5. **Iterar con las puertas G1/G2 del roadmap**: si una extracción coincide con la validación piloto, primero el deploy acumulado (0.6) y los datos del piloto.

## 7. Hallazgos que pasan al Backlog de depuración (Paso 6)

- Sesión Supabase inline como primer candidato de extracción (facilita tests de auth).
- `chat_reads` / RLS / tablas pendientes (ver `docs/06-depuracion.md` B-01/B-02).
- Comentario en publicación no sincronizada: `console.warn` y salida silenciosa (B-05).
- Peso del shell 3D precacheado (~487 KB de Three.js): intencional para offline, pero re-evaluable (B-17).
- **Nuevos hallazgos de la verificación (Paso 5, v1.1):**
  - **`awake-structured/` — segunda copia del código (2,1 MB, con su propio `server.js`, tests y `vercel.json`)** sin documentar; riesgo de desincronización y despliegue accidental (B-18).
  - **`www/.env.local` con `VERCEL_OIDC_TOKEN` — resuelto (B-19):** verificado sin uso (sin CI ni referencias; excluido del deploy por `.vercelignore`) y **eliminado** de `www/`. El `.env.local` raíz queda intacto.
  - **B-20 refutado (verificación del Paso 6):** `coin-studio.js` **sí es dependencia viva** del visor 3D — `coin-scene.js` importa `makeStudioEnv` de `../coin-studio.js` y `sw.js` lo precachea. No eliminar.
  - **`notify-message`: tokens FCM obsoletos sin purga y sin reintento** (baja prioridad: chat congelado) (B-21).

## 8. Resultados de la verificación del checklist del Paso 4 (§ 9 de `docs/04-arquitectura.md`)

| # | Item | Estado | Resultado verificado |
|---|---|---|---|
| 1 | Renderer 3D real en producción | ✅ | `badge-coin-3d.js` (62 líneas) importa `coin/coin-engine.js` (Three.js r185 procedural, imports relativos, guard WebGL2, `window.BadgeCoin3D`) |
| 2 | Credenciales y secretos en bundle | ✅ | Sin `service_role`/service keys ni JWTs extra en `www/`; anon key hardcodeada en app.js (pública por diseño — OK). `www/.env.local` verificado sin uso y eliminado (B-19) |
| 3 | Persistencia local y transición anónimo→cuenta | ✅ | `claveEstadoLocal(uid)` por usuario (`monolith_app_state:{uid}`) + migración legacy; sesión con migración localStorage→IndexedDB; prefs de ritual + `AWAKE_LAST_SYNC_KEY`. Política de conflictos: last-write-wins implícito (sin lógica de resolución) |
| 4 | Estado global implícito | ✅ | Confirmado: `window.cachePerfilesSocial` (28), `window.registrosGlobalMap` (23), `userHasAvatar` (13), `tempAvatarBase64` (10), `misHabitos` (32), `currentThemeHue` (29), `selectedDate`, `activeFilter`, `currentUser` (117), `viewingUserId` (45), `chatLoadGeneration` |
| 5 | Catálogo de IDs/flujos del monolito | ✅ | Cubierto por el smoke test (todo `getElementById` literal existe); 353 `getElementById` + 52 listeners + 498 funciones en app.js; plan de extracción S1–S7 en § 5 |
| 6 | `badges_unlocked` | ✅ **Resuelto** | No es una tabla: es una **columna jsonb en `profiles`** (script `supabase/sql/badges_unlocked.sql`); el código la lee/escribe (app.js 5541, 5632, 7175, 7978) y hay clave local `awake_badges_unlocked`. Pendiente: verificar que el script esté aplicado en Supabase (igual que `chat_reads`) — B-02 actualizado |
| 7 | Alcance de `notify-message` | ✅ | Edge Function Deno: push FCM de **mensajes de chat** vía service key en servidor (patrón correcto), autentica al remitente por JWT, rate-limit 800 ms/usuario en memoria. Limitaciones: tokens FCM sin purga, sin reintento, CORS `*`; chat congelado → prioridad baja |
| 8 | Cifra de líneas de app.js | ✅ | **9.473 verificado** (`docs/ROADMAP.md` 4.1 corregido); habits.js 3.714, chat.js 1.745, icons.js 549 (inventario corregido) |

**Salud del repo (verificada en el Paso 5):** `npm test` 16/16 en verde; SW en disco v148 (B-03: verificar producción); manifest con nombre/descripción correctos ✓; iconos PWA maskable + apple-touch ✓ (4.4); orden de scripts en `index.html` coincide con el modelo de carga documentado.