import { clientSupabase } from '@/lib/supabase';
import { getTelegramUser } from '@/lib/telegram';
import type {
  CustomerEvent,
  CustomerEventType,
  CustomerFavorite,
  CustomerTrafficSource,
} from '@/types';

const VISIT_MARKER_PREFIX = 'client-visit-marker:';
const LOCAL_EVENTS_KEY = 'client-local-events';

const safeReadJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const safeWriteJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage issues.
  }
};

const getVisitStorageKey = (catalogId: string, customerId: string) =>
  `${VISIT_MARKER_PREFIX}${catalogId}:${customerId}`;

export const resolveTrafficSource = (
  catalogId: string,
  customerId: string
): CustomerTrafficSource => {
  const visitKey = getVisitStorageKey(catalogId, customerId);
  if (localStorage.getItem(visitKey)) {
    return 'repeat_visit';
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash.split('?')[1] || '';
  const hashParams = new URLSearchParams(hashQuery);
  const explicitSource =
    searchParams.get('source') || hashParams.get('source') || '';

  if (
    explicitSource === 'qr' ||
    explicitSource === 'qr_code' ||
    searchParams.get('table') ||
    hashParams.get('table') ||
    localStorage.getItem('client-current-place-id')
  ) {
    return 'qr_code';
  }

  return 'direct_link';
};

const rememberVisit = (catalogId: string, customerId: string) => {
  localStorage.setItem(getVisitStorageKey(catalogId, customerId), String(Date.now()));
};

const pushLocalEvent = (event: Omit<CustomerEvent, 'id' | 'created_at'>) => {
  const current = safeReadJson<Array<Omit<CustomerEvent, 'id' | 'created_at'>>>(
    LOCAL_EVENTS_KEY,
    []
  );
  current.unshift(event);
  safeWriteJson(LOCAL_EVENTS_KEY, current.slice(0, 200));
};

export const customerIntelligenceService = {
  async trackEvent(input: {
    catalogId: string;
    customerId?: string | null;
    orderId?: string | null;
    eventType: CustomerEventType;
    source?: CustomerTrafficSource;
    metadata?: Record<string, unknown>;
  }) {
    const customerId = input.customerId || '';
    if (!input.catalogId || !customerId) return;

    const tgUser = getTelegramUser();
    const source = input.source || resolveTrafficSource(input.catalogId, customerId);
    const metadata = {
      ...(input.metadata || {}),
      telegram_username: tgUser?.username || null,
      telegram_first_name: tgUser?.first_name || null,
      pathname: window.location.pathname,
    };

    const eventPayload = {
      catalog_id: input.catalogId,
      customer_id: customerId,
      order_id: input.orderId || null,
      event_type: input.eventType,
      source,
      metadata,
    };

    pushLocalEvent(eventPayload);

    try {
      await clientSupabase.from('customer_events').insert(eventPayload);
    } catch {
      // Keep local history even when DB migration is not applied yet.
    }
  },

  async trackCatalogVisit(catalogId: string, customerId?: string | null) {
    const resolvedCustomerId = customerId || '';
    if (!resolvedCustomerId) return;
    const source = resolveTrafficSource(catalogId, resolvedCustomerId);
    const alreadyVisited = source === 'repeat_visit';
    await this.trackEvent({
      catalogId,
      customerId: resolvedCustomerId,
      eventType: alreadyVisited ? 'repeat_visit' : 'first_visit',
      source,
    });
    await this.trackEvent({
      catalogId,
      customerId: resolvedCustomerId,
      eventType: 'catalog_view',
      source,
    });
    rememberVisit(catalogId, resolvedCustomerId);
  },

  async syncFavorite(
    mode: 'add' | 'remove',
    catalogId: string,
    customerId: string,
    itemId: string
  ) {
    if (!catalogId || !customerId || !itemId) return;

    try {
      if (mode === 'add') {
        await clientSupabase.from('customer_favorites').upsert({
          catalog_id: catalogId,
          customer_id: customerId,
          item_id: itemId,
        });
      } else {
        await clientSupabase
          .from('customer_favorites')
          .delete()
          .eq('catalog_id', catalogId)
          .eq('customer_id', customerId)
          .eq('item_id', itemId);
      }
    } catch {
      // Local favorites still work without DB sync.
    }
  },

  async getRemoteFavorites(
    catalogId: string,
    customerId: string
  ): Promise<CustomerFavorite[]> {
    try {
      const { data, error } = await clientSupabase
        .from('customer_favorites')
        .select('id, catalog_id, customer_id, item_id, created_at')
        .eq('catalog_id', catalogId)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as CustomerFavorite[];
    } catch {
      return [];
    }
  },
};
