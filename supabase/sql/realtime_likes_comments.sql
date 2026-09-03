-- Replica identity para que el realtime de likes/comentarios
-- incluya la fila en DELETE (quitar me gusta / borrar comentario).
-- Ejecutar en el SQL Editor de Supabase.

alter table public.likes replica identity full;
alter table public.comments replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'likes'
  ) then
    execute 'alter publication supabase_realtime add table public.likes';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'comments'
  ) then
    execute 'alter publication supabase_realtime add table public.comments';
  end if;
end $$;
