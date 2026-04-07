import { businessSupabase } from '../../lib/supabase';
import { fetchWithRetry } from '@/lib/http';
import type { CatalogAccessInvite, CatalogUserAccess, User } from '../../types';

const generateInviteCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

export const catalogAccessService = {
  async getCollaborators(catalogId: string): Promise<CatalogUserAccess[]> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const response = await fetchWithRetry(
          `${supabaseUrl}/functions/v1/catalog-access-collaborators`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ catalogId }),
            timeoutMs: 20000,
            retries: 2,
          }
        );

        if (response.ok) {
          return (await response.json()) as CatalogUserAccess[];
        }
      } catch {
        // Fallback to direct querying below.
      }
    }

    const { data, error } = await businessSupabase
      .from('catalog_user_access')
      .select('*')
      .eq('catalog_id', catalogId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    const accessRows = (data || []) as CatalogUserAccess[];
    const userIds = accessRows.map((row) => row.user_id);
    if (!userIds.length) return accessRows;

    const { data: users, error: usersError } = await businessSupabase
      .from('users')
      .select('id, first_name, last_name, username')
      .in('id', userIds);

    if (usersError) throw usersError;

    const usersById = new Map(
      ((users || []) as Array<Pick<User, 'id' | 'first_name' | 'last_name' | 'username'>>).map(
        (user) => [user.id, user]
      )
    );

    return accessRows.map((row) => ({
      ...row,
      user: usersById.get(row.user_id) ?? null,
    }));
  },

  async getInvite(catalogId: string): Promise<CatalogAccessInvite | null> {
    const { data, error } = await businessSupabase
      .from('catalog_access_invites')
      .select('*')
      .eq('catalog_id', catalogId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async generateInvite(catalogId: string, createdBy: string) {
    const code = generateInviteCode();

    const { error: deactivateError } = await businessSupabase
      .from('catalog_access_invites')
      .update({ is_active: false })
      .eq('catalog_id', catalogId)
      .eq('is_active', true);

    if (deactivateError) throw deactivateError;

    const { data, error } = await businessSupabase
      .from('catalog_access_invites')
      .insert({
        catalog_id: catalogId,
        code,
        role: 'editor',
        created_by: createdBy,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as CatalogAccessInvite;
  },

  async acceptInvite(code: string, userId: string) {
    const normalizedCode = code.trim().toUpperCase();
    const { data: invite, error: inviteError } = await businessSupabase
      .from('catalog_access_invites')
      .select('*')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .maybeSingle();

    if (inviteError) throw inviteError;
    if (!invite) {
      throw new Error('Код доступа не найден');
    }

    const { data, error } = await businessSupabase
      .from('catalog_user_access')
      .upsert(
        {
          catalog_id: invite.catalog_id,
          user_id: userId,
          role: 'editor',
          granted_by: invite.created_by,
        },
        { onConflict: 'catalog_id,user_id' }
      )
      .select('*')
      .single();

    if (error) throw error;
    return data as CatalogUserAccess;
  },

  async revokeAccess(accessId: string) {
    const { error } = await businessSupabase
      .from('catalog_user_access')
      .delete()
      .eq('id', accessId);

    if (error) throw error;
  },
};
