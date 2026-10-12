-- =============================================================
-- 1st ROOT Admin Dashboard — Full Schema Migration
-- Requires: 202610080001_auth_profiles.sql already applied
-- Safe to rerun: uses IF NOT EXISTS / idempotent guards
-- =============================================================
begin;

-- ─────────────────────────────────────────────────────────────
-- SHARED: updated_at trigger function
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ─────────────────────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.products (
  id                uuid          primary key default gen_random_uuid(),
  name              text          not null,
  slug              text          not null unique,
  sku               text          not null unique,
  variant           text          not null default '',
  subtitle          text          not null default '',
  category          text          not null default '',
  short_description text          not null default '',
  description       text          not null default '',
  ingredients       text[]        not null default '{}',
  how_to_use        text[]        not null default '{}',
  features          text[]        not null default '{}',
  specifications    jsonb         not null default '[]',
  price             numeric(10,2) not null check (price >= 0),
  original_price    numeric(10,2),
  discount_pct      int           check (discount_pct between 0 and 100),
  status            text          not null default 'DRAFT'
                                  check (status in ('ACTIVE','DRAFT','INACTIVE')),
  rating            numeric(3,2)  not null default 0,
  review_count      int           not null default 0,
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now()
);
comment on table public.products is '1st ROOT product catalogue';

create index if not exists products_status_idx on public.products(status);
create index if not exists products_slug_idx   on public.products(slug);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.products'::regclass and tgname = 'products_updated_at'
  ) then
    create trigger products_updated_at before update on public.products
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.products enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='products_public_read') then
    create policy products_public_read on public.products
      for select using (status = 'ACTIVE');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='products_admin_all') then
    create policy products_admin_all on public.products
      for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- PRODUCT IMAGES
-- ─────────────────────────────────────────────────────────────
create table if not exists public.product_images (
  id           uuid        primary key default gen_random_uuid(),
  product_id   uuid        not null references public.products(id) on delete cascade,
  storage_path text        not null,
  url          text        not null,
  position     int         not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images(product_id, position);

alter table public.product_images enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='product_images' and policyname='product_images_public_read') then
    create policy product_images_public_read on public.product_images
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='product_images' and policyname='product_images_admin_all') then
    create policy product_images_admin_all on public.product_images
      for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- INVENTORY ITEMS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.inventory_items (
  id                  uuid        primary key default gen_random_uuid(),
  product_id          uuid        not null unique references public.products(id) on delete cascade,
  sku                 text        not null unique,
  physical_stock      int         not null default 0 check (physical_stock >= 0),
  reserved_stock      int         not null default 0 check (reserved_stock >= 0),
  low_stock_threshold int         not null default 10,
  updated_at          timestamptz not null default now()
);
create index if not exists inventory_product_idx on public.inventory_items(product_id);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.inventory_items'::regclass and tgname = 'inventory_updated_at'
  ) then
    create trigger inventory_updated_at before update on public.inventory_items
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.inventory_items enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='inventory_items' and policyname='inventory_public_read') then
    create policy inventory_public_read on public.inventory_items
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='inventory_items' and policyname='inventory_admin_all') then
    create policy inventory_admin_all on public.inventory_items
      for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- INVENTORY MOVEMENTS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.inventory_movements (
  id                uuid        primary key default gen_random_uuid(),
  inventory_item_id uuid        not null references public.inventory_items(id) on delete cascade,
  adjustment_type   text        not null
                                check (adjustment_type in (
                                  'ADD','REMOVE','DAMAGED','CORRECTION',
                                  'RETURNED','ORDER_RESERVED','ORDER_RELEASED','OTHER'
                                )),
  quantity_change   int         not null,
  stock_before      int         not null,
  stock_after       int         not null,
  reason            text        not null default '',
  reference         text        not null default '',
  performed_by      uuid        references auth.users(id),
  created_at        timestamptz not null default now()
);
create index if not exists inventory_movements_item_idx
  on public.inventory_movements(inventory_item_id, created_at desc);

alter table public.inventory_movements enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='inventory_movements' and policyname='inventory_movements_admin_all') then
    create policy inventory_movements_admin_all on public.inventory_movements
      for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- CUSTOMER ADDRESSES
-- ─────────────────────────────────────────────────────────────
create table if not exists public.customer_addresses (
  id          uuid        primary key default gen_random_uuid(),
  customer_id uuid        not null references public.profiles(id) on delete cascade,
  type        text        not null default 'Home' check (type in ('Home','Work','Other')),
  full_name   text        not null default '',
  mobile      text        not null default '',
  line1       text        not null default '',
  line2       text        not null default '',
  landmark    text        not null default '',
  city        text        not null default '',
  state       text        not null default '',
  pin_code    text        not null default '',
  country     text        not null default 'India',
  is_default  boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists addresses_customer_idx on public.customer_addresses(customer_id);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.customer_addresses'::regclass and tgname = 'addresses_updated_at'
  ) then
    create trigger addresses_updated_at before update on public.customer_addresses
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.customer_addresses enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='customer_addresses' and policyname='addresses_own') then
    create policy addresses_own on public.customer_addresses
      for all to authenticated
      using (customer_id = (select auth.uid()))
      with check (customer_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='customer_addresses' and policyname='addresses_admin_read') then
    create policy addresses_admin_read on public.customer_addresses
      for select to authenticated
      using ((select firstroot_private.is_admin()));
  end if;
end $$;

commit;
