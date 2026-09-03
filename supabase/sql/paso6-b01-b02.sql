-- ============================================================================
-- AWAKE · Paso 6 — B-01/B-02: RLS y tablas sociales (script combinado)
-- ============================================================================
-- Ejecutar TODO este archivo en el SQL Editor de Supabase (dashboard → SQL).
-- Es idempotente: se puede re-ejecutar sin perder datos.
--
-- Contenido (en orden):
--   1) chat_reads.sql     — GRANT + RLS + NOTICE de verificación (B-01)
--   2) device_tokens.sql  — tabla + RLS "solo propios" (B-02)
--   3) follows_rls.sql    — RLS "select autenticado; insert/delete propios" (B-02)
--   4) badges_unlocked.sql — columna jsonb en profiles (B-02)
--
-- Verificación esperada al final de la parte 1 (NOTICE):
--   chat_reads -> tabla: EXISTE | RLS: HABILITADO | SELECT anon: SÍ |
--   SELECT authenticated: SÍ | SELECT service_role: SÍ | políticas: 3 |
--   columnas: user_id, peer_id, last_read_at
-- Tras ejecutar, verificar con/sin sesión: docs/rls.md §4.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) chat_reads (B-01)
-- ----------------------------------------------------------------------------
create table if not exists public.chat_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  peer_id uuid not null,
  last_read_at timestamptz not null default now(),
  primary key (user_id, peer_id)
);

grant select, insert, update, delete on public.chat_reads to anon, authenticated, service_role;

alter table public.chat_reads enable row level security;

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

-- ----------------------------------------------------------------------------
-- 2) device_tokens (B-02)
-- ----------------------------------------------------------------------------
create table if not exists public.device_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null default 'android',
  updated_at timestamptz not null default now()
);

create index if not exists device_tokens_user_id_idx on public.device_tokens (user_id);

alter table public.device_tokens enable row level security;

drop policy if exists "Users manage own device tokens" on public.device_tokens;
create policy "Users manage own device tokens"
  on public.device_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3) follows RLS (B-02)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 4) badges_unlocked: columna jsonb en profiles (B-02)
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists badges_unlocked jsonb;

comment on column public.profiles.badges_unlocked is
  'Mapa { badge_id: unlocked_at_ms }. Solo lectura pública autenticada; escritura propia.';

-- ============================================================================
-- FIN. Verificar tras ejecutar (docs/rls.md §4):
--   sin sesión: select count(*) from public.follows;  -> 0 filas o error de permiso
--   con sesión: select * from public.device_tokens where user_id = auth.uid();
-- ============================================================================
