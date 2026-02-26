import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN_STAFF');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BOT_TOKEN) {
  throw new Error('Missing env vars');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const STATUS_LABELS: Record<string, string> = {
  created: 'Создан',
  submitted: 'Оформлен',
  payment_reported: 'Оплата отмечена клиентом',
  accepted: 'Принят в работу',
  rejected: 'Отклонен',
  ready: 'Готов',
  paid: 'Оплачен',
  completed: 'Завершен',
  cancelled: 'Отменен клиентом',
};

function statusLabel(status: string) {
  return STATUS_LABELS[status] || status;
}

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

function formatOrderText(order: Record<string, unknown>) {
  const orderNo = order.order_number || String(order.id || '').slice(0, 8).toUpperCase();
  const items = Array.isArray(order.items) ? order.items : [];
  const lines = items.map((item: Record<string, unknown>) => {
    const title = item?.title || 'Позиция';
    const qty = Number(item?.quantity || 1);
    const price = Number(item?.price || 0);
    return `• ${title} x${qty} — ${price * qty} ₽`;
  });

  const paymentMethod = String(order.payment_method || '');
  const paymentLabel =
    paymentMethod === 'light_sbp'
      ? 'Упрощенная СБП'
      : paymentMethod === 'payment_in_chat'
        ? 'Через Telegram-чат'
        : paymentMethod === 'payment_on_delivery'
          ? 'При получении'
          : String(order.status) === 'payment_reported'
            ? 'СБП (клиент отметил оплату)'
            : 'Не указан';
  const fulfillmentMethod = String(order.fulfillment_method || '');
  const fulfillmentLabel =
    fulfillmentMethod === 'delivery'
      ? 'Доставка'
      : fulfillmentMethod === 'pickup'
        ? 'Самовывоз'
        : fulfillmentMethod === 'digital'
          ? 'Цифровой продукт'
          : fulfillmentMethod === 'to_table'
            ? 'К столику'
            : fulfillmentMethod === 'on_site'
              ? 'На месте'
              : fulfillmentMethod === 'at_client'
                ? 'У клиента'
                : 'Не указан';

  return [
    `🧾 <b>Заказ №${orderNo}</b>`,
    `Статус: <b>${statusLabel(String(order.status || 'created'))}</b>`,
    `Сумма: <b>${Number(order.total_price || 0)} ₽</b>`,
    `Имя: <b>${String(order.customer_name || 'Не указано')}</b>`,
    `Телефон: <b>${String(order.customer_phone || 'Не указан')}</b>`,
    `Комментарий: <b>${String(order.customer_comment || 'Нет')}</b>`,
    `Способ оплаты: <b>${paymentLabel}</b>`,
    `Способ получения: <b>${fulfillmentLabel}</b>`,
    ...(order.table_number
      ? [`Столик: <b>${String(order.table_number)}</b>`]
      : []),
    ...(order.delivery_address
      ? [`Адрес: <b>${String(order.delivery_address)}</b>`]
      : []),
    '',
    ...lines,
  ].join('\n');
}

function orderActionKeyboard(orderId: string) {
  return {
    inline_keyboard: [[
      { text: 'Принять', callback_data: `order_accept:${orderId}` },
      { text: 'Отклонить', callback_data: `order_reject:${orderId}` },
    ]],
  };
}

async function markNotificationSent(params: {
  notificationId: string;
  sentToMemberId: string | null;
  error: string | null;
  payloadPatch?: Record<string, unknown>;
}) {
  const patch: Record<string, unknown> = {
    sent_to_member_id: params.sentToMemberId,
    error: params.error,
    sent_at: new Date().toISOString(),
  };

  if (params.payloadPatch) {
    patch.payload = params.payloadPatch;
  }

  await supabase
    .from('order_notifications')
    .update(patch)
    .eq('id', params.notificationId);
}

