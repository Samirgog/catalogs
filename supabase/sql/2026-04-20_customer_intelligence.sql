create table if not exists public.customer_events (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  customer_id uuid not null references public.users(id) on delete cascade,
  order_id uuid null references public.orders(id) on delete set null,
  event_type text not null,
  source text not null default 'direct_link',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists customer_events_catalog_customer_idx
  on public.customer_events(catalog_id, customer_id, created_at desc);

create index if not exists customer_events_catalog_event_idx
  on public.customer_events(catalog_id, event_type, created_at desc);

create table if not exists public.customer_favorites (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  customer_id uuid not null references public.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (catalog_id, customer_id, item_id)
);

create index if not exists customer_favorites_catalog_customer_idx
  on public.customer_favorites(catalog_id, customer_id, created_at desc);

create table if not exists public.catalog_related_items (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  source_item_id uuid not null references public.items(id) on delete cascade,
  related_item_id uuid not null references public.items(id) on delete cascade,
  priority integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (catalog_id, source_item_id, related_item_id),
  check (source_item_id <> related_item_id)
);

create index if not exists catalog_related_items_source_idx
  on public.catalog_related_items(catalog_id, source_item_id, priority asc, created_at desc);

create table if not exists public.customer_tags (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  customer_id uuid not null references public.users(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique (catalog_id, customer_id, tag)
);

create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  customer_id uuid not null references public.users(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
