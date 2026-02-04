import type { Order, OrderStatus } from '../../types';

export const mockOrders: Order[] = [
  {
    id: 'order-1',
    catalog_id: 'catalog-1',
    customer_id: 'user-2',
    items: [
      {
        item_id: 'item-1',
        quantity: 2,
        price: 250
      },
      {
        item_id: 'item-3',
        quantity: 1,
        price: 380
      }
    ],
    total_price: 880,
    table_number: '15',
    status: 'new' as OrderStatus,
    created_at: '2024-02-01T19:30:00Z',
    updated_at: '2024-02-01T19:30:00Z'
  },
  {
    id: 'order-2',
    catalog_id: 'catalog-1',
    customer_id: 'user-1',
    items: [
      {
        item_id: 'item-2',
        quantity: 1,
        price: 320
      },
      {
        item_id: 'item-4',
        quantity: 2,
        price: 120
      }
    ],
    total_price: 560,
    table_number: '8',
    status: 'paid' as OrderStatus,
    created_at: '2024-02-01T20:15:00Z',
    updated_at: '2024-02-01T20:20:00Z'
  },
  {
    id: 'order-3',
    catalog_id: 'catalog-1',
    customer_id: 'user-2',
    items: [
      {
        item_id: 'item-1',
        quantity: 1,
        price: 250
      }
    ],
    total_price: 250,
    table_number: '12',
    status: 'completed' as OrderStatus,
    created_at: '2024-02-01T18:45:00Z',
    updated_at: '2024-02-01T19:15:00Z'
  }
];