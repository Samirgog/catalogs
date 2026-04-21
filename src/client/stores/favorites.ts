import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Item } from '@/types';

type FavoriteItemSnapshot = Pick<
  Item,
  'id' | 'title' | 'price' | 'image_url' | 'description' | 'category_id'
>;

type FavoritesState = {
  itemsByCatalog: Record<string, FavoriteItemSnapshot[]>;
  toggleFavorite: (catalogId: string, item: FavoriteItemSnapshot) => boolean;
  isFavorite: (catalogId: string, itemId: string) => boolean;
  getFavorites: (catalogId: string) => FavoriteItemSnapshot[];
  addManyToCatalog: (catalogId: string, items: FavoriteItemSnapshot[]) => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      itemsByCatalog: {},
      toggleFavorite: (catalogId, item) => {
        let isNowFavorite = false;
        set((state) => {
          const currentItems = state.itemsByCatalog[catalogId] || [];
          const exists = currentItems.some((current) => current.id === item.id);
          isNowFavorite = !exists;
          return {
            itemsByCatalog: {
              ...state.itemsByCatalog,
              [catalogId]: exists
                ? currentItems.filter((current) => current.id !== item.id)
                : [item, ...currentItems],
            },
          };
        });
        return isNowFavorite;
      },
      isFavorite: (catalogId, itemId) =>
        (get().itemsByCatalog[catalogId] || []).some((item) => item.id === itemId),
      getFavorites: (catalogId) => get().itemsByCatalog[catalogId] || [],
      addManyToCatalog: (catalogId, items) => {
        set((state) => {
          const currentItems = state.itemsByCatalog[catalogId] || [];
          const merged = [...currentItems];
          for (const item of items) {
            if (!merged.some((current) => current.id === item.id)) {
              merged.push(item);
            }
          }
          return {
            itemsByCatalog: {
              ...state.itemsByCatalog,
              [catalogId]: merged,
            },
          };
        });
      },
    }),
    {
      name: 'client-favorites-store',
    }
  )
);
