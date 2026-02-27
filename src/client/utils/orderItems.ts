import type { Item, Order } from '@/types';

type UnknownRecord = Record<string, unknown>;
type OrderItemDraft = Order['items'][number];

const asRecord = (value: unknown): UnknownRecord => {
  if (!value || typeof value !== 'object') return {};
  return value as UnknownRecord;
};

export const parseOrderItems = (value: unknown): UnknownRecord[] =>
  Array.isArray(value) ? value.map(asRecord) : [];

export const isOrderItemLike = (
  value: OrderItemDraft | undefined
): value is Item =>
  Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as { title?: unknown }).title === 'string'
  );
