# Awake — Paso 1: Definición del MVP

**Versión:** 1.1.1 (APROBADO — cierre del Paso 1, septiembre 2026)
**Estado:** ✅ **APROBADO** por el responsable de producto. Paso 1 cerrado; se avanza al Paso 2.
**Alcance de este documento:** solo producto — no hay decisiones técnicas de implementación (se tratan en el Paso 4).
**Nota:** plataforma confirmada (web en Vercel + Google Play como lanzamiento); núcleo priorizado y contrastado con la build en vivo, con `docs/ROADMAP.md` (roadmap de auditoría técnico, que actúa como capa de ejecución) y con la estructura del repositorio.
**Historial de versión:**
- **v1.1.1 (septiembre 2026):** corrección factual en § 6 — el cliente usa el SDK JS de Supabase vía CDN (el v1.0 asumía «sin SDK»), según la verificación del Paso 4 (`docs/04-arquitectura.md`, ADR 3).
- **v1.1 (septiembre 2026):** revisión senior aplicada y aprobada — plan de validación ligera formalizado (supuesto 5, § Validación), métrica y criterio de corte para Publicaciones (§ 4.1.5 y § 5), hipótesis medible para Sellos cronometrados (§ 4.1.2).
- **v1.0 (septiembre 2026):** aprobación inicial — cierre del Paso 1.

---

## 1. Visión

> Awake convierte la constancia diaria en una experiencia social: mantén tus hábitos, comparte tus rachas con tus amigos y no vuelvas a empezar solo.

Awake es una app de hábitos sencilla de usar, con una capa social de bajo esfuerzo (amigos, rachas y motivación) como diferenciador central. La identidad del nombre — "despertar tu rutina" — es el gancho emocional y de marca, sin limitar la funcionalidad a hábitos de mañana.

**Distribución:** en la fase actual, Awake es 100 % ejecutable como aplicación web desde su URL (despliegue en Vercel). Google Play es el **mercado de lanzamiento formal** en la fase posterior, con su estrategia ASO.

## 2. Problema y público objetivo

**Problema:** las apps de hábitos clásicas fracasan en retención: la motivación decae a las 2–3 semanas por falta de *accountability* externo (rendición de cuentas entre personas reales) y el usuario abandona en silencio.

**Público objetivo (mercado hispanohablante):**
- Adultos jóvenes de 18–35 años: estudiantes y profesionales con metas de salud, estudio y trabajo.
- Usuarios habituales de redes sociales que ya comparten logros y buscan reconocimiento social.
- Han intentado (y abandonado) hábitos con apps o métodos manuales al menos una vez.

**Persona tipo:** *Marta, 27 años, marketing. Ha intentado leer 20 minutos al día tres veces y lo ha dejado. Se motiva cuando comparte o compite con su grupo de amigos. Descarga apps que parecen fáciles y las borra cuando exigen demasiado esfuerzo de configuración.*

## 3. Propuesta de valor / diferenciación

| Competidor | Fortaleza | Riesgo para Awake |
|---|---|---|
| Streaks | Minimalismo y diseño pulido | Single-player, sin motivación social |
| Habitica | Gamificación RPG | Complejidad alta, audiencia nicho |
| Forest | Enfoque en concentración | Solo hábitos de foco/tiempo |

**Diferenciación de Awake:** simplicidad de uso al nivel de "marcar y seguir" + capa social de bajo esfuerzo (ver y reaccionar a las rachas de tus amigos) + identidad de marca "despertar tu rutina".

## 4. Alcance funcional

### 4.0 Estado observado en producción (sin revisión de código)

El despliegue actual en la URL de Vercel ya muestra una build funcional sustancial de Awake: rituales mañana/tarde/noche, sellos con temporizador, deseos/metas con fecha objetivo, publicaciones, seguidores, insignias, mensajes, recordatorios (aviso por franja, racha en riesgo, resumen semanal), personalización (temas, fondos, sonido, vibración) y modo anónimo con cuenta opcional en la nube.

Consecuencia de alcance: el MVP no se construye desde cero, sino que **cierra, prioriza y valida el núcleo existente** (ritual + social + cuentas) antes de la fase de lanzamiento. La auditoría de código se realizará en los Pasos 4–5 y puede reordenar esta lista de prioridades.

**Clasificación de los módulos observados (valor/esfuerzo, pendiente de confirmación técnica en el Paso 4):**

