import useSWR, { useSWRConfig } from 'swr';
import { itemService } from '../services/items';
import type { Item, ItemFormData } from '../../types';

// SWR fetcher function
const fetcher = (categoryId: string) => itemService.getByCategoryId(categoryId);

// Hook for managing items
export const useItems = (categoryId: string) => {
  const { data: items = [], error, isLoading, isValidating, mutate } = useSWR(
    categoryId ? ['items', categoryId] : null,
    () => fetcher(categoryId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  const { mutate: globalMutate } = useSWRConfig();

  const createItem = async (itemData: ItemFormData) => {
    try {
      const newItem = await itemService.create(itemData, categoryId);
      
      // Optimistically update the cache
      await mutate(
        (prev: Item[] = []) => [...prev, newItem],
        { revalidate: false }
      );
      
      // Also invalidate related caches
      globalMutate(
        (key: any) => Array.isArray(key) && key[0] === 'item' && key[1] === newItem.id
      );
      
      return newItem;
    } catch (err) {
      throw err;
    }
  };

  const updateItem = async (id: string, itemData: Partial<ItemFormData>) => {
    try {
      const updatedItem = await itemService.update(id, itemData);
      
      // Update specific item cache
      globalMutate(['item', id], updatedItem, false);
      
      // Update items list
      await mutate(
        (prev: Item[] = []) => 
          prev.map(item => item.id === id ? updatedItem : item),
        { revalidate: false }
      );
      
      return updatedItem;
    } catch (err) {
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await itemService.delete(id);
      
      // Remove from items list
      await mutate(
        (prev: Item[] = []) => prev.filter(item => item.id !== id),
        { revalidate: false }
      );
      
      // Invalidate specific item cache
      globalMutate(['item', id], undefined, { revalidate: false });
    } catch (err) {
      throw err;
    }
  };

  const updatePositions = async (updates: { id: string; position: number }[]) => {
    try {
      await itemService.updatePositions(updates);
      // Revalidate to get updated positions
      await mutate();
    } catch (err) {
      throw err;
    }
  };

  return {
    items,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch items') : null,
    isValidating,
    refetch: () => mutate(),
    createItem,
    updateItem,
    deleteItem,
    updatePositions
  };
};

// Hook for single item
export const useItem = (id: string) => {
  const { data: item, error, isLoading, isValidating, mutate } = useSWR(
    id ? ['item', id] : null,
    () => itemService.getById(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  const { mutate: globalMutate } = useSWRConfig();

  const updateItem = async (itemData: Partial<ItemFormData>) => {
    try {
      const updatedItem = await itemService.update(id, itemData);
      
      // Update this item cache
      await mutate(updatedItem, { revalidate: false });
      
      // Update items list
      globalMutate(
        (key: any) => Array.isArray(key) && key[0] === 'items',
        undefined,
        { revalidate: true }
      );
      
      return updatedItem;
    } catch (err) {
      throw err;
    }
  };

  const deleteItem = async () => {
    try {
      await itemService.delete(id);
      
      // Clear this item cache
      await mutate(undefined, { revalidate: false });
      
      // Update items list
      globalMutate(
        (key: any) => Array.isArray(key) && key[0] === 'items',
        undefined,
        { revalidate: true }
      );
    } catch (err) {
      throw err;
    }
  };

  return {
    item,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch item') : null,
    isValidating,
    refetch: () => mutate(),
    updateItem,
    deleteItem
  };
};