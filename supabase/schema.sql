create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  student_number text not null unique,
  full_name text not null,
  section text not null,
  birthday date not null,
  preferred_items text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  seller_name text,
  title text not null,
  category text not null,
  price numeric(10,2) not null default 0,
  condition text not null,
  type text not null,
  location text not null,
  description text not null,
  is_free boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.listings
  drop constraint if exists listings_title_length_check;

alter table public.listings
  add constraint listings_title_length_check
  check (
    cardinality(
      regexp_split_to_array(
        btrim(title),
        '\s+'
      )
    ) <= 30
  ) not valid;

alter table public.listings
  drop constraint if exists listings_price_range_check;

alter table public.listings
  add constraint listings_price_range_check
  check (price >= 0 and price <= 999) not valid;

alter table public.listings
  drop constraint if exists listings_location_allowed_check;

alter table public.listings
  add constraint listings_location_allowed_check
  check (
    location in (
      'Front gate',
      'Back gate',
      'Ground floor',
      'Student lounge',
      'Library',
      'Canteen'
    )
  ) not valid;

create table if not exists public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  media_type text not null,
  storage_path text not null unique,
  public_url text not null,
  original_name text,
  mime_type text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.listing_media
  drop constraint if exists listing_media_type_check;

alter table public.listing_media
  add constraint listing_media_type_check
  check (media_type in ('image', 'video')) not valid;

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, listing_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_media enable row level security;
alter table public.favorites enable row level security;
alter table public.messages enable row level security;

drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = auth_user_id);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists "listings are readable by authenticated users" on public.listings;
create policy "listings are readable by authenticated users"
on public.listings for select
to authenticated
using (true);

drop policy if exists "users can create listings" on public.listings;
create policy "users can create listings"
on public.listings for insert
to authenticated
with check (true);

drop policy if exists "users can update their own listings" on public.listings;
create policy "users can update their own listings"
on public.listings for update
to authenticated
using (exists (
  select 1 from public.profiles
  where profiles.id = listings.owner_id
  and profiles.auth_user_id = auth.uid()
));

drop policy if exists "users can delete their own listings" on public.listings;
create policy "users can delete their own listings"
on public.listings for delete
to authenticated
using (exists (
  select 1 from public.profiles
  where profiles.id = listings.owner_id
  and profiles.auth_user_id = auth.uid()
));

drop policy if exists "listing media readable by authenticated users" on public.listing_media;
create policy "listing media readable by authenticated users"
on public.listing_media for select
to authenticated
using (true);

drop policy if exists "users can create listing media for their own listings" on public.listing_media;
create policy "users can create listing media for their own listings"
on public.listing_media for insert
to authenticated
with check (exists (
  select 1
  from public.listings
  join public.profiles on profiles.id = listings.owner_id
  where listings.id = listing_media.listing_id
  and profiles.auth_user_id = auth.uid()
));

drop policy if exists "users can delete media on their own listings" on public.listing_media;
create policy "users can delete media on their own listings"
on public.listing_media for delete
to authenticated
using (exists (
  select 1
  from public.listings
  join public.profiles on profiles.id = listings.owner_id
  where listings.id = listing_media.listing_id
  and profiles.auth_user_id = auth.uid()
));

drop policy if exists "favorites readable by owner" on public.favorites;
create policy "favorites readable by owner"
on public.favorites for select
to authenticated
using (exists (
  select 1 from public.profiles
  where profiles.id = favorites.profile_id
  and profiles.auth_user_id = auth.uid()
));

drop policy if exists "favorites manageable by owner" on public.favorites;
create policy "favorites manageable by owner"
on public.favorites for insert
to authenticated
with check (exists (
  select 1 from public.profiles
  where profiles.id = favorites.profile_id
  and profiles.auth_user_id = auth.uid()
));

drop policy if exists "favorites deletable by owner" on public.favorites;
create policy "favorites deletable by owner"
on public.favorites for delete
to authenticated
using (exists (
  select 1 from public.profiles
  where profiles.id = favorites.profile_id
  and profiles.auth_user_id = auth.uid()
));

drop policy if exists "messages readable by participants" on public.messages;
create policy "messages readable by participants"
on public.messages for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = messages.sender_id
    and profiles.auth_user_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles
    where profiles.id = messages.receiver_id
    and profiles.auth_user_id = auth.uid()
  )
);

drop policy if exists "messages insertable by sender" on public.messages;
create policy "messages insertable by sender"
on public.messages for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = messages.sender_id
    and profiles.auth_user_id = auth.uid()
  )
);

drop policy if exists "messages deletable by participants" on public.messages;
create policy "messages deletable by participants"
on public.messages for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = messages.sender_id
    and profiles.auth_user_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles
    where profiles.id = messages.receiver_id
    and profiles.auth_user_id = auth.uid()
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    auth_user_id,
    student_number,
    full_name,
    section,
    birthday,
    preferred_items
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'student_number', ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'section', ''),
    (new.raw_user_meta_data->>'birthday')::date,
    coalesce(
      array(
        select jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'preferred_items', '[]'::jsonb))
      ),
      '{}'::text[]
    )
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('listing-media', 'listing-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "listing media objects readable by authenticated users" on storage.objects;
create policy "listing media objects readable by authenticated users"
on storage.objects for select
to authenticated
using (bucket_id = 'listing-media');

drop policy if exists "listing media objects insertable by authenticated users" on storage.objects;
create policy "listing media objects insertable by authenticated users"
on storage.objects for insert
to authenticated
with check (bucket_id = 'listing-media');

drop policy if exists "listing media objects deletable by owners" on storage.objects;
create policy "listing media objects deletable by owners"
on storage.objects for delete
to authenticated
using (bucket_id = 'listing-media');
