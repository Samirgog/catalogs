-- Online payments via YooKassa + shared catalog access

create table if not exists public.catalog_payment_gateways (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  provider text not null,
  is_enabled boolean not null default true,
  shop_id text not null,
  secret_key text not null,
  success_return_url text null,
  fail_return_url text null,
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_payment_gateways_provider_check
    check (provider in ('yookassa'))
);

create unique index if not exists catalog_payment_gateways_catalog_provider_uidx
  on public.catalog_payment_gateways(catalog_id, provider);

create index if not exists catalog_payment_gateways_catalog_idx
  on public.catalog_payment_gateways(catalog_id);

alter table public.orders
  add column if not exists payment_provider text null,
  add column if not exists payment_external_id text null,
  add column if not exists payment_status text null,
  add column if not exists payment_confirmation_url text null,
  add column if not exists payment_details jsonb not null default '{}'::jsonb;

alter table public.orders
  drop constraint if exists orders_payment_provider_check;

alter table public.orders
  add constraint orders_payment_provider_check
  check (
    payment_provider is null
    or payment_provider in ('yookassa')
  );

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
  check (
    payment_status is null
    or payment_status in ('pending', 'waiting_for_capture', 'succeeded', 'canceled')
  );

create index if not exists orders_payment_external_id_idx
  on public.orders(payment_external_id);

create table if not exists public.catalog_access_invites (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  code text not null,
  role text not null default 'editor',
  created_by uuid null references public.users(id) on delete set null,
  expires_at timestamptz null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_access_invites_role_check
    check (role in ('editor'))
);

create unique index if not exists catalog_access_invites_code_uidx
  on public.catalog_access_invites(code);

create unique index if not exists catalog_access_invites_active_catalog_uidx
  on public.catalog_access_invites(catalog_id)
  where is_active = true;

create table if not exists public.catalog_user_access (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'editor',
  granted_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_user_access_role_check
    check (role in ('owner', 'editor'))
);

create unique index if not exists catalog_user_access_catalog_user_uidx
  on public.catalog_user_access(catalog_id, user_id);

create index if not exists catalog_user_access_user_idx
  on public.catalog_user_access(user_id);

insert into public.catalog_user_access(catalog_id, user_id, role, granted_by)
select c.id, c.owner_id, 'owner', c.owner_id
from public.catalogs c
where c.owner_id is not null
on conflict (catalog_id, user_id) do nothing;
