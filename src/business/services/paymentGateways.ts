import { businessSupabase } from '../../lib/supabase';
import type {
  CatalogPaymentGateway,
  CatalogPaymentGatewayFormData,
} from '../../types';

export const paymentGatewayService = {
  async getByCatalogId(catalogId: string): Promise<CatalogPaymentGateway | null> {
    const { data, error } = await businessSupabase
      .from('catalog_payment_gateways')
      .select('*')
      .eq('catalog_id', catalogId)
      .eq('provider', 'yookassa')
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async upsert(
    catalogId: string,
    gatewayData: CatalogPaymentGatewayFormData
  ): Promise<CatalogPaymentGateway> {
    const { data, error } = await businessSupabase
      .from('catalog_payment_gateways')
      .upsert(
        {
          catalog_id: catalogId,
          ...gatewayData,
        },
        { onConflict: 'catalog_id,provider' }
      )
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },
};
