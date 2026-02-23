import { businessSupabase } from '../../lib/supabase';
import type { FulfillmentMethod, FulfillmentMethodType } from '../../types';

export const fulfillmentService = {
  async getByCatalogId(catalogId: string): Promise<FulfillmentMethod[]> {
    const { data, error } = await businessSupabase
      .from('catalog_fulfillment_methods')
      .select('*')
      .eq('catalog_id', catalogId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async upsertMethod(params: {
    catalogId: string;
    method: FulfillmentMethodType;
    isEnabled: boolean;
  }): Promise<FulfillmentMethod> {
    const { data, error } = await businessSupabase
      .from('catalog_fulfillment_methods')
      .upsert(
        {
          catalog_id: params.catalogId,
          method: params.method,
          is_enabled: params.isEnabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'catalog_id,method' }
      )
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },
};
