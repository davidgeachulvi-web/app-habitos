-- Avatares en Storage + triggers de autoría.
-- Ejecutar en el SQL Editor de Supabase.

drop policy if exists "awake_media_auth_insert" on storage.objects;
create policy "awake_media_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'awake-media'
    and (storage.foldername(name))[1] in ('chat', 'logs', 'avatars')
    and (storage.foldername(name))[2] = auth.uid()::text
  );

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

create or replace function public.awake_set_sender_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.sender_id := auth.uid();
  return new;
end;
$$;

create or replace function public.awake_set_follower_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.follower_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists awake_habits_set_user_id on public.habits;
create trigger awake_habits_set_user_id
  before insert on public.habits
  for each row execute function public.awake_set_user_id();

drop trigger if exists awake_habit_logs_set_user_id on public.habit_logs;
create trigger awake_habit_logs_set_user_id
  before insert on public.habit_logs
  for each row execute function public.awake_set_user_id();

drop trigger if exists awake_likes_set_user_id on public.likes;
create trigger awake_likes_set_user_id
  before insert on public.likes
  for each row execute function public.awake_set_user_id();

drop trigger if exists awake_comments_set_user_id on public.comments;
create trigger awake_comments_set_user_id
  before insert on public.comments
  for each row execute function public.awake_set_user_id();

drop trigger if exists awake_messages_set_sender_id on public.messages;
create trigger awake_messages_set_sender_id
  before insert on public.messages
  for each row execute function public.awake_set_sender_id();

drop trigger if exists awake_follows_set_follower_id on public.follows;
create trigger awake_follows_set_follower_id
  before insert on public.follows
  for each row execute function public.awake_set_follower_id();
