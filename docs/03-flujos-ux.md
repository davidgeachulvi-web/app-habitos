# Awake — Paso 3: Flujos de Usuario y UX

**Versión:** 1.1 · septiembre 2026 (alineada con el MVP v1.1 y la hoja de ruta v1.1)
**Base:** núcleo del MVP aprobado (`docs/01-definicion-mvp.md` v1.1) y hoja de ruta de producto v1.1 (`docs/02-roadmap.md`); build real en `www-smoky-phi-21.vercel.app`. Los flujos describen comportamiento deseado; las pantallas nombradas corresponden a la build actual salvo que se indique lo contrario. Las tareas de accesibilidad 2.1–2.4 del `docs/ROADMAP.md` son requisitos transversales de todos los flujos.
**Historial:** v1.1 (sept 2026) — telemetría de 4 eventos core y encuesta in-app del piloto (F1), checkpoint V1 y criterio de corte de Publicaciones en métricas, límite freemium preparado sin cobro, historial 7/30 días en el ritual, capa cualitativa opcional con renuncia, corrección de erratas. v1.0 (sept 2026) — versión inicial.

---

## 1. Principios UX del MVP

1. **Un toque para lo esencial.** Sellar es la acción del día: no puede pedir más de un toque. Avisos y recordatorios nunca abren pasos intermedios.
2. **El sello es el momento emocional.** Estampar (animación + haptic + sonido) es la recompensa de la constancia; nada lo tapa (sin toasts, la racha se comunica con el contador y el cierre del día).
3. **Social pasivo, sin deuda social.** Ver y reaccionar no genera obligaciones. Seguir se hace en un gesto; no hay presión de publicar.
4. **Móvil-first y respetuoso con el sistema.** Objetivos táctiles ≥ 44 px, contraste ≥ 4.5:1 y `prefers-reduced-motion` respetado en todo (especialmente el visor 3D).
5. **Sin culpa.** Una omisión no rompe el producto: la racha refleja constancia, no perfección; los avisos ayudan, no presionan.

## 2. Métricas conectadas al norte

- **Time-to-first-seal** (tiempo desde la llegada hasta el primer sello) — meta: ≤ 3 minutos.
- **Tasa de finalización del onboarding** — meta: ≥ 80 % sin cuenta creada.
- **Sellos por sesión y sesiones por semana** — meta del núcleo: sellar ≥ 1 hábito por día activo.
- **Adopción de temporizador** (sellos cronometrados / total) y **% de día sellado** (días con todo cerrado).
- **Acciones sociales por usuario activo** (perfiles ajenos visitados, follows, reacciones, publicaciones).
- **Activación de avisos** (usuarios que activan recordatorios por franja / racha en riesgo / resumen semanal).
- **Telemetría del piloto (requisito F1, hoja de ruta v1.1):** los 4 eventos core — registro, sellado, seguimiento, publicación — se registran desde el día 1 de la cohorte (tarea 3.5 del `docs/ROADMAP.md`) y alimentan la encuesta in-app del primer mes (MVP v1.1 § 7.5).
- **Decisiones del checkpoint V1 (hoja de ruta F2):** hipótesis de sellos cronometrados (D30 ≥ 15 % en completadores de la semana 1), social ≥ 40 % con ≥ 1 seguido en 14 días y adopción de publicaciones ≥ 15 % WAU — por debajo de este último, el módulo pasa a DIFERIDO (criterio de corte v1.1).

## 3. Flujo A — Onboarding: del primer contacto al primer sello

**Objetivo:** que un usuario nuevo selle su primer ritual en ≤ 3 minutos, con o sin cuenta.

1. **Llegada.** La app arranca en el día de hoy (modo anónimo). Cero pantallas de bienvenida bloqueantes.
2. **Exploración libre.** El panel del día está vacío pero vivo: muestra dónde iría un ritual ("¿Qué escena quieres sostener? Un ritual basta para empezar.").
3. **Crear el primer ritual.** Elegir una de las franjas (mañana / tarde / noche) → nombre del ritual (o 1-3 sugeridos) → cuándo (todos los días / días fijos / veces por semana) → hora de aviso opcional.
4. **Primer sello guiado.** Al guardar el ritual, el propio día se presenta sellable: un toque sella y celebra (principio 2).
5. **Cuenta, después.** El registro ("Crear cuenta" con email) se ofrece en un momento de valor — al ver "Actividad reciente" vacía o al querer publicar —, nunca al inicio y nunca bloqueante.
6. **Salida.** Se puede abandonar el onboarding en cualquier punto; el progreso queda (local y, al crear cuenta, en la nube).

**Casos borde:** sin conexión (los sellos y la creación funcionan local y sincronizan al reconectar); usuario sin cuenta crea rituales y luego crea cuenta (todo se fusiona); re-apertura (el onboarding no se repite jamás); límite freemium preparado (MVP v1.1, IN 9) — al alcanzar el tope de rituales del plan gratuito se informa con un aviso pospuesto y sin cobro real en el MVP.

**Criterios de aceptación:** primer sello ≤ 6 toques desde la llegada; registro opcional detectable y pospuesto sin pérdida de datos; sin pantallas de bienvenida con "siguiente >" en cadena.

## 4. Flujo B — El ritual diario

**Objetivo:** reducir cada sello a un gesto y hacer del cierre del día un pequeño logro.

