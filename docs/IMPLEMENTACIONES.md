# AWAKE — Informe de implementaciones realizadas y pendientes

*Documento vivo · Última actualización: agosto 2026*

---

## 1. Resumen

Este documento detalla **todas las implementaciones** realizadas sobre la app AWAKE (versión web PWA + Android/iOS), las **ventajas** que aportan frente al estado anterior, y los **pasos pendientes** del roadmap de auditoría (`ROADMAP.md`).

**Estado global:** Fase 0 (Fundaciones) completada al 80% (4 de 5 tareas) + tarea 1.1 de la Fase 1 completada.

| Bloque | Tareas | Estado |
|---|---|---|
| Correcciones críticas pre-auditoría | 3 fixes | ✅ Completado |
| Fase 0 — Fundaciones | 0.4, 0.3, 0.2, 0.1 | ✅ 4/5 (falta 0.5) |
| Fase 1 — Retención | 1.1 | ✅ 1/4 |
| Fases 2–5 | UX, Social, Arquitectura, Marketing | ⏳ Pendientes |

---

## 2. Correcciones críticas previas a la auditoría

### 2.1 Visor 3D roto en iOS (import maps)

**Antes:** dos addons de Three.js (`RoomEnvironment.js` y `SVGLoader.js`) usaban el import bare `from 'three'`, que solo se resuelve con `<script type="importmap">` — soportado únicamente desde **iOS 16.4**. En iPhones con versiones anteriores, todo el grafo de módulos del visor 3D fallaba en silencio: al pulsar una insignia **no ocurría nada** (la moneda 3D nunca cargaba).

**Después:**
- Ambos addons migrados a import relativo (`from './three.module.min.js'`).
- Service worker actualizado (`v147`) con ambos módulos en el precache.
- Guard de WebGL2 en `badge-coin-3d.js` (aviso claro en consola si no está disponible, sin bloquear la UI).
- Simulación verificada sin import map (equivale a iOS 15): el visor 3D carga y renderiza perfectamente.

**Ventajas:**
- ✅ El visor 3D funciona en **cualquier iOS/Safari** (≥15), sin depender del import map.
- ✅ Los usuarios de iPhone que antes veían "nada" al pulsar una insignia ahora ven la moneda 3D.
- ✅ Sin cambios en la lógica de la app.

### 2.2 Modal "Color del tema" descentrado y descolorido

**Antes:** una regla CSS destinada a bloquear campos de "Editar perfil" sin sesión incluía por accidente a `#theme-modal` y `#backgrounds-modal` en su selector. Resultado: `position: relative` rompía el `position: fixed` (el modal se colapsaba a una franja de 179px pegada al borde) y `opacity: 0.55` + `filter: grayscale(0.45)` lo dejaba apagado y gris.

**Después:** eliminados los dos selectores accidentales de la regla (solo queda el bloqueo real de campos de editar perfil).

**Ventajas:**
- ✅ El selector de color aparece centrado y a pleno espectro.
- ✅ El modal de "Fondos" (que sufría el mismo bug) también quedó arreglado.
- ✅ El bloqueo de campos sin sesión sigue intacto.

### 2.3 Contador eliminado del submenú "Colección"

**Antes:** el título del submenú "COLECCIÓN" en Social mostraba un contador de insignias en propiedad ("X/Y"), añadiendo ruido visual.

**Después:** contador eliminado del HTML y de los dos puntos del JS que lo rellenaban. Se mantiene el contador de "MI PERFIL".

**Ventajas:**
- ✅ Título limpio y minimalista, acorde con el diseño de las 3 pestañas sociales.
- ✅ Menos elementos que actualizar (una fuente menos de errores).

---

## 3. Fase 0 — Fundaciones: medir y blindar

### 3.1 Tarea 0.4 — Lazy-load del visor 3D ✅

**Antes:** el HTML cargaba `<script type="module" src="js/badge-coin-3d.js">` al arrancar. Eso arrastraba ~800 KB innecesarios (Three.js en dos ficheros, OrbitControls, SVGLoader, RoomEnvironment y 6 módulos de la moneda) siempre, aunque el usuario nunca abriera una insignia.

**Después:**
- Etiqueta `<script>` eliminada del HTML: al arrancar **no se descarga nada del 3D**.
- Nuevo cargador perezoso en `app.js` con `import()` dinámico, caché de promesa (solo se descarga una vez) y reintento si falla.
- El antiguo bucle de polling de 4s se sustituyó por una espera real de la promesa del módulo.

**Ventajas:**
- ✅ Arranque más rápido en móvil/iPhone con 4G: la pantalla principal se pinta sin descargar Three.js.
- ✅ Los datos se ahorran para quien nunca abre insignias 3D.
- ✅ Fiabilidad: la apertura espera a la carga real del módulo, sin límite artificial de 4s.
- ✅ El modo offline se mantiene (el SW sigue precacheando el visor, con gestión network-first).

### 3.2 Tarea 0.3 — Bump automático del service worker ✅

