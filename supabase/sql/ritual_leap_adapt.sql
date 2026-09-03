-- ============================================================================
-- AWAKE · ritual_leap_adapt — campos extra del ritual
-- ============================================================================
-- Fase 1.1 del runbook (docs/sql-runbook.md).
-- Columnas del ritual AWAKE: omitir/archivo/frecuencia/glifo/aviso (habits),
-- semana preferida y prefs de ritual (profiles), deseos con fecha (wishes).
-- Idempotente: no borra datos; si una columna ya existe, se ignora.
-- Verificación: 00-diagnostico.sql -> COL habits.archived = EXISTE,
-- COL profiles.week_start = EXISTE, COL wishes.due_date = EXISTE.
-- ============================================================================

alter table public.habits add column if not exists archived boolean not null default false;
alter table public.habits add column if not exists times_per_week integer;
alter table public.habits add column if not exists glyph text;
alter table public.habits add column if not exists nudge text;

alter table public.profiles add column if not exists week_start smallint;
alter table public.profiles add column if not exists ritual_prefs jsonb;

alter table public.wishes add column if not exists due_date date;
