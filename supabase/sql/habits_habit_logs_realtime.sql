-- Realtime de hábitos y sellos entre dispositivos de la misma cuenta.
-- Sin esto, postgres_changes de habits / habit_logs no llega al cliente.
-- Replica identity full: el filtro user_id=eq.me funciona en UPDATE y DELETE.
-- Ejecutar en el SQL Editor de Supabase.

alter table public.habits replica identity full;
alter table public.habit_logs replica identity full;

do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'habits'
    ) then
        execute 'alter publication supabase_realtime add table public.habits';
    end if;
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'habit_logs'
    ) then
        execute 'alter publication supabase_realtime add table public.habit_logs';
    end if;
end $$;
