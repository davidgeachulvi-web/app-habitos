-- RLS de mensajes.
-- Ejecutar en el SQL Editor de Supabase.
--
-- Sexto paso de S5. Solo ves hilos donde eres remitente o destinatario.
-- Enviar solo como tú (sender_id = auth.uid()). El destinatario lo elige
-- la app (mensaje a cualquiera, como ahora).
-- No hay UPDATE ni DELETE en el cliente; no se crean esas policies.

alter table public.messages enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'messages'
  loop
    execute format('drop policy if exists %I on public.messages', r.policyname);
  end loop;
end $$;

create policy "messages_select_participant"
  on public.messages for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "messages_insert_as_sender"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid());
