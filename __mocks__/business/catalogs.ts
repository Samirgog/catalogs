import type {Catalog} from '../../src/types'

const sampleCatalogs: Catalog[] = [
  {
    id: '1',
    title: 'Основное меню',
    is_active: true,
    created_at: '2024-01-15',
    updated_at: '2024-02-01',
    banner_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop',
  },
  {
    id: '2',
    title: 'Летние специальные предложения',
    is_active: false,
    created_at: '2024-01-20',
    updated_at: '2024-01-25',
    banner_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop',
  },
  {
    id: '3',
    title: 'Напитки и закуски',
    is_active: true,
    created_at: '2024-01-25',
    updated_at: '2024-01-30',
    banner_url: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=400&h=200&fit=crop',
  },
];