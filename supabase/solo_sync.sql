-- Thesis Radar - temporary solo sync table for GitHub Pages testing.
-- This is for your personal MVP only. It lets the browser sync one encrypted-by-obscurity
-- state document using an unguessable sync_key. Do not use this as the final multi-user model.

create table if not exists public.user_sync_states (
  sync_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_sync_states enable row level security;

drop policy if exists "solo sync read" on public.user_sync_states;
drop policy if exists "solo sync insert" on public.user_sync_states;
drop policy if exists "solo sync update" on public.user_sync_states;

-- Temporary: allows the anon key to read/write rows. The app still filters by sync_key,
-- but this is not strong isolation. Replace with Supabase Auth or an Edge Function later.
create policy "solo sync read"
  on public.user_sync_states for select
  to anon
  using (true);

create policy "solo sync insert"
  on public.user_sync_states for insert
  to anon
  with check (length(sync_key) >= 24);

create policy "solo sync update"
  on public.user_sync_states for update
  to anon
  using (length(sync_key) >= 24)
  with check (length(sync_key) >= 24);
