-- Client bot bindings + client order status notifications

create extension if not exists pg_net with schema extensions;

-- Compatible wrapper for pg_net signatures
create or replace function public.http_post_json(p_url text, p_body jsonb)
returns void
language plpgsql
as $$
begin
  if to_regprocedure('extensions.http_post(text,jsonb,jsonb,jsonb,integer)') is not null then
    perform extensions.http_post(
      p_url,
      p_body,
      '{}'::jsonb,
      '{"Content-Type":"application/json"}'::jsonb,
      5000
    );
  elsif to_regprocedure('extensions.http_post(text,jsonb,jsonb,jsonb)') is not null then
    perform extensions.http_post(
      p_url,
      p_body,
      '{}'::jsonb,
      '{"Content-Type":"application/json"}'::jsonb
    );
  elsif to_regprocedure('extensions.http_post(text,jsonb,jsonb)') is not null then
    perform extensions.http_post(
      p_url,
      p_body,
      '{"Content-Type":"application/json"}'::jsonb
    );
  elsif to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is not null then
    perform net.http_post(
      p_url,
      p_body,
      '{}'::jsonb,
      '{"Content-Type":"application/json"}'::jsonb,
      5000
    );
  elsif to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb)') is not null then
    perform net.http_post(
      p_url,
      p_body,
      '{}'::jsonb,
      '{"Content-Type":"application/json"}'::jsonb
    );
  elsif to_regprocedure('net.http_post(text,jsonb,jsonb)') is not null then
    perform net.http_post(
      p_url,
      p_body,
      '{"Content-Type":"application/json"}'::jsonb
    );
  else
    raise exception 'No compatible http_post signature found (extensions/net)';
  end if;
end;
$$;

create table if not exists public.client_bot_chats (
  telegram_user_id bigint primary key,
  chat_id bigint not null unique,
  username text null,
  first_name text null,
  last_name text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_client_bot_chats_active
  on public.client_bot_chats (is_active, last_seen_at desc);

create table if not exists public.client_order_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  customer_id uuid not null references public.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz null,
  error text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_order_notifications_pending
  on public.client_order_notifications (sent_at, created_at)
  where sent_at is null;

create index if not exists idx_client_order_notifications_order
  on public.client_order_notifications (order_id, created_at desc);

create or replace function public.enqueue_client_order_notification()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
     and new.status is distinct from old.status
     and new.status in ('submitted', 'payment_reported', 'accepted', 'rejected', 'ready', 'completed', 'cancelled') then
    insert into public.client_order_notifications(order_id, catalog_id, customer_id, event_type, payload)
    values (
      new.id,
      new.catalog_id,
      new.customer_id,
      concat('order_status:', new.status),
      jsonb_build_object('status', new.status)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists orders_enqueue_client_notification on public.orders;
create trigger orders_enqueue_client_notification
after update on public.orders
for each row
execute function public.enqueue_client_order_notification();

create or replace function public.notify_client_order()
returns trigger
language plpgsql
as $$
declare
  v_url text := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/client-order-notify';
begin
  perform public.http_post_json(
    v_url,
    jsonb_build_object(
      'notification_id', new.id,
      'order_id', new.order_id,
      'catalog_id', new.catalog_id,
      'customer_id', new.customer_id,
      'event_type', new.event_type,
      'payload', new.payload
    )
  );

  return new;
end;
$$;

drop trigger if exists client_order_notify_trigger on public.client_order_notifications;
create trigger client_order_notify_trigger
after insert on public.client_order_notifications
for each row
execute function public.notify_client_order();
