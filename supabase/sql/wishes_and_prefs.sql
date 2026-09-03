-- Deseos únicos + tema/fondo entre dispositivos de la misma cuenta.
-- Ejecutar en el SQL Editor de Supabase.
-- No borra hábitos, sellos, perfiles ni mensajes.

create or replace function public.awake_set_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  comment text,
  image_url text,
  score text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists wishes_user_id_idx on public.wishes (user_id);

alter table public.wishes enable row level security;
alter table public.wishes replica identity full;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'wishes'
  loop
    execute format('drop policy if exists %I on public.wishes', r.policyname);
  end loop;
end $$;

create policy "wishes_select_own"
  on public.wishes for select
  to authenticated
  using (user_id = auth.uid());

create policy "wishes_insert_own"
  on public.wishes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "wishes_update_own"
  on public.wishes for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "wishes_delete_own"
  on public.wishes for delete
  to authenticated
  using (user_id = auth.uid());

drop trigger if exists awake_wishes_set_user_id on public.wishes;
create trigger awake_wishes_set_user_id
  before insert on public.wishes
  for each row execute function public.awake_set_user_id();

grant select, insert, update, delete on public.wishes to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wishes'
  ) then
    execute 'alter publication supabase_realtime add table public.wishes';
  end if;
end $$;

alter table public.profiles add column if not exists theme_hue integer;
alter table public.profiles add column if not exists bg_choice integer;
