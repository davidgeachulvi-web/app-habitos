# Awake — Paso 2: Hoja de Ruta (Roadmap)

**Versión:** 1.1 · septiembre 2026 (alineada con el MVP v1.1 — plan de validación § 7.5: telemetría de 4 eventos core, encuesta in-app, checkpoint de cierre del piloto y criterios de corte de Publicaciones y Sellos cronometrados)
**Relación con la documentación existente:** `docs/ROADMAP.md` es el roadmap de **auditoría técnica** (tareas por fase, marcadas con su estado). Este documento es el roadmap de **producto** (calendario, fases, hitos y puertas de validación) y usa el ROADMAP de auditoría como capa de ejecución. Ambos viven en paralelo: el de producto decide *qué y cuándo validar*; el de auditoría, *cómo ejecutarlo*.

---

## 1. Objetivo de la hoja de ruta

Llevar Awake desde su base actual (SPA en Vercel + Capacitor + Supabase) hasta el **lanzamiento formal en Google Play** y su primera evolución (v1.1), pasando por la validación del núcleo con usuarios reales. Horizonte: **septiembre 2026 → septiembre 2027**.

Cada fase termina con una **puerta de validación (G)** medible. No se avanza a la siguiente sin pasarla. Si una puerta no se cumple, la fase se extiende o se recorta alcance **antes** de encadenar deuda.

## 2. Mapa general

| Fase | Trimestre | Objetivo | Entregable principal | Puerta de salida |
|---|---|---|---|---|
| F1 · Cierre del núcleo | Sep–Oct 2026 | Alinear producción con disco y cerrar funcional el núcleo definido en el MVP | Deploy acumulado + validación piloto web | **G1** |
| F2 · UX, accesibilidad y estabilidad | Oct–Nov 2026 | Depurar (Paso 6), dejar el producto accesible y cerrar la validación del piloto | Backlog de depuración resuelto + a11y ≥ 90 + checkpoint V1 | **G2** |
| F3 · Motor social | Nov–Dic 2026 | Dar motivo al follow y blindar datos (RLS, export/borrar) | Follow con comparativa/retos + RLS auditado | **G3** |
| F4 · Beta Android | Dic–Ene 2027 | Empaquetar (Capacitor ya integrado) y abrir beta cerrada en Play | AAB + beta cerrada estable | **G4** |
| F5 · ASO y lanzamiento | Ene–Feb 2027 | Ficha, capturas y copys (impulsados desde su hilo de marketing) | Lanzamiento formal en Google Play | **G5** |
| F6 · v1.1 y evolución | Mar–Sep 2027 | Retos, push, i18n, landing e iteración con datos | v1.1 publicada + plan de evolución | — |

## 3. Fases en detalle

### F1 · Cierre del núcleo (semanas 1–8)

1. **Poner producción al día** — el ROADMAP de auditoría marca como innegociable el *deploy web acumulado* (0.6): verificar qué sirve hoy `www-smoky-phi-21.vercel.app` frente a disco y ejecutar `npm run deploy:web` cuando toque.
2. **Quick wins de marca** — manifest/metadatos (5.2) e iconos maskable (4.4) si no están verificados en producción.
3. **Blindar lo recién hecho** — tests de los recordatorios (1.5), ≥ 10 tests nuevos.
4. **Confianza y RGPD** — exportar y borrar datos (5.4) antes de promocionar.
5. **Validación con usuarios (plan del MVP v1.1, § 7.5)** — cohorte piloto de 20 usuarios reales vía la URL web, con telemetría de los 4 eventos core (registro, sellado, seguimiento, publicación) y **encuesta in-app en el primer mes**. Se mide: onboarding, primer sello, retención D1/D7/D30, seguimientos y publicaciones creadas, adopción de avisos y la **hipótesis de sellos cronometrados** (D30 de quienes completan ≥ 1 sello cronometrado en su semana 1 vs. el resto). La capa cualitativa (5–10 entrevistas) es **opcional** en v1.1: si no se realiza, se registra aquí la renuncia explícita.

**Puerta G1 (éxito del núcleo):** activación ≥ 60 % (primer sello el día 1), retención D7 ≥ 15 % en el piloto, crash-free ≥ 99 %, y testimonios de 5–8 usuarios que describan el valor ("el sello", "la racha", "ver sellar a otros") sin que se les sugiera.

### F2 · UX, accesibilidad y estabilidad (semanas 9–14)

Ejecutar la Fase 2 del roadmap de auditoría (contraste ≥ 4.5:1, táctiles ≥ 44 px, `prefers-reduced-motion` en el visor, ARIA, design system de componentes) e incorporar el **Paso 6 (Depuración)**: backlog ordenado de errores conocidos, limpieza de consola y deuda puntual.

**Checkpoint V1 — cierre de la validación del MVP (revisión informativa, no bloqueante):** cuando la cohorte del piloto alcance D30, se evalúa el criterio «MVP validado» (D30 ≥ 8 % con ≥ 20 WAU y feedback recogido) y las dos decisiones del MVP v1.1: (a) **publicaciones** — si la adopción queda bajo ≥ 15 % de WAU con ≥ 1 publicación semanal, el módulo pasa a DIFERIDO; (b) **sellos cronometrados** — si la hipótesis (D30 ≥ 15 % en completadores de la semana 1) no se confirma, el módulo queda como opción secundaria sin más inversión. Los resultados y las decisiones se documentan en un informe de validación anexo a este documento.

