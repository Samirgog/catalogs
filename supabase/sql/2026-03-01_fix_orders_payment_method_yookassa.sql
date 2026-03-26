-- Fix orders.payment_method constraint to allow YooKassa online payments

alter table public.orders
  drop constraint if exists orders_payment_method_check;

alter table public.orders
  add constraint orders_payment_method_check
  check (
    payment_method is null
    or payment_method in (
      'payment_on_delivery',
      'payment_in_chat',
      'light_sbp',
      'online_yookassa'
    )
  );
