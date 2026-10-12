-- Run the entire script in Supabase SQL Editor as the project owner.
-- No remote migration has been executed by Codex.
begin;

-- Never guess about an existing table/trigger that public credentials cannot inspect.
do $$
begin
  if to_regclass('public.profiles') is not null
     and obj_description(to_regclass('public.profiles'), 'pg_class') is distinct from '1st ROOT auth profiles v1' then
    raise exception 'Existing profiles table requires inspection. Run supabase/inspect-auth-schema.sql and reconcile its schema before this migration; nothing has been changed.';
  end if;
  if exists (
    select 1 from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal
    and tgname not in ('firstroot_auth_user_insert', 'firstroot_auth_user_email')
  ) then
    raise exception 'Existing auth.users triggers require inspection. Run supabase/inspect-auth-schema.sql before proceeding; nothing has been changed.';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles'
    and policyname not in ('firstroot_read_own', 'firstroot_update_own', 'firstroot_admin_read')) then
    raise exception 'Unfamiliar profiles policies require inspection; nothing has been changed.';
  end if;
  if exists (select 1 from pg_trigger where tgrelid = to_regclass('public.profiles')
    and not tgisinternal and tgname <> 'firstroot_profile_update') then
    raise exception 'Unfamiliar profiles triggers require inspection; nothing has been changed.';
  end if;
end $$;

create schema if not exists firstroot_private;
revoke all on schema firstroot_private from public, anon, authenticated;
grant usage on schema firstroot_private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  mobile text not null default '',
  role text not null default 'CUSTOMER' check (role in ('ADMIN', 'CUSTOMER')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is '1st ROOT auth profiles v1';
alter table public.profiles enable row level security;

-- Remove broad table grants, then allow only personal-field edits by authenticated users.
revoke all on public.profiles from public, anon, authenticated;
revoke all (id, full_name, email, mobile, role, created_at, updated_at)
  on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, mobile) on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- Non-recursive RLS helper: fixed search_path, no arguments, only answers for auth.uid().
create or replace function firstroot_private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'ADMIN');
$$;
revoke all on function firstroot_private.is_admin() from public, anon, authenticated;
grant execute on function firstroot_private.is_admin() to authenticated;

-- Defense in depth if someone later adds an overly broad UPDATE grant.
create or replace function firstroot_private.guard_profile_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') and (
    new.id is distinct from old.id or new.role is distinct from old.role
    or new.email is distinct from old.email or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Privileged profile fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke all on function firstroot_private.guard_profile_update() from public, anon, authenticated;

-- Auth metadata is used for personal fields only. Every public sign-up is CUSTOMER.
create or replace function firstroot_private.create_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, mobile, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'mobile', ''), 'CUSTOMER');
  return new;
end $$;
revoke all on function firstroot_private.create_profile() from public, anon, authenticated;

-- Email is an Auth-owned identity field, not a client-editable profiles field.
create or replace function firstroot_private.sync_profile_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end $$;
revoke all on function firstroot_private.sync_profile_email() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname = 'firstroot_profile_update') then
    create trigger firstroot_profile_update before update on public.profiles
      for each row execute function firstroot_private.guard_profile_update();
  end if;
  if not exists (select 1 from pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'firstroot_auth_user_insert') then
    create trigger firstroot_auth_user_insert after insert on auth.users
      for each row execute function firstroot_private.create_profile();
  end if;
  if not exists (select 1 from pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'firstroot_auth_user_email') then
    create trigger firstroot_auth_user_email after update of email on auth.users
      for each row execute function firstroot_private.sync_profile_email();
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'firstroot_read_own') then
    create policy firstroot_read_own on public.profiles for select to authenticated
      using (id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'firstroot_update_own') then
    create policy firstroot_update_own on public.profiles for update to authenticated
      using (id = (select auth.uid())) with check (id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'firstroot_admin_read') then
    create policy firstroot_admin_read on public.profiles for select to authenticated
      using ((select firstroot_private.is_admin()) and role = 'CUSTOMER');
  end if;
end $$;

-- Backfill earlier registrations without changing existing profiles or promoting metadata roles.
insert into public.profiles (id, full_name, email, mobile, role)
select id, coalesce(raw_user_meta_data ->> 'full_name', ''), coalesce(email, ''),
  coalesce(raw_user_meta_data ->> 'mobile', ''), 'CUSTOMER' from auth.users
on conflict (id) do nothing;

notify pgrst, 'reload schema';
commit;

-- OPTIONAL OWNER-EXECUTED BOOTSTRAP, DEVELOPMENT/TESTING ONLY:
-- Register normally, find the exact user's UUID in Authentication > Users,
-- then uncomment this block and replace the UUID. No public RPC grants ADMIN.
-- do $$
-- begin
--   update public.profiles set role = 'ADMIN'
--   where id = 'REPLACE-WITH-EXACT-AUTH-USER-UUID'::uuid;
--   if not found then raise exception 'Profile not found; no admin granted'; end if;
-- end $$;
