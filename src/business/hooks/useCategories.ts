import useSWR, { useSWRConfig } from 'swr';
import { categoryService } from '../services/categories';
import type { Category, CategoryFormData } from '../../types';

// SWR fetcher function
const fetcher = (catalogId: string) => categoryService.getByCatalogId(catalogId);

// Hook for managing categories
export const useCategories = (catalogId: string) => {
  const { data: categories = [], error, isLoading, isValidating, mutate } = useSWR(
    catalogId ? ['categories', catalogId] : null,
    () => fetcher(catalogId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  const { mutate: globalMutate } = useSWRConfig();

  const createCategory = async (categoryData: CategoryFormData) => {
    try {
      const newCategory = await categoryService.create(categoryData, catalogId);
      
      // Optimistically update the cache
      await mutate(
        (prev: Category[] = []) => [...prev, newCategory],
        { revalidate: false }
      );
      
      // Also invalidate related caches
      globalMutate(
        (key: any) => Array.isArray(key) && key[0] === 'category' && key[1] === newCategory.id
      );
      
      return newCategory;
    } catch (err) {
      throw err;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<CategoryFormData>) => {
    try {
      const updatedCategory = await categoryService.update(id, categoryData);
      
      // Update specific category cache
      globalMutate(['category', id], updatedCategory, false);
      
      // Update categories list
      await mutate(
        (prev: Category[] = []) => 
          prev.map(cat => cat.id === id ? updatedCategory : cat),
        { revalidate: false }
      );
      
      return updatedCategory;
    } catch (err) {
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoryService.delete(id);
      
      // Remove from categories list
      await mutate(
        (prev: Category[] = []) => prev.filter(cat => cat.id !== id),
        { revalidate: false }
      );
      
      // Invalidate specific category cache
      globalMutate(['category', id], undefined, { revalidate: false });
    } catch (err) {
      throw err;
    }
  };

  const updatePositions = async (updates: { id: string; position: number }[]) => {
    try {
      await categoryService.updatePositions(updates);
      // Revalidate to get updated positions
      await mutate();
    } catch (err) {
      throw err;
    }
  };

  return {
    categories,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch categories') : null,
    isValidating,
    refetch: () => mutate(),
    createCategory,
    updateCategory,
    deleteCategory,
    updatePositions
  };
};

// Hook for single category
export const useCategory = (id: string) => {
  const { data: category, error, isLoading, isValidating, mutate } = useSWR(
    id ? ['category', id] : null,
    () => categoryService.getById(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  const { mutate: globalMutate } = useSWRConfig();

  const updateCategory = async (categoryData: Partial<CategoryFormData>) => {
    try {
      const updatedCategory = await categoryService.update(id, categoryData);
      
      // Update this category cache
      await mutate(updatedCategory, { revalidate: false });
      
      // Update categories list
      globalMutate(
        (key: any) => Array.isArray(key) && key[0] === 'categories',
        undefined,
        { revalidate: true }
      );
      
      return updatedCategory;
    } catch (err) {
      throw err;
    }
  };

  const deleteCategory = async () => {
    try {
      await categoryService.delete(id);
      
      // Clear this category cache
      await mutate(undefined, { revalidate: false });
      
      // Update categories list
      globalMutate(
        (key: any) => Array.isArray(key) && key[0] === 'categories',
        undefined,
        { revalidate: true }
      );
    } catch (err) {
      throw err;
    }
  };

  return {
    category,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch category') : null,
    isValidating,
    refetch: () => mutate(),
    updateCategory,
    deleteCategory
  };
};