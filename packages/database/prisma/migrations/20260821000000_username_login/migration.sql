-- Username login support.
-- Usernames are stored in auth.users.raw_user_meta_data->>'username' and are
-- resolved to the account email client-side before signInWithPassword.
--
-- Prisma's shadow database has no auth schema, so function bodies are created
-- unvalidated and the trigger is only installed when auth.users exists.

set check_function_bodies = off;

-- Resolve a username to its auth email (case-insensitive).
create or replace function public.get_email_by_username(p_username text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select email
  from auth.users
  where lower(raw_user_meta_data->>'username') = lower(p_username)
  limit 1;
$$;

-- Sign-up pre-check for early feedback; the trigger below is authoritative.
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from auth.users
    where lower(raw_user_meta_data->>'username') = lower(p_username)
  );
$$;

-- Enforce username uniqueness across auth.users (metadata is not indexed).
create or replace function public.enforce_unique_username()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data->>'username' is null then
    return new;
  end if;

  if exists (
    select 1
    from auth.users
    where id <> new.id
      and lower(raw_user_meta_data->>'username')
        = lower(new.raw_user_meta_data->>'username')
  ) then
    raise exception 'Username already taken';
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('auth.users') is null then
    raise notice 'Skipping username trigger: auth.users not found (shadow database).';
    return;
  end if;

  drop trigger if exists enforce_unique_username on auth.users;
  create trigger enforce_unique_username
    before insert or update of raw_user_meta_data on auth.users
    for each row execute function public.enforce_unique_username();
end
$$;

revoke all on function public.get_email_by_username(text) from public;
revoke all on function public.is_username_available(text) from public;
grant execute on function public.get_email_by_username(text) to anon, authenticated;
grant execute on function public.is_username_available(text) to anon, authenticated;
