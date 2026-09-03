-- Bucket público para fotos/audio de chat y sellos.
-- Ejecutar en el SQL Editor de Supabase.
--
-- El bucket sigue siendo public=true: las URLs de getPublicUrl() (chat, sellos,
-- feed) siguen cargando en <img> sin login. Lo que se cierra es el listado
-- del índice: nadie con la anon key puede enumerar todos los archivos.

insert into storage.buckets (id, name, public)
values ('awake-media', 'awake-media', true)
on conflict (id) do nothing;

drop policy if exists "awake_media_public_read" on storage.objects;
drop policy if exists "awake_media_select_own" on storage.objects;
create policy "awake_media_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'awake-media'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "awake_media_auth_insert" on storage.objects;
create policy "awake_media_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'awake-media'
    and (storage.foldername(name))[1] in ('chat', 'logs', 'avatars')
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "awake_media_auth_update" on storage.objects;
create policy "awake_media_auth_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'awake-media'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
