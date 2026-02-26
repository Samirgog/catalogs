import type { Order } from '../../types';

const CURRENT_ORDER_KEY = 'client-current-order';
const CURRENT_ORDERS_KEY = 'client-current-orders';

export type CurrentOrderRef = {
  id: string;
  orderNumber?: string;
  catalogId?: string;
};

const safeParse = (value: string): CurrentOrderRef | null => {
  try {
    const parsed = JSON.parse(value) as CurrentOrderRef;
    if (!parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
};

const safeParseList = (value: string): CurrentOrderRef[] => {
  try {
    const parsed = JSON.parse(value) as CurrentOrderRef[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => Boolean(item?.id));
  } catch {
    return [];
  }
};

export const getCurrentOrder = (): CurrentOrderRef | null => {
  const raw = localStorage.getItem(CURRENT_ORDER_KEY);
  if (!raw) return null;
  return safeParse(raw);
};

export const setCurrentOrder = (
  order: Pick<Order, 'id' | 'order_number' | 'catalog_id'>
) => {
  const orderNumber = order.order_number
    ? String(order.order_number)
    : undefined;
  const payload: CurrentOrderRef = {
    id: order.id,
    orderNumber,
    catalogId: order.catalog_id,
  };
  localStorage.setItem(CURRENT_ORDER_KEY, JSON.stringify(payload));
  const existing = getCurrentOrders();
  const deduped = [payload, ...existing.filter(item => item.id !== payload.id)];
  localStorage.setItem(CURRENT_ORDERS_KEY, JSON.stringify(deduped.slice(0, 50)));
};

export const clearCurrentOrder = () => {
  localStorage.removeItem(CURRENT_ORDER_KEY);
};

export const clearOrderFromHistory = (orderId: string) => {
  const existing = getCurrentOrders().filter(item => item.id !== orderId);
  localStorage.setItem(CURRENT_ORDERS_KEY, JSON.stringify(existing));
  const current = getCurrentOrder();
  if (current?.id === orderId) {
    clearCurrentOrder();
  }
};

export const getCurrentOrders = (): CurrentOrderRef[] => {
  const raw = localStorage.getItem(CURRENT_ORDERS_KEY);
  if (!raw) return [];
  return safeParseList(raw);
};

export const getCurrentOrdersByCatalog = (catalogId: string) =>
  getCurrentOrders().filter(order => order.catalogId === catalogId);

export const getReadableOrderNumber = (
  order: Pick<Order, 'id' | 'order_number'>
) => {
  if (order.order_number) return String(order.order_number);
  return order.id.slice(0, 8).toUpperCase();
};