**Puerta G2:** Lighthouse accesibilidad ≥ 90; textos clave ≥ 4.5:1 en los temas principales; objetivos táctiles ≥ 44 px; crash-free ≥ 99,5 %; consola sin errores (solo el 401 guest esperado, documentado).

### F3 · Motor social (semanas 15–20)

1. **Motivo del follow (3.1)** — comparativa suave de rachas ("llevas 6 días, Ana 12") o mini-retos por tema (3.4).
2. **Vitrina de insignias en perfil ajeno (3.3)** — la colección 3D a 1 toque.
3. **Blindaje de datos (5.5)** — RLS auditado y documentado (`docs/rls.md`), incluidos `chat_reads`, `device_tokens`, `follows`.
4. **Decisión de push (5.7)** — notificaciones exactas (FCM/APNs para el resumen semanal fiable) sí/no con criterios de coste/beneficio.

**Puerta G3:** ≥ 40 % del piloto con al menos 1 seguido activo; perfil ajeno con vitrina operativa; RLS verificado con y sin sesión sin fugas.

### F4 · Beta Android (semanas 21–26)

1. Cuenta de desarrollador de Google y **Data Safety** completado (los datos que se recogen y por qué).
2. **AAB de release** firmado vía Capacitor (el proyecto `android/` ya existe y `cap:copy` sincroniza assets).
3. **Beta cerrada** en Play con 20–50 probadores; pruebas en dispositivos reales (recordar: avisos Android requieren ajustes de batería, ya documentados en la app).
4. Congelación de funcionalidad: solo hotfixes.

**Puerta G4:** 2 semanas de beta sin bugs críticos; políticas de Play aprobadas; métricas de la beta coherentes con el piloto web.

### F5 · ASO y lanzamiento (semanas 27–32)

Ficha ES, capturas con el visor 3D como protagonista y keywords (5.3), más copys publicitarios y estrategia de lanzamiento. **Por aislamiento temático, este bloque se impulsa desde sus hilos de conversación independientes (Pasos 7–9); aquí solo fijamos las dependencias técnicas**: capturas exportadas desde la app real, ficha lista, link de política de privacidad, y el alias público desprotegido o el dominio definitivo decidido.

**Puerta G5:** ficha aprobada por Google, rollout al 100 % en producción, y arranque de la estrategia de promoción coordinada.

### F6 · v1.1 y evolución (marzo–septiembre 2027)

Retos consolidados (3.4 ampliado), push nativo/web (5.7 si G3 dijo sí), i18n ES/EN (5.6), landing page (5.1), refactor continuo del monolito (4.1, un dominio por semana) y primeras capacidades de insights con los datos del piloto. Revisión trimestral de retención contra las metas del MVP (D30 ≥ 8 %).

## 4. Responsabilidades

| Rol | Alcance en este plan |
|---|---|
| Responsable de producto (usuario) | Valida puertas G1–G5; decide recortes de alcance antes que retrasos |
| Desarrollo (asistente + usuario) | Ejecución de F1–F4 y F6; dependencias técnicas de F5 |
| Marketing (hilos separados) | F5: ASO, copys, anuncios, estrategia de lanzamiento (Pasos 7–9) |

## 5. Riesgos del plan

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Calendario optimista (lanzamiento ≈ feb 2027) | Retraso de la puerta G4/G5 | Recortar alcance de F3 antes de mover fechas; betas en paralelo |
| Confusión de marca: `app-habitos.vercel.app` sirve otra app ajena ("UKIFAZER") | Fuga de usuarios, reputación | Unificar/cancelar proyectos Vercel heredados; fijar dominio limpio antes de F5 |
| RLS pendiente (chat_reads, follows, device_tokens) | Fuga de datos | F3 tarea 3 (5.5) con verificación con/sin sesión |
| Assets en 3 copias (web/iOS/Android) | Desincronización | `cap:copy` en el deploy; verificar `scripts/strip-vercel.js`; diff en F4 |
| Notificaciones locales sin push exacto | Resumen semanal con datos obsoletos | Decisión 5.7 en F3; comunicación honesta en ajustes |
| Telemetría social ausente (follow/post sin eventos en analytics) | Validación v1.1 incompleta: criterio social y de publicaciones sin datos | Añadir los eventos antes de abrir el piloto (auditoría 3.5); medir desde el día 1 de la cohorte |
| Dependencia de aprobaciones externas (Google) | Bloqueo de G4 | Preparar cuenta y Data Safety en paralelo desde F3 |

## 6. Salud del plan

Revisión mensual: estado de puertas, desviación de calendario, retención contra metas del MVP y deuda técnica acumulada (líneas del monolito como termómetro). Si dos puertas consecutivas se mueven, se re-planifica el resto en vez de estirar plazos.