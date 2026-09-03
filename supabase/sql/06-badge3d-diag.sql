-- ============================================================
-- B-37 · Diagnóstico automático del visor 3D (informes iOS)
-- El cliente inserta un informe TÉCNICO sin PII cuando el visor
-- 3D falla (o en cada arranque si se abre con ?debug3d=1).
-- Solo INSERT permitido a anon; la lectura queda para el
-- desarrollador con la service key desde el dashboard.
-- ============================================================

create table if not exists public.badge3d_diags (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    user_agent text,
    payload jsonb not null default '{}'::jsonb
);

alter table public.badge3d_diags enable row level security;

drop policy if exists "badge3d_diags_insert_anon" on public.badge3d_diags;
create policy "badge3d_diags_insert_anon"
    on public.badge3d_diags
    for insert
    to anon, authenticated
    with check (true);

-- Verificación tras ejecutar (debe devolver 1 fila con true):
-- select count(*) from pg_policies where tablename = 'badge3d_diags' and cmd = 'INSERT';

-- GRANT explícito (necesario: los roles anon/authenticated no reciben el
-- INSERT por defecto en este proyecto — mismo caso histórico que B-01).
grant insert on public.badge3d_diags to anon, authenticated;
