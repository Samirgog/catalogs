import { businessSupabase } from '../../lib/supabase';
import type { Action, ActionFormData } from '../../types';

// Action Services
export const actionService = {
  // Get all actions for a catalog
  async getByCatalogId(catalogId: string): Promise<Action[]> {
    const { data, error } = await businessSupabase
      .from('actions')
      .select('*')
      .eq('catalog_id', catalogId)
    if (error) throw error;
    return data || [];
  },

  // Get action by ID
  async getById(id: string): Promise<Action | null> {
    const { data, error } = await businessSupabase
      .from('actions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new action
  async create(actionData: ActionFormData, catalogId: string): Promise<Action> {
    const { data, error } = await businessSupabase
      .from('actions')
      .insert({
        ...actionData,
        catalog_id: catalogId,
        config: actionData.config || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update action
  async update(id: string, actionData: Partial<ActionFormData>): Promise<Action> {
    const { data, error } = await businessSupabase
      .from('actions')
      .update(actionData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete action
  async delete(id: string): Promise<void> {
    const { error } = await businessSupabase
      .from('actions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Enable/disable action
  async toggleEnabled(id: string, isEnabled: boolean): Promise<Action> {
    const { data, error } = await businessSupabase
      .from('actions')
      .update({ is_enabled: isEnabled })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};