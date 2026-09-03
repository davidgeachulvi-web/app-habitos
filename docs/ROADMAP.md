# AWAKE — Roadmap de auditoría (v2.1 · septiembre 2026)

Plan derivado de la auditoría inicial (agosto 2026) y **revisado a fondo en septiembre 2026** tras la Fase 0 y parte de la Fase 1.
Estado: `[x]` hecho · `[~]` descartado por decisión de producto · `[ ]` pendiente.
**v2.1 (sept 2026):** alineado con el MVP v1.1 (plan de validación § 7.5) — nueva tarea 3.5 (telemetría social) y tabla de resumen corregida a la realidad del repo.

---

## Resumen ejecutivo

| Fase | Tema | Estado | Prioridad |
|---|---|---|---|
| Fase 0 | Fundaciones: medir y blindar | ✅ 100% | 🔥🔥🔥 |
| Fase 1 | Retención y emoción | 🟡 parcial (3 hechas, 2 descartadas, 1 pendiente) | 🔥🔥🔥 |
| Fase 2 | UX y accesibilidad | 🟡 4/6 (2.5 y 2.6 pendientes) | 🔥🔥 |
| Fase 3 | Social | ⏳ 0/5 | 🔥🔥 |
| Fase 4 | Arquitectura | ⏳ 1/4 (4.4 hecha) | 🔥 |
| Fase 5 | Marketing y distribución | ⏳ 1/7 (5.2 hecha) | 🔥🔥 |

✅ **0.6 ejecutado y verificado (sept 2026, Paso 6):** producción sirve SW **v151** con el árbol estructurado por dominios, recordatorios, accesibilidad y helpers de mensajes (B-03 y B-18 cerrados).

---

## Fase 0 — Fundaciones: medir y blindar ✅

### 0.1 Analytics ligero y privado ✅
- [x] Capa única `www/js/analytics.js` (sin cookies, sin coste): local → localStorage/consola; si algún día hay `window.plausible`, reporta solo.
- [x] 8 eventos: `app_open`, `onboarding_done`, `auth_completed`, `habit_created`, `habit_sealed`, `deseo_completed`, `badge_unlocked`, `badge_opened_3d`. Verificados en preview.
- **Nota actualizada:** en el camino, se corrigió el doble camino de sellado (`guardarCompletado` + `insertarRegistroMarca`) para que `habit_sealed` no se pierda.

### 0.2 Tests: lógica pura + smoke + check de imports ✅
- [x] 16 tests con `node:test` (6 iconos + 8 programación + 2 smoke).
- [x] `scripts/check-imports.js`: 11 módulos del visor, 0 imports bare (probado en positivo y negativo).
- [x] `deploy:web` encadenado: check-imports → bump SW → vercel → cap:copy.
- **Nota actualizada:** el smoke test valida IDs y handlers; aún no cubre el HTML de ajustes añadido en 1.2 (ver 1.5).

### 0.3 Bump automático del service worker ✅
- [x] `scripts/bump-sw.js` (v147 → v148, validado 2×) dentro de `deploy:web`.
- [x] Nunca más "app vieja cacheada" por olvido.

### 0.4 Lazy-load del visor 3D ✅
- [x] Arranque sin descargar ~800 KB de Three.js; `import()` dinámico con caché y reintento solo al abrir insignia. Verificado en preview (red y consola).

### 0.5 Limpieza de deuda puntual ✅
- [x] `_dw()` muerto eliminado; `PCFSoftShadowMap` → `PCFShadowMap` (warning de consola eliminado); `willReadFrequently` auditado (correcto en donde lee); comentarios obsoletos revisados. Consola limpia (solo 401 guest).

