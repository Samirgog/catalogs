import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN_CLIENT');
const MINI_APP_URL = Deno.env.get('MINI_APP_URL') || 'https://catalogs-app.example.com';
const SUPPORT_URL =
  Deno.env.get('SUPPORT_TELEGRAM_URL') || 'https://t.me/catalogs_support_bot';
const CLIENT_BOT_USERNAME =
  (Deno.env.get('CLIENT_BOT_USERNAME') || 'catalogs_client_bot').replace('@', '');
const CLIENT_APP_SHORT_NAME = Deno.env.get('CLIENT_APP_SHORT_NAME') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing TELEGRAM_BOT_TOKEN_CLIENT/SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY'
  );
}

const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
  keyboard: [[{ text: 'Как открыть каталог' }], [{ text: 'Поддержка' }]],
  resize_keyboard: true,
  is_persistent: true,
};

function helpText() {
  return [
    'Это клиентский бот каталога.',
    '',
    'Как открыть каталог:',
    '1) Перейдите по ссылке от продавца или отсканируйте QR-код.',
    '2) Каталог откроется сразу в мини-приложении.',
    '',
    'Через этого бота вы также будете получать уведомления о статусе заказа.',
  ].join('\n');
}

function extractStartPayload(text: string): string {
  return text.replace(/^\/(start|startapp)\s*/i, '').trim();
}

function catalogInline(payload: string) {
  const tgMiniAppDeepLink = CLIENT_APP_SHORT_NAME
    ? `https://t.me/${CLIENT_BOT_USERNAME}/${CLIENT_APP_SHORT_NAME}?startapp=${encodeURIComponent(payload)}`
    : null;

  return {
    inline_keyboard: [[
      tgMiniAppDeepLink
        ? {
            text: 'Открыть каталог',
            url: tgMiniAppDeepLink,
          }
        : {
            text: 'Открыть каталог',
            web_app: {
              url: `${MINI_APP_URL}?role=catalog&startapp=${encodeURIComponent(payload)}`,
            },
          },
    ]],
  };
}

async function upsertClientChat(
  chatId: number,
  user: Record<string, unknown>,
) {
  await supabase.from('client_bot_chats').upsert(
    {
      telegram_user_id: Number(user.id),
      chat_id: chatId,
      username: user.username ? String(user.username) : null,
      first_name: user.first_name ? String(user.first_name) : null,
      last_name: user.last_name ? String(user.last_name) : null,
      is_active: true,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'telegram_user_id' }
  );
}

async function handleStart(chatId: number, payload: string) {
  await tg('sendMessage', {
    chat_id: chatId,
    text: helpText(),
    reply_markup: menuKeyboard,
  });

  if (payload) {
    await tg('sendMessage', {
      chat_id: chatId,
      text: 'Каталог готов к открытию:',
      reply_markup: catalogInline(payload),
    });
  } else {
    await tg('sendMessage', {
      chat_id: chatId,
      text: 'Откройте ссылку или QR-код от продавца, чтобы попасть в нужный каталог.',
      reply_markup: menuKeyboard,
    });
  }
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('OK');

    const update = await req.json();
    const message = update.message as Record<string, unknown> | undefined;
    if (!message) return new Response('OK');

    const chatId = Number((message.chat as Record<string, unknown>)?.id);
    const from = (message.from as Record<string, unknown>) || {};
    const text = String(message.text || '').trim();

    if (from.id) {
      await upsertClientChat(chatId, from);
    }

    if (text.startsWith('/start') || text.startsWith('/startapp')) {
      await handleStart(chatId, extractStartPayload(text));
      return new Response('OK');
    }

    if (text === 'Как открыть каталог') {
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
      text: 'Используйте ссылку/QR от продавца или команду /start.',
      reply_markup: menuKeyboard,
    });
    return new Response('OK');
  } catch (error) {
    console.error('client-tg-bot error', error);
    return new Response('OK');
  }
});
