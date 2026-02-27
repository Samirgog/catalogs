import type { FulfillmentMethodType, Order } from '@/types';
import { requiresAddressForFulfillment } from './presentation';

type FulfillmentInput = {
  selectedFulfillment: FulfillmentMethodType;
  deliveryAddress: string;
  tableNumber: string;
};

type CustomerInput = {
  customerName: string;
  customerPhone: string;
  customerComment: string;
};

export const validateFulfillmentInput = ({
  selectedFulfillment,
  deliveryAddress,
  tableNumber,
}: FulfillmentInput): string | null => {
  if (
    requiresAddressForFulfillment(selectedFulfillment) &&
    !deliveryAddress.trim()
  ) {
    return 'Укажите адрес';
  }
  if (selectedFulfillment === 'to_table' && !tableNumber.trim()) {
    return 'Укажите номер столика';
  }
  return null;
};

export const getFulfillmentFields = ({
  selectedFulfillment,
  deliveryAddress,
  tableNumber,
}: FulfillmentInput): Pick<Order, 'fulfillment_method' | 'delivery_address' | 'table_number'> => ({
  fulfillment_method: selectedFulfillment,
  delivery_address: requiresAddressForFulfillment(selectedFulfillment)
    ? deliveryAddress.trim()
    : undefined,
  table_number: selectedFulfillment === 'to_table' ? tableNumber.trim() : undefined,
});

export const buildOrderUpdatePayload = ({
  selectedFulfillment,
  deliveryAddress,
  tableNumber,
  customerName,
  customerPhone,
  customerComment,
  paymentMethod,
}: FulfillmentInput &
  CustomerInput & {
    paymentMethod: Order['payment_method'];
  }): Partial<Order> => ({
  customer_name: customerName.trim(),
  customer_phone: customerPhone.trim(),
  customer_comment: customerComment.trim(),
  payment_method: paymentMethod,
  ...getFulfillmentFields({
    selectedFulfillment,
    deliveryAddress,
    tableNumber,
  }),
});

export const persistFulfillmentDraft = ({
  selectedFulfillment,
  deliveryAddress,
  tableNumber,
}: FulfillmentInput) => {
  if (
    requiresAddressForFulfillment(selectedFulfillment) &&
    deliveryAddress.trim()
  ) {
    localStorage.setItem('client-last-delivery-address', deliveryAddress.trim());
  }
  if (selectedFulfillment === 'to_table' && tableNumber.trim()) {
    localStorage.setItem('client-table-number', tableNumber.trim());
  }
};
