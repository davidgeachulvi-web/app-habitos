-- Lecturas de chat para el indicador discreto "Visto" y el badge de mensajes no leídos.
-- Ejecutar en el SQL Editor de Supabase. Es idempotente: se puede volver a ejecutar
-- sin perder datos (no borra la tabla ni las filas existentes).
--
-- Incluye:
--   1) Creación de la tabla si no existe.
--   2) GRANT de privilegios a anon/authenticated/service_role. Este paso faltaba:
--      sin los GRANT, los upserts del cliente fallaban con "permission denied"
--      (42501) y las lecturas nunca se persistían en el servidor, por lo que los
--      mismos mensajes reaparecían como no leídos en cada sesión/dispositivo.
--   3) RLS + políticas (se recrean de forma idempotente).
--   4) Bloque de verificación que informa del estado: tabla, RLS, privilegios,
--      políticas y columnas.

create table if not exists public.chat_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  peer_id uuid not null,
  last_read_at timestamptz not null default now(),
  primary key (user_id, peer_id)
);

-- Privilegios: el cliente usa el rol authenticated; anon y service_role se incluyen
-- por convención del proyecto (el RLS restringe igualmente el acceso).
grant select, insert, update, delete on public.chat_reads to anon, authenticated, service_role;

alter table public.chat_reads enable row level security;

-- Recrea las políticas de forma idempotente (elimina cualquier política existente
-- antes de volver a crearlas, igual que hace messages_rls.sql).
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'chat_reads'
  loop
    execute format('drop policy if exists %I on public.chat_reads', r.policyname);
  end loop;
end $$;

create policy "chat_reads_select_own_or_peer"
  on public.chat_reads for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = peer_id);

create policy "chat_reads_upsert_own"
  on public.chat_reads for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "chat_reads_update_own"
  on public.chat_reads for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Verificación: tras ejecutar, revisa los mensajes NOTICE en la pestaña de resultados.
-- El resultado correcto es: RLS: HABILITADO | SELECT anon: SÍ | SELECT authenticated: SÍ
-- | SELECT service_role: SÍ | políticas: 3 | columnas: user_id, peer_id, last_read_at
do $$
declare
  v_rls text;
  v_anon text;
  v_auth text;
  v_svc text;
  v_cols text;
  v_pols int;
begin
  select case when relrowsecurity then 'HABILITADO' else 'DESHABILITADO' end
    into v_rls from pg_class where oid = 'public.chat_reads'::regclass;
  select case when has_table_privilege('anon', 'public.chat_reads', 'SELECT') then 'SÍ' else 'NO' end
    into v_anon;
  select case when has_table_privilege('authenticated', 'public.chat_reads', 'SELECT') then 'SÍ' else 'NO' end
    into v_auth;
  select case when has_table_privilege('service_role', 'public.chat_reads', 'SELECT') then 'SÍ' else 'NO' end
    into v_svc;
  select string_agg(column_name, ', ' order by ordinal_position)
    into v_cols
    from information_schema.columns
    where table_schema = 'public' and table_name = 'chat_reads';
  select count(*) into v_pols
    from pg_policies
    where schemaname = 'public' and tablename = 'chat_reads';

  raise notice 'chat_reads -> tabla: EXISTE | RLS: % | SELECT anon: % | SELECT authenticated: % | SELECT service_role: % | políticas: % | columnas: %',
    v_rls, v_anon, v_auth, v_svc, v_pols, coalesce(v_cols, '(ninguna)');
end $$;