| Módulo observado en producción | Clasificación | Justificación |
|---|---|---|
| Rituales mañana/tarde/noche + sellos | IN | Núcleo del producto: el loop diario del usuario |
| Sellos cronometrados | IN | Diferenciador ya construido; se mide su uso en la prueba |
| Cuenta opcional + nube | IN | Requisito de persistencia y de la capa social |
| Seguidores / seguidos y actividad reciente | IN | Diferenciador social central del MVP |
| Publicaciones (imagen, comentario, privacidad) | IN | Social ya construido; posible recorte según datos de uso |
| Recordatorios por franja (mañana/tarde/noche) | IN | Palanca de retención diaria |
| Mensajería interna | DIFERIDO (congelada) | Decisión de producto registrada: sin inversión hasta que el follow tenga tracción (ROADMAP 3.2) |
| Deseos/metas con fecha objetivo | DIFERIDO | Valor claro, pero fuera del loop diario núcleo |
| Insignias y vitrina 3D | IN (ya implementado; sin ampliar gamificación) | Gancho visual y social existente (ROADMAP 3.3) |
| Racha en riesgo + resumen semanal | IN (ya implementado; se valida con datos) | Avisos de retención construidos (ROADMAP 1.2) |
| Fondos, sonido, vibración, adaptación iOS | DIFERIDO | Pulido post-validación |
| Pago / monetización real | OUT | Fuera del MVP (solo arquitectura de límites) |

### 4.1 IN — funcionalidades del MVP

1. **Ritual del día (mañana / tarde / noche):** panel diario con sellos — check-in de un toque, racha actual e historial visual simple (7/30 días). El corazón del producto.
2. **Sellos cronometrados:** rituales con temporizador que se sellan al terminar; diferenciador ya construido que se valida con datos de uso en la prueba del MVP.
   **Hipótesis declarada (v1.1):** «los usuarios que completan ≥ 1 sello cronometrado en su primera semana muestran retención D30 ≥ 15 %». Se mide con analítica de eventos en el piloto; si no se confirma, el módulo se mantiene como opción secundaria y no recibe más inversión en el MVP.
3. **Cuenta y nube:** modo anónimo sin cuenta + registro por email opcional; el progreso se guarda en la nube al iniciar sesión (requisito de persistencia y de la capa social).
4. **Capa social núcleo:** seguidores / seguidos, actividad reciente de tu red y reacciones de motivación de bajo esfuerzo — el diferenciador central del MVP.
5. **Publicaciones y día sellado:** compartir logros con imagen/comentario y privacidad por publicación (visible para seguidores / privado); ya construido, se valida su adopción antes de ampliarlo. **Criterio de corte (v1.1):** si al cierre del piloto la adopción no alcanza ≥ 15 % de WAU con al menos 1 publicación semanal, el módulo pasa a DIFERIDO en la siguiente versión.
6. **Recordatorios:** avisos por franja (mañana/tarde/noche), aviso de racha en riesgo y resumen semanal — ya implementados (ROADMAP 1.2); se validan con datos en la prueba del MVP.
7. **Perfil y ajustes mínimos:** nombre, biografía, foto, privacidad de perfil y tema por defecto.
8. **Técnica mínima:** sellos funcionales sin conexión (offline-ligero) con sincronización posterior; analítica básica de eventos core (registro, sellado, seguimiento, publicación).
9. **Límites freemium preparados:** arquitectura de límites por plan (rituales gratis limitados, premium ilimitado) sin cobro real en el MVP.

### 4.2 DIFERIDO — post-MVP (v1.1 en adelante)

- Retos y competiciones entre amigos (clave de la evolución social post-MVP).
- Mensajería interna — congelada por decisión de producto (ROADMAP 3.2): no invertir hasta que la capa social tenga tracción.
- Deseos/metas con fecha objetivo.
- Gamificación ampliada (niveles, XP, logros, nuevos temas de insignias).
- Insights e IA sobre consistencia y predicción de abandono (funcionalidades "avanzadas").
- Widgets, Wear OS e integraciones (Health Connect / Google Fit).
- Multi-idioma (inglés).
- Modo oscuro completo y personalización visual avanzada (fondos, sonido, vibración, adaptación iOS).

### 4.3 OUT — explícitamente excluido del producto

- Feed público global sin segmentar (la red social se limita a seguidores/amigos en el MVP).
- Mercado de contenidos o cursos.
- Versión iOS / app nativa de tienda en esta fase: el MVP es una aplicación web ejecutable vía URL (Vercel); la publicación en Google Play llega en la fase de lanzamiento.
- Monetización real activa (cobros) en la fase MVP.

