import { useMemo } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { itemService } from '../../services/items';
import useSWR from 'swr';
import type { Category, Item, ItemFormData } from '../../../types';

interface CategoriesDataProviderProps {
  catalogId: string;
  children: (data: {
    categoriesWithItems: (Category & { items: Item[] })[];
    categoriesLoading: boolean;
    categoriesError: string | null;
    refreshData: () => void;
    getItemOperations: (categoryId: string) => {
      createItem: (data: ItemFormData) => Promise<Item>;
      updateItem: (id: string, data: Partial<ItemFormData>) => Promise<Item>;
      deleteItem: (id: string) => Promise<void>;
    };
  }) => React.ReactNode;
}

export function CategoriesDataProvider({ catalogId, children }: CategoriesDataProviderProps) {
  // Fetch categories
  const { 
    categories, 
    loading: categoriesLoading, 
    error: categoriesError,
    refetch: refetchCategories
  } = useCategories(catalogId);

  // Fetch all items for all categories in one request
  const categoryIds = categories?.map(cat => cat.id).filter(Boolean) || [];
  
  const { 
    data: allItems = [], 
    error: itemsError, 
    isLoading: itemsLoading,
    mutate: mutateItems
  } = useSWR(
    categoryIds.length > 0 ? ['items-by-categories', categoryIds] : null,
    async () => {
      // Fetch items for all categories in parallel
      const itemsPromises = categoryIds.map(categoryId => 
        itemService.getByCategoryId(categoryId)
      );
      const itemsArrays = await Promise.all(itemsPromises);
      
      // Flatten and add category_id to each item
      return itemsArrays.flatMap((items, index) => 
        items.map(item => ({
          ...item,
          category_id: categoryIds[index]
        }))
      );
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      keepPreviousData: true
    }
  );

  // Merge categories with their items
  const categoriesWithItems = useMemo(() => {
    if (!categories) return [];

    return categories.map(category => ({
      ...category,
      items: allItems
        .filter((item: Item & { category_id: string }) => item.category_id === category.id)
        .sort((a: Item, b: Item) => (a.position || 0) - (b.position || 0))
    }));
  }, [categories, allItems]);

  // Combined loading state
  const isLoading = categoriesLoading || itemsLoading;

  // Combined error state
  const error = categoriesError || (itemsError ? (itemsError instanceof Error ? itemsError.message : 'Failed to fetch items') : null);

  // Refresh function
  const refreshData = () => {
    refetchCategories();
    mutateItems();
  };

  // Item CRUD operations
  const getItemOperations = (categoryId: string) => ({
    createItem: async (data: ItemFormData) => {
      const newItem = await itemService.create(data, categoryId);
      await mutateItems();
      return newItem;
    },
    
    updateItem: async (id: string, data: Partial<ItemFormData>) => {
      const updatedItem = await itemService.update(id, data);
      await mutateItems();
      return updatedItem;
    },
    
    deleteItem: async (id: string) => {
      await itemService.delete(id);
      await mutateItems();
    }
  });

  return (
    <>
      {children({
        categoriesWithItems,
        categoriesLoading: isLoading,
        categoriesError: error,
        refreshData,
        getItemOperations
      })}
    </>
  );
}
