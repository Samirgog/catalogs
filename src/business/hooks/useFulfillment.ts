import useSWR, { useSWRConfig } from 'swr';
import { fulfillmentService } from '../services/fulfillment';
import type { FulfillmentMethodType } from '../../types';

export const useFulfillmentMethods = (catalogId: string) => {
  const { mutate: globalMutate } = useSWRConfig();
  const { data, error, isLoading, mutate } = useSWR(
    catalogId ? ['fulfillment-methods', catalogId] : null,
    () => fulfillmentService.getByCatalogId(catalogId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 15000,
    }
  );

  const setMethodEnabled = async (
    method: FulfillmentMethodType,
    isEnabled: boolean
  ) => {
    const saved = await fulfillmentService.upsertMethod({
      catalogId,
      method,
      isEnabled,
    });

    await mutate(
      prev => {
        const current = prev ?? [];
        const idx = current.findIndex(row => row.method === method);
        if (idx === -1) return [...current, saved];
        return current.map((row, i) => (i === idx ? saved : row));
      },
      { revalidate: false }
    );

    globalMutate(['catalog', catalogId]);
    return saved;
  };

  return {
    methods: data ?? [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Ошибка') : null,
    refetch: () => mutate(),
    setMethodEnabled,
  };
};
