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
    const { data: categories } = await businessSupabase
      .from('categories')
      .select('id')
      .eq('catalog_id', id);

    const categoryIds = (categories ?? []).map(row => row.id);
    if (categoryIds.length > 0) {
      await businessSupabase.from('items').delete().in('category_id', categoryIds);
      await businessSupabase.from('categories').delete().in('id', categoryIds);
    }

    await businessSupabase.from('actions').delete().eq('catalog_id', id);
    await businessSupabase
      .from('catalog_fulfillment_methods')
      .delete()
      .eq('catalog_id', id);
    await businessSupabase.from('qr_links').delete().eq('target_type', 'catalog').eq('target_id', id);
    await businessSupabase.from('place_catalogs').delete().eq('catalog_id', id);
    await businessSupabase.from('catalog_staff_members').delete().eq('catalog_id', id);
    await businessSupabase.from('catalog_staff_codes').delete().eq('catalog_id', id);
    await businessSupabase.from('order_notifications').delete().eq('catalog_id', id);
    await businessSupabase.from('orders').delete().eq('catalog_id', id);

    const { error } = await businessSupabase.from('catalogs').delete().eq('id', id);

    if (error) throw error;
  }
};
