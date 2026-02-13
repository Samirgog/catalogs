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
    console.log('itemService.delete called with ID:', id);
    
    // First, let's verify the item exists
    const { data: existingItem, error: fetchError } = await businessSupabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();
    
    console.log('Existing item check:', { existingItem, fetchError });
    
    if (fetchError) {
      console.error('Failed to fetch item before deletion:', fetchError);
      throw fetchError;
    }
    
    if (!existingItem) {
      console.warn('Item not found for deletion:', id);
      return; // Item doesn't exist, nothing to delete
    }
    
    console.log('Proceeding with deletion of item:', existingItem);
    
    const { error } = await businessSupabase
      .from('items')
      .delete()
      .eq('id', id);
    
    console.log('Delete operation result:', { error });
    
    if (error) {
      console.error('Delete operation failed:', error);
      throw error;
    }
    
    console.log('Item deleted successfully from database');
    
    // Verify deletion
    const { data: verifyItem, error: verifyError } = await businessSupabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();
    
    console.log('Verification after deletion:', { verifyItem, verifyError });
    
    if (verifyItem) {
      console.error('ITEM STILL EXISTS AFTER DELETION!', verifyItem);
      throw new Error('Item was not actually deleted from database');
    }
  },

  // Update item positions (for drag-and-drop reordering)
  async updatePositions(updates: { id: string; position: number }[]): Promise<void> {
    const { error } = await businessSupabase.rpc('update_item_positions', {
      updates: updates.map(u => ({ id: u.id, position: u.position }))
    });

    if (error) throw error;
  }
};