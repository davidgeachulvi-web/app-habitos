# AWAKE · Runbook SQL de Supabase

Runbook oficial de los scripts de `supabase/sql/`. Resuelve el desorden histórico del SQL Editor: aquí está **qué ejecutar, en qué orden, para qué sirve y cómo verificar** cada script.

## Cómo usar este runbook

1. **Primero, diagnostica:** ejecuta `supabase/sql/00-diagnostico.sql` en el SQL Editor (dashboard → SQL → New query). Es **solo lectura**, no modifica nada.
2. **Pega el resultado** (la tabla `objeto | estado | detalle` + los NOTICEs de filas) para que sepamos exactamente qué está aplicado en tu base de datos.
3. **Ejecuta solo lo que falte**, por fases, en el orden de abajo. Todos los scripts son **idempotentes**: se pueden re-ejecutar sin perder datos.
4. Tras cada fase, si quieres, re-ejecuta `00-diagnostico.sql` y compara: el estado de la fase debe pasar a verde.

> **Regla de oro:** un script = una pestaña del SQL Editor con **título** (el nombre del archivo). No mezcles scripts sueltos sin título en la misma query — así es como se perdió la trazabilidad.

---

## Fase 0 · Diagnóstico (ejecutar SIEMPRE primero)

| Script | Qué hace | Verificación |
|---|---|---|
| `00-diagnostico.sql` | Estado real de la BD: tablas, RLS, políticas, columnas, realtime, storage, triggers, GRANTs y conteo de filas. **Solo lectura.** | La tabla completa + NOTICEs al final. |

---

## Fase 1 · Esquema base (estructura de datos)

| Orden | Script | Qué hace | Verificación |
|---|---|---|---|
| 1.1 | `ritual_leap_adapt.sql` | Columnas del ritual: `archived`, `times_per_week`, `glyph`, `nudge` (habits); `week_start`, `ritual_prefs` (profiles); `due_date` (wishes) | Diagnóstico: `COL habits.archived = EXISTE`, `COL profiles.week_start = EXISTE`, `COL wishes.due_date = EXISTE` |
| 1.2 | `wishes_and_prefs.sql` | Tabla `wishes` + RLS propios + realtime; función `awake_set_user_id`; `theme_hue`, `bg_choice` (profiles) | Diagnóstico: `TABLA wishes = EXISTE`, `RLS wishes = HABILITADO`, `REALTIME wishes = PUBLICADO` |
| 1.3 | `owner_triggers.sql` | Política de insert en storage + triggers de autoría (`user_id`/`sender_id`/`follower_id` automáticos) en habits, habit_logs, likes, comments, messages, follows | Diagnóstico: `TRIGGER awake_habits_set_user_id = EXISTE` (y los otros 6) |
| 1.4 | `badges_unlocked.sql` | Columna jsonb `badges_unlocked` en `profiles` (mapa badge → timestamp) | Diagnóstico: `COL profiles.badges_unlocked = EXISTE` |
| 1.5 | `account_privacy.sql` | Columna `account_privacy` ('publico'/'privado') + constraint CHECK en `profiles` | Diagnóstico: `COL profiles.account_privacy = EXISTE` |

---

## Fase 2 · RLS del núcleo (hábitos, sellos y social)

| Orden | Script | Qué hace | Verificación |
|---|---|---|---|
| 2.1 | `habits_rls.sql` | RLS de hábitos: solo el dueño lee/escribe su rutina | Diagnóstico: `RLS habits = HABILITADO` + `POLÍTICAS habits = 3` |
| 2.2 | `habit_logs_rls.sql` | RLS de sellos: escritura propia; lectura según privacidad del autor | `RLS habit_logs = HABILITADO` + `POLÍTICAS habit_logs = 3` |
| 2.3 | `likes_rls.sql` | RLS de likes: solo tú das/quitas tu like, y solo en sellos visibles | `RLS likes = HABILITADO` + `POLÍTICAS likes = 3` |
| 2.4 | `comments_rls.sql` | RLS de comentarios: comentar solo en sellos visibles; borrar el autor o el dueño del sello | `RLS comments = HABILITADO` + `POLÍTICAS comments = 3` |
| 2.5 | `messages_rls.sql` | RLS de mensajes: solo participantes del hilo; enviar solo como tú | `RLS messages = HABILITADO` + `POLÍTICAS messages = 2` |
| 2.6 | `profiles_rls.sql` | RLS de perfiles: SELECT autenticado (feed/explorar); escritura solo la fila propia | `RLS profiles = HABILITADO` + `POLÍTICAS profiles = 3` |
| 2.7 | `follows_rls.sql` | RLS de follows: SELECT autenticado (público); INSERT/DELETE solo si tú eres el follower | `RLS follows = HABILITADO` + `POLÍTICAS follows = 3` |

