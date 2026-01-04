-- Create user_hidden_vehicles table (Fixed types)
create table if not exists public.user_hidden_vehicles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  vehicle_id bigint references public.staging_vehicles(id) not null, -- Changed to bigint to match staging_vehicles
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, vehicle_id)
);

-- Enable RLS
alter table public.user_hidden_vehicles enable row level security;

-- Policies
create policy "Users can view own hidden vehicles" on public.user_hidden_vehicles
  for select using (auth.uid() = user_id);

create policy "Users can insert own hidden vehicles" on public.user_hidden_vehicles
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own hidden vehicles" on public.user_hidden_vehicles
  for delete using (auth.uid() = user_id);
