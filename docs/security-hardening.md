# Безопасность YooKassa и RLS

## Что уже внедрено

1. Фронт больше не читает `shop_id` и `secret_key` напрямую из `catalog_payment_gateways`.
2. Для управления настройками добавлены Edge Functions:
   - `payment-gateway-get`
   - `payment-gateway-upsert`
   - `payment-gateway-toggle`
3. В Edge Functions добавлена проверка Telegram `initData` и проверка доступа к каталогу.
4. Для хранения секрета подготовлено серверное шифрование через `PAYMENT_CONFIG_MASTER_KEY`.
5. Платежные функции YooKassa умеют читать зашифрованные поля и пока имеют fallback на старые plaintext-поля.

## Что применить в Supabase

1. Задать секрет `PAYMENT_CONFIG_MASTER_KEY`.
   Требование: base64-строка для 32-байтового ключа AES-GCM.
2. Задеплоить функции:
   - `payment-gateway-get`
   - `payment-gateway-upsert`
   - `payment-gateway-toggle`
3. Применить SQL:
   - `/Users/samir/Documents/projects/catalogs/supabase/sql/2026-03-27_secure_yookassa_gateways.sql`
4. После этого один раз пересохранить настройки YooKassa в админке, чтобы новые значения уже попали в `shop_id_encrypted` и `secret_key_encrypted`.
5. После пересохранения всех рабочих магазинов:
   - проверить, что платежи создаются успешно
   - ротировать старые `secret_key` в кабинете YooKassa
   - удалить plaintext-колонки `shop_id` и `secret_key`

## Что еще важно по RLS

Для `catalog_payment_gateways` RLS уже можно включать, потому что браузерный доступ убран и работа идет через Edge Functions.

Для остальных таблиц полное включение RLS все еще нужно делать аккуратно, потому что проект пока работает через anon client без полноценной Supabase Auth session. Для них безопасный путь такой:

1. Или переводить доступ на Edge Functions.
2. Или вводить нормальную Supabase Auth session и только потом писать политики на `auth.uid()`.
