import { clientSupabase } from '@/lib/supabase';
import type { Item, RelatedItemLink } from '@/types';

export const clientRelatedItemsService = {
  async getSuggestions(catalogId: string, sourceItemIds: string[]): Promise<Item[]> {
    if (!catalogId || sourceItemIds.length === 0) return [];

    try {
      const { data: links, error: linksError } = await clientSupabase
        .from('catalog_related_items')
        .select('id, catalog_id, source_item_id, related_item_id, priority, created_at, updated_at')
        .eq('catalog_id', catalogId)
        .in('source_item_id', sourceItemIds)
        .order('priority', { ascending: true });

      if (linksError) throw linksError;

      const uniqueRelatedIds = Array.from(
        new Set(
          ((links || []) as RelatedItemLink[]).map((link) => link.related_item_id)
        )
      );

      if (!uniqueRelatedIds.length) return [];

      const { data: items, error: itemsError } = await clientSupabase
        .from('items')
        .select('*')
        .in('id', uniqueRelatedIds)
        .eq('is_available', true);

      if (itemsError) throw itemsError;

      const itemsById = new Map((items || []).map((item) => [item.id, item as Item]));
      return uniqueRelatedIds
        .map((id) => itemsById.get(id))
        .filter(Boolean) as Item[];
    } catch {
      return [];
    }
  },
};
