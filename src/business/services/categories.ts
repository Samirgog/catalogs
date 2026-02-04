import { businessSupabase } from '../../lib/supabase';
import type { Category, CategoryFormData } from '../../types';

// Category Services
export const categoryService = {
  // Get all categories for a catalog
  async getByCatalogId(catalogId: string): Promise<Category[]> {
    const { data, error } = await businessSupabase
      .from('categories')
      .select('*')
      .eq('catalog_id', catalogId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get category by ID
  async getById(id: string): Promise<Category | null> {
    const { data, error } = await businessSupabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new category
  async create(categoryData: CategoryFormData, catalogId: string): Promise<Category> {
    const { data, error } = await businessSupabase
      .from('categories')
      .insert({
        ...categoryData,
        catalog_id: catalogId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update category
  async update(id: string, categoryData: Partial<CategoryFormData>): Promise<Category> {
    const { data, error } = await businessSupabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete category
  async delete(id: string): Promise<void> {
    const { error } = await businessSupabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Update category positions (for drag-and-drop reordering)
  async updatePositions(updates: { id: string; position: number }[]): Promise<void> {
    const { error } = await businessSupabase.rpc('update_category_positions', {
      updates: updates.map(u => ({ id: u.id, position: u.position }))
    });

    if (error) throw error;
  }
};