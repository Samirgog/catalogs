import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type {
  MarketingAudienceSegment,
  MarketingCampaign,
  MarketingAutomation,
  MarketingMessageKind,
  MarketingCampaignRun,
  MarketingAutomationRun,
} from '../../../src/types.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN_CLIENT');
const CLIENT_BOT_USERNAME =
  (Deno.env.get('CLIENT_BOT_USERNAME') || 'catalogs_client_bot').replace('@', '');
const CLIENT_APP_SHORT_NAME = Deno.env.get('CLIENT_APP_SHORT_NAME') || '';
const MINI_APP_URL = Deno.env.get('MINI_APP_URL') || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY');
}

if (!BOT_TOKEN) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN_CLIENT');
}

export const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export type MarketingProfile = {
  customer_id: string;
  telegram_id: number | null;
  chat_id: number | null;
  name: string;
  username: string | null;
  birthday_at: string | null;
  marketing_opt_in: boolean;
  source: string;
  first_visit_at: string | null;
  last_visit_at: string | null;
  last_order_at: string | null;
  orders_count: number;
  total_spent: number;
  average_check: number;
  tags: string[];
  has_burger_order: boolean;
  has_abandoned_cart: boolean;
};

type SendMarkup = Record<string, unknown>;

const DAY_MS = 24 * 60 * 60 * 1000;

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

const buildCatalogStartSlug = (catalogId: string) => `catalog_${catalogId}`;

export async function getCatalogDeepLink(catalogId: string) {
  const { data: qrLink } = await supabaseService
    .from('qr_links')
    .select('slug')
    .eq('target_type', 'catalog')
    .eq('target_id', catalogId)
    .maybeSingle();

  const slug = String(qrLink?.slug || buildCatalogStartSlug(catalogId));
  if (CLIENT_APP_SHORT_NAME) {
    return `https://t.me/${CLIENT_BOT_USERNAME}/${CLIENT_APP_SHORT_NAME}?startapp=${encodeURIComponent(slug)}`;
  }
  if (MINI_APP_URL) {
    return `${MINI_APP_URL}?startapp=${encodeURIComponent(slug)}`;
  }
  return `https://t.me/${CLIENT_BOT_USERNAME}?startapp=${encodeURIComponent(slug)}`;
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: SendMarkup
) {
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    reply_markup: replyMarkup,
    disable_web_page_preview: true,
  });
}

const safeString = (value: unknown, fallback = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
};

const hasOrderAfter = (orders: Array<Record<string, unknown>>, date: string) =>
  orders.some((order) => {
    const createdAt = safeString(order.created_at);
    return createdAt && new Date(createdAt).getTime() > new Date(date).getTime();
  });

function getOrderItems(order: Record<string, unknown>) {
  return Array.isArray(order.items) ? order.items : [];
}

