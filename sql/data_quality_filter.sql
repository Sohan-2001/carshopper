-- 1. The Logic (The Bouncer)
-- Function to validate vehicle data before saving
create or replace function public.validate_vehicle_listing()
returns trigger as $$
begin
    -- Check for valid Price
    if new.price is null or new.price <= 0 then
        return null; -- Cancel insert/update
    end if;

    -- Check for valid Year
    if new.year is null or new.year < 1900 then
        return null; -- Cancel insert/update
    end if;

    -- Check for Title presence
    if new.title is null or trim(new.title) = '' then
        return null; -- Cancel insert/update
    end if;

    -- Check for Blacklisted Keywords using regex case-insensitive match (~*)
    -- Keywords: deuda, cuota, financiamiento, anticipo
    if new.title ~* 'deuda|cuota|financiamiento|anticipo' then
        return null; -- Cancel insert/update
    end if;

    return new; -- Approve and proceed
end;
$$ language plpgsql;

-- 2. The Trigger
-- Attach the function to the table
-- First, ensure we don't duplicate
drop trigger if exists check_vehicle_quality on public.staging_vehicles;

create trigger check_vehicle_quality
before insert or update on public.staging_vehicles
for each row
execute function public.validate_vehicle_listing();


-- 3. Cleanup Script
-- Delete existing "bad" records that violate the new rules
delete from public.staging_vehicles
where price is null or price <= 0
   or year is null or year < 1900
   or title is null or trim(title) = ''
   or title ~* 'deuda|cuota|financiamiento|anticipo';