**Antes:** el versionado del SW (`awake-shell-vN`) era **manual**. Cada deploy corría el riesgo de olvidarse de subirlo — y eso ya causó un bug real: un iPhone seguía sirviendo la app vieja cacheada durante días.

**Después:**
- Nuevo script `scripts/bump-sw.js`: lee `sw.js`, incrementa `vN → vN+1`, valida que la versión exista (error si no).
- `deploy:web` ahora encadena: **check de imports → bump del SW → deploy Vercel → cap:copy** (sync Android/iOS).

**Ventajas:**
- ✅ Imposible desplegar con un SW desactualizado por olvido.
- ✅ Cada deploy lleva una versión nueva: los usuarios siempre reciben la app actual.
- ✅ Android/iOS quedan sincronizados automáticamente en el mismo comando.

### 3.3 Tarea 0.2 — Red de seguridad: tests + check de imports ✅

**Antes:** cero tests automatizados y el deploy no validaba nada. Bugs como el del import map de iOS o el modal de tema roto solo se detectaban cuando un usuario real (¡o la novia del desarrollador!) los encontraba.

**Después:**
- **14 tests de lógica pura** (`node:test`, sin dependencias nuevas):
  - `test/iconos.test.mjs` — fechas "una vez" (`fechasUnicasDeHabito`, `extraerFechasUnicas`), `habitEsUnaVez`, momentos `U:`, `momentoDesdeHora`.
  - `test/programacion.test.mjs` — `habitProgramadoEnFecha`: multi-fecha, 24/7, días de la semana, legacy, hábitos futuros.
  - Sandbox `vm` que carga `icons.js` + `habits.js` con los helpers de fecha **copiados verbatim de `app.js`** (la lógica se prueba con los mismos cálculos que producción).
- **2 tests de smoke** (`test/smoke.test.mjs`): cada `getElementById` con id literal existe en el HTML **o** se crea dinámicamente; toda función llamada desde `onclick`/`onchange` existe.
- **`scripts/check-imports.js`**: recorre el grafo de 11 módulos del visor 3D y **falla el deploy si hay un import bare** (el bug de iOS). Probado en ambos sentidos (positivo y negativo).
- `package.json`: `npm test` (16 tests) y `deploy:web` encadenado con el check.

**Ventajas:**
- ✅ Las regresiones de lógica de hábitos/fechas se detectan en segundos, no en producción.
- ✅ El bug de imports de iOS **no puede volver a pasar desapercibido**: el deploy se bloquea solo.
- ✅ Los IDs rotos entre HTML y JS quedan cazados al instante.
- ✅ Cero dependencias nuevas: todo usa `node:test` incluido en Node.

### 3.4 Tarea 0.1 — Analytics ligero y privado ✅

**Antes:** **cero datos** del comportamiento de los usuarios. Cada decisión de producto ("¿qué mejoro?") era opinión, no dato. Imposible saber si la gente llega a desbloquear insignias, cuántos sellan, o dónde abandona.

**Después:**
- **`www/js/analytics.js`** (30 líneas, sin dependencias, sin cookies, sin red en modo local):
  - Modo local: cada evento se guarda en `localStorage` (máx. 300) y se imprime en consola como `[analytics]`.
  - Modo Plausible automático: si algún día se carga el script de Plausible (u otro proveedor con `window.plausible`), los eventos se envían solos **sin tocar código**.
- **8 eventos instrumentados:**
  - `app_open` (cada arranque) ✅ verificado
  - `onboarding_done` ✅ instrumentado
  - `auth_completed` ✅ instrumentado
  - `habit_created` ✅ verificado
  - `habit_sealed` ✅ verificado (en ambos caminos de sellado)
  - `deseo_completed` ✅ instrumentado
  - `badge_unlocked` ✅ verificado
  - `badge_opened_3d` ✅ verificado
- **Bug encontrado durante la verificación:** `habits.js` tiene dos caminos de sellado (`insertarRegistroMarca` y `guardarCompletado`); el track solo estaba en el primero. Añadido al flujo principal y filtradas omisiones/recaídas para que no cuenten como sellos reales.

**Ventajas:**
- ✅ Empiezas a medir desde hoy, con los datos guardados localmente.
- ✅ Decisiones futuras basadas en datos reales (retención, sellados, uso del 3D).
- ✅ RGPD-friendly: sin cookies, sin trackers de terceros.
- ✅ Coste cero y migración trivial a Plausible cuando quieras el dashboard.

---

## 4. Fase 1 — Retención y emoción

### 4.1 Tarea 1.1 — Celebración del sellado ✅

**Antes:** el sellado ya tenía haptic, sonido, contador de racha animado y hoja de "día sellado" (trabajo previo), pero el sello en sí solo mostraba **un anillo estático** — faltaba la sensación física de "estampar".

**Después (`app.css`):**
- **`@keyframes seal-stamp`** (0.32s): presión (escala 0.78 + giro -6°), rebote con overshoot (1.16 + 2°) y asentamiento — el gesto de estampar un sello.
- **`@keyframes seal-ring`**: anillo verde expansivo que se desvanece, sincronizado con la clase `just-checked`.
- **Guard de `prefers-reduced-motion`**: con la preferencia del sistema activada se desactivan las animaciones (accesibilidad).

