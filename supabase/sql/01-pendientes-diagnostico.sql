-- ============================================================================
-- AWAKE · Pendientes del diagnóstico (sept 2026)
-- ============================================================================
-- Ejecutar TODO este archivo en el SQL Editor de Supabase (dashboard → SQL).
-- Idempotente: se puede re-ejecutar sin perder datos.
--
-- Tras 00-diagnostico.sql, la base ya tenía casi todo aplicado. Faltaban 3 piezas:
--   1) GRANT de chat_reads (B-01): la tabla, RLS y políticas YA estaban; sin el
--      GRANT los upserts del cliente fallan con 42501 (permission denied).
--   2) Columna habits.nudge (ritual, Fase 1.1): el resto del ritual ya estaba.
--   3) Realtime de messages (Fase 4.2): el cliente se suscribe a postgres_changes
--      de messages (js/social/chat.js); sin la publicación no llegan en vivo.
--
-- Verificación tras ejecutar: re-ejecutar 00-diagnostico.sql y comprobar:
--   GRANT chat_reads.SELECT.anon / authenticated / service_role = SÍ
--   COL habits.nudge = EXISTE
--   REALTIME messages = PUBLICADO
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) chat_reads — GRANT (B-01)
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on public.chat_reads to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2) habits.nudge — columna del ritual (Fase 1.1)
-- ----------------------------------------------------------------------------
alter table public.habits add column if not exists nudge text;

-- ----------------------------------------------------------------------------
-- 3) messages — realtime (Fase 4.2)
-- ----------------------------------------------------------------------------
alter table public.messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end $$;

-- ============================================================================
-- FIN. Re-ejecuta 00-diagnostico.sql para confirmar los 3 puntos en verde.
-- ============================================================================
