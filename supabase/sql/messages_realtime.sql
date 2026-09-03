-- ============================================================================
-- AWAKE · messages_realtime — realtime de mensajes
-- ============================================================================
-- Fase 4.2 del runbook (docs/sql-runbook.md).
-- Publica messages en supabase_realtime con replica identity full para que
-- el filtro de suscripción del cliente funcione también en UPDATE/DELETE.
-- Idempotente: se puede re-ejecutar.
-- Verificación: 00-diagnostico.sql -> REALTIME messages = PUBLICADO.
-- ============================================================================

alter table public.messages replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end $$;
