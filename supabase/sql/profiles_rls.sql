-- RLS de perfiles.
-- Ejecutar en el SQL Editor de Supabase.
--
-- Último paso de S5 (tablas núcleo).
-- SELECT autenticado de todos los perfiles: explorar, chat, comentarios
-- (embed username) y habit_logs (mira account_privacy). Si se restringe
-- a "solo el mío", el feed y los perfiles ajenos se vacían.
-- Escribir (insert/update/upsert) solo la fila cuyo id es auth.uid().
-- No hay DELETE en el cliente; no se crea policy de delete.

alter table public.profiles enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', r.policyname);
  end loop;
end $$;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
