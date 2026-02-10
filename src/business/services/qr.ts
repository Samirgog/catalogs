import { businessSupabase } from '../../lib/supabase';
import type { QRLink } from '../../types';

// QR Code Services
export const qrService = {
  // Generate QR code for catalog
  async generateForCatalog(catalogId: string, slug: string): Promise<QRLink> {
    // First create the QR link record
    const { data: qrLink, error: linkError } = await businessSupabase
      .from('qr_links')
      .insert({
        target_type: 'catalog',
        target_id: catalogId,
        slug: slug
      })
      .select()
      .single();

    if (linkError) throw linkError;
    return qrLink;
  },

  // Generate QR code for place
  async generateForPlace(placeId: string, slug: string): Promise<QRLink> {
    const { data: qrLink, error: linkError } = await businessSupabase
      .from('qr_links')
      .insert({
        target_type: 'place',
        target_id: placeId,
        slug: slug
      })
      .select()
      .single();

    if (linkError) throw linkError;
    return qrLink;
  },

  // Get QR link by slug
  async getBySlug(slug: string): Promise<QRLink | null> {
    const { data, error } = await businessSupabase
      .from('qr_links')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  },

  // Get all QR links for a catalog
  async getByCatalogId(catalogId: string): Promise<QRLink[]> {
    const { data, error } = await businessSupabase
      .from('qr_links')
      .select('*')
      .eq('target_type', 'catalog')
      .eq('target_id', catalogId);

    if (error) throw error;
    return data || [];
  },

  // Delete QR link
  async delete(id: string): Promise<void> {
    const { error } = await businessSupabase
      .from('qr_links')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};