import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const MINI_APP_URL = Deno.env.get('MINI_APP_URL') || '';
const CLIENT_BOT_USERNAME =
  (Deno.env.get('CLIENT_BOT_USERNAME') || '').replace('@', '');
const CLIENT_APP_SHORT_NAME = Deno.env.get('CLIENT_APP_SHORT_NAME') || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type GatewayRow = {
  shop_id: string;
  secret_key: string;
  is_enabled: boolean;
};

type OrderRow = {
  id: string;
  catalog_id: string;
  customer_id: string;
  total_price: number;
  status: string;
  payment_method?: string | null;
  payment_provider?: string | null;
  payment_external_id?: string | null;
  payment_status?: string | null;
  payment_confirmation_url?: string | null;
  payment_details?: Record<string, unknown> | null;
  order_number?: number | null;
};

export type YooKassaPayment = {
  id: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  paid?: boolean;
  amount?: {
    value?: string;
    currency?: string;
  };
  confirmation?: {
    type?: string;
    confirmation_url?: string;
  };
  payment_method?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at?: string;
  captured_at?: string;
  description?: string;
  [key: string]: unknown;
};

export async function getOrderWithGateway(orderId: string): Promise<{
  order: OrderRow;
  gateway: GatewayRow;
}> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error('Заказ не найден');
  }

  const { data: gateway, error: gatewayError } = await supabase
    .from('catalog_payment_gateways')
    .select('shop_id, secret_key, is_enabled')
    .eq('catalog_id', order.catalog_id)
    .eq('provider', 'yookassa')
    .maybeSingle();

  if (gatewayError || !gateway) {
    throw new Error('ЮKassa не настроена для этого каталога');
  }

  if (!gateway.is_enabled) {
    throw new Error('Онлайн-оплата временно отключена');
  }

  return {
    order: order as OrderRow,
    gateway: gateway as GatewayRow,
  };
}

export function createYooKassaHeaders(shopId: string, secretKey: string, idempotenceKey?: string) {
  const basic = btoa(`${shopId}:${secretKey}`);
  return {
    Authorization: `Basic ${basic}`,
    'Content-Type': 'application/json',
    ...(idempotenceKey ? { 'Idempotence-Key': idempotenceKey } : {}),
  };
}

export async function fetchCatalogStartParam(catalogId: string) {
  const { data: qrLink } = await supabase
    .from('qr_links')
    .select('slug')
    .eq('target_type', 'catalog')
    .eq('target_id', catalogId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return qrLink?.slug || `catalog_${catalogId}`;
}

export async function buildReturnUrl(order: OrderRow) {
  const startParam = await fetchCatalogStartParam(order.catalog_id);

  if (CLIENT_BOT_USERNAME && CLIENT_APP_SHORT_NAME) {
    return `https://t.me/${CLIENT_BOT_USERNAME}/${CLIENT_APP_SHORT_NAME}?startapp=${encodeURIComponent(startParam)}`;
  }

  if (MINI_APP_URL) {
    return `${MINI_APP_URL}?role=catalog&startapp=${encodeURIComponent(startParam)}#/order/${order.id}`;
  }

  throw new Error('Не настроен CLIENT_BOT_USERNAME/CLIENT_APP_SHORT_NAME или MINI_APP_URL');
}

export function formatAmount(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

export function buildPaymentDescription(order: OrderRow) {
  const readableOrderNumber = order.order_number
    ? `№${order.order_number}`
    : `#${order.id.slice(0, 8).toUpperCase()}`;

  return `Оплата заказа ${readableOrderNumber}`;
}

export function getPaymentPatch(order: OrderRow, payment: YooKassaPayment) {
  const patch: Record<string, unknown> = {
    payment_provider: 'yookassa',
    payment_method: 'online_yookassa',
    payment_external_id: payment.id,
    payment_status: payment.status,
    payment_confirmation_url:
      payment.confirmation?.confirmation_url || order.payment_confirmation_url || null,
    payment_details: payment,
  };

  if (
    payment.status === 'succeeded' &&
    ['created', 'new'].includes(order.status)
  ) {
    patch.status = 'payment_reported';
  }

  return patch;
}

export async function updateOrderFromPayment(order: OrderRow, payment: YooKassaPayment) {
  const patch = getPaymentPatch(order, payment);
  const { data, error } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', order.id)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Не удалось обновить заказ по статусу оплаты');
  }

  return data;
}

