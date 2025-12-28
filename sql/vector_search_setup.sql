-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Add embedding column to staging_vehicles if it doesn't exist
-- Note: The cars should already be in staging_vehicles
alter table staging_vehicles 
add column if not exists embedding vector(768);

-- 3. Create the vector matching function
create or replace function match_cars (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns setof staging_vehicles
language plpgsql
as $$
begin
  return query
  select *
  from staging_vehicles
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by (embedding <=> query_embedding) asc
  limit match_count;
end;
$$;
