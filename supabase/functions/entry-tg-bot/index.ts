import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN_ENTRY');
const MINI_APP_URL = Deno.env.get('MINI_APP_URL') || 'https://catalogs-app.example.com';
const SUPPORT_URL = Deno.env.get('SUPPORT_TELEGRAM_URL') || 'https://t.me/catalogs_support_bot';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const BOT_USERNAME = Deno.env.get('ENTRY_BOT_USERNAME') || 'catalogs_test_1_bot';

if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN_ENTRY/SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY');
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
  keyboard: [
    [{ text: 'Войти как бизнес' }],
    [{ text: 'Найти каталог' }],
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
    'Добро пожаловать!',
    'Этот бот помогает быстро открыть каталог:',
    '• владельцу бизнеса — для управления',
    '• клиенту — для оформления заказа',
    '',
    'Как пользоваться:',
    '1) Нажмите «Войти как бизнес», если вы владелец каталога.',
    '2) Нажмите «Войти как клиент», отправьте ссылку/QR каталога и бот откроет нужный экран.',
    '3) Если что-то не работает, нажмите «Поддержка».',
    '',
    'Мы стараемся сделать работу с каталогами максимально простой и быстрой.',
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

async function findCatalogsByName(query: string) {
  const value = query.trim();
  if (!value) return [];
  const { data, error } = await supabase
    .from('catalogs')
    .select('id,title,address')
    .eq('is_active', true)
    .ilike('title', `%${value}%`)
    .order('updated_at', { ascending: false })
    .limit(15);
  if (error) {
    return [];
  }

  const ids = (data ?? []).map(row => row.id);
  if (!ids.length) return [];

  const { data: links } = await supabase
    .from('qr_links')
    .select('target_id,slug')
    .eq('target_type', 'catalog')
    .in('target_id', ids);

  const slugByCatalog = new Map<string, string>();
  for (const link of links ?? []) {
    if (!slugByCatalog.has(String(link.target_id))) {
      slugByCatalog.set(String(link.target_id), String(link.slug));
    }
  }

  return (data ?? []).map(catalog => ({
    id: String(catalog.id),
    title: String(catalog.title || ''),
    address: String(catalog.address || ''),
    slug: slugByCatalog.get(String(catalog.id)) || `catalog_${catalog.id}`,
  }));
}

async function answerInlineQuery(inlineQuery: Record<string, unknown>) {
  const query = String(inlineQuery.query || '');
  const catalogs = await findCatalogsByName(query);

  const results = catalogs.map(catalog => ({
    type: 'article',
    id: catalog.id,
    title: catalog.title,
    description: catalog.address || 'Каталог',
    input_message_content: {
      message_text: `Каталог: ${catalog.title}`,
    },
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'Открыть каталог',
          url: `https://t.me/${BOT_USERNAME}?startapp=${encodeURIComponent(catalog.slug)}`,
        },
      ]],
    },
  }));

  await tg('answerInlineQuery', {
    inline_query_id: inlineQuery.id,
    cache_time: 3,
    is_personal: true,
    results,
  });
}

serve(async req => {
  try {
    if (req.method !== 'POST') return new Response('OK');

    const update = await req.json();
    if (update.inline_query) {
      await answerInlineQuery(update.inline_query as Record<string, unknown>);
      return new Response('OK');
    }

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

    if (text === 'Найти каталог') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Введите название каталога прямо в строке сообщения, и Telegram покажет варианты.',
        reply_markup: {
          inline_keyboard: [[
            {
              text: 'Начать поиск',
              switch_inline_query_current_chat: '',
            },
          ]],
        },
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
