-- Borrar archivos propios del bucket (fotos viejas de avatar/sello).
-- Ejecutar en el SQL Editor de Supabase.

drop policy if exists "awake_media_delete_own" on storage.objects;
create policy "awake_media_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'awake-media'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
