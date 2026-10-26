-- The reading desk: Lens items now carry their reading, and the Section 48
-- vault follows the account as the Library already does.
-- Safe to run more than once.

alter table public.lens_files add column if not exists room text not null default 'library';
alter table public.lens_files add column if not exists meta jsonb;
create index if not exists lens_files_user_room on public.lens_files (user_id, room);

-- The original files: a private bucket with one folder per member.
insert into storage.buckets (id, name, public)
values ('lens', 'lens', false)
on conflict (id) do nothing;

drop policy if exists "lens per-school folders" on storage.objects;
create policy "lens per-school folders" on storage.objects for all
  using (bucket_id = 'lens' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'lens' and (storage.foldername(name))[1] = auth.uid()::text);