### 0.6 Deploy web acumulado 🔥 (ACCIÓN INMEDIATA)
- [x] **Qué:** publicar en Vercel lo acumulado desde el último deploy (v147): recordatorios 1.2, eliminación del share 1.3, limpieza 0.5, banner 1.4 descartado, reubicación `proto/`.
- **Por qué:** iOS/Android ya tienen estos archivos, pero `www-smoky-phi-21.vercel.app` sirve la versión anterior (SW v147 sin 1.2). Es el único desajuste producción↔nativo.
- **Hecho cuando:** cumplido — `npm run deploy:web` subió a SW **v151** con el árbol estructurado (verificado en el Paso 6, B-03/B-18).


---

## Fase 1 — Retención y emoción (revisada)

### 1.1 Celebración del sellado ✅
- [x] Animación "estamparse" (`seal-stamp` + anillo `seal-ring`), haptic y sonido ya existentes, `prefers-reduced-motion` respetado. Un toque sigue bastando.

### 1.2 Recordatorios de "racha en riesgo" y resumen semanal ✅
- [x] Aviso diario configurable (18:00) solo si quedan sellos sin cerrar + **cancelación automática** cuando el día se completa.
- [x] Resumen semanal (domingo 20:00) con `resumenSemanaRitual()`: "Sellaste 18 de 21 · racha de 6 días".
- [x] Dos filas nuevas en Ajustes → Ritual con switch + hora, persistidas local y en la nube.
- **Nota honesta (sin resolver):** las alarmas nativas fijan el contenido al programarse (limitación de LocalNotifications sin push); se reprograman en cada arranque y la verificación en vivo cubre la app abierta, pero si el usuario no abre la app el domingo, el resumen puede llevar datos del último arranque. → solo con push (Fase 3/5) sería exacto.

### 1.3 Compartir insignia/racha como imagen
- [~] **Descartada por decisión de producto (sept 2026):** la insignia se muestra en el perfil vía la vitrina; el share no aporta. Se eliminó botón, funciones y `capture()` del engine.

### 1.4 Pantalla "próximas insignias"
- [~] **Descartada por decisión de producto (sept 2026):** la colección ya comunica la progresión en cada tarjeta y en «Próxima ·» por tema; el banner destacado se eliminó (58 líneas JS + CSS).

### 1.5 Ampliar la red de tests al nuevo código ✅
- [x] **Qué:** tests para los recordatorios (1.2): `resumenSemanaRitual` con semanas vacías/llenas, generación del body de racha en riesgo, y verificación de que el HTML de ajustes (switch-digest-riesgo/resumen) existe.
- [x] **Resuelto (Paso 6, sept 2026):** `test/recordatorios.test.mjs` con **14 tests** (mensajes extraídos a funciones puras `mensajeResumenSemanal` / `mensajeRachaEnRiesgo` en habits.js; app.js usa los helpers en los 4 puntos de notificación, web y nativa).
- [x] **Hecho cuando:** cumplido — `npm test` **30/30 en verde** y `check-imports` OK.

### 1.6 (Nueva) Reforzar el cierre del día
- [ ] **Qué:** al sellar el último pendiente del día, opción "ver mi día" (resumen de sellos/fotos/notas de HOY) además del overlay actual.
- **Cómo:** reutilizar la ficha existente (`habit-ficha-modal`) con un nuevo modo "resumen del día" o una hoja ligera.
- **Por qué:** el cierre del día es el segundo momento emocional (tras sellar); hoy la info del día completo está dispersa en el historial.
- **Hecho cuando:** se llega al resumen del día sellado en ≤ 2 toques desde el ritual.

---

## Fase 2 — UX y accesibilidad (nueva: 6 tareas)

