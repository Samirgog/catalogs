import { businessSupabase } from '@/lib/supabase';
import type {
  CatalogAnalyticsSnapshot,
  CustomerEvent,
  CustomerFavorite,
  CustomerNote,
  CustomerProfile,
  CustomerTag,
  CustomerTagCode,
  CustomerTrafficSource,
  Order,
} from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;

const toDate = (value?: string | null) => (value ? new Date(value) : null);

const resolveCustomerStatus = (profile: {
  lastVisitAt?: string;
  ordersCount: number;
  averageCheck: number;
  tags: CustomerTagCode[];
}): CustomerProfile['status'] => {
  if (profile.tags.includes('vip') || profile.averageCheck >= 5000) return 'vip';
  if (profile.ordersCount === 0) return 'no_orders';
  if (profile.lastVisitAt) {
    const diff = Date.now() - new Date(profile.lastVisitAt).getTime();
    if (diff > 30 * DAY_MS) return 'lost';
  }
  if (profile.ordersCount >= 2) return 'regular';
  return 'new';
};

const safeSelect = async <T>(query: PromiseLike<{ data: T[] | null; error: unknown }>) => {
  try {
    const result = await query;
    if (result.error) {
      return [] as T[];
    }
    return (result.data || []) as T[];
  } catch {
    return [] as T[];
  }
};

