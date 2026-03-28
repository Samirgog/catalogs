import { getTelegramWebApp } from '@/lib/telegram';
import type {
  CatalogPaymentGateway,
  CatalogPaymentGatewayFormData,
} from '../../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const getFunctionUrl = (name: string) => {
  if (!SUPABASE_URL) {
    throw new Error('Не настроен VITE_SUPABASE_URL');
  }
  return `${SUPABASE_URL}/functions/v1/${name}`;
};

const getInitData = () => {
  const initData = getTelegramWebApp()?.initData || '';
  if (!initData) {
    throw new Error('Не найден Telegram initData');
  }
  return initData;
};

export const paymentGatewayService = {
  async getByCatalogId(catalogId: string): Promise<CatalogPaymentGateway | null> {
    const response = await fetch(getFunctionUrl('payment-gateway-get'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalogId,
        initData: getInitData(),
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return (await response.json()) as CatalogPaymentGateway | null;
  },

  async saveCredentials(
    catalogId: string,
    gatewayData: CatalogPaymentGatewayFormData
  ): Promise<CatalogPaymentGateway> {
    const response = await fetch(getFunctionUrl('payment-gateway-upsert'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalogId,
        initData: getInitData(),
        gatewayData,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return (await response.json()) as CatalogPaymentGateway;
  },

  async setEnabled(catalogId: string, isEnabled: boolean): Promise<CatalogPaymentGateway> {
    const response = await fetch(getFunctionUrl('payment-gateway-toggle'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalogId,
        initData: getInitData(),
        isEnabled,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return (await response.json()) as CatalogPaymentGateway;
  },
};
