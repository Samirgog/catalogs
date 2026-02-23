import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN_STAFF');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env vars');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const authKeyboard = {
  keyboard: [[{ text: 'Авторизоваться' }]],
  resize_keyboard: true,
  is_persistent: true,
};

const staffMenuKeyboard = {
  keyboard: [
    [{ text: 'Начать работу' }],
    [{ text: 'Закончить работу' }],
    [{ text: 'Активные заказы' }],
    [{ text: 'Сменить каталог' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

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

const TERMINAL_STATUSES = new Set(['rejected', 'ready', 'cancelled', 'completed']);
const ACTIVE_ORDER_STATUSES = ['submitted', 'payment_reported', 'accepted'];

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

async function sendMessage(chatId: number, text: string, extra: Record<string, unknown> = {}) {
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

function statusLabel(status: string) {
  return STATUS_LABELS[status] || status;
}

function orderActionKeyboard(orderId: string) {
  return {
    inline_keyboard: [[
      { text: 'Принять', callback_data: `order_accept:${orderId}` },
      { text: 'Отклонить', callback_data: `order_reject:${orderId}` },
    ]],
  };
}

function orderReadyKeyboard(orderId: string) {
  return {
    inline_keyboard: [[{ text: 'Заказ готов', callback_data: `order_ready:${orderId}` }]],
  };
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

  return [
    `🧾 <b>Заказ №${orderNo}</b>`,
    `Статус: <b>${statusLabel(String(order.status || 'created'))}</b>`,
    `Сумма: <b>${Number(order.total_price || 0)} ₽</b>`,
    `Имя: <b>${String(order.customer_name || 'Не указано')}</b>`,
    `Телефон: <b>${String(order.customer_phone || 'Не указан')}</b>`,
    `Комментарий: <b>${String(order.customer_comment || 'Нет')}</b>`,
    '',
    ...lines,
  ].join('\n');
}

async function removeInlineKeyboard(chatId: number, messageId: number) {
  await tg('editMessageReplyMarkup', {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: { inline_keyboard: [] },
  });
}

async function finalizeMessage(chatId: number, messageId: number, currentText: string, suffix: string) {
  const nextText = currentText.includes(suffix) ? currentText : `${currentText}\n\n${suffix}`;
  await removeInlineKeyboard(chatId, messageId);
  await tg('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: nextText,
    parse_mode: 'HTML',
  });
}

async function getActiveBindings(telegramId: number, onlyOnShift = false) {
  let query = supabase
    .from('catalog_staff_members')
    .select('*')
    .eq('telegram_id', telegramId)
    .eq('is_active', true);

  if (onlyOnShift) {
    query = query.eq('on_shift', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function hasActiveBinding(telegramId: number) {
  const rows = await getActiveBindings(telegramId);
  return rows.length > 0;
}

async function bindStaffByCode(tgUser: Record<string, unknown>, rawCode: string) {
  const accessCode = rawCode.trim().toUpperCase();
  if (!accessCode) return null;

  const { data: codeRow } = await supabase
    .from('catalog_staff_codes')
    .select('*')
    .eq('access_code', accessCode)
    .eq('is_active', true)
    .maybeSingle();

  if (!codeRow) return null;

  const payload = {
    catalog_id: codeRow.catalog_id,
    telegram_id: tgUser.id,
    username: tgUser.username || null,
    first_name: tgUser.first_name || null,
    last_name: tgUser.last_name || null,
    is_active: true,
    on_shift: false,
    last_activity_at: new Date().toISOString(),
  };

  const { data } = await supabase
    .from('catalog_staff_members')
    .upsert(payload, { onConflict: 'catalog_id,telegram_id' })
    .select('*')
    .single();

  return data;
}

async function unbindStaff(telegramId: number) {
  await supabase
    .from('catalog_staff_members')
    .update({
      is_active: false,
      on_shift: false,
      last_activity_at: new Date().toISOString(),
    })
    .eq('telegram_id', telegramId)
    .eq('is_active', true);
}

async function setShift(telegramId: number, onShift: boolean) {
  await supabase
    .from('catalog_staff_members')
    .update({
      on_shift: onShift,
      last_activity_at: new Date().toISOString(),
    })
    .eq('telegram_id', telegramId)
    .eq('is_active', true);
}

async function getOrder(orderId: string) {
  const { data } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
  return data;
}

async function updateOrderStatus(orderId: string, status: string) {
  await supabase.from('orders').update({ status }).eq('id', orderId);
}

async function sendOrderToChat(chatId: number, order: Record<string, unknown>) {
  const status = String(order.status || 'created');
  let replyMarkup: Record<string, unknown> | undefined;

  if (status === 'accepted') {
    replyMarkup = orderReadyKeyboard(String(order.id));
  } else if (ACTIVE_ORDER_STATUSES.includes(status)) {
    replyMarkup = orderActionKeyboard(String(order.id));
  }

  await sendMessage(chatId, formatOrderText(order), {
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

async function showActiveOrders(chatId: number, telegramId: number) {
  const bindings = await getActiveBindings(telegramId, true);
  if (!bindings.length) {
    await sendMessage(
      chatId,
      'Вы не на смене. Нажмите «Начать работу», затем снова откройте активные заказы.',
      { reply_markup: staffMenuKeyboard }
    );
    return;
  }

  const catalogIds = bindings.map(row => row.catalog_id);
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .in('catalog_id', catalogIds)
    .in('status', ACTIVE_ORDER_STATUSES)
    .order('created_at', { ascending: true })
    .limit(20);

  if (!orders?.length) {
    await sendMessage(chatId, 'Сейчас активных заказов нет.', {
      reply_markup: staffMenuKeyboard,
    });
    return;
  }

  for (const order of orders) {
    await sendOrderToChat(chatId, order);
  }
}

async function processPendingNotificationsForTelegram(telegramId: number, chatId: number) {
  const bindings = await getActiveBindings(telegramId, true);
  if (!bindings.length) return;

  const catalogIds = bindings.map(row => row.catalog_id);
  const { data: notifications } = await supabase
    .from('order_notifications')
    .select('*')
    .in('catalog_id', catalogIds)
    .is('sent_at', null)
    .order('created_at', { ascending: true })
    .limit(20);

  if (!notifications?.length) return;

  for (const notification of notifications) {
    const order = await getOrder(String(notification.order_id));
    if (!order) continue;

    await sendOrderToChat(chatId, order);

    const binding = bindings.find(item => item.catalog_id === notification.catalog_id);
    await supabase
      .from('order_notifications')
      .update({
        sent_at: new Date().toISOString(),
        sent_to_member_id: binding?.id ?? null,
      })
      .eq('id', notification.id);
  }
}

async function handleTextMessage(message: Record<string, unknown>) {
  const chatId = Number((message.chat as Record<string, unknown>)?.id);
  const from = (message.from as Record<string, unknown>) || {};
  const text = String(message.text || '').trim();
  const telegramId = Number(from.id);

  const isBound = await hasActiveBinding(telegramId);

  if (text === '/start') {
    if (!isBound) {
      return sendMessage(
        chatId,
        'Привет! Для доступа к заказам нажмите «Авторизоваться» и введите код.',
        { reply_markup: authKeyboard }
      );
    }
    return sendMessage(
      chatId,
      'Вы авторизованы. Нажимайте «Начать работу» в начале смены и «Закончить работу» в конце.',
      { reply_markup: staffMenuKeyboard }
    );
  }

  if (text === 'Авторизоваться') {
    return sendMessage(chatId, 'Введите код доступа из админки:', {
      reply_markup: authKeyboard,
    });
  }

  if (!isBound) {
    const bound = await bindStaffByCode(from, text);
    if (bound) {
      return sendMessage(
        chatId,
        'Код принят. Нажмите «Начать работу» в начале смены и «Закончить работу» в конце.',
        { reply_markup: staffMenuKeyboard }
      );
    }
    return sendMessage(
      chatId,
      'Неверный код. Нажмите «Авторизоваться» и попробуйте снова.',
      { reply_markup: authKeyboard }
    );
  }

  if (text === 'Сменить каталог') {
    await unbindStaff(telegramId);
    return sendMessage(
      chatId,
      'Вы откреплены. Нажмите «Авторизоваться» и введите новый код.',
      { reply_markup: authKeyboard }
    );
  }

  if (text === 'Начать работу') {
    await setShift(telegramId, true);
    await sendMessage(chatId, 'Смена начата.', { reply_markup: staffMenuKeyboard });
    await processPendingNotificationsForTelegram(telegramId, chatId);
    await showActiveOrders(chatId, telegramId);
    return;
  }

  if (text === 'Закончить работу') {
    await setShift(telegramId, false);
    return sendMessage(chatId, 'Смена завершена.', { reply_markup: staffMenuKeyboard });
  }

  if (text === 'Активные заказы') {
    await showActiveOrders(chatId, telegramId);
    return;
  }

  return sendMessage(chatId, 'Команда не распознана.', {
    reply_markup: staffMenuKeyboard,
  });
}

async function handleCallbackQuery(callbackQuery: Record<string, unknown>) {
  const data = String(callbackQuery.data || '');
  const chatId = Number((callbackQuery.message as Record<string, unknown>)?.chat?.id);
  const messageId = Number((callbackQuery.message as Record<string, unknown>)?.message_id);
  const currentText = String((callbackQuery.message as Record<string, unknown>)?.text || '');

  const orderId = data.split(':')[1];
  if (!orderId) {
    return tg('answerCallbackQuery', {
      callback_query_id: callbackQuery.id,
      text: 'Некорректные данные',
      show_alert: true,
    });
  }

  const order = await getOrder(orderId);
  if (!order) {
    await removeInlineKeyboard(chatId, messageId);
    return tg('answerCallbackQuery', {
      callback_query_id: callbackQuery.id,
      text: 'Заказ не найден',
      show_alert: true,
    });
  }

  if (TERMINAL_STATUSES.has(String(order.status))) {
    await removeInlineKeyboard(chatId, messageId);
    return tg('answerCallbackQuery', {
      callback_query_id: callbackQuery.id,
      text: `Заказ уже в статусе "${statusLabel(String(order.status))}"`,
      show_alert: true,
    });
  }

  if (data.startsWith('order_accept:')) {
    if (!['submitted', 'payment_reported', 'accepted'].includes(String(order.status))) {
      return tg('answerCallbackQuery', {
        callback_query_id: callbackQuery.id,
        text: `Нельзя принять в статусе "${statusLabel(String(order.status))}"`,
        show_alert: true,
      });
    }
    await updateOrderStatus(orderId, 'accepted');
    await tg('editMessageReplyMarkup', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: orderReadyKeyboard(orderId),
    });
  } else if (data.startsWith('order_reject:')) {
    await updateOrderStatus(orderId, 'rejected');
    await finalizeMessage(chatId, messageId, currentText, '❌ <b>Заказ отменен</b>');
  } else if (data.startsWith('order_ready:')) {
    if (String(order.status) !== 'accepted') {
      return tg('answerCallbackQuery', {
        callback_query_id: callbackQuery.id,
        text: 'Сначала примите заказ',
        show_alert: true,
      });
    }
    await updateOrderStatus(orderId, 'ready');
    await finalizeMessage(chatId, messageId, currentText, '✅ <b>Заказ выполнен</b>');
  }

  return tg('answerCallbackQuery', {
    callback_query_id: callbackQuery.id,
  });
}

serve(async req => {
  try {
    if (req.method !== 'POST') {
      return new Response('OK');
    }

    const update = await req.json();

    if (update.message) {
      await handleTextMessage(update.message);
    }

    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }
  } catch (e) {
    console.error('staff-tg-bot error', e);
  }

  return new Response('OK');
});
