import type { QRLink, QRLinkTargetType } from '../../types';

export const mockQRLinks: QRLink[] = [
  {
    id: 'qr-1',
    target_type: 'catalog' as QRLinkTargetType,
    target_id: 'catalog-1',
    slug: 'menu-main',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'qr-2',
    target_type: 'catalog' as QRLinkTargetType,
    target_id: 'catalog-2',
    slug: 'summer-specials',
    created_at: '2024-01-20T09:00:00Z',
    updated_at: '2024-01-20T09:00:00Z'
  },
  {
    id: 'qr-3',
    target_type: 'catalog' as QRLinkTargetType,
    target_id: 'catalog-3',
    slug: 'massage-services',
    created_at: '2024-01-25T13:00:00Z',
    updated_at: '2024-01-25T13:00:00Z'
  },
  {
    id: 'qr-4',
    target_type: 'place' as QRLinkTargetType,
    target_id: 'place-1',
    slug: 'central-restaurant',
    created_at: '2024-01-01T09:30:00Z',
    updated_at: '2024-01-01T09:30:00Z'
  },
  {
    id: 'qr-5',
    target_type: 'place' as QRLinkTargetType,
    target_id: 'place-2',
    slug: 'foodcourt-taste',
    created_at: '2024-01-05T11:00:00Z',
    updated_at: '2024-01-05T11:00:00Z'
  }
];