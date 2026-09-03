-- RLS de follows (seguir / dejar de seguir).
-- Ejecutar en el SQL Editor de Supabase.
--
-- Tercer paso de S5. La lista de quién sigue a quién es pública en la app
-- (contadores y modal de seguidores), así que SELECT queda para cualquiera
-- autenticado. Insertar o borrar solo si tú eres el follower: nadie puede
-- hacer que otra cuenta te siga o deje de seguirte.
--
-- No hay UPDATE en el cliente; no se crea policy de update.

alter table public.follows enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'follows'
  loop
    execute format('drop policy if exists %I on public.follows', r.policyname);
  end loop;
end $$;

create policy "follows_select_authenticated"
  on public.follows for select
  to authenticated
  using (true);

create policy "follows_insert_own"
  on public.follows for insert
  to authenticated
  with check (follower_id = auth.uid());

create policy "follows_delete_own"
  on public.follows for delete
  to authenticated
  using (follower_id = auth.uid());
