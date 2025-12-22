-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User Profiles Table (extends Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  makes text[], -- Array of preferred makes
  min_price integer,
  max_price integer,
  min_year integer,
  max_year integer,
  max_mileage integer,
  zip_code text,
  radius_miles integer default 50,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Vehicles Inventory Table
create table public.vehicles (
  id uuid default uuid_generate_v4() primary key,
  source_id text not null, -- Unique ID from the source (e.g., eBay Item ID)
  source text not null check (source in ('autodev', 'ebay', 'facebook', 'other')),
  vin text,
  make text,
  model text,
  year integer,
  trim text,
  price integer,
  mileage integer,
  location_raw text,
  images jsonb, -- Array of image URLs
  url text,
  status text default 'active' check (status in ('active', 'sold', 'expired')),
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(source, source_id)
);

-- Enable RLS on vehicles (Public read, ServiceRole write)
alter table public.vehicles enable row level security;

create policy "Public can view active vehicles" on public.vehicles
  for select using (status = 'active');

-- User Interactions Table (Favorites, Rejected)
create table public.user_interactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  vehicle_id uuid references public.vehicles(id) not null,
  status text not null check (status in ('favorite', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, vehicle_id)
);

-- Enable RLS on user_interactions
alter table public.user_interactions enable row level security;

create policy "Users can view own interactions" on public.user_interactions
  for select using (auth.uid() = user_id);

create policy "Users can insert own interactions" on public.user_interactions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own interactions" on public.user_interactions
  for update using (auth.uid() = user_id);

create policy "Users can delete own interactions" on public.user_interactions
  for delete using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
