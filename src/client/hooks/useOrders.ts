import useSWR, { useSWRConfig } from 'swr';
import { clientOrderService } from '../services/orders';
import type { Order } from '../../types';

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
    ([_, orderId]) => orderFetcher('order', orderId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 10 seconds
    }
  );

  return {
    order: data,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    mutate
  };
};

// Hook for creating orders
export const useCreateOrder = () => {
  const { mutate } = useSWRConfig();

  const createOrder = async (orderData: {
    catalog_id: string;
    customer_id: string;
    items: any[];
    total_price: number;
    table_number?: string;
  }) => {
    try {
      const newOrder = await clientOrderService.create(orderData);
      
      // Optimistically update any related caches
      mutate(
        (key: any) => Array.isArray(key) && key[0] === 'orders',
        undefined,
        { revalidate: true }
      );
      
      return newOrder;
    } catch (error) {
      throw error;
    }
  };

  return { createOrder };
};

// Hook for updating order status
export const useUpdateOrderStatus = () => {
  const { mutate } = useSWRConfig();

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const updatedOrder = await clientOrderService.updateStatus(orderId, status);
      
      // Update the specific order cache
      mutate(['order', orderId], updatedOrder, false);
      
      // Also update any orders lists
      mutate(
        (key: any) => Array.isArray(key) && key[0] === 'orders',
        undefined,
        { revalidate: true }
      );
      
      return updatedOrder;
    } catch (error) {
      throw error;
    }
  };

  return { updateStatus };
};