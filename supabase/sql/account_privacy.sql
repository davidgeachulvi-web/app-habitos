-- Privacidad de cuenta en el servidor.
-- Ejecutar en el SQL Editor de Supabase.
--
-- Hasta ahora el interruptor Público/Privado solo vivía en el móvil.
-- Esta columna es lo que leen los demás al visitar el perfil.
-- Las filas existentes quedan en 'publico' (mismo comportamiento de siempre).

alter table public.profiles
  add column if not exists account_privacy text not null default 'publico';

update public.profiles
  set account_privacy = 'publico'
  where account_privacy is null
     or account_privacy not in ('publico', 'privado');

alter table public.profiles
  drop constraint if exists profiles_account_privacy_check;

alter table public.profiles
  add constraint profiles_account_privacy_check
  check (account_privacy in ('publico', 'privado'));
