import { businessSupabase } from '@/lib/supabase';
import type { Item, RelatedItemLink } from '@/types';

export const relatedItemsService = {
  async list(catalogId: string): Promise<RelatedItemLink[]> {
    const { data, error } = await businessSupabase
      .from('catalog_related_items')
      .select('*')
      .eq('catalog_id', catalogId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as RelatedItemLink[];
  },

  async create(input: {
    catalog_id: string;
    source_item_id: string;
    related_item_id: string;
    priority?: number;
  }) {
    const { data, error } = await businessSupabase
      .from('catalog_related_items')
      .upsert(
        {
          ...input,
          priority: input.priority ?? 100,
        },
        { onConflict: 'catalog_id,source_item_id,related_item_id' }
      )
      .select('*')
      .single();

    if (error) throw error;
    return data as RelatedItemLink;
  },

  async remove(id: string) {
    const { error } = await businessSupabase
      .from('catalog_related_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async listCatalogItems(catalogId: string): Promise<Item[]> {
    const { data: categories, error: categoriesError } = await businessSupabase
      .from('categories')
      .select('id')
      .eq('catalog_id', catalogId);

    if (categoriesError) throw categoriesError;

    const categoryIds = (categories || []).map((category) => category.id);
    if (!categoryIds.length) return [];

    const { data: items, error: itemsError } = await businessSupabase
      .from('items')
      .select('*')
      .in('category_id', categoryIds)
      .order('position', { ascending: true });

    if (itemsError) throw itemsError;
    return (items || []) as Item[];
  },
};
