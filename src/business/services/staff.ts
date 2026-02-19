import { businessSupabase } from '../../lib/supabase';
import type { StaffAccessCode, StaffMember } from '../../types';

const generateAccessCode = () =>
  Math.random().toString(36).toUpperCase().slice(2, 8);

export const staffService = {
  async getAccessCode(catalogId: string): Promise<StaffAccessCode | null> {
    const { data, error } = await businessSupabase
      .from('catalog_staff_codes')
      .select('*')
      .eq('catalog_id', catalogId)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  },

  async upsertAccessCode(
    catalogId: string,
    createdBy?: string
  ): Promise<StaffAccessCode> {
    const accessCode = generateAccessCode();

    const { data, error } = await businessSupabase
      .from('catalog_staff_codes')
      .upsert(
        {
          catalog_id: catalogId,
          access_code: accessCode,
          is_active: true,
          created_by: createdBy,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'catalog_id' }
      )
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async getMembers(catalogId: string): Promise<StaffMember[]> {
    const { data, error } = await businessSupabase
      .from('catalog_staff_members')
      .select('*')
      .eq('catalog_id', catalogId)
      .order('linked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async setMemberActive(id: string, isActive: boolean): Promise<StaffMember> {
    const { data, error } = await businessSupabase
      .from('catalog_staff_members')
      .update({ is_active: isActive, on_shift: isActive ? false : false })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },
};
