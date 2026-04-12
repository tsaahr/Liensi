-- Liensi - Supabase schema, RLS, storage policies and admin whitelist.
-- Execute this whole file in the Supabase SQL editor.
--
-- Important:
-- 1. This SQL authorizes liensiparadise@gmail.com as an admin in public.admin_users.
-- 2. If that Auth user already exists, this SQL confirms the email.
-- 3. This file no longer sets a default password. Create the Auth user in
--    Authentication > Users or run scripts/create-admin.mjs with a backend key.

create extension if not exists pg_trgm;
create extension if not exists citext;
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_email_not_blank check (length(trim(email::text)) > 0)
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users admin
    where admin.active = true
      and lower(admin.email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank check (length(trim(name)) > 0),
  constraint categories_slug_not_blank check (length(trim(slug)) > 0)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  sku text,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10, 2) not null,
  promotional_price numeric(10, 2),
  stock integer not null default 0,
  low_stock_threshold integer not null default 3,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_sku_not_blank check (sku is null or length(trim(sku)) > 0),
  constraint products_name_not_blank check (length(trim(name)) > 0),
  constraint products_slug_not_blank check (length(trim(slug)) > 0),
  constraint products_price_positive check (price >= 0),
  constraint products_promotional_price_positive check (
    promotional_price is null or promotional_price >= 0
  ),
  constraint products_promotional_price_lower check (
    promotional_price is null or promotional_price < price
  ),
  constraint products_stock_positive check (stock >= 0),
  constraint products_low_stock_threshold_positive check (low_stock_threshold >= 0)
);

alter table public.products
  add column if not exists sku text,
  add column if not exists low_stock_threshold integer not null default 3;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_sku_not_blank'
  ) then
    alter table public.products
      add constraint products_sku_not_blank check (sku is null or length(trim(sku)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'products_low_stock_threshold_positive'
  ) then
    alter table public.products
      add constraint products_low_stock_threshold_positive check (low_stock_threshold >= 0);
  end if;
end;
$$;

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  display_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_images_storage_path_not_blank check (length(trim(storage_path)) > 0),
  constraint product_images_display_order_positive check (display_order >= 0)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  color_hex text,
  stock integer not null default 0,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_name_not_blank check (length(trim(name)) > 0),
  constraint product_variants_sku_not_blank check (sku is null or length(trim(sku)) > 0),
  constraint product_variants_color_hex_valid check (
    color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$'
  ),
  constraint product_variants_stock_positive check (stock >= 0),
  constraint product_variants_display_order_positive check (display_order >= 0)
);

create table if not exists public.catalog_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  eyebrow text,
  subtitle text,
  button_label text,
  href text,
  storage_path text not null unique,
  mobile_storage_path text,
  alt_text text,
  display_order integer not null default 0,
  focal_point_x integer not null default 50,
  focal_point_y integer not null default 50,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_banners_storage_path_not_blank check (length(trim(storage_path)) > 0),
  constraint catalog_banners_mobile_storage_path_not_blank check (
    mobile_storage_path is null or length(trim(mobile_storage_path)) > 0
  ),
  constraint catalog_banners_display_order_positive check (display_order >= 0),
  constraint catalog_banners_focal_point_x_range check (
    focal_point_x >= 0 and focal_point_x <= 100
  ),
  constraint catalog_banners_focal_point_y_range check (
    focal_point_y >= 0 and focal_point_y <= 100
  )
);

alter table public.catalog_banners
  add column if not exists mobile_storage_path text,
  add column if not exists focal_point_x integer not null default 50,
  add column if not exists focal_point_y integer not null default 50;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'catalog_banners_mobile_storage_path_not_blank'
  ) then
    alter table public.catalog_banners
      add constraint catalog_banners_mobile_storage_path_not_blank check (
        mobile_storage_path is null or length(trim(mobile_storage_path)) > 0
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'catalog_banners_focal_point_x_range'
  ) then
    alter table public.catalog_banners
      add constraint catalog_banners_focal_point_x_range check (
        focal_point_x >= 0 and focal_point_x <= 100
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'catalog_banners_focal_point_y_range'
  ) then
    alter table public.catalog_banners
      add constraint catalog_banners_focal_point_y_range check (
        focal_point_y >= 0 and focal_point_y <= 100
      );
  end if;
end;
$$;

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  variant_name text,
  quantity_delta integer not null,
  stock_before integer not null,
  stock_after integer not null,
  reason text not null default 'adjustment',
  note text,
  created_by uuid,
  created_by_email text,
  created_at timestamptz not null default now(),
  constraint stock_movements_stock_before_positive check (stock_before >= 0),
  constraint stock_movements_stock_after_positive check (stock_after >= 0),
  constraint stock_movements_reason_not_blank check (length(trim(reason)) > 0)
);

alter table public.stock_movements
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null,
  add column if not exists variant_name text;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  visitor_id uuid not null,
  product_id uuid references public.products(id) on delete set null,
  product_slug text,
  product_name text,
  path text,
  referrer text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint analytics_events_event_type_valid check (
    event_type in (
      'catalog_view',
      'product_card_click',
      'product_view',
      'whatsapp_click'
    )
  ),
  constraint analytics_events_product_slug_length check (
    product_slug is null or length(product_slug) <= 220
  ),
  constraint analytics_events_product_name_length check (
    product_name is null or length(product_name) <= 220
  ),
  constraint analytics_events_path_length check (path is null or length(path) <= 500),
  constraint analytics_events_referrer_length check (
    referrer is null or length(referrer) <= 500
  ),
  constraint analytics_events_user_agent_length check (
    user_agent is null or length(user_agent) <= 500
  ),
  constraint analytics_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists product_images_set_updated_at on public.product_images;
