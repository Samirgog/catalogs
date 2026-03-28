-- Secure YooKassa gateway storage

alter table public.catalog_payment_gateways
  add column if not exists shop_id_encrypted text,
  add column if not exists secret_key_encrypted text,
  add column if not exists shop_id_masked text;

update public.catalog_payment_gateways
set shop_id_masked = case
  when shop_id_masked is not null then shop_id_masked
  when shop_id is null then null
  when length(shop_id) <= 4 then repeat('*', greatest(length(shop_id), 1))
  else repeat('*', greatest(length(shop_id) - 4, 1)) || right(shop_id, 4)
end
where shop_id_masked is null;

alter table public.catalog_payment_gateways enable row level security;

revoke all on public.catalog_payment_gateways from anon, authenticated;
