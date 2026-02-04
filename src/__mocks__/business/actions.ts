import type { Action, ActionType } from '../../types';

export const mockActions: Action[] = [
  {
    id: 'action-1',
    catalog_id: 'catalog-1',
    type: 'order' as ActionType,
    is_enabled: true,
    config: {
      require_table_number: true
    },
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'action-2',
    catalog_id: 'catalog-1',
    type: 'pay' as ActionType,
    is_enabled: true,
    config: {
      payment_method: 'sbp',
      sbp_link: 'https://sbp.example.com/pay/menu'
    },
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'action-3',
    catalog_id: 'catalog-2',
    type: 'order' as ActionType,
    is_enabled: true,
    config: {
      require_table_number: false
    },
    created_at: '2024-01-20T09:30:00Z',
    updated_at: '2024-01-20T09:30:00Z'
  },
  {
    id: 'action-4',
    catalog_id: 'catalog-3',
    type: 'book' as ActionType,
    is_enabled: true,
    config: {
      contact_method: 'telegram',
      contact_info: '@massage_master'
    },
    created_at: '2024-01-25T13:30:00Z',
    updated_at: '2024-01-25T13:30:00Z'
  },
  {
    id: 'action-5',
    catalog_id: 'catalog-3',
    type: 'chat' as ActionType,
    is_enabled: true,
    config: {
      chat_platform: 'telegram',
      chat_link: 'https://t.me/massage_master'
    },
    created_at: '2024-01-25T13:30:00Z',
    updated_at: '2024-01-25T13:30:00Z'
  }
];