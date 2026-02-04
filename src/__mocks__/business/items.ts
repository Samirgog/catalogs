import type { Item } from '../../types';

export const mockItems: Item[] = [
  // Items for catalog-1 (Основное меню)
  {
    id: 'item-1',
    category_id: 'category-1',
    title: 'Борщ',
    description: 'Традиционный украинский борщ с густой сметаной',
    price: 250,
    image_url: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5f5c?w=300&h=200&fit=crop',
    is_available: true,
    position: 1,
    metadata: {
      weight: '350г',
      ingredients: ['свекла', 'капуста', 'картофель', 'мясо']
    },
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z'
  },
  {
    id: 'item-2',
    category_id: 'category-1',
    title: 'Пельмени домашние',
    description: 'Сочная говядина и свинина в тонком тесте',
    price: 320,
    image_url: 'https://images.unsplash.com/photo-1606756040081-5d8c6fb1c72b?w=300&h=200&fit=crop',
    is_available: true,
    position: 2,
    metadata: {
      weight: '400г',
      ingredients: ['мука', 'говядина', 'свинина', 'лук'],
      cooking_time: '15 мин'
    },
    created_at: '2024-01-15T12:05:00Z',
    updated_at: '2024-01-15T12:05:00Z'
  },
  {
    id: 'item-3',
    category_id: 'category-2',
    title: 'Цезарь',
    description: 'Классический салат с курицей и пармезаном',
    price: 380,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop',
    is_available: true,
    position: 1,
    metadata: {
      weight: '250г',
      ingredients: ['курица', 'салат айсберг', 'пармезан', 'гренки']
    },
    created_at: '2024-01-15T12:10:00Z',
    updated_at: '2024-01-15T12:10:00Z'
  },
  {
    id: 'item-4',
    category_id: 'category-3',
    title: 'Морс клюквенный',
    description: 'Освежающий напиток из свежей клюквы',
    price: 120,
    image_url: 'https://images.unsplash.com/photo-1536937275676-206a9dc9fc5a?w=300&h=200&fit=crop',
    is_available: true,
    position: 1,
    metadata: {
      volume: '300мл',
      ingredients: ['клюква', 'вода', 'сахар']
    },
    created_at: '2024-01-15T12:15:00Z',
    updated_at: '2024-01-15T12:15:00Z'
  },
  // Items for catalog-3 (Массажные услуги)
  {
    id: 'item-5',
    category_id: 'category-4',
    title: 'Классический массаж спины',
    description: 'Расслабляющий массаж для снятия напряжения',
    price: 1500,
    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=200&fit=crop',
    is_available: true,
    position: 1,
    metadata: {
      duration: '60 мин',
      benefits: ['расслабление', 'улучшение кровообращения']
    },
    created_at: '2024-01-25T15:00:00Z',
    updated_at: '2024-01-25T15:00:00Z'
  },
  {
    id: 'item-6',
    category_id: 'category-5',
    title: 'Спортивный массаж ног',
    description: 'Глубокий массаж для восстановления мышц',
    price: 2000,
    image_url: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=300&h=200&fit=crop',
    is_available: true,
    position: 1,
    metadata: {
      duration: '45 мин',
      benefits: ['восстановление', 'профилактика травм']
    },
    created_at: '2024-01-25T15:05:00Z',
    updated_at: '2024-01-25T15:05:00Z'
  }
];