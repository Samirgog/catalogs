import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env: TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

let offset = 0;

const staffMenuKeyboard = {
  keyboard: [[{ text: 'Начать работу' }], [{ text: 'Закончить работу' }]],
  resize_keyboard: true,
  is_persistent: true,
};

async function tg(method, body) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!json.ok) {
    throw new Error(`Telegram API error: ${JSON.stringify(json)}`);
  }
  return json.result;
}

async function sendMessage(chatId, text, extra = {}) {
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

async function bindStaffByCode(tgUser, rawCode) {
  const accessCode = rawCode.trim().toUpperCase();
  if (!accessCode) return null;

  const { data: codeRow, error: codeError } = await supabase
    .from('catalog_staff_codes')
    .select('*')
    .eq('access_code', accessCode)
    .eq('is_active', true)
    .single();

  if (codeError || !codeRow) return null;

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

  const { data, error } = await supabase
    .from('catalog_staff_members')
    .upsert(payload, { onConflict: 'catalog_id,telegram_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function setShift(telegramId, onShift) {
  const { error } = await supabase
    .from('catalog_staff_members')
    .update({ on_shift: onShift, last_activity_at: new Date().toISOString() })
    .eq('telegram_id', telegramId)
    .eq('is_active', true);

  if (error) throw error;
}

async function updateOrderStatus(orderId, status) {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) throw error;
}

function formatOrderText(order) {
  const orderNo = order.order_number || order.id.slice(0, 8).toUpperCase();
  const items = Array.isArray(order.items) ? order.items : [];

  const lines = items.map(item => {
    const title = item?.title || 'Позиция';
    const qty = item?.quantity || 1;
    const price = item?.price || 0;
    return `• ${title} x${qty} — ${price * qty} ₽`;
  });

  return [
    `🧾 <b>Новый заказ №${orderNo}</b>`,
    `Статус: <b>${order.status}</b>`,
    `Сумма: <b>${order.total_price} ₽</b>`,
    '',
    ...lines,
  ].join('\n');
}

function orderActionKeyboard(orderId) {
  return {
    inline_keyboard: [
      [
        { text: 'Принять', callback_data: `order_accept:${orderId}` },
        { text: 'Отклонить', callback_data: `order_reject:${orderId}` },
      ],
    ],
  };
}

function orderReadyKeyboard(orderId) {
  return {
    inline_keyboard: [
      [{ text: 'Заказ готов', callback_data: `order_ready:${orderId}` }],
    ],
  };
}

async function processPendingNotifications() {
  const { data: notifications, error } = await supabase
    .from('order_notifications')
    .select('*')
    .is('sent_at', null)
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) throw error;
  if (!notifications?.length) return;

  for (const notification of notifications) {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', notification.order_id)
        .single();

      if (orderError || !order) {
        await supabase
          .from('order_notifications')
          .update({ error: 'Order not found', sent_at: new Date().toISOString() })
          .eq('id', notification.id);
        continue;
      }

      const { data: staff, error: staffError } = await supabase
        .from('catalog_staff_members')
        .select('*')
        .eq('catalog_id', notification.catalog_id)
        .eq('is_active', true)
        .eq('on_shift', true)
        .order('last_activity_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (staffError || !staff) {
        await supabase
          .from('order_notifications')
          .update({ error: 'No active staff on shift' })
          .eq('id', notification.id);
        continue;
      }

      await sendMessage(
        staff.telegram_id,
        formatOrderText(order),
        { reply_markup: orderActionKeyboard(order.id) }
      );

      await supabase
        .from('order_notifications')
        .update({
          sent_at: new Date().toISOString(),
          sent_to_member_id: staff.id,
          error: null,
        })
        .eq('id', notification.id);
    } catch (err) {
      await supabase
        .from('order_notifications')
        .update({ error: err instanceof Error ? err.message : 'Unknown error' })
        .eq('id', notification.id);
    }
  }
}

async function handleTextMessage(message) {
  const chatId = message.chat.id;
  const text = (message.text || '').trim();

  if (!text) return;

  if (text === '/start') {
    await sendMessage(
      chatId,
      'Привет. Введите код доступа от каталога, чтобы подключиться к уведомлениям.',
      { reply_markup: staffMenuKeyboard }
    );
    return;
  }

  if (text.startsWith('/start ')) {
    const code = text.replace('/start', '').trim();
    const bound = await bindStaffByCode(message.from, code);
    if (bound) {
      await sendMessage(
        chatId,
        'Успешно привязано. Используйте кнопки ниже для начала/окончания смены.',
        { reply_markup: staffMenuKeyboard }
      );
    } else {
      await sendMessage(chatId, 'Код не найден или неактивен.');
    }
    return;
  }

  if (text === 'Начать работу') {
    await setShift(message.from.id, true);
    await sendMessage(chatId, 'Смена начата. Теперь вы получаете заказы.', {
      reply_markup: staffMenuKeyboard,
    });
    return;
  }

  if (text === 'Закончить работу') {
    await setShift(message.from.id, false);
    await sendMessage(chatId, 'Смена завершена. Уведомления отключены.', {
      reply_markup: staffMenuKeyboard,
    });
    return;
  }

  const bound = await bindStaffByCode(message.from, text);
  if (bound) {
    await sendMessage(
      chatId,
      'Код принят. Для получения заказов нажмите «Начать работу».',
      { reply_markup: staffMenuKeyboard }
    );
  } else {
    await sendMessage(chatId, 'Неизвестная команда или неверный код.');
  }
}

async function handleCallbackQuery(callbackQuery) {
  const data = callbackQuery.data || '';
  const message = callbackQuery.message;
  const chatId = message?.chat?.id;
  const messageId = message?.message_id;

  if (!chatId || !messageId) return;

  if (data.startsWith('order_accept:')) {
    const orderId = data.split(':')[1];
    await updateOrderStatus(orderId, 'accepted');
    await tg('editMessageReplyMarkup', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: orderReadyKeyboard(orderId),
    });
    await tg('answerCallbackQuery', { callback_query_id: callbackQuery.id, text: 'Заказ принят' });
    return;
  }

  if (data.startsWith('order_reject:')) {
    const orderId = data.split(':')[1];
    await updateOrderStatus(orderId, 'rejected');
    await tg('editMessageReplyMarkup', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: [] },
    });
    await tg('sendMessage', {
      chat_id: chatId,
      text: `Заказ ${orderId.slice(0, 8).toUpperCase()} отменен`,
    });
    await tg('answerCallbackQuery', { callback_query_id: callbackQuery.id, text: 'Заказ отклонен' });
    return;
  }

  if (data.startsWith('order_ready:')) {
    const orderId = data.split(':')[1];
    await updateOrderStatus(orderId, 'ready');
    await tg('editMessageReplyMarkup', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: [] },
    });
    await tg('answerCallbackQuery', { callback_query_id: callbackQuery.id, text: 'Отмечено как готово' });
  }
}

async function processUpdates() {
  const updates = await tg('getUpdates', {
    timeout: 25,
    offset,
    allowed_updates: ['message', 'callback_query'],
  });

  for (const update of updates) {
    offset = update.update_id + 1;

    try {
      if (update.message) {
        await handleTextMessage(update.message);
      }

      if (update.callback_query) {
        await handleCallbackQuery(update.callback_query);
      }
    } catch (err) {
      console.error('Update processing error:', err);
    }
  }
}

async function loop() {
  while (true) {
    try {
      await Promise.all([processUpdates(), processPendingNotifications()]);
    } catch (err) {
      console.error('Bot loop error:', err);
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

console.log('Order notifier bot started...');
loop();
