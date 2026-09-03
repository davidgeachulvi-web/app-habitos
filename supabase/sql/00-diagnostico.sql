-- ============================================================================
-- AWAKE · Diagnóstico del esquema en Supabase (solo lectura)
-- ============================================================================
-- Ejecutar TODO este archivo en el SQL Editor de Supabase (dashboard → SQL).
-- NO modifica nada: solo consulta. No hay riesgo al ejecutarlo.
--
-- Qué obtienes:
--   1) Una tabla con columnas: objeto | estado | detalle
--      (tablas, RLS, políticas, columnas esperadas, realtime, storage,
--      triggers, privilegios).
--   2) Al final, un NOTICE por tabla con el conteo de filas.
--
-- Cómo usarlo:
--   1. Ejecuta el archivo completo.
--   2. Copia el resultado (tabla completa + NOTICEs) y pégamelo.
--   3. Con eso sé exactamente qué está aplicado en tu base de datos y
--      qué falta ejecutar del runbook (docs/sql-runbook.md).
-- ============================================================================

with tablas as (
  select * from (values
    ('habits'), ('habit_logs'), ('profiles'), ('follows'),
    ('likes'), ('comments'), ('messages'), ('chat_reads'),
    ('device_tokens'), ('wishes')
  ) as t(name)
)
-- 1) Existencia de tablas
select 'TABLA ' || name as objeto,
  case when to_regclass('public.' || name) is null then 'NO EXISTE' else 'EXISTE' end as estado,
  '' as detalle
from tablas

union all
-- 2) RLS por tabla
select 'RLS ' || name,
  case
    when to_regclass('public.' || name) is null then 'TABLA NO EXISTE'
    when (select relrowsecurity from pg_class c where c.oid = to_regclass('public.' || name)) then 'HABILITADO'
    else 'DESHABILITADO'
  end,
  ''
from tablas

union all
-- 3) Políticas por tabla (nombre + conteo)
select 'POLÍTICAS ' || name,
  case when to_regclass('public.' || name) is null then 'TABLA NO EXISTE'
       else (select count(*)::text from pg_policies p
             where p.schemaname = 'public' and p.tablename = tablas.name) end,
  coalesce((select string_agg(p.policyname, ', ' order by p.policyname)
            from pg_policies p
            where p.schemaname = 'public' and p.tablename = tablas.name), '')
from tablas

union all
-- 4) Columnas esperadas en profiles
select 'COL profiles.' || c.column_name,
  case
    when to_regclass('public.profiles') is null then 'TABLA NO EXISTE'
    when exists (select 1 from information_schema.columns cc
                 where cc.table_schema = 'public' and cc.table_name = 'profiles'
                   and cc.column_name = c.column_name) then 'EXISTE'
    else 'FALTA'
  end,
  ''
from (values ('account_privacy'), ('badges_unlocked'), ('theme_hue'),
             ('bg_choice'), ('week_start'), ('ritual_prefs')) as c(column_name)

union all
-- 5) Columnas esperadas en habits
select 'COL habits.' || c.column_name,
  case
    when to_regclass('public.habits') is null then 'TABLA NO EXISTE'
    when exists (select 1 from information_schema.columns cc
                 where cc.table_schema = 'public' and cc.table_name = 'habits'
                   and cc.column_name = c.column_name) then 'EXISTE'
    else 'FALTA'
  end,
  ''
from (values ('archived'), ('times_per_week'), ('glyph'), ('nudge')) as c(column_name)

union all
-- 6) Columna esperada en wishes
select 'COL wishes.due_date',
  case
    when to_regclass('public.wishes') is null then 'TABLA NO EXISTE'
    when exists (select 1 from information_schema.columns cc
                 where cc.table_schema = 'public' and cc.table_name = 'wishes'
                   and cc.column_name = 'due_date') then 'EXISTE'
    else 'FALTA'
  end,
  ''

union all
-- 7) Tablas en la publicación realtime
select 'REALTIME ' || name,
  case when exists (select 1 from pg_publication_tables p
                    where p.pubname = 'supabase_realtime'
                      and p.schemaname = 'public'
                      and p.tablename = tablas.name) then 'PUBLICADO'
       else 'NO' end,
  ''
from tablas
where name in ('habits', 'habit_logs', 'likes', 'comments', 'messages', 'wishes')

union all
-- 8) Bucket de storage awake-media
select 'STORAGE awake-media',
  case when exists (select 1 from storage.buckets b where b.id = 'awake-media') then 'EXISTE' else 'FALTA' end,
  coalesce((select 'límite=' || b.file_size_limit || ' bytes · mimes=' || array_length(b.allowed_mime_types, 1)
            from storage.buckets b where b.id = 'awake-media'), '')

union all
-- 9) Políticas de storage para awake-media
select 'POLÍTICAS storage.objects (awake_media*)',
  (select count(*)::text from pg_policies p
   where p.schemaname = 'storage' and p.tablename = 'objects'
     and p.policyname like 'awake_media%'),
  coalesce((select string_agg(p.policyname, ', ' order by p.policyname)
            from pg_policies p
            where p.schemaname = 'storage' and p.tablename = 'objects'
              and p.policyname like 'awake_media%'), '')

union all
-- 10) Triggers de autoría
select 'TRIGGER ' || t.tgname,
  case
    when to_regclass(t.tbl) is null then 'TABLA NO EXISTE'
    when exists (select 1 from pg_trigger tg
                 where tg.tgrelid = to_regclass(t.tbl) and tg.tgname = t.tgname) then 'EXISTE'
    else 'FALTA'
  end,
  ''
from (values
  ('public.habits', 'awake_habits_set_user_id'),
  ('public.habit_logs', 'awake_habit_logs_set_user_id'),
  ('public.likes', 'awake_likes_set_user_id'),
  ('public.comments', 'awake_comments_set_user_id'),
  ('public.messages', 'awake_messages_set_sender_id'),
  ('public.follows', 'awake_follows_set_follower_id'),
  ('public.wishes', 'awake_wishes_set_user_id')
) as t(tbl, tgname)

union all
-- 11) Privilegios SELECT sobre chat_reads por rol
select 'GRANT chat_reads.SELECT.' || r.rol,
  case
    when to_regclass('public.chat_reads') is null then 'TABLA NO EXISTE'
    when has_table_privilege(r.rol, 'public.chat_reads', 'SELECT') then 'SÍ'
    else 'NO'
  end,
  ''
from (values ('anon'), ('authenticated'), ('service_role')) as r(rol)

order by objeto;

-- ============================================================================
-- 12) Conteo de filas por tabla (NOTICE en la pestaña de resultados)
-- ============================================================================
do $$
declare
  t text;
  n bigint;
begin
  raise notice '--- Conteo de filas (AWAKE diagnóstico) ---';
  foreach t in array array[
    'habits', 'habit_logs', 'profiles', 'follows', 'likes',
    'comments', 'messages', 'chat_reads', 'device_tokens', 'wishes'
  ] loop
    if to_regclass('public.' || t) is null then
      raise notice 'FILAS %: TABLA NO EXISTE', t;
    else
      execute format('select count(*) from public.%I', t) into n;
      raise notice 'FILAS %: %', t, n;
    end if;
  end loop;
  raise notice '--- Fin del diagnóstico. Copia la tabla + estos NOTICEs y pégamelos. ---';
end $$;
