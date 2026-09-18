-- The All Saints Institute · database schema
-- Run in the Supabase SQL editor. Row-level security throughout:
-- a school's data is cryptographically its own. The Lens covenant, enforced.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  school_name text,
  urn integer,
  role text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "own profile read"  on public.profiles for select using (auth.uid() = id);
create policy "own profile write" on public.profiles for update using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

create table public.orbit_plans (
  user_id uuid primary key references auth.users on delete cascade,
  plan jsonb not null,
  updated_at timestamptz default now()
);
alter table public.orbit_plans enable row level security;
create policy "own plan" on public.orbit_plans for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.lens_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  path text not null,
  label text,
  uploaded_at timestamptz default now()
);
alter table public.lens_files enable row level security;
create policy "own files" on public.lens_files for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage: create a private bucket named 'lens' in the dashboard, then:
create policy "lens per-school folders" on storage.objects for all
  using (bucket_id = 'lens' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'lens' and (storage.foldername(name))[1] = auth.uid()::text);


-- Every new account gets its profile automatically, carrying the school name from sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, school_name)
  values (new.id, new.raw_user_meta_data->>'school_name')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
