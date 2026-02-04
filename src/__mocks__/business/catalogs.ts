import type { Catalog, CatalogType } from '../../types';

export const mockCatalogs: Catalog[] = [
  {
    id: 'catalog-1',
    owner_id: 'user-1',
    title: 'Основное меню',
    description: 'Полное меню нашего ресторана',
    type: 'goods' as CatalogType,
    banner_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop',
    settings: {
      sbp_enabled: true,
      sbp_link: 'https://sbp.example.com/pay',
      on_delivery: true
    },
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-02-01T14:30:00Z',
    categories: []
  },
  {
    id: 'catalog-2',
    owner_id: 'user-1',
    title: 'Летние специальные предложения',
    description: 'Сезонные блюда и акции',
    type: 'goods' as CatalogType,
    banner_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop',
    settings: {
      sbp_enabled: false,
      on_delivery: true
    },
    is_active: false,
    created_at: '2024-01-20T09:15:00Z',
    updated_at: '2024-01-25T11:45:00Z',
    categories: []
  },
  {
    id: 'catalog-3',
    owner_id: 'user-2',
    title: 'Массажные услуги',
    description: 'Профессиональные массажные процедуры',
    type: 'services' as CatalogType,
    banner_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=200&fit=crop',
    settings: {
      contact_info: '@massage_master'
    },
    is_active: true,
    created_at: '2024-01-25T13:20:00Z',
    updated_at: '2024-01-30T16:10:00Z',
    categories: []
  }
];