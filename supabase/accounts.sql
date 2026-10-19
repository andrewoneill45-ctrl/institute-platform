-- Accounts grow up: a profile belongs to a PERSON, carries their account
-- type, and administrators choose who gets what. Run once in the Supabase
-- SQL editor (safe to re-run).
--
-- Account types:
--   school  - bound to one school by URN (the default)
--   system  - whole-system, bird's-eye view (Kevan, Tim Coulson)
--   trust   - a multi-academy trust (org_name holds the trust's DfE name)
--   la      - a local authority (org_name holds the LA name)
--   diocese - a diocese (org_name holds it)
--   aepa    - AEPA and similar sector bodies

alter table public.profiles
  add column if not exists full_name    text,
  add column if not exists role_title   text,
  add column if not exists account_type text not null default 'school',
  add column if not exists org_name     text,
  add column if not exists is_admin     boolean not null default false;

alter table public.profiles drop constraint if exists profiles_account_type_check;
alter table public.profiles add constraint profiles_account_type_check
  check (account_type in ('school','system','trust','la','diocese','aepa'));

alter table public.profiles enable row level security;

-- am I an administrator? (security definer so RLS on profiles can use it)
create or replace function public.profile_is_admin()
returns boolean language sql security definer stable set search_path = public as
$$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (id = auth.uid() or public.profile_is_admin());

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- people may edit their NAME and ROLE; only the admin functions below may
-- touch account_type, org_name, urn, school_name or is_admin
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant insert on public.profiles to authenticated;
grant update (full_name, role_title) on public.profiles to authenticated;

-- the admin's eyes: every account, with or without a profile row yet
create or replace function public.admin_list_accounts()
returns table (id uuid, email text, full_name text, role_title text, account_type text, org_name text, urn integer, school_name text, is_admin boolean, created_at timestamptz)
language sql security definer stable set search_path = public as $$
  select u.id, u.email::text, p.full_name, p.role_title,
         coalesce(p.account_type, 'school'), p.org_name, p.urn, p.school_name,
         coalesce(p.is_admin, false), u.created_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  where public.profile_is_admin()
  order by u.created_at desc
$$;

-- the admin's hand: set anyone's type, org, school and names (upserts)
create or replace function public.admin_update_profile(
  target uuid, p_account_type text, p_org_name text, p_urn integer,
  p_school_name text, p_full_name text, p_role_title text, p_is_admin boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.profile_is_admin() then
    raise exception 'Only an administrator may change accounts.';
  end if;
  insert into public.profiles (id, account_type, org_name, urn, school_name, full_name, role_title, is_admin)
  values (target, coalesce(p_account_type, 'school'), p_org_name, p_urn, p_school_name, p_full_name, p_role_title, coalesce(p_is_admin, false))
  on conflict (id) do update set
    account_type = coalesce(p_account_type, profiles.account_type),
    org_name     = p_org_name,
    urn          = p_urn,
    school_name  = p_school_name,
    full_name    = coalesce(p_full_name, profiles.full_name),
    role_title   = coalesce(p_role_title, profiles.role_title),
    is_admin     = coalesce(p_is_admin, profiles.is_admin);
end $$;

grant execute on function public.profile_is_admin() to authenticated;
grant execute on function public.admin_list_accounts() to authenticated;
grant execute on function public.admin_update_profile(uuid, text, text, integer, text, text, text, boolean) to authenticated;

-- Andrew is the first administrator
insert into public.profiles (id, full_name, role_title, account_type, is_admin)
select id, 'Andrew O''Neill', 'Executive Headteacher', 'school', true
from auth.users where lower(trim(email)) = 'a.oneill@allsaintscc.org.uk'
on conflict (id) do update set is_admin = true,
  full_name = coalesce(public.profiles.full_name, excluded.full_name),
  role_title = coalesce(public.profiles.role_title, excluded.role_title);
