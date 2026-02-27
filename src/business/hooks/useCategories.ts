import useSWR, { useSWRConfig } from 'swr';
import { categoryService } from '../services/categories';
import type { Category, CategoryFormData } from '../../types';

// SWR fetcher function
const fetcher = (catalogId: string) => categoryService.getByCatalogId(catalogId);
const isCacheKey = (key: unknown, prefix: string) =>
  Array.isArray(key) && key[0] === prefix;

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
    const newCategory = await categoryService.create(categoryData, catalogId);
    
    // Optimistically update the cache
    await mutate(
      (prev: Category[] = []) => [...prev, newCategory],
      { revalidate: false }
    );
    
    // Also invalidate related caches
    globalMutate(
      (key: unknown) =>
        Array.isArray(key) && key[0] === 'category' && key[1] === newCategory.id
    );
    
    return newCategory;
  };

  const updateCategory = async (id: string, categoryData: Partial<CategoryFormData>) => {
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
  };

  const deleteCategory = async (id: string) => {
    await categoryService.delete(id);
    
    // Remove from categories list
    await mutate(
      (prev: Category[] = []) => prev.filter(cat => cat.id !== id),
      { revalidate: false }
    );
    
    // Invalidate specific category cache
    globalMutate(['category', id], undefined, { revalidate: false });
  };

  const updatePositions = async (updates: { id: string; position: number }[]) => {
    await categoryService.updatePositions(updates);
    // Revalidate to get updated positions
    await mutate();
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
    const updatedCategory = await categoryService.update(id, categoryData);
    
    // Update this category cache
    await mutate(updatedCategory, { revalidate: false });
    
    // Update categories list
    globalMutate(
      (key: unknown) => isCacheKey(key, 'categories'),
      undefined,
      { revalidate: true }
    );
    
    return updatedCategory;
  };

  const deleteCategory = async () => {
    await categoryService.delete(id);
    
    // Clear this category cache
    await mutate(undefined, { revalidate: false });
    
    // Update categories list
    globalMutate(
      (key: unknown) => isCacheKey(key, 'categories'),
      undefined,
      { revalidate: true }
    );
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