### 2.1 Contraste accesible ✅
- [x] **Qué:** auditar `--text-muted` (#9ca3af ≈ 7.5:1 sobre #000, OK) y `--text-dim` (#6b7280 ≈ 4.6:1, justo) **más los colores derivados del tema** (hue) que pueden caer por debajo de 4.5:1 en textos small.
- [x] **Resuelto (Paso 6):** `--text-dim` #6b7280 → **#98a1b3** (≈ 6.8:1 sobre #121824; el anterior daba ≈ 3.7:1 y fallaba 4.5:1). `--text-muted` verificado ≈ 7:1. No existe tema claro (todos los fondos son oscuros), así que la combinación "fondo claro + texto tenue" no aplica en la build actual.
- [x] **Hecho cuando:** cumplido — textos con `--text-dim` ≥ 4.5:1 en los temas principales.

### 2.2 Tamaños táctiles ✅
- [x] **Qué:** objetivos de toque ≥ 44px: chips de día (day selectors), botones del visor (`badge-nav-btn`), filas de ajustes y pills de filtro.
- [x] **Resuelto (Paso 6):** `badge-nav-btn` 42 → **44 px**; `.day-btn` y `.filter-pill` con `min-height: 44px`; `.settings-row` con `min-height: 44px` (ya ≈ 48 px por padding, refuerzo defensivo).
- [x] **Hecho cuando:** cumplido — interactivos principales ≥ 44 px.

### 2.3 Movimiento reducido ✅
- [x] **Qué:** respetar `prefers-reduced-motion` en: giro de la moneda 3D, transiciones `is-entering/is-switching` del visor, y entradas de modales.
- [x] **Resuelto (Paso 6):** **premisa corregida** — la moneda 3D **no tiene rotación automática** (solo drag del usuario, que es iniciado por él y por tanto permitido). Neutralizadas bajo `prefers-reduced-motion`: animaciones `badge-coin-leave`/`badge-coin-enter` del visor, entrada del modal de insignias (`badge-modal-in`) y el toast (`toast-in`).
- [x] **Hecho cuando:** cumplido — con la preferencia activada no hay transiciones de entrada bruscas en visor ni modales.

### 2.4 ARIA y etiquetas ✅
- [x] **Qué:** auditar: roles de pestañas sociales (`role=tab` + `aria-selected` ya presentes), `aria-label` en botones solo-icono (hamburguesa, estrella de deseo, ⋯, ojo de perfil), y `aria-live` para toasts/insignias desbloqueadas.
- [x] **Resuelto (Paso 6):** toast con `role="status"` ✓ (implica `aria-live=polite`); botones del visor (anterior/siguiente) y canvas 3D ya etiquetados ✓; añadidos `aria-label`: `btn-mensajes` (Sala de Mensajes), `btn-hamburger` (Ajustes) y `close-modal` (Cerrar).
- [x] **Hecho cuando:** cumplido — elementos sin nombre auditados y etiquetados; pestañas con `role=tab`/`aria-selected` verificadas.

### 2.5 Design system de componentes
- [ ] **Qué:** primitivas CSS (botón primario/secundario, chip, tarjeta, overlay, switch) en variables y clases base; migrar componentes nuevos a las primitivas.
- **Por qué:** 5.992 líneas de CSS con estilos repetidos por copia; los bugs de estilo (botón del visor, modal de tema) vienen de ahí.
- **Hecho cuando:** los componentes nuevos se construyen con primitivas y se eliminan ~30% de reglas duplicadas.

### 2.6 (Nueva) Fonts: fuente de marca y anti-FOUT
- [ ] **Qué:** revisar la carga de fuentes (`www/fonts/`): preload de la fuente de la marca AWAKE (serif) y de Roboto, `font-display: swap` coherente, y evitar el "cambio de fuente" al abrir el visor 3D (la fuente de marca se usa en la moneda).
- **Por qué:** la moneda 3D renderiza texto con la fuente de marca; si no está lista, puede verse con la fuente por defecto al desbloquear.
- **Hecho cuando:** no hay parpadeo de fuente ni saltos de texto en la app ni en el visor 3D.

---

## Fase 3 — Social (revisada: 5 tareas)

### 3.1 Definir el motivo del follow
- [ ] **Qué:** construir una razón explícita para seguir: comparativa suave de rachas ("llevas 6 días, Ana 12") o retos compartidos por tema.
- **Por qué:** "ver que otro selló" no motiva suficiente hoy; sin motivo, el feed y el follow mueren.
- **Hecho cuando:** el perfil ajeno muestra al menos un dato comparativo motivador.

### 3.2 Congelar el chat DM (decisión)
- [ ] **Qué:** registrar la decisión: no invertir más en chat directo (chat.js, 1.745 líneas) hasta que el follow tenga tracción.
- **Por qué:** es la feature con menos uso esperado y la más cara de mantener (bugs de notificaciones de mensajes).
- **Hecho cuando:** decisión apuntada en este roadmap; sin nuevas features de chat.

### 3.3 Vitrina de insignias en perfil ajeno (sin share)
- [ ] **Qué:** colocar la colección 3D como protagonista del perfil ajeno: ver insignias de otro en ≤ 1 toque (ya funciona el visor con viewingUserId); **sin botón de share** (descartado en 1.3).
- **Por qué:** la vitrina es el gancho de la app; hoy el perfil ajeno la esconde detrás de pestañas.
- **Hecho cuando:** entrando a un perfil ajeno, la colección está a 1 toque y con el visor 3D operativo.

### 3.4 (Nueva) Primera versión de "retos de sección"
- [ ] **Qué:** mini-reto semanal opcional por sección (ej. "sella 5 tardes esta semana") con progreso compartido entre seguidores.
- **Por qué:** es el motivo de follow más barato de construir (reutiliza resumenSemanaRitual y las métricas de insignias) y da conversación.
- **Hecho cuando:** existe un reto por tema, con progreso visible en el feed social.

### 3.5 (Nueva) Telemetría social para el plan de validación del MVP
- [ ] **Qué:** añadir a `www/js/analytics.js` los eventos `follow_created` y `post_published`. El plan de validación del MVP v1.1 (§ 7.5) exige telemetría de registro, sellado, seguimiento y publicación; 0.1 ya cubre los dos primeros, faltan los dos últimos.
- **Por qué:** sin estos eventos, el piloto (F1 del roadmap de producto) no puede medir el criterio social (≥ 40 % con ≥ 1 seguido en 14 días) ni la adopción de publicaciones (≥ 15 % WAU, con criterio de corte).
- **Hecho cuando:** ambos eventos se registran en los flujos de follow y de publicación y aparecen en consola en la preview.

---

## Fase 4 — Arquitectura (revisada: 4 tareas, monolito creciente)

### 4.1 Refactor de app.js en módulos ES
- [ ] **Qué:** dividir el monolito (**9.473 líneas — verificado en el Paso 5** y creciendo) por dominio: state.js, badges.js, social.js, settings.js, auth.js, ui.js, notifications.js.
- **Cómo:** por extracción segura (mover funciones sin cambiar comportamiento), un dominio por semana, con los tests como red.
- **Por qué:** cada bug reciente (modal de tema, visor iOS) fue un síntoma de un monolito sin límites; la deuda solo crece.
- **Hecho cuando:** app.js queda como orquestador < 3.000 líneas y cada dominio es importable y testeable.

### 4.2 Store de estado mínimo
- [ ] **Qué:** createStore() central (30 líneas) con suscriptores para: hábitos del día, tema/hue, insignias, sesión.
- **Por qué:** el estado global implícito (misHabitos, currentThemeHue…) es la causa raíz de comportamientos impredecibles al combinar fases.
- **Hecho cuando:** al menos 3 dominios leen/escriben estado por el store.

### 4.3 Rueda de color pre-renderizada
- [ ] **Qué:** cachear la rueda (canvas offscreen de una vez) en vez de recalcular píxel a píxel cada apertura del modal de tema.
- **Hecho cuando:** abrir el modal de tema no re-renderiza la rueda (medible: < 5ms).

- [x] ### 4.4 Iconos PWA maskable (ampliada)
- [x] **Qué:** generar iconos reales 192/512 con padding maskable correcto **+ apple-touch-icon 180×180** (hoy todo apunta a icon.png de 10 KB, un solo PNG).
- **Nota de la auditoría:** el manifest declara el mismo icon.png para 192 y 512 con purpose "any maskable" — se recorta en iOS/Android al añadir a pantalla de inicio.
- **Hecho cuando:** iconos 192/512 maskable + 180 apple-touch generados y referenciados.

---

## Fase 5 — Marketing y distribución (revisada: 7 tareas)

### 5.1 Landing page
- [ ] **Qué:** página en la raíz (separada de la app en www/): propuesta en una frase, 3 capturas (visor 3D como hero), CTA "Añadir a pantalla de inicio" + links a stores.
- **Hecho cuando:** la URL raíz muestra la landing y el botón lleva a la app.

- [x] ### 5.2 Manifest y metadatos (quizá la más rápida con más retorno)
- [x] **Qué:** description: "Habit Architecture" → "AWAKE — Sella tus hábitos, colecciona insignias"; theme-color dinámico por tema; meta OG para compartir la URL.
- **Hecho cuando:** manifest y meta tags venden exactamente qué hace la app.

### 5.3 ASO (al publicar en stores)
- [ ] **Qué:** capturas con el visor 3D como protagonista; keywords (hábitos, rutina, disciplina, sellos, insignias, racha); ficha ES/EN.
- **Hecho cuando:** ficha de store preparada.

### 5.4 Exportar y borrar datos
- [ ] **Qué:** exportar historial a JSON/CSV + botón de borrar cuenta (confianza + RGPD).
- **Hecho cuando:** export y borrado desde Ajustes, probado.

### 5.5 Revisión RLS de Supabase
- [ ] **Qué:** auditar políticas RLS (profiles, follows, habit_logs) y confirmar que un guest no lee datos ajenos (el 401 guest esperado es buena señal; documentarlo).
- **Hecho cuando:** políticas documentadas en docs/rls.md y verificadas con y sin sesión.

### 5.6 (Nueva) Preparar i18n ES/EN
- [ ] **Qué:** extraer strings a un objeto de traducción (mínimo: onboarding, ajustes, ritual).
- **Por qué:** el ASO pide localización y la app hoy es 100% ES hardcodeado en el monolito; cuanto antes se extraiga, más barato.
- **Hecho cuando:** las etiquetas principales están en i18n.js (ES activo; EN como meta).

### 5.7 (Nueva) Push web/nativo para el resumen exacto
- [ ] **Qué:** evaluar FCM/APNs + VAPID web para que "racha en riesgo" y resumen semanal lleguen con datos frescos aunque la app lleve días cerrada.
- **Por qué:** resuelve la limitación honesta de 1.2 (contenido fijado al programar).
- **Hecho cuando:** decisión tomada (sí/no) y, si es sí, primer push de prueba en producción.

---

## Orden de arranque recomendado (v2.1)

1. **0.6 Deploy web acumulado** — 5 min, alinea producción con nativo (innegociable).
2. **5.2 Manifest + 4.4 Iconos** — 1-2 h, mejora percepción de marca al instalar (quick win).
3. **2.3 Movimiento reducido del visor** — 1-2 h, cierra la accesibilidad más visible.
4. **1.5 Tests nuevos** — 1 h, blinda lo recién hecho antes de tocar más.
5. **5.4 Exportar/borrar datos** — 1 día, confianza + RGPD antes de promocionar.
6. **3.1/3.3/3.5 Motivo del follow + vitrina + telemetría social** — la palanca social de mayor retorno (3.5 debe estar desplegada antes de abrir el piloto de la F1 del roadmap de producto).
7. **4.1 Refactor** — continuo, un dominio por semana, cuando la app esté estable.

*El orden exacto lo marca el usuario: cada turno indica el siguiente paso.*
