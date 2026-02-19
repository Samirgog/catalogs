import type { Order } from '../../types';

const CURRENT_ORDER_KEY = 'client-current-order';

export type CurrentOrderRef = {
  id: string;
  orderNumber?: string;
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

export const getCurrentOrder = (): CurrentOrderRef | null => {
  const raw = localStorage.getItem(CURRENT_ORDER_KEY);
  if (!raw) return null;
  return safeParse(raw);
};

export const setCurrentOrder = (order: Pick<Order, 'id' | 'order_number'>) => {
  const orderNumber = order.order_number
    ? String(order.order_number)
    : undefined;
  const payload: CurrentOrderRef = {
    id: order.id,
    orderNumber,
  };
  localStorage.setItem(CURRENT_ORDER_KEY, JSON.stringify(payload));
};

export const clearCurrentOrder = () => {
  localStorage.removeItem(CURRENT_ORDER_KEY);
};

export const getReadableOrderNumber = (
  order: Pick<Order, 'id' | 'order_number'>
) => {
  if (order.order_number) return String(order.order_number);
  return order.id.slice(0, 8).toUpperCase();
};
