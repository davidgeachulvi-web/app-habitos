# AWAKE — Contexto para IA: mapa lógico y verificación (09)

**Versión:** 1.0 · 3 de septiembre de 2026
**Propósito:** que cualquier sesión de IA (y el mantenedor) entienda **cómo funciona AWAKE por dentro** —
dónde vive cada lógica, cómo fluyen los datos, qué invariantes hay que respetar y cómo verificar un cambio.
Este es el documento «vivo» de referencia junto con `AGENTS.md`; los números de línea **son orientativos**
(siempre verificables con `code_search` por nombre de función) porque el código evoluciona.

---

## 1. Modelo de dominio en una frase

AWAKE gestiona **rituales** (hábitos) que el usuario **sella** una vez al día por franja horaria
(MAÑANA/TARDE/NOCHE o 24/7). Cada sello crea un **registro** (log) con fecha, momento y adjuntos opcionales
(foto/nota). Los sellos alimentan **rachas**, un **día sellado** (todo completado), **deseos** (objetivos de una
sola vez) e **insignias** desbloqueables. Con cuenta, los datos sincronizan a Supabase y aparece la capa social
(feed de actividad, follows, likes, comentarios, publicaciones, perfiles). El **chat** está congelado
(funcional pero sin nuevas features).

## 2. Dónde vive cada lógica (mapa verificado con `code_search`)

### 2.1 `www/app.js` — orquestador global (~10.000 líneas)
| Responsabilidad | Funciones clave (línea aprox.) |
|---|---|
| Arranque | `window.onload` (1746): canvas de fondo, slider, sesión, SW, reloj del ritual |
| Sesión Supabase (flujo) | `restaurarSesionDesdeRespaldo` (1867), `cerrarSesionSupabase` (5238), `cambiarCuentaAjustes` (5252), `abrirModalAuth` (6350) |
| Sellado/celebración | `celebrarSello` (1734), `deshacerUltimoSellado` (1655) |
| Imágenes/avatares | `subirImagenOAvisar` (1235), `manejarClickAvatarPrincipal` (6670) |
| Navegación | `cambiarTab` (2688) |
| Calendario | `renderCalendarStrip` (5800), `seleccionarDiaCalendario` (5985) |
| Social/feed | `renderizarFeedActividad` (4360), `renderizarPerfilPublicacionesGrid` (7514) |
| Temas | `aplicarTemaGlobalHabitos` (6502) |
| Recordatorios | `verificarRecordatoriosHabitos` (4131) |
| Insignias | `metricasInsignias` (8110), `estaEnShowcase` (7948), `alternarShowcaseInsignia3D` (8216), `sincronizarInsigniasConMetricas` (8895), `revocarInsigniasSinMetrica` (8956), `itemsInsigniasDesdeMapa` (9021) |
| Persistencia local | `claveEstadoLocal` (2945) — clave `monolith_app_state:{uid}` |

### 2.2 `www/js/domain/habits.js` — ritual, agenda, sellado (~3.800 líneas)
| Responsabilidad | Funciones clave (línea aprox.) |
|---|---|
| Fechas locales | `inicioDiaLocal` (250) |
| Programación | `habitProgramadoEnFecha` (301) — días de la semana, 24/7, una vez, futuro |
| Deseo (una vez) | `guardarCompletacionDeseo` (2192), `solicitarDesmarcarDeseo` (2286), `borrarLogDelDia` (2692) |
| Sellado | `insertarRegistroMarca` (2564), `desellarSellosHabitoEnFecha` (2696), `ejecutarLogicaCheckboxHabito` (3366), `guardarCompletado` (3568) |
| Resumen/avisos | `resumenSemanaRitual` (2962), `mensajeResumenSemanal` (2978), `mensajeRachaEnRiesgo` (2983) |
| Historial/perfil | `publicacionesDeLogsHabito` (417) |

### 2.3 Otros archivos
| Archivo | Rol |
|---|---|
| `www/js/core/session.js` | Cliente Supabase + adaptador de almacenamiento (localStorage + IDB + cookies, migración) |
| `www/js/core/sonidos.js` | Motor de sonido por manifiesto id→ruta (no-op silencioso si no hay fichero) |
| `www/js/core/analytics.js` | `window.awakeAnalytics.track` (local-first; salta a `window.plausible` si existe) |
| `www/js/domain/icons.js` | Catálogo Phosphor SVG (sin DOM) |
| `www/js/social/chat.js` | Chat DM congelado (1.745 líneas; polling/broadcast propio) |
| `www/js/badges/*` | Visor 3D: `badge-coin-3d.js` (wrapper, guard WebGL2, lazy-load) + `coin/*` (grafo ESM) + `badge-seal-art.js` |
| `www/sw.js` | PWA shell: precache `AWAKE_SHELL` + network-first + notificaciones (versión `awake-shell-vN`) |

## 3. Flujo de datos (local-first)

```
Usar la app (anónimo) → todo en localStorage/IDB (monolith_app_state:{uid}, prefs, badges)
Crear cuenta → session.js guarda sesión → app.js sube estado local (cargarDatosUsuarioSupabase)
Con cuenta → lecturas/escrituras Supabase (tablas: profiles, habits, habit_logs, follows, likes,
            comments, awake_media, wishes_and_prefs, chat_reads, device_tokens, messages)
Realtime → canales postgres_changes (db-changes, messages-inbox) + Edge Function notify-message (FCM)
Sin conexión → la app funciona local y sincroniza (last-write-wins implícito)
```

