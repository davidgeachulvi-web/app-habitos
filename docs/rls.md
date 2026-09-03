# Awake — Mapa de políticas RLS (Supabase)

**Versión:** 1.1 · septiembre 2026 (Paso 6, B-06)
**Propósito:** documentar el estado de Row Level Security por tabla, el 401 "guest" esperado y el procedimiento de verificación con/sin sesión (tarea 5.5 del `docs/ROADMAP.md`). Este documento es también el runbook de ejecución de B-01/B-02 (`docs/06-depuracion.md`).

> **Runbook completo y ordenado:** para ejecutar cualquier script con orden y títulos, usa **`docs/sql-runbook.md`** (fases 0–5). Antes de tocar nada, ejecuta `supabase/sql/00-diagnostico.sql` (solo lectura) y pega la salida para saber qué está aplicado.

---

## 1. El 401 guest esperado (no es un bug)

Al arrancar en modo anónimo, la app hace llamadas autenticadas que responden 401 / `permission denied` en consola. Es **comportamiento correcto**: sin sesión, RLS niega el acceso y el cliente degrada con gracia. El objetivo de la auditoría es que **ningún dato ajeno sea legible sin sesión ni por otros usuarios**. No debe "limpiarse" de consola; debe documentarse y verificarse que no hay fugas.

## 2. Estado por tabla

| Tabla / columna | Script (`supabase/sql/`) | Estado del script | RLS previsto | Pendiente |
|---|---|---|---|---|
| `chat_reads` | `chat_reads.sql` | ✅ **Aplicado y verificado** (sept 2026): tabla + RLS + 3 políticas + GRANT (5/5 en `true`) | SELECT propia o de par; INSERT/UPDATE propios | Verificación con/sin sesión (5.5) |
| `device_tokens` | `device_tokens.sql` | ✅ **Aplicado** (diagnóstico sept 2026) | ALL solo propios (`auth.uid() = user_id`) | Verificación con/sin sesión |
| `follows` | `follows_rls.sql` | ✅ **Aplicado** (diagnóstico sept 2026) | SELECT autenticado (público); INSERT/DELETE solo propios | Verificación con/sin sesión |
| `profiles.badges_unlocked` | `badges_unlocked.sql` | ✅ **Aplicado** (diagnóstico sept 2026) | Lectura pública autenticada; escritura propia | Verificación con/sin sesión |
| `profiles` | `profiles_rls.sql` | Pendiente de auditoría (5.5) | según script | Auditar con/sin sesión |
| `habits` / `habit_logs` | `habits_rls.sql` / `habit_logs_rls.sql` | Pendiente de auditoría (5.5) | propios; logs según privacidad | Auditar con/sin sesión |
| `likes` / `comments` | `likes_rls.sql` / `comments_rls.sql` | Pendiente de auditoría (5.5) | públicos autenticados; escritura propia | Auditar con/sin sesión |
| `messages` / `chat_reads` | `messages_rls.sql` / `chat_reads.sql` | Pendiente de auditoría (5.5); chat congelado (3.2) | solo participantes | Auditar con/sin sesión |
| `awake_media` | `awake_media*.sql` | Pendiente de auditoría (5.5) | propietario + lectores de la publicación | Auditar con/sin sesión |
| `wishes_and_prefs` | `wishes_and_prefs.sql` | Pendiente de auditoría (5.5) | propios | Auditar con/sin sesión |

## 3. Runbook de ejecución (B-01 / B-02)

> **Orden oficial y títulos de los 21 scripts:** `docs/sql-runbook.md`. Para B-01/B-02 basta con la **Fase 3** (o el combinado `paso6-b01-b02.sql`, que ejecuta 3.1 + 3.2 + 2.7 + 1.4 en una sola pasada).

**Estado tras el diagnóstico y la verificación (sept 2026):** **B-01 y B-02 cerrados.** Ejecutado `supabase/sql/01-pendientes-diagnostico.sql` (GRANT de chat_reads · columna `habits.nudge` · realtime de messages) y verificado con la consulta de 5 puntos: **5/5 en `true`**. Pendiente de la tarea 5.5: la auditoría con/sin sesión (§ 4) — no requiere ejecutar más scripts.

En el SQL Editor de Supabase (dashboard → SQL), ejecutar **en orden**:

1. `chat_reads.sql` — esperar NOTICE:
   `chat_reads -> tabla: EXISTE | RLS: HABILITADO | SELECT anon: SÍ | SELECT authenticated: SÍ | SELECT service_role: SÍ | políticas: 3 | columnas: user_id, peer_id, last_read_at`
2. `device_tokens.sql`
3. `follows_rls.sql`
4. `badges_unlocked.sql`

Todos son idempotentes: se pueden re-ejecutar sin perder datos.

## 4. Verificación con/sin sesión

- **Sin sesión (anon):** un SELECT a `follows`, `profiles`, `habits`, `habit_logs` debe devolver **vacío o 401** — nunca filas ajenas.
- **Con sesión (dos cuentas A y B):**
  - `chat_reads`: B solo ve filas donde es `user_id` o `peer_id`.
  - `follows`: SELECT público para autenticados; B no puede insertar/borrar follows de A.
  - `device_tokens`: cada cuenta solo ve/edita sus propios tokens.
  - `profiles.badges_unlocked`: lectura pública; escritura solo propia.
  - `habits`/`habit_logs`/`messages`/`awake_media`: sin fugas entre cuentas.

Ejemplos para el SQL Editor:

```sql
-- Sin sesión (anon): no debe devolver filas ajenas (esperado: 0 filas o error de permiso)
select count(*) from public.follows;

-- Con sesión: solo filas propias
select * from public.device_tokens where user_id = auth.uid();
select * from public.chat_reads where user_id = auth.uid() or peer_id = auth.uid();
```

## 5. Referencias

- B-01/B-02/B-06 en `docs/06-depuracion.md`; tarea 5.5 en `docs/ROADMAP.md`; modelo de datos y riesgos en `docs/04-arquitectura.md` § 4 y § 7.
- Runbook SQL completo: `docs/sql-runbook.md`. Diagnóstico: `supabase/sql/00-diagnostico.sql`.
