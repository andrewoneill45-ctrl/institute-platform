-- Prizm's saved reports: a report a member keeps becomes part of the school's
-- vault, visible to every member of that school and no one else. What is
-- stored is the SPECIFICATION (scope, blocks, title), not the figures: a
-- saved report recomputes against the dataset of the day it is opened, so it
-- is always honest about vintage.
--
-- Run once in the Supabase SQL editor, after school-vault.sql (it reuses
-- is_school_member).

create table if not exists public.prizm_reports (
  id         uuid primary key default gen_random_uuid(),
  urn        integer not null,
  title      text not null check (char_length(title) between 1 and 200),
  spec       jsonb not null,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists prizm_reports_urn_idx on public.prizm_reports (urn, created_at desc);

alter table public.prizm_reports enable row level security;

drop policy if exists "members read reports" on public.prizm_reports;
create policy "members read reports" on public.prizm_reports
  for select using (public.is_school_member(urn));

drop policy if exists "members save reports" on public.prizm_reports;
create policy "members save reports" on public.prizm_reports
  for insert with check (public.is_school_member(urn) and created_by = auth.uid());

drop policy if exists "authors delete reports" on public.prizm_reports;
create policy "authors delete reports" on public.prizm_reports
  for delete using (created_by = auth.uid() and public.is_school_member(urn));