export const customerInsightsService = {
  async getProfiles(catalogId: string): Promise<CustomerProfile[]> {
    const orders = await safeSelect<Order>(
      businessSupabase
        .from('orders')
        .select('*')
        .eq('catalog_id', catalogId)
        .order('created_at', { ascending: false })
    );

    const events = await safeSelect<CustomerEvent>(
      businessSupabase
        .from('customer_events')
        .select('*')
        .eq('catalog_id', catalogId)
        .order('created_at', { ascending: false })
    );

    const favorites = await safeSelect<CustomerFavorite>(
      businessSupabase
        .from('customer_favorites')
        .select('id, catalog_id, customer_id, item_id, created_at')
        .eq('catalog_id', catalogId)
        .order('created_at', { ascending: false })
    );

    const tags = await safeSelect<CustomerTag>(
      businessSupabase
        .from('customer_tags')
        .select('*')
        .eq('catalog_id', catalogId)
        .order('created_at', { ascending: false })
    );

    const notes = await safeSelect<CustomerNote>(
      businessSupabase
        .from('customer_notes')
        .select('*')
        .eq('catalog_id', catalogId)
        .order('created_at', { ascending: false })
    );

    const favoriteItemIds = Array.from(new Set(favorites.map((favorite) => favorite.item_id)));
    const favoriteItems =
      favoriteItemIds.length > 0
        ? await safeSelect<{
            id: string;
            title: string;
            price?: number;
            image_url?: string;
          }>(
            businessSupabase
              .from('items')
              .select('id, title, price, image_url')
              .in('id', favoriteItemIds)
          )
        : [];

    const favoriteItemsById = new Map(favoriteItems.map((item) => [item.id, item]));
    const profiles = new Map<
      string,
      {
        profile: CustomerProfile;
        orders: Order[];
        events: CustomerEvent[];
        notes: CustomerNote[];
      }
    >();

    const ensureProfile = (customerId: string) => {
      const existing = profiles.get(customerId);
      if (existing) return existing;

      const seed: CustomerProfile = {
        customer_id: customerId,
        name: 'Без имени',
        orders_count: 0,
        total_spent: 0,
        average_check: 0,
        status: 'no_orders',
        favorite_items: [],
        tags: [],
        revenue: 0,
      };

      const next = { profile: seed, orders: [], events: [], notes: [] };
      profiles.set(customerId, next);
      return next;
    };

    for (const order of orders) {
      const bucket = ensureProfile(order.customer_id);
      bucket.orders.push(order);
      bucket.profile.name =
        order.customer_name?.trim() ||
        bucket.profile.name ||
        'Без имени';
      bucket.profile.phone = order.customer_phone || bucket.profile.phone;
      bucket.profile.orders_count += 1;
      bucket.profile.total_spent += Number(order.total_price || 0);
      bucket.profile.revenue = bucket.profile.total_spent;
      bucket.profile.last_order = bucket.profile.last_order || order;
      bucket.profile.first_visit_at = bucket.profile.first_visit_at
        ? new Date(order.created_at) < new Date(bucket.profile.first_visit_at)
          ? order.created_at
          : bucket.profile.first_visit_at
        : order.created_at;
      bucket.profile.last_visit_at = bucket.profile.last_visit_at
        ? new Date(order.created_at) > new Date(bucket.profile.last_visit_at)
          ? order.created_at
          : bucket.profile.last_visit_at
        : order.created_at;
    }

    for (const event of events) {
      const bucket = ensureProfile(event.customer_id);
      bucket.events.push(event);
      const metaName = String(event.metadata?.telegram_first_name || '').trim();
      const metaUsername = String(event.metadata?.telegram_username || '').trim();
      if (bucket.profile.name === 'Без имени' && metaName) {
        bucket.profile.name = metaName;
      }
      if (!bucket.profile.username && metaUsername) {
        bucket.profile.username = metaUsername;
      }
      bucket.profile.source = bucket.profile.source || (event.source as CustomerTrafficSource);
      bucket.profile.first_visit_at = bucket.profile.first_visit_at
        ? new Date(event.created_at) < new Date(bucket.profile.first_visit_at)
          ? event.created_at
          : bucket.profile.first_visit_at
        : event.created_at;
      bucket.profile.last_visit_at = bucket.profile.last_visit_at
        ? new Date(event.created_at) > new Date(bucket.profile.last_visit_at)
          ? event.created_at
          : bucket.profile.last_visit_at
        : event.created_at;
    }

    for (const favorite of favorites) {
      const bucket = ensureProfile(favorite.customer_id);
      const item = favoriteItemsById.get(favorite.item_id);
      if (!item) continue;
      if (!bucket.profile.favorite_items.some((current) => current.id === item.id)) {
        bucket.profile.favorite_items.push(item);
      }
    }

    for (const tag of tags) {
      const bucket = ensureProfile(tag.customer_id);
      if (!bucket.profile.tags.includes(tag.tag)) {
        bucket.profile.tags.push(tag.tag);
      }
    }

    for (const note of notes) {
      const bucket = ensureProfile(note.customer_id);
      bucket.notes.push(note);
    }

    return Array.from(profiles.values())
      .map(({ profile }) => {
        const averageCheck =
          profile.orders_count > 0 ? profile.total_spent / profile.orders_count : 0;
        const status = resolveCustomerStatus({
          lastVisitAt: profile.last_visit_at,
          ordersCount: profile.orders_count,
          averageCheck,
          tags: profile.tags,
        });

        return {
          ...profile,
          average_check: averageCheck,
          status,
        };
      })
      .sort((a, b) => {
        const dateA = toDate(a.last_visit_at)?.getTime() || 0;
        const dateB = toDate(b.last_visit_at)?.getTime() || 0;
        return dateB - dateA;
      });
  },

  async getProfileDetail(catalogId: string, customerId: string) {
    const [profiles, orders, events, notes, tags] = await Promise.all([
      this.getProfiles(catalogId),
      safeSelect<Order>(
        businessSupabase
          .from('orders')
          .select('*')
          .eq('catalog_id', catalogId)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
      ),
      safeSelect<CustomerEvent>(
        businessSupabase
          .from('customer_events')
          .select('*')
          .eq('catalog_id', catalogId)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
      ),
      safeSelect<CustomerNote>(
        businessSupabase
          .from('customer_notes')
          .select('*')
          .eq('catalog_id', catalogId)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
      ),
      safeSelect<CustomerTag>(
        businessSupabase
          .from('customer_tags')
          .select('*')
          .eq('catalog_id', catalogId)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
      ),
    ]);

    return {
      profile: profiles.find((profile) => profile.customer_id === customerId) || null,
      orders,
      events,
      notes,
      tags,
    };
  },

  async getAnalytics(catalogId: string): Promise<CatalogAnalyticsSnapshot> {
    const [profiles, orders, events, favorites] = await Promise.all([
      this.getProfiles(catalogId),
      safeSelect<Order>(
        businessSupabase
          .from('orders')
          .select('*')
          .eq('catalog_id', catalogId)
          .order('created_at', { ascending: false })
      ),
      safeSelect<CustomerEvent>(
        businessSupabase
          .from('customer_events')
          .select('*')
          .eq('catalog_id', catalogId)
          .order('created_at', { ascending: false })
      ),
      safeSelect<CustomerFavorite>(
        businessSupabase
          .from('customer_favorites')
          .select('id, catalog_id, customer_id, item_id, created_at')
          .eq('catalog_id', catalogId)
      ),
    ]);

    const now = Date.now();
    const visits = events.filter((event) =>
      ['first_visit', 'repeat_visit', 'catalog_view'].includes(event.event_type)
    );
    const carts = events.filter((event) =>
      ['cart_add', 'cart_quantity_change'].includes(event.event_type)
    );
    const itemCounter = new Map<string, { title: string; count: number }>();
    const favoriteCounter = new Map<string, number>();
    const sourceCounter = new Map<CustomerTrafficSource, number>();

    for (const order of orders) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const itemId = String(item.item_id || '');
        const title = String(item.title || 'Товар');
        const quantity = Number(item.quantity || 1);
        if (!itemId) continue;
        const current = itemCounter.get(itemId) || { title, count: 0 };
        current.count += quantity;
        itemCounter.set(itemId, current);
      }
    }

    for (const favorite of favorites) {
      favoriteCounter.set(
        favorite.item_id,
        (favoriteCounter.get(favorite.item_id) || 0) + 1
      );
    }

    for (const event of events) {
      sourceCounter.set(
        event.source,
        (sourceCounter.get(event.source) || 0) + 1
      );
    }

    const newToday = profiles.filter((profile) => {
      const firstVisit = toDate(profile.first_visit_at);
      return firstVisit ? now - firstVisit.getTime() <= DAY_MS : false;
    }).length;
    const newWeek = profiles.filter((profile) => {
      const firstVisit = toDate(profile.first_visit_at);
      return firstVisit ? now - firstVisit.getTime() <= 7 * DAY_MS : false;
    }).length;
    const newMonth = profiles.filter((profile) => {
      const firstVisit = toDate(profile.first_visit_at);
      return firstVisit ? now - firstVisit.getTime() <= 30 * DAY_MS : false;
    }).length;
    const returningCustomers = profiles.filter((profile) => profile.orders_count >= 2).length;
    const customersTotal = profiles.length;
    const averageCheck =
      orders.length > 0
        ? orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0) /
          orders.length
        : 0;

    return {
      customers_total: customersTotal,
      new_today: newToday,
      new_week: newWeek,
      new_month: newMonth,
      returning_customers: returningCustomers,
      retention_rate:
        customersTotal > 0 ? (returningCustomers / customersTotal) * 100 : 0,
      average_check: averageCheck,
      revenue_total: orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0),
      conversion_visit_to_cart:
        visits.length > 0 ? (carts.length / visits.length) * 100 : 0,
      conversion_cart_to_order:
        carts.length > 0 ? (orders.length / carts.length) * 100 : 0,
      abandoned_carts: events.filter((event) => event.event_type === 'session_without_purchase').length,
      popular_items: Array.from(itemCounter.entries())
        .map(([item_id, value]) => ({ item_id, title: value.title, count: value.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      favorite_items: Array.from(favoriteCounter.entries())
        .map(([item_id, count]) => ({
          item_id,
          title:
            orders
              .flatMap((order) => (Array.isArray(order.items) ? order.items : []))
              .find((item) => String(item.item_id || '') === item_id)?.title
              ?.toString() || 'Товар',
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      traffic_sources: Array.from(sourceCounter.entries()).map(([source, count]) => ({
        source,
        count,
      })),
      stale_customers: profiles.filter((profile) => {
        const lastVisit = toDate(profile.last_visit_at);
        return lastVisit ? now - lastVisit.getTime() > 30 * DAY_MS : false;
      }).length,
    };
  },
};
