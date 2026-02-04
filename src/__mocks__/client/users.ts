import type { User } from '../../types';

export const mockClientUsers: User[] = [
  {
    id: 'client-1',
    telegram_id: 111111111,
    first_name: 'Алексей',
    last_name: 'Иванов',
    username: 'alex_ivanov',
    created_at: '2024-01-10T12:00:00Z',
    updated_at: '2024-01-10T12:00:00Z'
  },
  {
    id: 'client-2',
    telegram_id: 222222222,
    first_name: 'Елена',
    last_name: 'Козлова',
    username: 'elena_kozlova',
    created_at: '2024-01-12T16:30:00Z',
    updated_at: '2024-01-12T16:30:00Z'
  },
  {
    id: 'client-3',
    telegram_id: 333333333,
    first_name: 'Дмитрий',
    last_name: 'Смирнов',
    username: 'dmitry_smirnov',
    created_at: '2024-01-15T14:15:00Z',
    updated_at: '2024-01-15T14:15:00Z'
  }
];