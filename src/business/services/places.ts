import { businessSupabase } from '../../lib/supabase';
import type { Place } from '../../types';

const normalizePlace = (value: unknown): Place | null => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const first = value[0];
    return first ? (first as Place) : null;
  }
  return value as Place;
};

export const placesService = {
  async getFoodcourtForCatalog(catalogId: string): Promise<Place | null> {
    const { data, error } = await businessSupabase
      .from('place_catalogs')
      .select(
        `
        place_id,
        places (
          id,
          name,
          address,
          type,
          created_at,
          updated_at
        )
      `
      )
      .eq('catalog_id', catalogId);

    if (error) throw error;
    if (!data?.length) return null;

    const match = data.find(row => normalizePlace(row.places)?.type === 'foodcourt');
    return normalizePlace(match?.places) || null;
  },

  async detachFromFoodcourt(catalogId: string): Promise<void> {
    const { data, error } = await businessSupabase
      .from('place_catalogs')
      .select(
        `
        place_id,
        places (
          id,
          type
        )
      `
      )
      .eq('catalog_id', catalogId);

    if (error) throw error;
    const foodcourtPlaceIds = (data ?? [])
      .filter(row => normalizePlace(row.places)?.type === 'foodcourt')
      .map(row => row.place_id);

    if (!foodcourtPlaceIds.length) return;

    const { error: deleteError } = await businessSupabase
      .from('place_catalogs')
      .delete()
      .eq('catalog_id', catalogId)
      .in('place_id', foodcourtPlaceIds);

    if (deleteError) throw deleteError;
  },
};