**Reglas de datos:**
- El **registro de invitado** (sin `user_id`) nunca aparece en la red social (regla `!!ej.user_id` en
  `renderizarFeedActividad`, B-50) — la foto/nota queda solo en el historial local.
- Los data-URL de invitado se conservan al persistir; al tener cuenta se suben como imágenes reales.
- Conflictos: **last-write-wins**, sin resolución (documentado; decisión consciente del MVP).

## 4. Invariantes de lógica (no romper)

| # | Invariante | Verificación |
|---|---|---|
| I-1 | Sellar es **1 toque**; desellar siempre pide **confirmación** (también en 24/7, B-59) | `ejecutarLogicaCheckboxHabito`, `confirmModalAction` |
| I-2 | Un sello = un registro con fecha/momento; deshacer/desellar **revoca** la insignia si la métrica ya no se cumple (B-56/B-57) | `revocarInsigniasSinMetrica` tras desello/borrado real |
| I-3 | La insignia **ok** se decide por el **desbloqueo guardado**, no por la métrica en vivo (B-55) | `sincronizarInsigniasConMetricas` lee `saved[def.id]` |
| I-4 | Insignias de DÍA se entregan con **regla de 24 h** (nunca el mismo día sellado) | `metricasInsignias` excluye hoy (`if (i > 0)`) |
| I-5 | Un registro de invitado jamás entra en el feed social | `!!ej.user_id` en `renderizarFeedActividad` |
| I-6 | Sin sesión, Supabase responde 401/permission denied en consola: **esperado**, no es bug | `docs/rls.md` |
| I-7 | El chat (DM) está **congelado**: solo mantenimiento mecánico | ROADMAP 3.2 |
| I-8 | Los handlers inline del HTML (`onclick=…`) llaman a funciones **globales**: si renombras una, actualiza HTML y templates JS | smoke test |
| I-9 | El SW precachea el shell **manualmente**: todo archivo nuevo servido debe ir a `AWAKE_SHELL`/`esRecursoShell` | `www/sw.js` |
| I-10 | El visor 3D usa imports **relativos** (no import map) y guard WebGL2; falla con `onFail`, nunca lanza | B-24, `badge-coin-3d.js` |
| I-11 | Un gesto → **un sonido** (el específico cancela el click genérico pendiente) | `marcarSonidoEspecifico` (B-40/B-41) |
| I-12 | Fechas y momentos se calculan en **hora local**; el día cambia a medianoche local | helpers `claveDiaLocal`/`inicioDiaLocal` |
| I-13 | La UI está en **español hardcodeado** (sin i18n todavía) | — |

## 5. Señales de error frecuentes y su causa probable

| Síntoma | Causa probable (histórico) | Referencia |
|---|---|---|
| La app sirve versión vieja | SW sin bump o shell desactualizado | B-03, 0.3 |
| El visor 3D no abre / «Failed to fetch module» | ruta de módulo rota, `three.core.min.js` ausente, import bare en iOS <16.4 | B-24, IMPLEMENTACIONES 2.1 |
| Modal/estilo raro | regla CSS accidental con selector demasiado amplio | IMPLEMENTACIONES 2.2 |
| Insignia encendida sin mérito o apagada con mérito | ok decidido por métrica viva en vez de guardado | B-55 |
| Insignia revocada al deshacer un sello | revoke no conectado al desello | B-56/B-57 |
| Foto de invitado en SOCIAL | faltaba `!!ej.user_id` | B-50 |
| Doble sonido en un gesto | click genérico + sonido específico sin cancelación | B-40/B-41 |
| El día no se selecciona en el calendario | pointer capture retargetea el click | B-33 |
| Comentar publicación no sincronizada se pierde | sin cola local (decisión MVP) — hay toast de aviso | B-05 |

## 6. Cómo verificar un cambio (checklist)

1. `npm test` (30) + `npm run check` (sintaxis + imports del visor) — **obligatorio**.
2. Si tocaste HTML/IDs/handlers: el smoke test ya cubre que existan.
3. Si tocaste lógica pura (programación, rachas, resumen): hay tests dedicados en `test/`; **añade casos**
   para la nueva lógica si es pura y testeable.
4. Si tocaste Supabase/RLS: ejecuta `supabase/sql/00-diagnostico.sql` (solo lectura) y compara con `docs/rls.md`.
5. Si tocaste rutas/archivos del shell: actualiza `sw.js` (I-9) y prueba offline en el preview.
6. Preview manual: `npm run dev` → recorre el flujo tocado → consola limpia (salvo 401 guest esperado) →
   si toca nativo, `npm run cap:copy` y diff con las copias (esperado: solo `.vercel`, `cordova.*`, versión SW).

## 7. Referencias cruzadas

- **Inventario y hallazgos de auditoría (estado real):** `docs/07-auditoria-externa.md`
- **Decisión estructural (Opción A) y plan S1–S7:** `docs/08-decision-estructura.md`
- **Backlog de bugs con causa raíz:** `docs/06-depuracion.md` (B-01…B-60)
- **Roadmap técnico de fases:** `docs/ROADMAP.md` · **Producto:** `docs/02-roadmap.md`, `docs/01-definicion-mvp.md`
- **Seguridad/backend:** `docs/rls.md`, `docs/sql-runbook.md`
- **Bitácora de sesiones:** `docs/10-registro-sesiones.md`
