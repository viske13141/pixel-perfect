-- =============================================================
-- 1st ROOT Admin — Part 3: Reviews, Support, Discounts,
--                          Content, Settings, RPC functions
-- Run AFTER 202610090002_admin_orders.sql
-- =============================================================
begin;

-- ─────────────────────────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id          uuid        primary key default gen_random_uuid(),
  customer_id uuid        not null references public.profiles(id) on delete cascade,
  product_id  uuid        not null references public.products(id) on delete cascade,
  order_id    text        references public.orders(id),
  rating      int         not null check (rating between 1 and 5),
  title       text        not null default '',
  body        text        not null default '',
  status      text        not null default 'PENDING'
                          check (status in ('PENDING','PUBLISHED','REJECTED')),
  verified    boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (customer_id, product_id, order_id)
);
create index if not exists reviews_product_idx  on public.reviews(product_id, status);
create index if not exists reviews_customer_idx on public.reviews(customer_id);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.reviews'::regclass and tgname = 'reviews_updated_at'
  ) then
    create trigger reviews_updated_at before update on public.reviews
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.reviews enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_public_read') then
    create policy reviews_public_read on public.reviews
      for select using (status = 'PUBLISHED');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_own') then
    create policy reviews_own on public.reviews for all to authenticated
      using (customer_id = (select auth.uid()))
      with check (customer_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_admin_all') then
    create policy reviews_admin_all on public.reviews for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- SUPPORT TICKETS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.support_tickets (
  id          uuid        primary key default gen_random_uuid(),
  customer_id uuid        not null references public.profiles(id) on delete cascade,
  order_id    text        references public.orders(id),
  category    text        not null default '',
  subject     text        not null default '',
  message     text        not null default '',
  priority    text        not null default 'NORMAL'
                          check (priority in ('LOW','NORMAL','HIGH')),
  status      text        not null default 'OPEN'
                          check (status in (
                            'OPEN','IN PROGRESS','WAITING FOR CUSTOMER','RESOLVED','CLOSED'
                          )),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists tickets_customer_idx on public.support_tickets(customer_id);
create index if not exists tickets_status_idx   on public.support_tickets(status);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.support_tickets'::regclass and tgname = 'tickets_updated_at'
  ) then
    create trigger tickets_updated_at before update on public.support_tickets
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.support_tickets enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='support_tickets' and policyname='tickets_own') then
    create policy tickets_own on public.support_tickets for all to authenticated
      using (customer_id = (select auth.uid()))
      with check (customer_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='support_tickets' and policyname='tickets_admin_all') then
    create policy tickets_admin_all on public.support_tickets for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- TICKET MESSAGES
-- ─────────────────────────────────────────────────────────────
create table if not exists public.ticket_messages (
  id          uuid        primary key default gen_random_uuid(),
  ticket_id   uuid        not null references public.support_tickets(id) on delete cascade,
  author_role text        not null check (author_role in ('CUSTOMER','SUPPORT')),
  body        text        not null,
  created_at  timestamptz not null default now()
);
create index if not exists ticket_messages_ticket_idx on public.ticket_messages(ticket_id, created_at asc);

alter table public.ticket_messages enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ticket_messages' and policyname='ticket_messages_own') then
    create policy ticket_messages_own on public.ticket_messages for all to authenticated
      using (ticket_id in (
        select id from public.support_tickets where customer_id = (select auth.uid())
      ))
      with check (ticket_id in (
        select id from public.support_tickets where customer_id = (select auth.uid())
      ));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ticket_messages' and policyname='ticket_messages_admin_all') then
    create policy ticket_messages_admin_all on public.ticket_messages for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- DISCOUNT CODES
-- ─────────────────────────────────────────────────────────────
create table if not exists public.discount_codes (
  id              uuid          primary key default gen_random_uuid(),
  code            text          not null unique,
  description     text          not null default '',
  discount_type   text          not null default 'PERCENTAGE'
                                check (discount_type in ('PERCENTAGE','FIXED')),
  discount_value  numeric(10,2) not null check (discount_value > 0),
  minimum_order   numeric(10,2) not null default 0,
  usage_limit     int,
  usage_count     int           not null default 0,
  starts_at       date          not null default current_date,
  expires_at      date,
  status          text          not null default 'ACTIVE'
                                check (status in ('ACTIVE','PAUSED','EXPIRED')),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);
create index if not exists discounts_code_idx   on public.discount_codes(code);
create index if not exists discounts_status_idx on public.discount_codes(status);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.discount_codes'::regclass and tgname = 'discounts_updated_at'
  ) then
    create trigger discounts_updated_at before update on public.discount_codes
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.discount_codes enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='discount_codes' and policyname='discounts_admin_all') then
    create policy discounts_admin_all on public.discount_codes for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
  -- Customers can read active codes to validate at checkout
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='discount_codes' and policyname='discounts_public_read') then
    create policy discounts_public_read on public.discount_codes
      for select using (status = 'ACTIVE');
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- CONTENT SECTIONS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.content_sections (
  id          text        primary key,  -- e.g. 'announcement', 'story'
  name        text        not null,
  summary     text        not null default '',
  body        text        not null default '',
  updated_at  timestamptz not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.content_sections'::regclass and tgname = 'content_updated_at'
  ) then
    create trigger content_updated_at before update on public.content_sections
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.content_sections enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='content_sections' and policyname='content_public_read') then
    create policy content_public_read on public.content_sections
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='content_sections' and policyname='content_admin_all') then
    create policy content_admin_all on public.content_sections for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

-- Seed default content sections (safe: ON CONFLICT DO NOTHING)
insert into public.content_sections (id, name, summary, body) values
  ('announcement', 'Homepage Announcement',  'A slower, more thoughtful hair-care ritual.',                    'Discover a botanical ritual, prepared with patience.'),
  ('story',        'Our Story',              'Rooted in nature. Designed for modern rituals.',                 '1st ROOT begins where botanical tradition has always begun — with patience.'),
  ('ingredients',  'Ingredients',            'Botanicals, one ingredient at a time.',                         'Explore the botanicals that shape the 1st ROOT ritual.'),
  ('ritual',       'Ritual',                 'Botanicals. Patience. Time.',                                   'Make room for a small, considered moment in your routine.'),
  ('journal',      'Journal',                'Notes from the world of botanical care.',                       'Journal content preview for the 1st ROOT storefront.'),
  ('faq',          'FAQ',                    'Helpful notes for customers.',                                  'Answers to common product and order questions.'),
  ('products',     'Product Content',        'Descriptions and product details.',                             'Product content is managed independently from the cinematic frame sequence.')
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- STORE SETTINGS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.store_settings (
  id                   int  primary key default 1 check (id = 1),  -- single row
  store_name           text not null default '1st ROOT',
  contact_email        text not null default '',
  contact_phone        text not null default '',
  currency             text not null default 'INR',
  timezone             text not null default 'Asia/Kolkata',
  email_notifications  boolean not null default true,
  low_stock_alerts     boolean not null default true,
  order_alerts         boolean not null default true,
  updated_at           timestamptz not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.store_settings'::regclass and tgname = 'settings_updated_at'
  ) then
    create trigger settings_updated_at before update on public.store_settings
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.store_settings enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='store_settings' and policyname='settings_admin_all') then
    create policy settings_admin_all on public.store_settings for all to authenticated
      using ((select firstroot_private.is_admin()))
      with check ((select firstroot_private.is_admin()));
  end if;
end $$;

-- Seed default settings row
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

commit;
