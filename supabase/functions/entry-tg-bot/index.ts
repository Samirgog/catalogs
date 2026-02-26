import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN_ENTRY');
const MINI_APP_URL = Deno.env.get('MINI_APP_URL') || 'https://catalogs-app.example.com';
const SUPPORT_URL = Deno.env.get('SUPPORT_TELEGRAM_URL') || 'https://t.me/catalogs_support_bot';

if (!BOT_TOKEN) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN_ENTRY');
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
  keyboard: [
    [{ text: 'Войти как бизнес' }],
    [{ text: 'Войти как клиент' }],
    [{ text: 'Справка о боте' }, { text: 'Поддержка' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

function webAppInline(role: 'admin' | 'catalog', startapp?: string) {
  const url = startapp
    ? `${MINI_APP_URL}?role=${role}&startapp=${encodeURIComponent(startapp)}`
    : `${MINI_APP_URL}?role=${role}`;

  return {
    inline_keyboard: [[
      {
        text: role === 'admin' ? 'Открыть админку' : 'Открыть каталог',
        web_app: { url },
      },
    ]],
  };
}

function helpText() {
  return [
    'Привет! Это единая точка входа в ваш каталог-сервис.',
    '',
    'Что умеет бот:',
    '• открыть мини-апп для владельца (бизнес)',
    '• открыть мини-апп для клиента',
    '• сохранить быстрый доступ через меню',
    '',
    'Как использовать:',
    '1) Нажмите «Войти как бизнес», если вы управляете каталогами.',
    '2) Нажмите «Войти как клиент», если хотите открыть каталог по ссылке/QR.',
    '3) Если пришли по deep-link с параметром startapp, он сохранится и будет использован при открытии.',
    '',
    'Если нужна помощь по подключению, нажмите «Поддержка».',
  ].join('\n');
}

function extractStartPayload(text: string): string {
  const payload = text.replace(/^\/(start|startapp)\s*/i, '').trim();
  return payload;
}

async function sendMainMenu(chatId: number, startPayload = '') {
  await tg('sendMessage', {
    chat_id: chatId,
    text: helpText(),
    reply_markup: menuKeyboard,
  });

  if (startPayload) {
    await tg('sendMessage', {
      chat_id: chatId,
      text: `Обнаружен параметр входа: ${startPayload}`,
      reply_markup: webAppInline('catalog', startPayload),
    });
  }
}

serve(async req => {
  try {
    if (req.method !== 'POST') return new Response('OK');

    const update = await req.json();
    const message = update.message as Record<string, unknown> | undefined;
    if (!message) return new Response('OK');

    const chatId = Number((message.chat as Record<string, unknown>)?.id);
    const text = String(message.text || '').trim();

    if (text.startsWith('/start') || text.startsWith('/startapp')) {
      const payload = extractStartPayload(text);
      await sendMainMenu(chatId, payload);
      return new Response('OK');
    }

    if (text === 'Справка о боте') {
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

    if (text === 'Войти как бизнес') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Откройте админку для управления каталогами:',
        reply_markup: webAppInline('admin'),
      });
      return new Response('OK');
    }

    if (text === 'Войти как клиент') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Откройте клиентскую часть (последний/переданный каталог):',
        reply_markup: webAppInline('catalog'),
      });
      return new Response('OK');
    }

    await tg('sendMessage', {
      chat_id: chatId,
      text: 'Используйте кнопки меню ниже.',
      reply_markup: menuKeyboard,
    });

    return new Response('OK');
  } catch (error) {
    console.error('entry-tg-bot error', error);
    return new Response('OK');
  }
});
