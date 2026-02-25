-- Catalog subtype + extended fulfillment + order payment/address fields

-- 1) Catalog subtype
alter table public.catalogs
  add column if not exists subtype text;

alter table public.catalogs
  drop constraint if exists catalogs_subtype_check;

alter table public.catalogs
  add constraint catalogs_subtype_check
  check (
    subtype is null
    or subtype in (
      'shop',
      'cafe_restaurant',
      'digital_store',
      'salon',
      'private_master',
      'studio_club'
    )
  );

-- Default subtype for existing rows
update public.catalogs
set subtype = case
  when type = 'goods' then 'shop'
  when type = 'services' then 'salon'
  else subtype
end
where subtype is null;

-- 2) Extended fulfillment methods
alter table public.catalog_fulfillment_methods
  drop constraint if exists catalog_fulfillment_methods_method_check;

alter table public.catalog_fulfillment_methods
  add constraint catalog_fulfillment_methods_method_check
  check (
    method in (
      'pickup',
      'delivery',
      'digital',
      'to_table',
      'on_site',
      'at_client'
    )
  );

-- Seed missing methods for existing catalogs by type/subtype
insert into public.catalog_fulfillment_methods (catalog_id, method, is_enabled)
select c.id, m.method, false
from public.catalogs c
join lateral (
  select unnest(
    case
      when c.type = 'goods' and c.subtype = 'shop'
        then array['delivery', 'pickup', 'digital']::text[]
      when c.type = 'goods' and c.subtype = 'cafe_restaurant'
        then array['delivery', 'pickup', 'to_table']::text[]
      when c.type = 'goods' and c.subtype = 'digital_store'
        then array['digital']::text[]
      when c.type = 'services'
        then array['on_site', 'at_client']::text[]
      else array['pickup', 'delivery']::text[]
    end
  ) as method
) m on true
on conflict (catalog_id, method) do nothing;

-- 3) Orders: payment method + delivery address + extended fulfillment check
alter table public.orders
  add column if not exists payment_method text,
  add column if not exists delivery_address text;

alter table public.orders
  drop constraint if exists orders_fulfillment_method_check;

alter table public.orders
  add constraint orders_fulfillment_method_check
  check (
    fulfillment_method is null
    or fulfillment_method in (
      'pickup',
      'delivery',
      'digital',
      'to_table',
      'on_site',
      'at_client'
    )
  );

alter table public.orders
  drop constraint if exists orders_payment_method_check;

alter table public.orders
  add constraint orders_payment_method_check
  check (
    payment_method is null
    or payment_method in (
      'payment_on_delivery',
      'payment_in_chat',
      'light_sbp'
    )
  );

create index if not exists orders_payment_method_idx
  on public.orders(payment_method);

create index if not exists orders_fulfillment_method_idx
  on public.orders(fulfillment_method);
