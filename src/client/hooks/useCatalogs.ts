import useSWR from 'swr';
import { clientCatalogService } from '../services/catalogs';

// SWR fetcher function
const fetcher = async (key: string, id: string) => {
  switch (key) {
    case 'catalog':
      return await clientCatalogService.getById(id);
    case 'catalog-by-slug':
      return await clientCatalogService.getBySlug(id);
    default:
      throw new Error(`Unknown key: ${key}`);
  }
};

// Hook for getting catalog by ID
export const useCatalog = (id: string | null) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    id ? ['catalog', id] : null,
    ([_, catalogId]) => fetcher('catalog', catalogId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    catalog: data,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    mutate
  };
};

// Hook for getting catalog by QR slug
export const useCatalogBySlug = (slug: string | null) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    slug ? ['catalog-by-slug', slug] : null,
    ([_, slugParam]) => fetcher('catalog-by-slug', slugParam),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    catalog: data,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    mutate
  };
};

// Hook for getting catalogs by place ID
export const useCatalogsByPlace = (placeId: string | null) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    placeId ? ['catalogs-by-place', placeId] : null,
    async () => {
      if (!placeId) return [];
      return await clientCatalogService.getByPlaceId(placeId);
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    catalogs: data || [],
    isLoading,
    isError: !!error,
    error,
    isValidating,
    mutate
  };
};

export const usePlace = (placeId: string | null) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    placeId ? ['place', placeId] : null,
    async () => {
      if (!placeId) return null;
      return await clientCatalogService.getPlaceById(placeId);
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    place: data ?? null,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    mutate,
  };
};
