-- Accounts, the control panel: which rooms each member may open, and the
-- functions the Accounts room and its Netlify function use. Run once in the
-- Supabase SQL editor (safe to re-run).
--
-- tools: a map of room -> false for rooms switched OFF for this member.
--   {} means every room; {"lens": false} hides Lens. Keys: atlas, prizm,
--   lens, orbit, constellation. Horizon stays on its own switch
--   (horizon_access), because it is by invitation rather than by default.

alter table public.profiles
  add column if not exists tools jsonb not null default '{}'::jsonb;

drop function if exists public.admin_list_accounts();
create function public.admin_list_accounts()
returns table (id uuid, email text, full_name text, role_title text, account_type text, org_name text, urn integer, school_name text, is_admin boolean, system_access boolean, horizon_access boolean, tools jsonb, created_at timestamptz, last_sign_in_at timestamptz)
language sql security definer stable set search_path = public as $$
  select u.id, u.email::text, p.full_name, p.role_title,
         coalesce(p.account_type, 'school'), p.org_name, p.urn, p.school_name,
         coalesce(p.is_admin, false), coalesce(p.system_access, false), coalesce(p.horizon_access, false),
         coalesce(p.tools, '{}'::jsonb), u.created_at, u.last_sign_in_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  where public.profile_is_admin()
  order by u.created_at desc
$$;

drop function if exists public.admin_update_profile(uuid, text, text, integer, text, text, text, boolean, boolean, boolean);
drop function if exists public.admin_update_profile(uuid, text, text, integer, text, text, text, boolean, boolean, boolean, jsonb);
create function public.admin_update_profile(
  target uuid, p_account_type text, p_org_name text, p_urn integer,
  p_school_name text, p_full_name text, p_role_title text, p_is_admin boolean,
  p_system_access boolean default false, p_horizon_access boolean default false,
  p_tools jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.profile_is_admin() then
    raise exception 'Only an administrator may change accounts.';
  end if;
  insert into public.profiles (id, account_type, org_name, urn, school_name, full_name, role_title, is_admin, system_access, horizon_access, tools)
  values (target, coalesce(p_account_type, 'school'), p_org_name, p_urn, p_school_name, p_full_name, p_role_title, coalesce(p_is_admin, false), coalesce(p_system_access, false), coalesce(p_horizon_access, false), coalesce(p_tools, '{}'::jsonb))
  on conflict (id) do update set
    account_type   = coalesce(p_account_type, profiles.account_type),
    org_name       = p_org_name,
    urn            = p_urn,
    school_name    = p_school_name,
    full_name      = coalesce(p_full_name, profiles.full_name),
    role_title     = coalesce(p_role_title, profiles.role_title),
    is_admin       = coalesce(p_is_admin, profiles.is_admin),
    system_access  = coalesce(p_system_access, profiles.system_access),
    horizon_access = coalesce(p_horizon_access, profiles.horizon_access),
    tools          = coalesce(p_tools, profiles.tools);
end $$;

grant execute on function public.admin_list_accounts() to authenticated;
grant execute on function public.admin_update_profile(uuid, text, text, integer, text, text, text, boolean, boolean, boolean, jsonb) to authenticated;
