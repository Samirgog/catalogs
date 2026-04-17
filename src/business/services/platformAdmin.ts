import { businessSupabase } from '../../lib/supabase';
import type { Catalog, User } from '../../types';

export type PlatformUserWithCatalogs = Pick<
  User,
  'id' | 'first_name' | 'last_name' | 'username' | 'created_at'
> & {
  catalogs: Array<Pick<Catalog, 'id' | 'title' | 'created_at'>>;
};

export const platformAdminService = {
  async getUsersWithCatalogs(): Promise<PlatformUserWithCatalogs[]> {
    const { data: users, error: usersError } = await businessSupabase
      .from('users')
      .select('id, first_name, last_name, username, created_at')
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    const { data: catalogs, error: catalogsError } = await businessSupabase
      .from('catalogs')
      .select('id, title, created_at, owner_id')
      .not('owner_id', 'is', null)
      .order('created_at', { ascending: false });

    if (catalogsError) throw catalogsError;

    const catalogsByOwner = new Map<string, Array<Pick<Catalog, 'id' | 'title' | 'created_at'>>>();
    for (const catalog of catalogs || []) {
      const ownerId = String((catalog as Catalog & { owner_id?: string }).owner_id || '');
      if (!ownerId) continue;
      const current = catalogsByOwner.get(ownerId) || [];
      current.push({
        id: catalog.id,
        title: catalog.title,
        created_at: catalog.created_at,
      });
      catalogsByOwner.set(ownerId, current);
    }

    return (users || []).map((user) => ({
      ...user,
      catalogs: catalogsByOwner.get(user.id) || [],
    }));
  },
};