**Ventajas:**
- ✅ El momento de mayor carga emocional del día (sellar) ahora se siente físico y satisfactorio.
- ✅ Cero fricción añadida: sigue siendo un solo toque.
- ✅ Accesible por defecto (reduce-motion respetado).
- ✅ Decisión respetada: sin toast de racha por sello (se eliminó antes porque tapaba la ventana de deshacer) — la racha se comunica con el contador y la hoja del día completo.

---

## 5. Tabla resumen: antes → después

| Área | Antes | Después | Ventaja clave |
|---|---|---|---|
| Visor 3D en iOS | Roto en iOS <16.4 (imports bare) | Import relativos + SW v147 + guard WebGL2 | Funciona en cualquier iPhone |
| Modal color del tema | Descentrado y gris (CSS accidentado) | Centrado, a pleno color | UX correcta en ajustes |
| Submenú Colección | Contador ruidoso en el título | Título limpio | Diseño minimalista |
| Arranque de la app | ~800 KB de Three.js siempre | Lazy-load: solo al abrir insignia | Arranque rápido en móvil |
| Service worker | Bump manual (olvidos = app vieja) | Bump automático en el deploy | Los usuarios siempre ven la app nueva |
| Calidad | Cero tests, deploy ciego | 16 tests + check de imports en el deploy | Las regresiones no llegan a producción |
| Datos de uso | Ninguno | 8 eventos analíticos a coste cero | Decisiones basadas en datos |
| Sellado de hábitos | Anillo estático | Animación de estampado + anillo expansivo | Momento emocional más gratificante |

---

## 6. Pasos pendientes

### 🔴 Prioridad alta

| # | Tarea | Qué aporta | Esfuerzo |
|---|---|---|---|
| **0.5** | Limpieza de deuda puntual | Quitar `_dw(){}` muerto, silenciar avisos de consola (`WebGLShadowMap deprecated`, `willReadFrequently`) | 1–2 h |
| **1.2** | Recordatorios de "racha en riesgo" + resumen semanal | El clásico que más sube retención: aviso si un hábito del día queda sin sellar + resumen semanal | 1 día |
| **1.3** | Compartir insignia/racha como imagen | Marketing gratis: cada insignia compartida es una vitrina de la app | 1 día |
| **1.4** | Pantalla "próximas insignias" | Motor de re-enganche: objetivo concreto hacia la siguiente insignia | 1 día |

### 🟡 Prioridad media

| # | Tarea | Qué aporta | Esfuerzo |
|---|---|---|---|
| **2.1** | Contraste accesible | Textos ≥ 4.5:1 (Lighthouse a11y) | 4 h |
| **2.2** | Tamaños táctiles | Objetivos de toque ≥ 44px | 4 h |
| **2.3** | Movimiento reducido | Respetar `prefers-reduced-motion` en entrada y giro de la moneda | 4 h |
| **2.4** | ARIA y etiquetas | Screen readers navegan la app | 4 h |
| **2.5** | Design system de componentes | Primitivas CSS reutilizables; matan los bugs de estilo | 2 días |
| **3.1** | Motivo del follow (retos o comparativa) | Razón explícita para seguir gente | 1–2 sem |
| **3.3** | Vitrina de insignias en perfil ajeno | Colección 3D protagonista + share | 2–3 días |
| **4.3** | Rueda de color pre-renderizada | Abrir el modal de tema sin recálculo | 3 h |

### 🟢 Prioridad media-baja / estratégica

| # | Tarea | Qué aporta | Esfuerzo |
|---|---|---|---|
| **3.2** | Congelar el chat DM | Decisión registrada: no invertir sin tracción | — |
| **4.1** | Refactor de `app.js` (9.323 líneas) en módulos ES | Menos bugs, más testabilidad | 1–2 sem |
| **4.2** | Store de estado mínimo | Estado central con suscriptores | 2 días |
| **4.4** | Iconos PWA maskable | Sin recortes al añadir a pantalla de inicio | 3 h |
| **5.1** | Landing page | Proposición clara + CTA + vitrina del visor 3D | 2 días |
| **5.2** | Manifest y metadatos | Nombre/descripción/theme-color correctos | 3 h |
| **5.3** | ASO (capturas + keywords) | Ficha de store preparada | 1 día |
| **5.4** | Exportar y borrar datos | Confianza + RGPD | 1 día |
| **5.5** | Revisión RLS de Supabase | Auditar que un guest no lee datos ajenos | 4 h |

---

## 7. Siguiente paso recomendado

**Tarea 1.2 — Recordatorios de "racha en riesgo" y resumen semanal**: es la de mayor impacto en retención de las pendientes, reutiliza las notificaciones locales que ya existen, y cierra de forma natural la Fase 0/1 emocional. Después, la 0.5 (limpieza) queda como tarea rápida para empezar la Fase 2.

*Este documento se actualiza al completar cada tarea del roadmap.*