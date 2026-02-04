import useSWR, { useSWRConfig } from 'swr';
import { catalogService } from '../services/catalogs';
import type { Catalog, CatalogFormData } from '../../types';

// SWR fetcher function
const fetcher = (userId: string) => catalogService.getAll(userId);

// Hook for managing catalogs
export const useCatalogs = (userId: string) => {
  const { data: catalogs = [], error, isLoading, isValidating, mutate } = useSWR(
    userId ? ['catalogs', userId] : null,
    () => fetcher(userId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  const { mutate: globalMutate } = useSWRConfig();

  const createCatalog = async (catalogData: CatalogFormData) => {
    try {
      const newCatalog = await catalogService.create(catalogData, userId);
      
      // Optimistically update the cache
      await mutate(
        (prev: Catalog[] = []) => [newCatalog, ...prev],
        { revalidate: false }
      );
      
      // Also invalidate related caches
      globalMutate(
        (key: any) => Array.isArray(key) && key[0] === 'catalog' && key[1] === newCatalog.id
      );
      
      return newCatalog;
    } catch (err) {
      throw err;
    }
  };

  const updateCatalog = async (id: string, catalogData: Partial<CatalogFormData>) => {
    try {
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
    } catch (err) {
      throw err;
    }
  };

  const deleteCatalog = async (id: string) => {
    try {
      await catalogService.delete(id);
      
      // Remove from catalogs list
      await mutate(
        (prev: Catalog[] = []) => prev.filter(cat => cat.id !== id),
        { revalidate: false }
      );
      
      // Invalidate specific catalog cache
      globalMutate(['catalog', id], undefined, { revalidate: false });
    } catch (err) {
      throw err;
    }
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
    try {
      const updatedCatalog = await catalogService.update(id, catalogData);
      
      // Update this catalog cache
      await mutate(updatedCatalog, { revalidate: false });
      
      // Update catalogs list
      globalMutate(
        (key: any) => Array.isArray(key) && key[0] === 'catalogs',
        undefined,
        { revalidate: true }
      );
      
      return updatedCatalog;
    } catch (err) {
      throw err;
    }
  };

  const deleteCatalog = async () => {
    try {
      await catalogService.delete(id);
      
      // Clear this catalog cache
      await mutate(undefined, { revalidate: false });
      
      // Update catalogs list
      globalMutate(
        (key: any) => Array.isArray(key) && key[0] === 'catalogs',
        undefined,
        { revalidate: true }
      );
    } catch (err) {
      throw err;
    }
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