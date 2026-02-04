import { businessSupabase } from '../../lib/supabase';
import type { Catalog, CatalogFormData } from '../../types';

// Catalog Services
export const catalogService = {
  // Get all catalogs for current user
  async getAll(userId: string): Promise<Catalog[]> {
    const { data, error } = await businessSupabase
      .from('catalogs')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
    const { error } = await businessSupabase
      .from('catalogs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};