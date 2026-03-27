import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getOrderStatusLabel } from '../../../src/shared/orderStatus.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN_CLIENT');
const CLIENT_BOT_USERNAME =
  (Deno.env.get('CLIENT_BOT_USERNAME') || 'catalogs_client_bot').replace('@', '');
const CLIENT_APP_SHORT_NAME = Deno.env.get('CLIENT_APP_SHORT_NAME') || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BOT_TOKEN) {
  throw new Error(
    'Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/TELEGRAM_BOT_TOKEN_CLIENT'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function tg(method: string, body: unknown) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) {
    throw new Error(`Telegram API error (${method}): ${JSON.stringify(json)}`);
  }
  return json.result;
}

function statusLabel(status: string, fulfillmentMethod?: string) {
  return getOrderStatusLabel(status, fulfillmentMethod);
}

function formatMessage(order: Record<string, unknown>) {
  const orderNo =
    order.order_number || String(order.id || '').slice(0, 8).toUpperCase();
  const total = Number(order.total_price || 0);
  return [
    `📦 Обновление по заказу №${orderNo}`,
    `Статус: ${statusLabel(
      String(order.status || 'created'),
      String(order.fulfillment_method || ''),
    )}`,
    `Сумма: ${total} ₽`,
  ].join('\n');
}

async function markNotification(
  notificationId: string,
  patch: Record<string, unknown>
) {
  await supabase
    .from('client_order_notifications')
    .update({
      ...patch,
      sent_at: new Date().toISOString(),
    })
    .eq('id', notificationId);
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('OK');

  try {
    const body = await req.json();
    const notificationId = String(body.notification_id || '');
    const orderId = String(body.order_id || '');
    const customerId = String(body.customer_id || '');

    if (!notificationId || !orderId || !customerId) {
      return new Response('Missing notification_id/order_id/customer_id', {
        status: 400,
      });
    }

    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
    if (!order) {
      await markNotification(notificationId, { error: 'Order not found' });
      return new Response('Order not found', { status: 404 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('id', customerId)
      .maybeSingle();
    if (!user?.telegram_id) {
      await markNotification(notificationId, { error: 'User telegram_id not found' });
      return new Response('User telegram_id not found', { status: 200 });
    }

    const { data: chat } = await supabase
      .from('client_bot_chats')
      .select('chat_id')
      .eq('telegram_user_id', user.telegram_id)
      .eq('is_active', true)
      .maybeSingle();
    if (!chat?.chat_id) {
      await markNotification(notificationId, { error: 'Client chat not registered in bot' });
      return new Response('Client chat not registered', { status: 200 });
    }

    const slugFallback = `catalog_${order.catalog_id}`;
    const { data: qrLink } = await supabase
      .from('qr_links')
      .select('slug')
      .eq('target_type', 'catalog')
      .eq('target_id', order.catalog_id)
      .limit(1)
      .maybeSingle();
    const startapp = qrLink?.slug || slugFallback;
    const deeplink = CLIENT_APP_SHORT_NAME
      ? `https://t.me/${CLIENT_BOT_USERNAME}/${CLIENT_APP_SHORT_NAME}?startapp=${encodeURIComponent(startapp)}`
      : `https://t.me/${CLIENT_BOT_USERNAME}?startapp=${encodeURIComponent(startapp)}`;

    await tg('sendMessage', {
      chat_id: chat.chat_id,
      text: formatMessage(order),
      reply_markup: {
        inline_keyboard: [[{ text: 'Открыть каталог', url: deeplink }]],
      },
    });

    await markNotification(notificationId, { error: null });
    return new Response('OK');
  } catch (error) {
    console.error('client-order-notify error', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
