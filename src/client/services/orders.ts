import { clientSupabase } from '../../lib/supabase';
import type { FulfillmentMethodType, Order, OrderStatus } from '../../types';

// Client Order Services
export const clientOrderService = {
  // Create new order
  async create(orderData: {
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
  }): Promise<Order> {
    const { data, error } = await clientSupabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get order by ID
  async getById(id: string): Promise<Order | null> {
    const { data, error } = await clientSupabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update order status
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const { data, error } = await clientSupabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, orderData: Partial<Order>): Promise<Order> {
    const { data, error } = await clientSupabase
      .from('orders')
      .update(orderData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
