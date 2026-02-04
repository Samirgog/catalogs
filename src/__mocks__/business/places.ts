import type { Place, PlaceType } from '../../types';

export const mockPlaces: Place[] = [
  {
    id: 'place-1',
    name: 'Центральный ресторан',
    address: 'ул. Ленина, 123, Москва',
    type: 'single' as PlaceType,
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T09:00:00Z'
  },
  {
    id: 'place-2',
    name: 'Фудкорт "Вкус мира"',
    address: 'пр. Мира, 45, ТРЦ "Галерея"',
    type: 'foodcourt' as PlaceType,
    created_at: '2024-01-05T10:30:00Z',
    updated_at: '2024-01-05T10:30:00Z'
  },
  {
    id: 'place-3',
    name: 'Кофейня у дома',
    address: 'ул. Советская, 78, Санкт-Петербург',
    type: 'single' as PlaceType,
    created_at: '2024-01-10T14:15:00Z',
    updated_at: '2024-01-10T14:15:00Z'
  }
];