# YooKassa Hardening And RLS

## 1. What is already fixed in code

1. Frontend no longer reads `secret_key` back from `catalog_payment_gateways`.
2. Frontend no longer reads `shop_id` back from `catalog_payment_gateways`.
3. In admin UI, existing YooKassa settings are treated as "configured", and credentials are entered only when creating or rotating them.

Files:

- `/Users/samir/Documents/projects/catalogs/src/business/services/paymentGateways.ts`
- `/Users/samir/Documents/projects/catalogs/src/business/hooks/usePaymentGateway.ts`
- `/Users/samir/Documents/projects/catalogs/src/business/pages/ActionsEditorPage.tsx`

## 2. Immediate YooKassa hardening that should be done next

### Step 1. Stop direct browser access to `catalog_payment_gateways`

Move all read/write operations for YooKassa settings from direct Supabase table access to Edge Functions:

1. `payment-gateway-get`
2. `payment-gateway-upsert`
3. `payment-gateway-toggle`

Each function must:

1. Accept `initData` from Telegram WebApp.
2. Validate `initData` exactly the same way as `/supabase/functions/catalogs-auth-function/index.ts`.
3. Resolve current user by `telegram_id`.
4. Check access through `catalog_user_access` or `catalogs.owner_id`.
5. Return only public fields:
   - `id`
   - `catalog_id`
   - `provider`
   - `is_enabled`
   - `is_configured`
   - `shop_id_masked`
   - `created_at`
   - `updated_at`

### Step 2. Encrypt `shop_id` and `secret_key` before saving to DB

Do not keep raw values in plaintext columns.

Use this storage model:

1. Add columns:
   - `shop_id_encrypted text not null`
   - `secret_key_encrypted text not null`
   - `shop_id_masked text not null`
2. Backfill encrypted values.
3. Drop plaintext columns:
   - `shop_id`
   - `secret_key`

Recommended approach:

1. Generate `PAYMENT_CONFIG_MASTER_KEY` and store it only in Supabase Edge Function secrets.
2. Encrypt in Edge Functions before write.
3. Decrypt only inside server-side payment functions:
   - `/supabase/functions/yookassa-create-payment/index.ts`
   - `/supabase/functions/yookassa-sync-payment/index.ts`
   - `/supabase/functions/yookassa-webhook/index.ts`

### Step 3. Update `_shared/yookassa.ts`

`getOrderWithGateway()` must read only encrypted fields and decrypt them in memory:

1. Load `shop_id_encrypted`, `secret_key_encrypted`, `shop_id_masked`, `is_enabled`.
2. Decrypt in Edge Function runtime.
3. Never return decrypted values to frontend.

### Step 4. Rotate already leaked credentials

After shipping the new flow:

1. Rotate `secret_key` in YooKassa cabinet.
2. Re-save credentials through secured Edge Function.
3. Verify that plaintext no longer exists in DB.

## 3. Exact SQL for encrypted storage migration

```sql
alter table public.catalog_payment_gateways
  add column if not exists shop_id_encrypted text,
  add column if not exists secret_key_encrypted text,
  add column if not exists shop_id_masked text;

update public.catalog_payment_gateways
set shop_id_masked = case
  when length(shop_id) <= 4 then repeat('*', greatest(length(shop_id), 1))
  else repeat('*', greatest(length(shop_id) - 4, 1)) || right(shop_id, 4)
end
where shop_id_masked is null
  and shop_id is not null;
```

Backfill encrypted values must be done from server code, not in SQL, because the encryption key must not live inside the database.

After backfill:

```sql
alter table public.catalog_payment_gateways
  alter column shop_id_encrypted set not null,
  alter column secret_key_encrypted set not null,
  alter column shop_id_masked set not null;

alter table public.catalog_payment_gateways
  drop column if exists shop_id,
  drop column if exists secret_key;
```

## 4. RLS: what can be enabled right now

With the current architecture, frontend uses the anon key directly and does not create a Supabase Auth session. Because of that, full table-by-table RLS for all business data will break the app if enabled blindly.

What can be enabled immediately and safely after moving payment gateway access to Edge Functions:

1. `catalog_payment_gateways`
2. `order_notifications`
3. `client_order_notifications`
4. `catalog_staff_codes`
5. `catalog_staff_members`
6. `client_bot_chats`

These tables should not be directly available from browser clients at all.

## 5. Exact RLS SQL for sensitive tables

After frontend access is removed, apply:

```sql
alter table public.catalog_payment_gateways enable row level security;
alter table public.order_notifications enable row level security;
alter table public.client_order_notifications enable row level security;
alter table public.catalog_staff_codes enable row level security;
alter table public.catalog_staff_members enable row level security;
alter table public.client_bot_chats enable row level security;

revoke all on public.catalog_payment_gateways from anon, authenticated;
revoke all on public.order_notifications from anon, authenticated;
revoke all on public.client_order_notifications from anon, authenticated;
revoke all on public.catalog_staff_codes from anon, authenticated;
revoke all on public.catalog_staff_members from anon, authenticated;
revoke all on public.client_bot_chats from anon, authenticated;
```

No `create policy` is needed here if all access goes only through Edge Functions with service role.

## 6. RLS for the rest of the app

For `catalogs`, `items`, `categories`, `orders`, `actions`, `fulfillment_methods`, `catalog_user_access` you have two real options.

### Option A. Recommended

1. Introduce real Supabase Auth session for Telegram users.
2. Map Telegram user to Supabase `auth.users`.
3. Send authenticated JWT from browser.
4. Write normal RLS policies with `auth.uid()`.

### Option B. More work operationally

1. Keep anon client.
2. Remove all direct table access from browser.
3. Move all reads/writes into Edge Functions.
4. Turn browser into pure function caller.

## 7. If you choose Option A, implement it in this order

1. Extend `/supabase/functions/catalogs-auth-function/index.ts` so it not only validates Telegram `initData`, but also creates or finds a linked auth user.
2. Store link table `telegram_id -> auth_user_id -> public.users.id`.
3. Exchange validated Telegram login for real Supabase session tokens.
4. Replace direct anonymous `createClient` usage with authenticated client session.
5. Only after that enable RLS on application tables.

## 8. Minimum policy set for full business access after Supabase Auth

Example shape:

```sql
create policy catalogs_select_for_members
on public.catalogs
for select
using (
  exists (
    select 1
    from public.catalog_user_access cua
    where cua.catalog_id = catalogs.id
      and cua.user_id = auth.uid()
  )
);
```

Before this can work, `public.users.id` must match auth identity or be deterministically linked in policy through a helper function.

## 9. Deployment order

1. Ship current frontend fix that stops reading secrets into browser.
2. Add secure Edge Functions for payment gateway management.
3. Encrypt YooKassa credentials and backfill.
4. Rotate leaked YooKassa secret.
5. Enable RLS and revoke direct browser access on sensitive tables.
6. Then choose either full Supabase Auth + RLS, or full Edge Function proxy for the rest of the app.