async function findStaffOnShift(catalogId: string) {
  const { data } = await supabase
    .from('catalog_staff_members')
    .select('*')
    .eq('catalog_id', catalogId)
    .eq('is_active', true)
    .eq('on_shift', true)
    .order('last_activity_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

async function getOrder(orderId: string) {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();
  return data;
}

async function notifyNewOrPaymentReportedOrder(params: {
  notificationId: string;
  order: Record<string, unknown>;
  catalogId: string;
  payload: Record<string, unknown>;
}) {
  const staff = await findStaffOnShift(params.catalogId);
  if (!staff) {
    await supabase
      .from('order_notifications')
      .update({ error: 'No active staff on shift' })
      .eq('id', params.notificationId);
    return new Response('No active staff on shift', { status: 200 });
  }

  const sent = await tg('sendMessage', {
    chat_id: staff.telegram_id,
    text: formatOrderText(params.order),
    parse_mode: 'HTML',
    reply_markup: orderActionKeyboard(String(params.order.id)),
  });

  await markNotificationSent({
    notificationId: params.notificationId,
    sentToMemberId: staff.id,
    error: null,
    payloadPatch: {
      ...params.payload,
      telegram_message_text: formatOrderText(params.order),
      telegram_chat_id: staff.telegram_id,
      telegram_message_id: sent.message_id,
    },
  });

  return new Response('OK');
}

async function notifyOrderCancelled(params: {
  notificationId: string;
  order: Record<string, unknown>;
  payload: Record<string, unknown>;
}) {
  const orderId = String(params.order.id);

  const { data: lastSent } = await supabase
    .from('order_notifications')
    .select('*')
    .eq('order_id', orderId)
    .not('sent_to_member_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastSent?.sent_to_member_id) {
    await markNotificationSent({
      notificationId: params.notificationId,
      sentToMemberId: null,
      error: 'No previous sent notification for this order',
    });
    return new Response('No staff to notify for cancelled order', { status: 200 });
  }

  const { data: staff } = await supabase
    .from('catalog_staff_members')
    .select('*')
    .eq('id', lastSent.sent_to_member_id)
    .maybeSingle();

  if (!staff) {
    await markNotificationSent({
      notificationId: params.notificationId,
      sentToMemberId: null,
      error: 'Staff member not found',
    });
    return new Response('Staff member not found', { status: 200 });
  }

  const orderNo = params.order.order_number || String(params.order.id).slice(0, 8).toUpperCase();
  await tg('sendMessage', {
    chat_id: staff.telegram_id,
    text: `❌ <b>Заказ №${orderNo} отменен клиентом</b>`,
    parse_mode: 'HTML',
  });

  const previousChatId = Number(lastSent.payload?.telegram_chat_id || 0);
  const previousMessageId = Number(lastSent.payload?.telegram_message_id || 0);
  if (previousChatId && previousMessageId) {
    try {
      await tg('editMessageReplyMarkup', {
        chat_id: previousChatId,
        message_id: previousMessageId,
        reply_markup: { inline_keyboard: [] },
      });
      const previousText = String(lastSent.payload?.telegram_message_text || '');
      if (previousText) {
        await tg('editMessageText', {
          chat_id: previousChatId,
          message_id: previousMessageId,
          text: `${previousText}\n\n❌ <b>Заказ отменен клиентом</b>`,
          parse_mode: 'HTML',
        });
      }
    } catch (_err) {
      // Soft-fail: cancellation alert already sent to staff.
    }
  }

  await markNotificationSent({
    notificationId: params.notificationId,
    sentToMemberId: lastSent.sent_to_member_id,
    error: null,
    payloadPatch: {
      ...params.payload,
      linked_notification_id: lastSent.id,
    },
  });

  return new Response('OK');
}

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('OK');
  }

  try {
    const body = await req.json();
    const orderId = String(body.order_id || '');
    const catalogId = String(body.catalog_id || '');
    const notificationId = String(body.notification_id || '');
    const eventType = String(body.event_type || '');

    if (!orderId || !catalogId || !notificationId || !eventType) {
      return new Response('Missing order_id/catalog_id/notification_id/event_type', {
        status: 400,
      });
    }

    const order = await getOrder(orderId);
    if (!order) {
      await markNotificationSent({
        notificationId,
        sentToMemberId: null,
        error: 'Order not found',
      });
      return new Response('Order not found', { status: 404 });
    }

    const payload = (body.payload && typeof body.payload === 'object') ? body.payload : {};

    if (eventType === 'order_status:cancelled') {
      return await notifyOrderCancelled({
        notificationId,
        order,
        payload,
      });
    }

    if (eventType === 'order_status:submitted' || eventType === 'order_status:payment_reported') {
      return await notifyNewOrPaymentReportedOrder({
        notificationId,
        order,
        catalogId,
        payload,
      });
    }

    await markNotificationSent({
      notificationId,
      sentToMemberId: null,
      error: `Unsupported event_type: ${eventType}`,
    });
    return new Response('Unsupported event_type', { status: 200 });
  } catch (err) {
    console.error('order-notify error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
