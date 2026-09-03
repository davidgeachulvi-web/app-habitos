-- RLS de comentarios.
-- Ejecutar en el SQL Editor de Supabase.
--
-- Quinto paso de S5. Comentar solo en sellos que ya puedes ver.
-- Borrar: el autor del comentario o el dueño del sello (igual que el ✕
-- de la app). SELECT solo de esos sellos visibles.

alter table public.comments enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'comments'
  loop
    execute format('drop policy if exists %I on public.comments', r.policyname);
  end loop;
end $$;

create policy "comments_select_visible_log"
  on public.comments for select
  to authenticated
  using (
    exists (
      select 1 from public.habit_logs h
      where h.id = comments.log_id
    )
  );

create policy "comments_insert_own"
  on public.comments for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.habit_logs h
      where h.id = comments.log_id
    )
  );

create policy "comments_delete_author_or_log_owner"
  on public.comments for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.habit_logs h
      where h.id = comments.log_id
        and h.user_id = auth.uid()
    )
  );
