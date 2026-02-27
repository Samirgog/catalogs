import useSWR, { useSWRConfig } from 'swr';
import { catalogService } from '../services/catalogs';
import type { Catalog, CatalogFormData } from '../../types';
import { useUserStore } from '@/userStore';

// SWR fetcher function
const fetcher = (userId: string) => catalogService.getAll(userId);
const isCacheKey = (key: unknown, prefix: string) =>
  Array.isArray(key) && key[0] === prefix;

// Hook for managing catalogs
export const useCatalogs = () => {
    const { user } = useUserStore();

  const { data: catalogs = [], error, isLoading, isValidating, mutate } = useSWR(
    user?.id ? ['catalogs', user.id] : null,
    () => fetcher(user?.id || ''),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  const { mutate: globalMutate } = useSWRConfig();

  const createCatalog = async (catalogData: CatalogFormData) => {
    const newCatalog = await catalogService.create(catalogData, user?.id || '');
    
    // Optimistically update the cache
    await mutate(
      (prev: Catalog[] = []) => [newCatalog, ...prev],
      { revalidate: false }
    );
    
    // Also invalidate related caches
    globalMutate(
      (key: unknown) =>
        Array.isArray(key) && key[0] === 'catalog' && key[1] === newCatalog.id
    );
    
    return newCatalog;
  };

  const updateCatalog = async (id: string, catalogData: Partial<CatalogFormData>) => {
    const updatedCatalog = await catalogService.update(id, catalogData);
    
    // Update specific catalog cache
    globalMutate(['catalog', id], updatedCatalog, false);
    
    // Update catalogs list
    await mutate(
      (prev: Catalog[] = []) => 
        prev.map(cat => cat.id === id ? updatedCatalog : cat),
      { revalidate: false }
    );
    
    return updatedCatalog;
  };

  const deleteCatalog = async (id: string) => {
    await catalogService.delete(id);
    
    // Remove from catalogs list
    await mutate(
      (prev: Catalog[] = []) => prev.filter(cat => cat.id !== id),
      { revalidate: false }
    );
    
    // Invalidate specific catalog cache
    globalMutate(['catalog', id], undefined, { revalidate: false });
  };

  return {
    catalogs,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch catalogs') : null,
    isValidating,
    refetch: () => mutate(),
    createCatalog,
    updateCatalog,
    deleteCatalog
  };
};

// Hook for single catalog
export const useCatalog = (id: string) => {
  const { data: catalog, error, isLoading, isValidating, mutate } = useSWR(
    id ? ['catalog', id] : null,
    () => catalogService.getById(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  const { mutate: globalMutate } = useSWRConfig();

  const updateCatalog = async (catalogData: Partial<CatalogFormData>) => {
    const updatedCatalog = await catalogService.update(id, catalogData);
    
    // Update this catalog cache
    await mutate(updatedCatalog, { revalidate: false });
    
    // Update catalogs list
    globalMutate(
      (key: unknown) => isCacheKey(key, 'catalogs'),
      undefined,
      { revalidate: true }
    );
    
    return updatedCatalog;
  };

  const deleteCatalog = async () => {
    await catalogService.delete(id);
    
    // Clear this catalog cache
    await mutate(undefined, { revalidate: false });
    
    // Update catalogs list
    globalMutate(
      (key: unknown) => isCacheKey(key, 'catalogs'),
      undefined,
      { revalidate: true }
    );
  };

  return {
    catalog,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch catalog') : null,
    isValidating,
    refetch: () => mutate(),
    updateCatalog,
    deleteCatalog
  };
};
