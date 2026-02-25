import useSWR, { useSWRConfig } from 'swr';
import { clientOrderService } from '../services/orders';
import type {
  FulfillmentMethodType,
  Order,
  OrderStatus,
} from '../../types';

// SWR fetcher for orders
const orderFetcher = async (key: string, id: string) => {
  switch (key) {
    case 'order':
      return await clientOrderService.getById(id);
    default:
      throw new Error(`Unknown key: ${key}`);
  }
};

// Hook for getting order by ID
export const useOrder = (id: string | null) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    id ? ['order', id] : null,
    key => orderFetcher(key[0], key[1]),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 10 seconds
      refreshInterval: 10000,
    }
  );

  return {
    order: data,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    mutate,
  };
};

// Hook for creating orders
export const useCreateOrder = () => {
  const { mutate } = useSWRConfig();

  const createOrder = async (orderData: {
    catalog_id: string;
    customer_id: string;
    customer_name?: string;
    customer_phone?: string;
    customer_comment?: string;
    fulfillment_method?: FulfillmentMethodType;
    payment_method?: Order['payment_method'];
    delivery_address?: string;
    items: Record<string, unknown>[];
    total_price: number;
    table_number?: string;
    status?: OrderStatus;
  }) => {
    const newOrder = await clientOrderService.create(orderData);

    // Optimistically update any related caches
    mutate(
      (key: unknown) => Array.isArray(key) && key[0] === 'orders',
      undefined,
      { revalidate: true }
    );

    return newOrder;
  };

  return { createOrder };
};

// Hook for updating order status
export const useUpdateOrderStatus = () => {
  const { mutate } = useSWRConfig();

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const updatedOrder = await clientOrderService.updateStatus(orderId, status);

    // Update the specific order cache
    mutate(['order', orderId], updatedOrder, false);

    // Also update any orders lists
    mutate(
      (key: unknown) => Array.isArray(key) && key[0] === 'orders',
      undefined,
      { revalidate: true }
    );

    return updatedOrder;
  };

  return { updateStatus };
};

export const useUpdateOrder = () => {
  const { mutate } = useSWRConfig();

  const updateOrder = async (orderId: string, orderData: Partial<Order>) => {
    const updatedOrder = await clientOrderService.update(orderId, orderData);
    mutate(['order', orderId], updatedOrder, false);
    mutate(
      (key: unknown) => Array.isArray(key) && key[0] === 'orders',
      undefined,
      { revalidate: true }
    );
    return updatedOrder;
  };

  return { updateOrder };
};
