import { businessSupabase } from '../../lib/supabase';
import type {
  CatalogPaymentGateway,
  CatalogPaymentGatewayFormData,
} from '../../types';

export const paymentGatewayService = {
  async getByCatalogId(catalogId: string): Promise<CatalogPaymentGateway | null> {
    const { data, error } = await businessSupabase
      .from('catalog_payment_gateways')
      .select('id, catalog_id, provider, is_enabled, success_return_url, fail_return_url, created_at, updated_at')
      .eq('catalog_id', catalogId)
      .eq('provider', 'yookassa')
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      is_configured: true,
      shop_id_masked: undefined,
    } as CatalogPaymentGateway;
  },

  async saveCredentials(
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
      .select('id, catalog_id, provider, is_enabled, success_return_url, fail_return_url, created_at, updated_at')
      .single();

    if (error) throw error;
    return {
      ...data,
      is_configured: true,
      shop_id_masked: undefined,
    } as CatalogPaymentGateway;
  },

  async setEnabled(catalogId: string, isEnabled: boolean): Promise<CatalogPaymentGateway> {
    const { data, error } = await businessSupabase
      .from('catalog_payment_gateways')
      .update({ is_enabled: isEnabled })
      .eq('catalog_id', catalogId)
      .eq('provider', 'yookassa')
      .select('id, catalog_id, provider, is_enabled, success_return_url, fail_return_url, created_at, updated_at')
      .single();

    if (error) throw error;
    return {
      ...data,
      is_configured: true,
      shop_id_masked: undefined,
    } as CatalogPaymentGateway;
  },
};
