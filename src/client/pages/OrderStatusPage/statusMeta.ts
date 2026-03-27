import {
  TERMINAL_ORDER_STATUSES,
  getOrderStatusMeta,
  getStatusToneClasses,
} from '@/shared/orderStatus';
import type { FulfillmentMethodType } from '@/types';

export type StatusMeta = {
  label: string;
  className: string;
  description: string;
};

export const TERMINAL_STATUSES = TERMINAL_ORDER_STATUSES;

export function resolveStatusMeta(
  status: string,
  fulfillmentMethod?: FulfillmentMethodType | null
): StatusMeta {
  const meta = getOrderStatusMeta(status, fulfillmentMethod);

  return {
    label: meta.label,
    className: getStatusToneClasses(meta.tone),
    description: meta.description,
  };
}
