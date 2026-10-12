-- =============================================================
-- 1st ROOT Admin — Part 2: Orders, Shipments, Payments, Returns
-- Run AFTER 202610090001_admin_schema.sql
-- =============================================================
begin;

-- ─────────────────────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                    text          primary key,  -- e.g. "1R1028"
  customer_id           uuid          not null references public.profiles(id),
  shipping_address_id   uuid          references public.customer_addresses(id),
  status                text          not null default 'PENDING'
                                      check (status in (
                                        'PENDING','CONFIRMED','PROCESSING','PACKED',
                                        'SHIPPED','OUT FOR DELIVERY','DELIVERED',
                                        'CANCELLED','RETURN REQUESTED','REFUNDED'
                                      )),
  payment_status        text          not null default 'PENDING'
                                      check (payment_status in (
                                        'PENDING','PAID','FAILED','PARTIALLY REFUNDED','REFUNDED'
                                      )),
  payment_method        text          not null default '',
  transaction_reference text          not null default '',
  subtotal              numeric(10,2) not null default 0,
  discount_amount       numeric(10,2) not null default 0,
  shipping_amount       numeric(10,2) not null default 0,
  tax_amount            numeric(10,2) not null default 0,
  total                 numeric(10,2) not null default 0,
  notes                 text          not null default '',
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);
create index if not exists orders_customer_idx   on public.orders(customer_id);
create index if not exists orders_status_idx     on public.orders(status);
create index if not exists orders_created_idx    on public.orders(created_at desc);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.orders'::regclass and tgname = 'orders_updated_at'
  ) then
    create trigger orders_updated_at before update on public.orders
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.orders enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_own_read') then
    create policy orders_own_read on public.orders for select to authenticated
      using (customer_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_own_insert') then
    create policy orders_own_insert on public.orders for insert to authenticated
      with check (customer_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_admin_all') then
    create policy orders_admin_all on public.orders for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id           uuid          primary key default gen_random_uuid(),
  order_id     text          not null references public.orders(id) on delete cascade,
  product_id   uuid          not null references public.products(id),
  product_name text          not null,
  variant      text          not null default '',
  sku          text          not null default '',
  quantity     int           not null check (quantity > 0),
  unit_price   numeric(10,2) not null,
  total_price  numeric(10,2) not null,
  created_at   timestamptz   not null default now()
);
create index if not exists order_items_order_idx   on public.order_items(order_id);
create index if not exists order_items_product_idx on public.order_items(product_id);

alter table public.order_items enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='order_items' and policyname='order_items_own_read') then
    create policy order_items_own_read on public.order_items for select to authenticated
      using (order_id in (
        select id from public.orders where customer_id = (select auth.uid())
      ));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='order_items' and policyname='order_items_own_insert') then
    create policy order_items_own_insert on public.order_items for insert to authenticated
      with check (order_id in (
        select id from public.orders where customer_id = (select auth.uid())
      ));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='order_items' and policyname='order_items_admin_all') then
    create policy order_items_admin_all on public.order_items for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- ORDER STATUS HISTORY
-- ─────────────────────────────────────────────────────────────
create table if not exists public.order_status_history (
  id          uuid        primary key default gen_random_uuid(),
  order_id    text        not null references public.orders(id) on delete cascade,
  status      text        not null,
  note        text        not null default '',
  changed_by  uuid        references auth.users(id),
  created_at  timestamptz not null default now()
);
create index if not exists order_history_order_idx
  on public.order_status_history(order_id, created_at desc);

alter table public.order_status_history enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='order_status_history' and policyname='order_history_own_read') then
    create policy order_history_own_read on public.order_status_history for select to authenticated
      using (order_id in (
        select id from public.orders where customer_id = (select auth.uid())
      ));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='order_status_history' and policyname='order_history_admin_all') then
    create policy order_history_admin_all on public.order_status_history for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- SHIPMENTS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.shipments (
  id                uuid        primary key default gen_random_uuid(),
  order_id          text        not null unique references public.orders(id) on delete cascade,
  courier           text        not null default '',
  tracking_number   text        not null default '',
  destination       text        not null default '',
  status            text        not null default 'READY TO SHIP'
                                check (status in (
                                  'READY TO SHIP','PACKED','IN TRANSIT',
                                  'OUT FOR DELIVERY','DELIVERED','FAILED DELIVERY'
                                )),
  expected_delivery text        not null default '',
  dispatched_at     timestamptz,
  delivered_at      timestamptz,
  updated_at        timestamptz not null default now()
);
create index if not exists shipments_order_idx on public.shipments(order_id);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.shipments'::regclass and tgname = 'shipments_updated_at'
  ) then
    create trigger shipments_updated_at before update on public.shipments
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.shipments enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='shipments' and policyname='shipments_own_read') then
    create policy shipments_own_read on public.shipments for select to authenticated
      using (order_id in (
        select id from public.orders where customer_id = (select auth.uid())
      ));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='shipments' and policyname='shipments_admin_all') then
    create policy shipments_admin_all on public.shipments for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id              uuid          primary key default gen_random_uuid(),
  order_id        text          not null references public.orders(id) on delete cascade,
  amount          numeric(10,2) not null,
  method          text          not null default '',
  status          text          not null default 'PENDING'
                                check (status in (
                                  'PENDING','PAID','FAILED','PARTIALLY REFUNDED','REFUNDED'
                                )),
  transaction_ref text          not null default '',
  refund_status   text          not null default '—',
  paid_at         timestamptz,
  updated_at      timestamptz   not null default now()
);
create index if not exists payments_order_idx on public.payments(order_id);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.payments'::regclass and tgname = 'payments_updated_at'
  ) then
    create trigger payments_updated_at before update on public.payments
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.payments enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='payments' and policyname='payments_own_read') then
    create policy payments_own_read on public.payments for select to authenticated
      using (order_id in (
        select id from public.orders where customer_id = (select auth.uid())
      ));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='payments' and policyname='payments_admin_all') then
    create policy payments_admin_all on public.payments for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- RETURNS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.returns (
  id            uuid          primary key default gen_random_uuid(),
  order_id      text          not null references public.orders(id),
  customer_id   uuid          not null references public.profiles(id),
  product_id    uuid          not null references public.products(id),
  reason        text          not null default '',
  status        text          not null default 'REVIEWING'
                              check (status in (
                                'REVIEWING','APPROVED','REJECTED','RECEIVED','REFUNDED'
                              )),
  refund_amount numeric(10,2) not null default 0,
  refund_status text          not null default 'PENDING'
                              check (refund_status in (
                                'PENDING','PROCESSING','REFUNDED','FAILED'
                              )),
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);
create index if not exists returns_order_idx    on public.returns(order_id);
create index if not exists returns_customer_idx on public.returns(customer_id);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.returns'::regclass and tgname = 'returns_updated_at'
  ) then
    create trigger returns_updated_at before update on public.returns
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.returns enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='returns' and policyname='returns_own') then
    create policy returns_own on public.returns for all to authenticated
      using (customer_id = (select auth.uid()))
      with check (customer_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='returns' and policyname='returns_admin_all') then
    create policy returns_admin_all on public.returns for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

commit;
