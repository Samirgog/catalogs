import { useCallback } from 'react';
import useSWR from 'swr';
import { paymentGatewayService } from '../services/paymentGateways';
import type { CatalogPaymentGatewayFormData } from '../../types';

export const usePaymentGateway = (catalogId: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    catalogId ? ['payment-gateway', catalogId] : null,
    () => paymentGatewayService.getByCatalogId(catalogId),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      errorRetryCount: 0,
      dedupingInterval: 30000,
    }
  );

  const saveGateway = async (gatewayData: CatalogPaymentGatewayFormData) => {
    const next = await paymentGatewayService.saveCredentials(catalogId, gatewayData);
    await mutate(next, { revalidate: false });
    return next;
  };

  const setGatewayEnabled = async (isEnabled: boolean) => {
    const next = await paymentGatewayService.setEnabled(catalogId, isEnabled);
    await mutate(next, { revalidate: false });
    return next;
  };

  return {
    gateway: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: useCallback(() => mutate(), [mutate]),
    saveGateway,
    setGatewayEnabled,
  };
};