1. **Entrada** por aviso (franja configurada, "racha en riesgo" a las 18:00 si quedan sellos, o resumen semanal el domingo) o por apertura directa.
2. **Panel del día.** Rituales pendientes por franja, con su racha actual e historial visual simple (7/30 días). Sin decoro: lo pendiente, visible.
3. **Sellar.** Un toque: animación de estampado + anillo + haptic + sonido (o, si el ritual lleva sello cronometrado, elegir duración y sellar al terminar el temporizador).
4. **Cierre del día.** Al sellar el último pendiente: "Día sellado" con opción de **ver mi día** (resumen de sellos/fotos/notas de hoy — tarea 1.6 del ROADMAP) en ≤ 2 toques.
5. **Salida.** El usuario puede irse en cualquier punto; el estado queda guardado.

**Casos borde:** día sin pendientes (estado "todo sellado", sin penalización); omisión/recaída (se refleja en el historial sin dramatismo — principio 5); offline (sellar funciona; sincroniza después); aviso fuera de hora (no interrumpe flujos activos).

**Criterios de aceptación:** sellar en 1 toque; revertir un sello accidental en ≤ 2 toques (ventana de deshacer ya existente); resumen del día alcanzable en ≤ 2 toques; animación desactivada con `prefers-reduced-motion`.

## 5. Flujo C — Social: ver, seguir, motivar

**Objetivo:** dar al usuario un motivo real para volver: ver constancia ajena y ser visto.

1. **Entrar en "Actividad reciente"** (red propia) o abrir un perfil ajeno desde una publicación o desde la colección.
2. **Encontrar el motivo del follow.** El perfil ajeno muestra al menos un dato comparativo motivador ("llevas 6 días, Ana 12") — tarea 3.1 — y la **vitrina de insignias** accesible en 1 toque (3.3).
3. **Seguir / dejar de seguir** en un gesto; el seguido se refleja sin notificación invasiva.
4. **Reaccionar** con una reacción de motivación de bajo esfuerzo desde la actividad o la publicación.
5. **Publicar (opcional).** Compartir un logro: imagen o nota, comentario opcional y privacidad por publicación (visible para seguidores / privado). Sin sesión: invita a crear cuenta en ese punto (Flujo A, paso 5).
6. **No hay mensajería** en el MVP (congelada): la conversación la dan las reacciones y la comparativa.

**Casos borde:** perfil privado (no se ve la vitrina ni las publicaciones; sí el nombre); sin sesión (todo es de solo lectura salvo el CTA de cuenta); red vacía (la actividad reciente explica cómo encontrar gente en 1 línea, sin pantalla muerta).

**Criterios de aceptación:** seguir en ≤ 3 toques; perfil ajeno con vitrina 3D en ≤ 1 toque; publicación en ≤ 4 toques; una acción social posible sin crear cuenta (reaccionar no exige sesión).

## 6. Flujo D — Cuenta y nube

**Objetivo:** que pasar de anónimo a cuenta sea seguro, rápido y sin pérdidas.

1. **Anónimo → cuenta.** Desde "Entrar / Crear cuenta": email + contraseña. Al completar, todo lo local (rituales, sellos, insignias, deseos) se sincroniza a la nube.
2. **Re-apertura en otro dispositivo.** Iniciar sesión restaura el progreso. Conflicto de escritura: última escritura gana (documentado; no hay resolución de conflictos en el MVP).
3. **Privacidad del perfil** (público / privado) y **datos**: exportar historial (JSON/CSV) y borrar cuenta (tarea 5.4) visibles y accionables en Ajustes.
4. **Salir** sin destruir nada local.

**Casos borde:** cuenta existente vs. datos locales (fusionar sin duplicar rituales); recuperación de contraseña (flujo estándar de email); creación de cuenta offline (se encola o se pide conexión, sin pérdida).

**Criterios de aceptación:** crear cuenta en ≤ 2 minutos sin pérdida de datos; exportar en ≤ 2 toques; borrar cuenta con confirmación explícita y aviso de pérdida irreversible.

## 7. Flujo E — Ajustes y recordatorios

1. **Ritual:** avisos por franja (hora configurable), racha en riesgo (18:00, se cancela si el día se completa), resumen semanal (domingo 20:00) y ajuste de hora — todo en ≤ 2 toques.
2. **Apariencia:** tema (color del tema y fondos) por defecto; personalización avanzada diferida (4.2 del MVP).
3. **Interacción:** sonido y vibración ("toques suaves al sellar, en chat y ambiente").
4. **Android:** recordatorio de permisos de batería/alarma exacta (ya implementado en los avisos).

**Criterios de aceptación:** activar/cambiar la hora de un aviso en ≤ 2 toques; un screen reader navega las 4 secciones y el menú sin elementos sin nombre (2.4); táctiles ≥ 44 px (2.2).

## 8. Mapa de pantallas del núcleo

- **Día** (panel por franjas: TODOS / MAÑANA / TARDE / NOCHE) · sello · temporizador · "día sellado / ver mi día"
- **Social** (pestañas: Actividad reciente · Colección/Vitrina · Perfil propio y ajeno)
- **Publicar logro** (imagen / nota / privacidad)
- **Perfil** (nickname, bio, foto, privacidad, rachas e insignias) propio y ajeno
- **Ajustes** (Ritual / Apariencia / Interacción / Cuenta y datos)
- **Autenticación** (Entrar / Crear cuenta) · **Onboarding del primer ritual**

*Confirmar en prototipo (Paso 3.5, dentro de F1 del roadmap) la navegación raíz (p.ej. barra inferior) y mover cualquier pantalla que no pase sus criterios de ≤ N toques. Los criterios de aceptación de los flujos A–E son los umbrales que valida la cohorte del piloto (checkpoint V1, hoja de ruta F2), con la telemetría de los 4 eventos core desplegada antes de abrirla.*