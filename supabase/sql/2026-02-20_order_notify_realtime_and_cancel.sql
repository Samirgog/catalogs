-- Realtime notifications for staff bot + cancel event support

-- 1) Ensure pg_net exists (fixes "schema net does not exist")
create extension if not exists pg_net with schema extensions;

-- Compatibility helper for different pg_net signatures
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

-- 2) Enqueue notifications also for client-side cancellation
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
       and new.status in ('submitted', 'payment_reported', 'cancelled') then
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

-- 3) HTTP callback from order_notifications to Edge Function
create or replace function public.notify_new_order()
returns trigger
language plpgsql
as $$
declare
  v_url text := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/order-notify';
begin
  perform public.http_post_json(
    v_url,
    jsonb_build_object(
      'notification_id', new.id,
      'order_id', new.order_id,
      'catalog_id', new.catalog_id,
      'event_type', new.event_type,
      'payload', new.payload
    )
  );
  return new;
end;
$$;

drop trigger if exists order_notify_trigger on public.order_notifications;

create trigger order_notify_trigger
after insert on public.order_notifications
for each row
execute function public.notify_new_order();
