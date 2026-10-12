begin;

create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 200),
  email text not null default '',
  phone text not null default '',
  source text not null default 'Manual',
  stage text not null default 'New' check (stage in ('New','Contacted','Qualified','Won','Lost')),
  value numeric(12,2) not null default 0 check (value >= 0),
  follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index crm_contacts_follow_up_idx on public.crm_contacts(follow_up_at);
create index crm_contacts_customer_idx on public.crm_contacts(customer_id);
create trigger crm_contacts_updated_at before update on public.crm_contacts
  for each row execute function public.set_updated_at();

create table public.crm_notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.crm_contacts(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 10000),
  created_at timestamptz not null default now()
);
create index crm_notes_contact_idx on public.crm_notes(contact_id, created_at);

alter table public.crm_contacts enable row level security;
alter table public.crm_notes enable row level security;
create policy crm_contacts_admin on public.crm_contacts for all to authenticated
  using ((select firstroot_private.is_admin())) with check ((select firstroot_private.is_admin()));
create policy crm_notes_admin on public.crm_notes for all to authenticated
  using ((select firstroot_private.is_admin())) with check ((select firstroot_private.is_admin()));
grant select, insert, update, delete on public.crm_contacts, public.crm_notes to authenticated;
commit;
