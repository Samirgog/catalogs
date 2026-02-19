-- =========================
-- Order/Staff system schema
-- =========================

-- 1) Human-readable order number
create sequence if not exists public.orders_order_number_seq;

alter table public.orders
  add column if not exists order_number bigint;

alter table public.orders
  alter column order_number set default nextval('public.orders_order_number_seq');

update public.orders
set order_number = nextval('public.orders_order_number_seq')
where order_number is null;

alter table public.orders
  alter column order_number set not null;

create unique index if not exists orders_order_number_uidx
  on public.orders(order_number);

-- 2) Extended order statuses
alter table public.orders
  alter column status type text using status::text;

alter table public.orders
  alter column status set default 'created';

update public.orders
set status = 'submitted'
where status = 'new';

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (
    status in (
      'created',
      'submitted',
      'payment_reported',
      'accepted',
      'rejected',
      'ready',
      'paid',
      'completed',
      'cancelled'
    )
  );

-- 3) Access codes for staff binding
create table if not exists public.catalog_staff_codes (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  access_code text not null unique,
  is_active boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (catalog_id)
);

create index if not exists catalog_staff_codes_catalog_idx
  on public.catalog_staff_codes(catalog_id);

-- 4) Staff members bound via bot
create table if not exists public.catalog_staff_members (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  telegram_id bigint not null,
  username text,
  first_name text,
  last_name text,
  is_active boolean not null default true,
  on_shift boolean not null default false,
  linked_at timestamptz not null default now(),
  last_activity_at timestamptz,
  unique (catalog_id, telegram_id)
);

create index if not exists catalog_staff_members_catalog_idx
  on public.catalog_staff_members(catalog_id);

create index if not exists catalog_staff_members_shift_idx
  on public.catalog_staff_members(catalog_id, on_shift, is_active);

-- 5) Notification queue consumed by bot
create table if not exists public.order_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  sent_to_member_id uuid references public.catalog_staff_members(id) on delete set null,
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists order_notifications_pending_idx
  on public.order_notifications(sent_at, created_at)
  where sent_at is null;

create unique index if not exists order_notifications_unique_event_idx
  on public.order_notifications(order_id, event_type)
  where sent_at is null;

-- 6) Trigger to enqueue notifications for target statuses
create or replace function public.enqueue_order_notification()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status in ('submitted', 'payment_reported') then
      insert into public.order_notifications(order_id, catalog_id, event_type, payload)
      values (
        new.id,
        new.catalog_id,
        concat('order_status:', new.status),
        jsonb_build_object('status', new.status)
      )
      on conflict do nothing;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status
       and new.status in ('submitted', 'payment_reported') then
      insert into public.order_notifications(order_id, catalog_id, event_type, payload)
      values (
        new.id,
        new.catalog_id,
        concat('order_status:', new.status),
        jsonb_build_object('status', new.status)
      )
      on conflict do nothing;
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enqueue_order_notification on public.orders;

create trigger trg_enqueue_order_notification
after insert or update of status on public.orders
for each row
execute function public.enqueue_order_notification();
