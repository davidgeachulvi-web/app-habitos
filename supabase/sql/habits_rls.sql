-- RLS de hábitos: solo el dueño lee y escribe su rutina.
-- Ejecutar en el SQL Editor de Supabase.
--
-- Primer paso de S5. No toca habit_logs, profiles, follows, likes,
-- comments ni messages. Si ya había policies sueltas en el dashboard,
-- este script las sustituye para no dejar un SELECT público OR-eado.

alter table public.habits enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'habits'
  loop
    execute format('drop policy if exists %I on public.habits', r.policyname);
  end loop;
end $$;

create policy "habits_select_own"
  on public.habits for select
  to authenticated
  using (user_id = auth.uid());

create policy "habits_insert_own"
  on public.habits for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "habits_update_own"
  on public.habits for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "habits_delete_own"
  on public.habits for delete
  to authenticated
  using (user_id = auth.uid());