export async function buildMarketingProfiles(catalogId: string): Promise<MarketingProfile[]> {
  const [{ data: orders }, { data: events }, { data: users }, { data: tags }, { data: chats }] = await Promise.all([
    supabaseService
      .from('orders')
      .select('id, catalog_id, customer_id, status, items, total_price, created_at, order_number')
      .eq('catalog_id', catalogId),
    supabaseService
      .from('customer_events')
      .select('id, catalog_id, customer_id, event_type, source, metadata, created_at')
      .eq('catalog_id', catalogId),
    supabaseService
      .from('users')
      .select('id, telegram_id, first_name, last_name, username, birthday_at, marketing_opt_in, created_at'),
    supabaseService
      .from('customer_tags')
      .select('customer_id, tag')
      .eq('catalog_id', catalogId),
    supabaseService
      .from('client_bot_chats')
      .select('telegram_user_id, chat_id, is_active')
      .eq('is_active', true),
  ]);

  const ordersForCatalog = (orders || []).filter(
    (order) => String((order as Record<string, unknown>).catalog_id || '') === catalogId
  ) as Array<Record<string, unknown>>;
  const usersById = new Map(
    (users || []).map((user) => [String((user as Record<string, unknown>).id), user as Record<string, unknown>])
  );
  const chatsByTelegramId = new Map(
    (chats || []).map((chat) => [String((chat as Record<string, unknown>).telegram_user_id), chat as Record<string, unknown>])
  );
  const tagsByCustomer = new Map<string, string[]>();
  for (const tag of tags || []) {
    const row = tag as Record<string, unknown>;
    const customerId = String(row.customer_id || '');
    const current = tagsByCustomer.get(customerId) || [];
    current.push(String(row.tag || ''));
    tagsByCustomer.set(customerId, current);
  }

  const profiles = new Map<string, MarketingProfile>();

  const ensure = (customerId: string) => {
    const existing = profiles.get(customerId);
    if (existing) return existing;
    const user = usersById.get(customerId) || {};
    const telegramId = user.telegram_id ? Number(user.telegram_id) : null;
    const chat = telegramId ? chatsByTelegramId.get(String(telegramId)) : null;
    const profile: MarketingProfile = {
      customer_id: customerId,
      telegram_id: telegramId,
      chat_id: chat?.chat_id ? Number(chat.chat_id) : null,
      name:
        safeString(user.first_name).trim() ||
        [safeString(user.first_name), safeString(user.last_name)].filter(Boolean).join(' ').trim() ||
        'Без имени',
      username: user.username ? safeString(user.username) : null,
      birthday_at: user.birthday_at ? safeString(user.birthday_at) : null,
      marketing_opt_in: user.marketing_opt_in !== false,
      source: 'direct_link',
      first_visit_at: null,
      last_visit_at: null,
      last_order_at: null,
      orders_count: 0,
      total_spent: 0,
      average_check: 0,
      tags: tagsByCustomer.get(customerId) || [],
      has_burger_order: false,
      has_abandoned_cart: false,
    };
    profiles.set(customerId, profile);
    return profile;
  };

  for (const order of ordersForCatalog) {
    const customerId = String(order.customer_id || '');
    if (!customerId) continue;
    const profile = ensure(customerId);
    profile.orders_count += 1;
    profile.total_spent += Number(order.total_price || 0);
    profile.average_check =
      profile.orders_count > 0 ? profile.total_spent / profile.orders_count : 0;
    const createdAt = safeString(order.created_at);
    if (createdAt) {
      profile.first_visit_at =
        profile.first_visit_at && new Date(profile.first_visit_at) < new Date(createdAt)
          ? profile.first_visit_at
          : createdAt;
      profile.last_visit_at =
        profile.last_visit_at && new Date(profile.last_visit_at) > new Date(createdAt)
          ? profile.last_visit_at
          : createdAt;
      profile.last_order_at =
        profile.last_order_at && new Date(profile.last_order_at) > new Date(createdAt)
          ? profile.last_order_at
          : createdAt;
    }
    for (const item of getOrderItems(order)) {
      const title = safeString((item as Record<string, unknown>).title).toLowerCase();
      if (title.includes('бургер') || title.includes('burger')) {
        profile.has_burger_order = true;
      }
    }
  }

  for (const event of events || []) {
    const row = event as Record<string, unknown>;
    const customerId = String(row.customer_id || '');
    if (!customerId) continue;
    const profile = ensure(customerId);
    const createdAt = safeString(row.created_at);
    if (createdAt) {
      profile.first_visit_at =
        profile.first_visit_at && new Date(profile.first_visit_at) < new Date(createdAt)
          ? profile.first_visit_at
          : createdAt;
      profile.last_visit_at =
        profile.last_visit_at && new Date(profile.last_visit_at) > new Date(createdAt)
          ? profile.last_visit_at
          : createdAt;
    }
    if (safeString(row.source)) {
      profile.source = safeString(row.source);
    }
    const eventType = safeString(row.event_type);
    if (eventType === 'session_without_purchase') {
      profile.has_abandoned_cart = true;
    }
    if (eventType === 'checkout_started') {
      const payload = (row.metadata || {}) as Record<string, unknown>;
      const startedAt = createdAt || new Date().toISOString();
      const laterOrder = ordersForCatalog.filter(
        (order) => String(order.customer_id || '') === customerId
      );
      if (!hasOrderAfter(laterOrder, startedAt)) {
        profile.has_abandoned_cart = true;
      }
    }
  }

  return Array.from(profiles.values()).filter((profile) => profile.marketing_opt_in);
}

