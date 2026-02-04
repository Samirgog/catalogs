import { clientSupabase } from '../../lib/supabase';
import type { Catalog } from '../../types';

interface PlaceCatalogWithCatalog {
  catalogs: Catalog;
}

// Client Catalog Services
export const clientCatalogService = {
  // Get public catalog by ID
  async getById(id: string): Promise<Catalog | null> {
    const { data, error } = await clientSupabase
      .from('catalogs')
      .select(`
        *,
        categories (
          *,
          items (*)
        ),
        actions (*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  },

  // Get catalog by QR link slug
  async getBySlug(slug: string): Promise<Catalog | null> {
    // First get the QR link
    const { data: qrLink, error: qrError } = await clientSupabase
      .from('qr_links')
      .select('*')
      .eq('slug', slug)
      .eq('target_type', 'catalog')
      .single();

    if (qrError) throw qrError;
    if (!qrLink) return null;

    // Then get the catalog
    const { data: catalog, error: catalogError } = await clientSupabase
      .from('catalogs')
      .select(`
        *,
        categories (
          *,
          items (*)
        ),
        actions (*)
      `)
      .eq('id', qrLink.target_id)
      .eq('is_active', true)
      .single();

    if (catalogError) throw catalogError;
    return catalog;
  },

  // Get all active catalogs for a place
  async getByPlaceId(placeId: string): Promise<Catalog[]> {
    const { data, error } = await clientSupabase
      .from('place_catalogs')
      .select(`
        catalogs (
          *,
          categories (
            *,
            items (*)
          ),
          actions (*)
        )
      `)
      .eq('place_id', placeId)
      .eq('catalogs.is_active', true);

    if (error) throw error;
    
    if (!data) return [];
    
    // Extract catalogs from the joined data
    const catalogs: Catalog[] = [];
    for (const placeCatalog of data) {
      if (placeCatalog.catalogs) {
        catalogs.push(placeCatalog.catalogs as unknown as Catalog);
      }
    }
    
    return catalogs;
  }
};