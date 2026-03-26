import { clientSupabase } from '../../lib/supabase';
import type { Catalog, Place } from '../../types';

type CatalogWithFulfillment = Catalog & {
  catalog_fulfillment_methods?: Catalog['fulfillment_methods'];
};

const normalizeCatalog = (catalog: CatalogWithFulfillment | null): Catalog | null => {
  if (!catalog) return catalog;
  return {
    ...catalog,
    fulfillment_methods: catalog.catalog_fulfillment_methods ?? [],
  };
};

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
        actions (*),
        catalog_fulfillment_methods (*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return normalizeCatalog(data);
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
        actions (*),
        catalog_fulfillment_methods (*)
      `)
      .eq('id', qrLink.target_id)
      .eq('is_active', true)
      .single();

    if (catalogError) throw catalogError;
    return normalizeCatalog(catalog as CatalogWithFulfillment);
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
          actions (*),
          catalog_fulfillment_methods (*)
        )
      `)
      .eq('place_id', placeId)
      .eq('catalogs.is_active', true);

    if (error) throw error;
    
    if (!data) return [];
    
    // Extract catalogs from the joined data
    const catalogs: Catalog[] = [];
    for (const placeCatalog of data) {
      const rawCatalog = Array.isArray(placeCatalog.catalogs)
        ? placeCatalog.catalogs[0]
        : placeCatalog.catalogs;
      if (rawCatalog) {
        catalogs.push(
          normalizeCatalog(rawCatalog as CatalogWithFulfillment) as Catalog
        );
      }
    }
    
    return catalogs;
  },

  async getPlaceById(placeId: string): Promise<Place | null> {
    const { data, error } = await clientSupabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (error) throw error;
    return data;
  },
};