export function getAudienceMatches(
  profiles: MarketingProfile[],
  segment: MarketingAudienceSegment
) {
  const now = Date.now();
  return profiles.filter((profile) => {
    const lastVisit = profile.last_visit_at ? new Date(profile.last_visit_at).getTime() : 0;
    const firstVisit = profile.first_visit_at ? new Date(profile.first_visit_at).getTime() : 0;
    switch (segment) {
      case 'all':
        return true;
      case 'new_today':
        return firstVisit > 0 && now - firstVisit <= DAY_MS;
      case 'new_week':
        return firstVisit > 0 && now - firstVisit <= 7 * DAY_MS;
      case 'vip':
        return profile.tags.includes('vip') || profile.average_check >= 5000 || profile.orders_count >= 5;
      case 'lost_7_days':
        return lastVisit > 0 && now - lastVisit >= 7 * DAY_MS;
      case 'lost_30_days':
        return lastVisit > 0 && now - lastVisit >= 30 * DAY_MS;
      case 'abandoned_cart':
        return profile.has_abandoned_cart;
      case 'one_order':
        return profile.orders_count === 1;
      case 'many_orders':
        return profile.orders_count >= 3;
      case 'high_avg_check':
        return profile.average_check >= 5000;
      case 'source_qr_code':
        return profile.source === 'qr_code';
      case 'source_direct_link':
        return profile.source === 'direct_link';
      case 'source_repeat_visit':
        return profile.source === 'repeat_visit';
      case 'source_instagram':
        return profile.source === 'instagram';
      case 'source_ads':
        return profile.source === 'ads';
      case 'burger_lovers':
        return profile.has_burger_order;
      default:
        return true;
    }
  });
}

export async function buildRecipientList(catalogId: string, segment: MarketingAudienceSegment) {
  const profiles = await buildMarketingProfiles(catalogId);
  const matched = getAudienceMatches(profiles, segment);
  return matched.filter((profile) => Boolean(profile.chat_id));
}

export async function buildCampaignMessage(
  campaign: MarketingCampaign,
  catalogId: string
) {
  const { data: productRows } = await supabaseService
    .from('items')
    .select('id,title,price,description,image_url')
    .in('id', campaign.product_ids || []);

  const products = (productRows || []) as Array<Record<string, unknown>>;
  const lines: string[] = [];

  if (campaign.message_title) {
    lines.push(campaign.message_title.trim());
    lines.push('');
  }
  if (campaign.message_text.trim()) {
    lines.push(campaign.message_text.trim());
    lines.push('');
  }
  if (campaign.message_kind === 'promo_code' && campaign.promo_code) {
    lines.push(`Промокод: ${campaign.promo_code}`);
  }
  if (campaign.message_kind === 'offer' && campaign.promo_code) {
    lines.push(`Акция с промокодом: ${campaign.promo_code}`);
  }
  if (campaign.message_kind === 'product_selection' && products.length > 0) {
    lines.push('Подборка товаров:');
    for (const product of products.slice(0, 5)) {
      const title = safeString(product.title, 'Товар');
      const price = Number(product.price || 0);
      lines.push(`• ${title}${price ? ` — ${price} ₽` : ''}`);
    }
  }

  const text = lines.filter(Boolean).join('\n').trim();
  const keyboard: SendMarkup | undefined =
    campaign.cta_label || campaign.promo_code || campaign.message_kind === 'button_to_catalog'
      ? {
          inline_keyboard: [
            [
              {
                text: campaign.cta_label || 'Открыть каталог',
                url:
                  campaign.cta_url ||
                  (await getCatalogDeepLink(catalogId)),
              },
            ],
          ],
        }
      : undefined;

  return { text, replyMarkup: keyboard };
}

export async function buildAutomationMessage(
  automation: MarketingAutomation,
  catalogId: string
) {
  const message = {
    id: automation.id,
    catalog_id: automation.catalog_id,
    title: automation.title,
    audience_segment: automation.audience_segment,
    message_kind: 'text' as MarketingMessageKind,
    message_title: automation.message_title,
    message_text: automation.message_text,
    cta_label: automation.cta_label,
    cta_url: automation.cta_url,
    promo_code: automation.promo_code,
    product_ids: automation.product_ids,
    status: 'draft' as const,
    recipient_count: 0,
    success_count: 0,
    failed_count: 0,
    created_by: automation.created_by,
    created_at: automation.created_at,
    updated_at: automation.updated_at,
  } satisfies MarketingCampaign;

  return buildCampaignMessage(message, catalogId);
}

export async function sendToRecipient(
  chatId: number,
  text: string,
  replyMarkup?: SendMarkup
) {
  await sendTelegramMessage(chatId, text, replyMarkup);
}

export async function markCampaignRun(
  run: MarketingCampaignRun | MarketingAutomationRun
) {
  const table =
    'campaign_id' in run ? 'marketing_campaign_runs' : 'marketing_automation_runs';
  const payload: Record<string, unknown> = {
    ...run,
    sent_at: run.sent_at || null,
    error: run.error || null,
  };
  await supabaseService.from(table).upsert(payload, {
    onConflict: 'id',
  });
}
