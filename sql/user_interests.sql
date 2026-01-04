-- Create user_interests table
create table if not exists public.user_interests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  name text not null,
  criteria jsonb not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_interests enable row level security;

-- Policies
create policy "Users can view own interests" on public.user_interests
  for select using (auth.uid() = user_id);

create policy "Users can insert own interests" on public.user_interests
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own interests" on public.user_interests
  for delete using (auth.uid() = user_id);

create policy "Users can update own interests" on public.user_interests
  for update using (auth.uid() = user_id);