## 5. Criterios de éxito

**North Star Metric:** hábitos completados por Usuario Activo Semanal (H/WAU).

| Métrica | Meta |
|---|---|
| Activación (primer check-in el Día 1) | ≥ 60 % de registrados |
| Retención D1 / D7 / D30 | ≥ 30 % / ≥ 15 % / ≥ 8 % |
| Social (≥ 1 amigo conectado en 14 días) | ≥ 40 % de activos |
| Adopción de publicaciones (≥ 1 publicación/semana) | ≥ 15 % de WAU — por debajo, el módulo pasa a DIFERIDO |
| Estabilidad (crash-free) | ≥ 99,5 % |
| Valoración en Google Play (primer mes) | ≥ 4,3 |

**Definición de "MVP validado":** retención D30 ≥ 8 % y un grupo piloto real de ≥ 20 usuarios activos semanales con feedback cualitativo recogido.

## 6. Plataforma y restricciones técnicas preliminares

*Solo supuestos de producto — se decide la arquitectura en el Paso 4.*

- **Fase MVP (actual):** aplicación web totalmente ejecutable desde URL — despliegue en Vercel (https://www-smoky-phi-21.vercel.app/), sin instalación, accesible desde el navegador y móvil-first. Requisitos de producto: diseño responsive móvil, modo anónimo sin cuenta (con cuenta opcional para la nube y lo social) y funcionamiento básico sin conexión.
- **Fase de lanzamiento (formal):** Google Play como mercado de lanzamiento, con su estrategia ASO. El empaquetado a Android (TWA / Capacitor / port nativo Kotlin) se decide en el Paso 4; en esta fase la web debe quedar lista para empaquetarse sin rediseñar el producto.
- **Servicios (confirmados en el repo):** **Supabase** (Postgres + RLS + Realtime + Edge Functions) es el backend real ya integrado, con el **SDK JS de Supabase vía CDN** y acceso REST desde el cliente (la sesión se gestiona con un adaptador propio — corrección factual v1.1.1: el v1.0 asumía «sin SDK»). Su configuración y riesgos se detallan en el Paso 4 (`docs/04-arquitectura.md`).
- **Offline-ligero:** los check-ins funcionan sin conexión y sincronizan al reconectar.
- **Privacidad:** mínimo dato exigido, opción de cuenta anónima, cumplimiento de políticas de datos de Google Play.

## 7. Supuestos y decisiones asumidas (a validar)

1. **Mercado:** hispanohablante; español como idioma de lanzamiento.
2. **Monetización:** freemium con suscripción (se prepara la arquitectura de límites; no se implementa cobro real en el MVP).
3. **Posicionamiento:** el nombre "Awake" es la identidad ("despertar tu rutina") sobre un tracker general; no limita a hábitos de mañana — se valida con usuarios.
4. **Social mínima** (amigos + rachas + reacciones) es el diferenciador central del MVP; los retos quedan para v1.1.
5. **Validación de producto (formalizada en v1.1):** en dos capas durante los Pasos 2–3, sin bloquear el avance del plan:
   - **Cualitativa (opcional):** 5–10 entrevistas breves con usuarios objetivo para confirmar dolor y posicionamiento; si no se realizan, se registra la renuncia explícita en el documento de la fase correspondiente.
   - **Cuantitativa (obligatoria):** cohorte beta con telemetría de eventos core (registro, sellado, seguimiento, publicación) y encuesta in-app en el primer mes; sus resultados alimentan el criterio «MVP validado» (§ 5).
6. **Web-first en el MVP:** la validación del producto se hace sobre la web ejecutable en la URL de Vercel, sin requerir instalación; acelera el ciclo de prueba y corrección del MVP.
7. **Google Play = lanzamiento formal:** la publicación en Google Play ocurre en la fase de lanzamiento (última fase del plan) sobre lo validado en web; el empaquetado Android se decide en el Paso 4.

## Criterio de salida del Paso 1

✅ **Cumplido (septiembre de 2026):** el responsable de producto aprobó el alcance y autorizó continuar con el resto de pasos. Refrendado en v1.1 (septiembre de 2026) tras el review senior: plan de validación, métrica y criterio de corte de Publicaciones, e hipótesis de Sellos cronometrados incorporados al documento. Cualquier cambio posterior de alcance requiere actualizar este documento en paralelo.