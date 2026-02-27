import { businessSupabase } from '../../lib/supabase';
import type { Item, ItemFormData } from '../../types';

// Item Services
export const itemService = {
  async shiftPositionsForInsert(categoryId: string, fromPosition: number): Promise<void> {
    const { data, error } = await businessSupabase
      .from('items')
      .select('id, position')
      .eq('category_id', categoryId)
      .gte('position', fromPosition)
      .order('position', { ascending: false });
    if (error) throw error;

    for (const row of data ?? []) {
      await businessSupabase
        .from('items')
        .update({ position: (row.position || 0) + 1 })
        .eq('id', row.id);
    }
  },

  async shiftPositionsForUpdate(
    categoryId: string,
    itemId: string,
    previousPosition: number,
    nextPosition: number
  ): Promise<void> {
    if (previousPosition === nextPosition) return;
    const { data, error } = await businessSupabase
      .from('items')
      .select('id, position')
      .eq('category_id', categoryId)
      .neq('id', itemId)
      .order('position', { ascending: true });
    if (error) throw error;

    for (const row of data ?? []) {
      const pos = row.position || 0;
      if (nextPosition < previousPosition) {
        if (pos >= nextPosition && pos < previousPosition) {
          await businessSupabase
            .from('items')
            .update({ position: pos + 1 })
            .eq('id', row.id);
        }
      } else {
        if (pos <= nextPosition && pos > previousPosition) {
          await businessSupabase
            .from('items')
            .update({ position: pos - 1 })
            .eq('id', row.id);
        }
      }
    }
  },

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
    const nextPosition = Math.max(1, Number(itemData.position || 1));
    await this.shiftPositionsForInsert(categoryId, nextPosition);
    const { data, error } = await businessSupabase
      .from('items')
      .insert({
        ...itemData,
        position: nextPosition,
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
    if (typeof itemData.position === 'number') {
      const { data: current, error: currentError } = await businessSupabase
        .from('items')
        .select('id, category_id, position')
        .eq('id', id)
        .single();
      if (currentError) throw currentError;
      const nextPosition = Math.max(1, Number(itemData.position || 1));
      await this.shiftPositionsForUpdate(
        current.category_id,
        id,
        Number(current.position || 1),
        nextPosition
      );
      itemData.position = nextPosition;
    }
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
    const { data: existingItem, error: fetchError } = await businessSupabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!existingItem) {
      return;
    }

    const { error } = await businessSupabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    const { data: verifyItem, error: verifyError } = await businessSupabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (verifyItem) {
      throw new Error('Item was not actually deleted from database');
    }
    if (verifyError && verifyError.code !== 'PGRST116') {
      throw verifyError;
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
