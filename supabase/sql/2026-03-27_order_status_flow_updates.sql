-- Order status flow updates by fulfillment method

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
      'in_transit',
      'delivered',
      'completed',
      'cancelled'
    )
  );

create or replace function public.enqueue_client_order_notification()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
     and new.status is distinct from old.status
     and new.status in (
       'submitted',
       'payment_reported',
       'accepted',
       'rejected',
       'ready',
       'in_transit',
       'delivered',
       'completed',
       'cancelled'
     ) then
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
