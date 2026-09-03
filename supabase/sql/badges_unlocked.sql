-- Insignias encendidas en el perfil (mapa badge_id -> unlocked_at ms).
-- Ejecutar en el SQL Editor de Supabase.
-- SELECT de profiles ya es autenticado→todos; UPDATE solo la fila propia.

alter table public.profiles
  add column if not exists badges_unlocked jsonb;

comment on column public.profiles.badges_unlocked is
  'Mapa { badge_id: unlocked_at_ms }. Solo lectura pública autenticada; escritura propia.';
