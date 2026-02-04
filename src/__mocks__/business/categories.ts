import type { Category } from '../../types';

export const mockCategories: Category[] = [
  {
    id: 'category-1',
    catalog_id: 'catalog-1',
    title: 'Горячие блюда',
    position: 1,
    is_active: true,
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
    items: []
  },
  {
    id: 'category-2',
    catalog_id: 'catalog-1',
    title: 'Салаты',
    position: 2,
    is_active: true,
    created_at: '2024-01-15T11:05:00Z',
    updated_at: '2024-01-15T11:05:00Z',
    items: []
  },
  {
    id: 'category-3',
    catalog_id: 'catalog-1',
    title: 'Напитки',
    position: 3,
    is_active: true,
    created_at: '2024-01-15T11:10:00Z',
    updated_at: '2024-01-15T11:10:00Z',
    items: []
  },
  {
    id: 'category-4',
    catalog_id: 'catalog-3',
    title: 'Расслабляющий массаж',
    position: 1,
    is_active: true,
    created_at: '2024-01-25T14:00:00Z',
    updated_at: '2024-01-25T14:00:00Z',
    items: []
  },
  {
    id: 'category-5',
    catalog_id: 'catalog-3',
    title: 'Спортивный массаж',
    position: 2,
    is_active: true,
    created_at: '2024-01-25T14:05:00Z',
    updated_at: '2024-01-25T14:05:00Z',
    items: []
  }
];