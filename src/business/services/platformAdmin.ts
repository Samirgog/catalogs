import { getTelegramWebApp } from '@/lib/telegram';
import { fetchWithRetry } from '@/lib/http';
import type { Catalog, User } from '../../types';

export type PlatformUserWithCatalogs = Pick<
  User,
  'id' | 'first_name' | 'last_name' | 'username' | 'created_at'
> & {
  catalogs: Array<Pick<Catalog, 'id' | 'title' | 'created_at'>>;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const getFunctionUrl = (name: string) => {
  if (!SUPABASE_URL) {
    throw new Error('Не настроен VITE_SUPABASE_URL');
  }

  return `${SUPABASE_URL}/functions/v1/${name}`;
};

const getInitData = () => {
  const initData = getTelegramWebApp()?.initData || '';
  if (!initData) {
    throw new Error('Не найден Telegram initData');
  }

  return initData;
};

export const platformAdminService = {
  async getUsersWithCatalogs(): Promise<PlatformUserWithCatalogs[]> {
    const response = await fetchWithRetry(getFunctionUrl('platform-admin-users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData: getInitData(),
      }),
      timeoutMs: 25000,
      retries: 2,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return (await response.json()) as PlatformUserWithCatalogs[];
  },
};
