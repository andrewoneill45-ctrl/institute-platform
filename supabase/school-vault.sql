-- ═══════════════════════════════════════════════════════════════════════════
-- The School Vault: one shared Constellation per school, for every school.
-- Run this once in the Supabase SQL editor.
--
-- The security model, in one breath: membership of a school is written ONLY
-- from the dashboard (service role) - never by users themselves - because
-- sign-up lets anyone type any school name, and self-declared identity must
-- never be what guards pupil data. Row-level security then gives a school's
-- verified members, and nobody else, sight of that school's vault.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1 ── Schools known to the vault
create table if not exists public.schools (
  urn        integer primary key,
  name       text not null,
  created_at timestamptz not null default now()
);

-- 2 ── Verified membership (written only via the dashboard / service role)
create table if not exists public.school_members (
  user_id  uuid    not null references auth.users(id) on delete cascade,
  urn      integer not null references public.schools(urn) on delete cascade,
  role     text    not null default 'member' check (role in ('lead','member')),
  added_at timestamptz not null default now(),
  primary key (user_id, urn)
);

-- 3 ── The vault itself: one state document per school
create table if not exists public.vault_states (
  urn        integer primary key references public.schools(urn) on delete cascade,
  state      jsonb   not null,
  version    integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.schools        enable row level security;
alter table public.school_members enable row level security;
alter table public.vault_states   enable row level security;

-- Is the signed-in user a verified member of this school?
create or replace function public.is_school_member(check_urn integer)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from school_members m
    where m.user_id = auth.uid() and m.urn = check_urn
  );
$$;

-- Members may read their own school row and their own membership row
drop policy if exists "members read their school" on public.schools;
create policy "members read their school"
  on public.schools for select using (public.is_school_member(urn));

drop policy if exists "members read own membership" on public.school_members;
create policy "members read own membership"
  on public.school_members for select using (user_id = auth.uid());

-- Members may read and write their school's vault; to everyone else it
-- does not exist. There is deliberately NO delete policy and NO insert or
-- update policy on schools/school_members: membership changes happen only
-- in the dashboard.
drop policy if exists "members read vault" on public.vault_states;
create policy "members read vault"
  on public.vault_states for select using (public.is_school_member(urn));

drop policy if exists "members insert vault" on public.vault_states;
create policy "members insert vault"
  on public.vault_states for insert with check (public.is_school_member(urn));

drop policy if exists "members update vault" on public.vault_states;
create policy "members update vault"
  on public.vault_states for update
  using (public.is_school_member(urn))
  with check (public.is_school_member(urn));

-- 4 ── Bootstrap: All Saints Catholic College and its first two members.
-- Add further colleagues by adding their email to the list below and
-- re-running this block, or with a single insert of the same shape.
insert into public.schools (urn, name)
values (100503, 'All Saints Catholic College')
on conflict do nothing;

insert into public.school_members (user_id, urn, role)
select u.id, 100503,
       case when u.email = 'andrewoneill45@googlemail.com' then 'lead' else 'member' end
from auth.users u
where u.email in (
  'andrewoneill45@googlemail.com',
  'r.walmsley@allsaintscc.org.uk'
)
on conflict do nothing;

-- 5 ── See who the vault knows (handy check after running)
select s.name, s.urn, u.email, m.role
from public.school_members m
join public.schools s on s.urn = m.urn
join auth.users u on u.id = m.user_id
order by s.urn, m.role;
