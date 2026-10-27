create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

create or replace function public.is_jeshurun_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()))
$$;
revoke all on function public.is_jeshurun_admin() from public;
grant execute on function public.is_jeshurun_admin() to authenticated;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  slug text not null unique,
  title text not null,
  description text not null default '',
  listing_type text not null check (listing_type in ('sale','rent')),
  property_type text not null check (property_type in ('house','apartment','townhouse','land','commercial','other')),
  publication_status text not null default 'draft' check (publication_status in ('draft','published','unpublished')),
  availability_status text not null default 'available' check (availability_status in ('available','under_offer','sold','rented')),
  price numeric(14,2) not null check (price >= 0),
  currency text not null default 'KES',
  location_name text not null,
  county text,
  area_name text,
  bedrooms integer check (bedrooms is null or bedrooms >= 0),
  bathrooms numeric(3,1) check (bathrooms is null or bathrooms >= 0),
  land_area numeric(12,2),
  floor_area numeric(12,2),
  area_unit text,
  features text[] not null default '{}',
  amenities text[] not null default '{}',
  featured boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists properties_public_catalogue on public.properties(publication_status, availability_status, listing_type, property_type, price);
create index if not exists properties_location on public.properties(location_name, county, area_name);
alter table public.properties enable row level security;
revoke all on public.properties from anon, authenticated;
grant select on public.properties to anon, authenticated;
grant insert, update, delete on public.properties to authenticated;
drop policy if exists "public reads discoverable listings" on public.properties;
create policy "public reads discoverable listings" on public.properties for select to anon, authenticated
 using (publication_status = 'published' and availability_status in ('available','under_offer'));
drop policy if exists "admins manage listings" on public.properties;
create policy "admins manage listings" on public.properties for all to authenticated
 using (public.is_jeshurun_admin()) with check (public.is_jeshurun_admin());

create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.property_images enable row level security;
revoke all on public.property_images from anon, authenticated;
grant select on public.property_images to anon, authenticated;
grant insert, update, delete on public.property_images to authenticated;
create policy "public reads photos for visible listings" on public.property_images for select to anon, authenticated
 using (exists (select 1 from public.properties p where p.id=property_id and p.publication_status='published' and p.availability_status in ('available','under_offer')));
create policy "admins manage property photos" on public.property_images for all to authenticated
 using (public.is_jeshurun_admin()) with check (public.is_jeshurun_admin());

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 32),
  email text check (email is null or char_length(email) <= 254),
  message text not null check (char_length(message) between 2 and 4000),
  preferred_viewing timestamptz,
  status text not null default 'new' check (status in ('new','contacted','viewing_scheduled','closed')),
  created_at timestamptz not null default now()
);
create index if not exists enquiries_created_at on public.enquiries(created_at desc);
alter table public.enquiries enable row level security;
revoke all on public.enquiries from anon, authenticated;
grant select, update, delete on public.enquiries to authenticated;
create policy "admins manage enquiries" on public.enquiries for all to authenticated
 using (public.is_jeshurun_admin()) with check (public.is_jeshurun_admin());

-- Public enquiry writes are performed only by the server using the service role.
-- This security-definer function supplies a durable per-phone throttle so the
-- API does not rely on per-process memory in serverless deployments.
create or replace function public.enquiry_allowed(p_phone text)
returns boolean language sql stable security definer set search_path = '' as $$
  select count(*) < 5
  from public.enquiries
  where right(regexp_replace(phone, '[^0-9]', '', 'g'), 9) = right(regexp_replace(p_phone, '[^0-9]', '', 'g'), 9)
    and created_at > now() - interval '10 minutes'
$$;
revoke all on function public.enquiry_allowed(text) from public;
grant execute on function public.enquiry_allowed(text) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('property-media','property-media',true,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do update set public=true, file_size_limit=10485760, allowed_mime_types=array['image/jpeg','image/png','image/webp','image/avif'];
create policy "public reads public property media" on storage.objects for select to anon, authenticated using (bucket_id='property-media');
create policy "admins upload property media" on storage.objects for insert to authenticated with check (bucket_id='property-media' and public.is_jeshurun_admin());
create policy "admins update property media" on storage.objects for update to authenticated using (bucket_id='property-media' and public.is_jeshurun_admin()) with check (bucket_id='property-media' and public.is_jeshurun_admin());
create policy "admins delete property media" on storage.objects for delete to authenticated using (bucket_id='property-media' and public.is_jeshurun_admin());
