-- RLS de likes.
-- Ejecutar en el SQL Editor de Supabase.
--
-- Cuarto paso de S5. Solo tú das o quitas tu like.
-- Ver likes solo de sellos que ya puedes leer (habit_logs RLS):
-- así no se enumeran likes de un sello privado.

alter table public.likes enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'likes'
  loop
    execute format('drop policy if exists %I on public.likes', r.policyname);
  end loop;
end $$;

create policy "likes_select_visible_log"
  on public.likes for select
  to authenticated
  using (
    exists (
      select 1 from public.habit_logs h
      where h.id = likes.log_id
    )
  );

create policy "likes_insert_own"
  on public.likes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.habit_logs h
      where h.id = likes.log_id
    )
  );

create policy "likes_delete_own"
  on public.likes for delete
  to authenticated
  using (user_id = auth.uid());
