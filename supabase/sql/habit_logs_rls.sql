-- RLS de sellos (habit_logs).
-- Ejecutar en el SQL Editor de Supabase.
--
-- Segundo paso de S5. Escritura solo del dueño.
-- Lectura: tus sellos siempre; los de otro solo si su cuenta no es privada
-- (o le sigues) y el sello no está marcado privado.
--
-- Este SELECT mira profiles y follows. Cuando cerremos profiles con RLS,
-- hay que dejar leer id y account_privacy; si no, el feed se vacía.

alter table public.habit_logs enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'habit_logs'
  loop
    execute format('drop policy if exists %I on public.habit_logs', r.policyname);
  end loop;
end $$;

create policy "habit_logs_select_visible"
  on public.habit_logs for select
  to authenticated
  using (
    user_id = auth.uid()
    or (
      coalesce(privacy, 'seguidores') not in ('privado', 'private')
      and exists (
        select 1 from public.profiles p
        where p.id = habit_logs.user_id
          and (
            coalesce(p.account_privacy, 'publico') <> 'privado'
            or exists (
              select 1 from public.follows f
              where f.follower_id = auth.uid()
                and f.following_id = habit_logs.user_id
            )
          )
      )
    )
  );

create policy "habit_logs_insert_own"
  on public.habit_logs for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "habit_logs_update_own"
  on public.habit_logs for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "habit_logs_delete_own"
  on public.habit_logs for delete
  to authenticated
  using (user_id = auth.uid());
