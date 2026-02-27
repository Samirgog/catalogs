import type { Catalog, FulfillmentMethodType } from '@/types';

export const getAllowedFulfillmentOptions = (
  catalog: Catalog | null | undefined
): FulfillmentMethodType[] => {
  const all = (catalog?.fulfillment_methods ?? [])
    .filter((method) => method.is_enabled)
    .map((method) => method.method);

  if (!catalog) return all;

  if (catalog.type === 'goods' && catalog.subtype === 'shop') {
    return all.filter((method) => method === 'pickup' || method === 'delivery');
  }
  if (catalog.type === 'goods' && catalog.subtype === 'cafe_restaurant') {
    return all.filter(
      (method) =>
        method === 'pickup' || method === 'delivery' || method === 'to_table'
    );
  }
  if (catalog.type === 'goods' && catalog.subtype === 'digital_store') {
    return all.filter((method) => method === 'digital');
  }
  if (catalog.type === 'services') {
    if (catalog.subtype === 'studio_club') {
      return all.filter((method) => method === 'digital' || method === 'pickup');
    }
    return all.filter((method) => method === 'on_site' || method === 'at_client');
  }

  return all;
};

export const normalizeTelegramContactLink = (
  rawTelegram: string | null | undefined
): string => {
  const raw = rawTelegram?.trim();
  if (!raw) return '';
  if (raw.startsWith('https://') || raw.startsWith('http://')) return raw;
  if (raw.startsWith('@')) return `https://t.me/${raw.slice(1)}`;
  if (raw.startsWith('t.me/')) return `https://${raw}`;
  if (/^[a-zA-Z0-9_]{5,}$/.test(raw)) return `https://t.me/${raw}`;
  return raw;
};
