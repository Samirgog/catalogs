import type { User } from '../../types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    telegram_id: 123456789,
    first_name: 'Иван',
    last_name: 'Петров',
    username: 'ivan_petrov',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 'user-2',
    telegram_id: 987654321,
    first_name: 'Мария',
    last_name: 'Сидорова',
    username: 'maria_sidorova',
    created_at: '2024-01-02T15:30:00Z',
    updated_at: '2024-01-02T15:30:00Z'
  }
];