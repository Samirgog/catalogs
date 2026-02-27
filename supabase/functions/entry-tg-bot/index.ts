import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPPORT_URL =
  Deno.env.get('SUPPORT_TELEGRAM_URL') || 'https://t.me/catalogs_support_bot';

if (!BOT_TOKEN) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN');
}

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

const menuKeyboard = {
  keyboard: [[{ text: 'Справка' }, { text: 'Поддержка' }]],
  resize_keyboard: true,
  is_persistent: true,
};

function helpText() {
  return [
    'Это бот для владельца каталога.',
    '',
    'Что можно делать:',
    '• открыть админку и управлять каталогами;',
    '• настраивать оплату, способы получения и сотрудников;',
    '• получать ссылки и QR-коды для клиентов.',
    '',
    'Для клиентов используйте отдельного клиентского бота.',
  ].join('\n');
}

async function sendMainMenu(chatId: number) {
  await tg('sendMessage', {
    chat_id: chatId,
    text: helpText(),
    reply_markup: menuKeyboard,
  });
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('OK');

    const update = await req.json();
    const message = update.message as Record<string, unknown> | undefined;
    if (!message) return new Response('OK');

    const chatId = Number((message.chat as Record<string, unknown>)?.id);
    const text = String(message.text || '').trim();

    if (text.startsWith('/start')) {
      await sendMainMenu(chatId);
      return new Response('OK');
    }

    if (text === 'Справка') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: helpText(),
        reply_markup: menuKeyboard,
      });
      return new Response('OK');
    }

    if (text === 'Поддержка') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Связаться с поддержкой:',
        reply_markup: {
          inline_keyboard: [[{ text: 'Написать в поддержку', url: SUPPORT_URL }]],
        },
      });
      return new Response('OK');
    }

    await tg('sendMessage', {
      chat_id: chatId,
      text: 'Используйте кнопки меню.',
      reply_markup: menuKeyboard,
    });

    return new Response('OK');
  } catch (error) {
    console.error('entry-tg-bot error', error);
    return new Response('OK');
  }
});