---

## Fase 3 · Social y chat (tablas pendientes de B-01/B-02)

| Orden | Script | Qué hace | Verificación |
|---|---|---|---|
| 3.1 | `chat_reads.sql` | Tabla `chat_reads` + **GRANT** a anon/authenticated/service_role + RLS + NOTICE de verificación | NOTICE: `chat_reads -> tabla: EXISTE | RLS: HABILITADO | SELECT anon: SÍ | SELECT authenticated: SÍ | SELECT service_role: SÍ | políticas: 3 | columnas: user_id, peer_id, last_read_at` |
| 3.2 | `device_tokens.sql` | Tabla `device_tokens` (push FCM) + RLS "solo propios" | Diagnóstico: `TABLA device_tokens = EXISTE`, `RLS device_tokens = HABILITADO` |

> **Alternativa combinada:** `paso6-b01-b02.sql` ejecuta 3.1 + 3.2 + 2.7 + 1.4 en una sola pasada (fue creado para el bloque B-01/B-02). Si ya ejecutaste los scripts por separado, **no lo repitas**.

---

## Fase 4 · Realtime (sincronización entre dispositivos)

| Orden | Script | Qué hace | Verificación |
|---|---|---|---|
| 4.1 | `habits_habit_logs_realtime.sql` | Realtime de habits/habit_logs + `replica identity full` (filtro `user_id=eq.me` funciona en UPDATE/DELETE) | Diagnóstico: `REALTIME habits = PUBLICADO`, `REALTIME habit_logs = PUBLICADO` |
| 4.2 | `messages_realtime.sql` | Realtime de messages + `replica identity full` | `REALTIME messages = PUBLICADO` |
| 4.3 | `realtime_likes_comments.sql` | Realtime de likes/comments + `replica identity full` (incluye fila en DELETE) | `REALTIME likes = PUBLICADO`, `REALTIME comments = PUBLICADO` |

---

## Fase 5 · Storage (bucket awake-media)

| Orden | Script | Qué hace | Verificación |
|---|---|---|---|
| 5.1 | `awake_media.sql` | Crea bucket público `awake-media` + políticas: SELECT/INSERT/UPDATE solo sobre rutas propias (`chat/`, `logs/`, `avatars/`) | Diagnóstico: `STORAGE awake-media = EXISTE` + `POLÍTICAS storage.objects (awake_media*) = 3` |
| 5.2 | `awake_media_delete.sql` | Política DELETE de archivos propios | `POLÍTICAS storage.objects (awake_media*) = 4` |
| 5.3 | `awake_media_limits.sql` | Tope de 8 MB y tipos permitidos (imagen/audio) en el bucket | Diagnóstico: `STORAGE awake-media` con `límite=8388608` |

---

## Notas transversales

- **Todos los scripts son idempotentes** (patrón `if not exists` / `drop policy if exists` / recreación de políticas): ejecutarlos dos veces no rompe nada.
- **Los scripts de RLS sustituyen políticas sueltas**: si en el dashboard hay policies creadas a mano con otros nombres, el bloque `DO` las elimina antes de recrear las oficiales — evita SELECT públicos "OR-eados".
- **`messages` está congelado en el roadmap (3.2)**, pero su RLS y realtime deben estar aplicados igualmente: el chat ya está en producción web y sin RLS quedaría expuesto.
- **Prueba con/sin sesión** tras aplicar la Fase 2 (detalle en `docs/rls.md` §4):
  - Sin sesión: `select count(*) from public.follows;` → 0 filas o error de permiso (no debe devolver datos).
  - Con sesión: `select * from public.device_tokens where user_id = auth.uid();` → solo tus filas.
- Si algo falla a mitad de fase, **no pasa nada**: re-ejecuta el script completo (idempotente) o el combinado `paso6-b01-b02.sql`.

---

## Trazabilidad

- **Backlog:** B-01 (`chat_reads` GRANT/RLS) y B-02 (`device_tokens`, `follows`, `badges_unlocked`) → Fase 3 + Fase 2.7 + Fase 1.4.
- **Paso 5 del roadmap (S5):** los scripts `*_rls.sql` se referencian por su número de paso en sus cabeceras (p. ej. "Primer paso de S5" en `habits_rls.sql`).
- **Auditoría de RLS completa:** `docs/rls.md`.
