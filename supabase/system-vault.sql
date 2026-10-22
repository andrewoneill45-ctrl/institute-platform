-- The system vault: members without a school (whole-system, trust, LA,
-- diocese and AEPA accounts) keep their Prizm reports personally — durable,
-- cross-device, visible only to their author — instead of falling back to
-- one browser's storage. A personal report is a prizm_reports row with no
-- URN. School vaults are unchanged.
--
-- Run once in the Supabase SQL editor, after prizm-reports.sql.

alter table public.prizm_reports alter column urn drop not null;

create index if not exists prizm_reports_author_idx
  on public.prizm_reports (created_by, created_at desc);

drop policy if exists "members read reports" on public.prizm_reports;
create policy "members read reports" on public.prizm_reports
  for select using (
    (urn is not null and public.is_school_member(urn))
    or (urn is null and created_by = auth.uid())
  );

drop policy if exists "members save reports" on public.prizm_reports;
create policy "members save reports" on public.prizm_reports
  for insert with check (
    created_by = auth.uid()
    and (urn is null or public.is_school_member(urn))
  );

drop policy if exists "authors delete reports" on public.prizm_reports;
create policy "authors delete reports" on public.prizm_reports
  for delete using (created_by = auth.uid());
