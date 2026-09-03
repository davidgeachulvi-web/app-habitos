-- Tope de tamaño y tipos en el bucket awake-media.
-- Ejecutar en el SQL Editor de Supabase.
--
-- 8 MB. Solo imagen y audio. El cliente ya comprime fotos;
-- esto evita un POST directo a Storage con un archivo enorme.

update storage.buckets
set
  file_size_limit = 8388608,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/webm',
    'audio/mpeg',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/3gpp',
    'audio/wav'
  ]
where id = 'awake-media';
