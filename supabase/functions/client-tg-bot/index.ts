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
  keyboard: [
    [{ text: 'Найти каталог' }],
    [{ text: 'Как открыть каталог' }],
    [{ text: 'Поддержка' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

function helpText() {
  return [
    'Добро пожаловать во Вклик.',
    '',
    'Через этого бота можно открыть каталог и оформить заказ или запись прямо в Telegram.',
    '',
    'Как это работает:',
    '• переходите по ссылке или сканируете QR-код;',
    '• открываете каталог;',
    '• выбираете товары или услуги;',
    '• оформляете заказ удобным способом.',
    '',
    'Здесь же вы будете получать уведомления, если изменится статус вашего заказа.',
  ].join('\n');
}

function supportText() {
  return [
    'Справка по боту Вклик',
    '',
    'Этот бот нужен для клиентов.',
    'Через него можно открыть каталог продавца, выбрать нужные товары или услуги и оформить заказ.',
    '',
    'Если продавец отправил вам ссылку или QR-код, просто откройте их — каталог загрузится автоматически.',
    'Если вы не сохранили ссылку, можно воспользоваться поиском по названию каталога.',
    '',
    'После оформления заказа сюда могут приходить уведомления о его статусе.',
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

async function findCatalogsByName(query: string) {
  const value = query.trim();
  if (!value) return [];

  const { data: catalogs } = await supabase
    .from('catalogs')
    .select('id,title,address,banner_url')
    .eq('is_active', true)
    .ilike('title', `%${value}%`)
    .order('updated_at', { ascending: false })
    .limit(15);

  if (!catalogs?.length) return [];

  const ids = catalogs.map((row) => row.id);
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

  return catalogs.map((catalog) => ({
    id: String(catalog.id),
    title: String(catalog.title || ''),
    address: String(catalog.address || ''),
    bannerUrl: catalog.banner_url ? String(catalog.banner_url) : '',
    slug: slugByCatalog.get(String(catalog.id)) || `catalog_${catalog.id}`,
  }));
}

async function answerInlineQuery(inlineQuery: Record<string, unknown>) {
  const query = String(inlineQuery.query || '');
  const catalogs = await findCatalogsByName(query);

  const results = catalogs.map((catalog) => ({
    type: 'article',
    id: catalog.id,
    title: catalog.title,
    description: catalog.address || 'Каталог',
    ...(catalog.bannerUrl ? { thumbnail_url: catalog.bannerUrl } : {}),
    input_message_content: {
      message_text: `Каталог: ${catalog.title}`,
    },
    reply_markup: catalogInline(catalog.slug),
  }));

  await tg('answerInlineQuery', {
    inline_query_id: inlineQuery.id,
    cache_time: 3,
    is_personal: true,
    results,
  });
}

serve(async (req) => {
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
    const from = (message.from as Record<string, unknown>) || {};
    const text = String(message.text || '').trim();

    if (from.id) {
      await upsertClientChat(chatId, from);
    }

    if (text.startsWith('/start') || text.startsWith('/startapp')) {
      await handleStart(chatId, extractStartPayload(text));
      return new Response('OK');
    }

    if (text === 'Найти каталог') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Введите название каталога в поле ввода, Telegram покажет подходящие варианты.',
        reply_markup: {
          inline_keyboard: [[{ text: 'Начать поиск', switch_inline_query_current_chat: '' }]],
        },
      });
      return new Response('OK');
    }

    if (text === 'Как открыть каталог') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: supportText(),
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