create trigger product_images_set_updated_at
before update on public.product_images
for each row execute function public.set_updated_at();

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

drop trigger if exists catalog_banners_set_updated_at on public.catalog_banners;
create trigger catalog_banners_set_updated_at
before update on public.catalog_banners
for each row execute function public.set_updated_at();

create index if not exists admin_users_active_email_idx
  on public.admin_users(active, email);
create index if not exists categories_slug_idx on public.categories(slug);
create index if not exists products_slug_idx on public.products(slug);
create unique index if not exists products_sku_unique_idx
  on public.products(lower(sku))
  where sku is not null;
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_active_created_at_idx on public.products(active, created_at desc);
create index if not exists products_stock_idx on public.products(stock);
create index if not exists products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create index if not exists product_images_product_order_idx
  on public.product_images(product_id, display_order);
create unique index if not exists product_images_one_cover_idx
  on public.product_images(product_id)
  where is_cover;
create index if not exists product_variants_product_order_idx
  on public.product_variants(product_id, display_order);
create index if not exists product_variants_active_product_idx
  on public.product_variants(active, product_id);
create unique index if not exists product_variants_sku_unique_idx
  on public.product_variants(lower(sku))
  where sku is not null;
create index if not exists catalog_banners_active_order_idx
  on public.catalog_banners(active, display_order, created_at desc);
create unique index if not exists catalog_banners_mobile_storage_path_idx
  on public.catalog_banners(mobile_storage_path)
  where mobile_storage_path is not null;
create index if not exists stock_movements_product_created_at_idx
  on public.stock_movements(product_id, created_at desc);
create index if not exists stock_movements_variant_created_at_idx
  on public.stock_movements(variant_id, created_at desc)
  where variant_id is not null;
create index if not exists stock_movements_created_at_idx
  on public.stock_movements(created_at desc);
create index if not exists analytics_events_created_at_idx
  on public.analytics_events(created_at desc);
create index if not exists analytics_events_type_created_at_idx
  on public.analytics_events(event_type, created_at desc);
create index if not exists analytics_events_visitor_created_at_idx
  on public.analytics_events(visitor_id, created_at desc);
create index if not exists analytics_events_product_created_at_idx
  on public.analytics_events(product_id, created_at desc);
create index if not exists analytics_events_product_slug_created_at_idx
  on public.analytics_events(product_slug, created_at desc)
  where product_slug is not null;

insert into public.admin_users (email, active)
values ('liensiparadise@gmail.com', true)
on conflict (email) do update
set active = true,
    updated_at = now();

-- The account was created through Supabase Auth signup. This confirms the email
-- when the SQL editor runs with owner privileges. If the Auth user does not
-- exist yet, this safely updates zero rows. Password definition stays outside
-- the repository for security.
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
where lower(email) = lower('liensiparadise@gmail.com');

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.catalog_banners enable row level security;
alter table public.stock_movements enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage admin users" on public.admin_users;
create policy "Admins can manage admin users"
on public.admin_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories
for select
using (true);

drop policy if exists "Authenticated admins can manage categories" on public.categories;
drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products
for select
using (active = true or public.is_admin());

drop policy if exists "Authenticated admins can manage products" on public.products;
drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active product images" on public.product_images;
create policy "Public can read active product images"
on public.product_images
for select
using (
  exists (
    select 1
    from public.products p
    where p.id = product_images.product_id
      and (p.active = true or public.is_admin())
  )
);

drop policy if exists "Authenticated admins can manage product images" on public.product_images;
drop policy if exists "Admins can manage product images" on public.product_images;
create policy "Admins can manage product images"
on public.product_images
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active product variants" on public.product_variants;
create policy "Public can read active product variants"
on public.product_variants
for select
using (
  active = true
  and exists (
    select 1
    from public.products p
    where p.id = product_variants.product_id
      and (p.active = true or public.is_admin())
  )
);

drop policy if exists "Admins can manage product variants" on public.product_variants;
create policy "Admins can manage product variants"
on public.product_variants
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active catalog banners" on public.catalog_banners;
create policy "Public can read active catalog banners"
on public.catalog_banners
for select
using (active = true or public.is_admin());

drop policy if exists "Admins can manage catalog banners" on public.catalog_banners;
create policy "Admins can manage catalog banners"
on public.catalog_banners
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read stock movements" on public.stock_movements;
create policy "Admins can read stock movements"
on public.stock_movements
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage stock movements" on public.stock_movements;
create policy "Admins can manage stock movements"
on public.stock_movements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can insert analytics events" on public.analytics_events;
create policy "Public can insert analytics events"
on public.analytics_events
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read analytics events" on public.analytics_events;
create policy "Admins can read analytics events"
on public.analytics_events
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can delete analytics events" on public.analytics_events;
create policy "Admins can delete analytics events"
on public.analytics_events
for delete
to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'produtos',
  'produtos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read product storage" on storage.objects;
create policy "Public can read product storage"
on storage.objects
for select
using (bucket_id = 'produtos');

drop policy if exists "Authenticated admins can upload product storage" on storage.objects;
drop policy if exists "Admins can upload product storage" on storage.objects;
create policy "Admins can upload product storage"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'produtos' and public.is_admin());

drop policy if exists "Authenticated admins can update product storage" on storage.objects;
drop policy if exists "Admins can update product storage" on storage.objects;
create policy "Admins can update product storage"
on storage.objects
for update
to authenticated
using (bucket_id = 'produtos' and public.is_admin())
with check (bucket_id = 'produtos' and public.is_admin());

drop policy if exists "Authenticated admins can delete product storage" on storage.objects;
drop policy if exists "Admins can delete product storage" on storage.objects;
create policy "Admins can delete product storage"
on storage.objects
for delete
to authenticated
using (bucket_id = 'produtos' and public.is_admin());
