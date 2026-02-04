import { businessSupabase } from '../../lib/supabase';
import type { Item, ItemFormData } from '../../types';

// Item Services
export const itemService = {
  // Get all items for a category
  async getByCategoryId(categoryId: string): Promise<Item[]> {
    const { data, error } = await businessSupabase
      .from('items')
      .select('*')
      .eq('category_id', categoryId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get item by ID
  async getById(id: string): Promise<Item | null> {
    const { data, error } = await businessSupabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new item
  async create(itemData: ItemFormData, categoryId: string): Promise<Item> {
    const { data, error } = await businessSupabase
      .from('items')
      .insert({
        ...itemData,
        category_id: categoryId,
        metadata: {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update item
  async update(id: string, itemData: Partial<ItemFormData>): Promise<Item> {
    const { data, error } = await businessSupabase
      .from('items')
      .update(itemData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete item
  async delete(id: string): Promise<void> {
    const { error } = await businessSupabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Update item positions (for drag-and-drop reordering)
  async updatePositions(updates: { id: string; position: number }[]): Promise<void> {
    const { error } = await businessSupabase.rpc('update_item_positions', {
      updates: updates.map(u => ({ id: u.id, position: u.position }))
    });

    if (error) throw error;
  }
};