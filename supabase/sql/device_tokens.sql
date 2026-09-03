-- ============================================================================
-- AWAKE · device_tokens — tokens de push FCM por dispositivo
-- ============================================================================
-- Fase 3.2 del runbook (docs/sql-runbook.md) · B-02.
-- Tabla de tokens de notificación + RLS "solo propios" (cada usuario
-- gestiona únicamente sus dispositivos). Idempotente: se puede re-ejecutar.
-- Verificación: 00-diagnostico.sql -> TABLA device_tokens = EXISTE,
-- RLS device_tokens = HABILITADO.
-- ============================================================================

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
