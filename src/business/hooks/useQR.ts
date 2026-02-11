import useSWR from 'swr';
import { qrService } from '../services/qr';
import type { QRLink } from '../../types';

// SWR fetcher function
const fetcher = async (catalogId: string) => {
  return await qrService.getByCatalogId(catalogId);
};

// Hook for managing QR codes
export const useQRLinks = (catalogId: string) => {
  const { data: qrLinks = [], error, isLoading, isValidating, mutate } = useSWR(
    catalogId ? ['qr-links', catalogId] : null,
    () => fetcher(catalogId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const generateQRForCatalog = async (slug: string) => {
    try {
      const newQRLink = await qrService.generateForCatalog(catalogId, slug);
      
      // Update cache
      await mutate(
        (prev: QRLink[] = []) => [...prev, newQRLink],
        { revalidate: false }
      );
      
      return newQRLink;
    } catch (err) {
      throw err;
    }
  };

  const deleteQR = async (id: string) => {
    try {
      await qrService.delete(id);
      
      // Remove from list
      await mutate(
        (prev: QRLink[] = []) => prev.filter(qr => qr.id !== id),
        { revalidate: false }
      );
    } catch (err) {
      throw err;
    }
  };

  return {
    qrLinks,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch QR codes') : null,
    isValidating,
    refetch: () => mutate(),
    generateQRForCatalog,
    deleteQR
  };
};

// Hook for single QR link by slug
export const useQRLinkBySlug = (slug: string) => {
  const { data: qrLink, error, isLoading, isValidating, mutate } = useSWR(
    slug ? ['qr-link-by-slug', slug] : null,
    () => qrService.getBySlug(slug),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    qrLink,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch QR code') : null,
    isValidating,
    refetch: () => mutate()
  };
};