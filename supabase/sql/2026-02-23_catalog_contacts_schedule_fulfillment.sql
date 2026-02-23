-- Catalog contacts, schedule and fulfillment methods

-- 1) Catalog fields: address, working hours, emergency contacts
alter table public.catalogs
  add column if not exists address text,
  add column if not exists is_open_24_7 boolean not null default false,
  add column if not exists work_start time,
  add column if not exists work_end time,
  add column if not exists emergency_phone text,
  add column if not exists emergency_telegram text;

-- 2) Fulfillment methods (pickup/delivery) per catalog
create table if not exists public.catalog_fulfillment_methods (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  method text not null check (method in ('pickup', 'delivery')),
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (catalog_id, method)
);

create index if not exists catalog_fulfillment_methods_catalog_idx
  on public.catalog_fulfillment_methods(catalog_id);

-- Optional seed so both methods appear in UI immediately for existing catalogs
insert into public.catalog_fulfillment_methods (catalog_id, method, is_enabled)
select c.id, m.method, false
from public.catalogs c
cross join (values ('pickup'::text), ('delivery'::text)) as m(method)
on conflict (catalog_id, method) do nothing;

-- 3) Save selected fulfillment method in order
alter table public.orders
  add column if not exists fulfillment_method text;

alter table public.orders
  drop constraint if exists orders_fulfillment_method_check;

alter table public.orders
  add constraint orders_fulfillment_method_check
  check (
    fulfillment_method is null
    or fulfillment_method in ('pickup', 'delivery')
  );
