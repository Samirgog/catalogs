import { businessSupabase } from '../../lib/supabase';
import { fetchWithRetry } from '@/lib/http';
import type { Catalog, CatalogFormData } from '../../types';

// Catalog Services
export const catalogService = {
  // Get all catalogs for current user
  async getAll(userId: string): Promise<Catalog[]> {
    const { data: owned, error: ownedError } = await businessSupabase
      .from('catalogs')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (ownedError) throw ownedError;

    const { data: accessRows, error: accessError } = await businessSupabase
      .from('catalog_user_access')
      .select('catalog_id')
      .eq('user_id', userId);

    if (accessError) throw accessError;

    const sharedIds = (accessRows || []).map((row) => row.catalog_id);
    if (!sharedIds.length) {
      return owned || [];
    }

    const { data: shared, error: sharedError } = await businessSupabase
      .from('catalogs')
      .select('*')
      .in('id', sharedIds)
      .order('created_at', { ascending: false });

    if (sharedError) throw sharedError;

    const merged = [...(owned || []), ...(shared || [])];
    return merged.filter(
      (catalog, index, arr) =>
        arr.findIndex((item) => item.id === catalog.id) === index
    );
  },

  // Get catalog by ID
  async getById(id: string): Promise<Catalog | null> {
    const { data, error } = await businessSupabase
      .from('catalogs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new catalog
  async create(catalogData: CatalogFormData, ownerId: string): Promise<Catalog> {
    const { data, error } = await businessSupabase
      .from('catalogs')
      .insert({
        ...catalogData,
        owner_id: ownerId,
        settings: {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update catalog
  async update(id: string, catalogData: Partial<CatalogFormData>): Promise<Catalog> {
    const { data, error } = await businessSupabase
      .from('catalogs')
      .update(catalogData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete catalog
  async delete(id: string): Promise<void> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Не настроен VITE_SUPABASE_URL');
    }

    const response = await fetchWithRetry(`${supabaseUrl}/functions/v1/catalog-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalogId: id }),
      timeoutMs: 20000,
      retries: 2,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
  }
};
