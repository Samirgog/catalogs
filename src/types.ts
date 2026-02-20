// Database Models

export type User = {
  id: string;
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  created_at: string;
  updated_at: string;
};

export type UserEntry = {
  type: 'admin' | 'catalog';
  catalogId?: string;
} | null;

export type AuthResponse = {
  user: User;
  entry: UserEntry;
};

export type CatalogType = 'goods' | 'services';

export type Catalog = {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  type: CatalogType;
  banner_url?: string;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category[];
  actions?: Action[];
};

export type Category = {
  id: string;
  catalog_id: string;
  title: string;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  items?: Item[];
};

export type Item = {
  id: string;
  category_id: string;
  title: string;
  description?: string;
  price?: number;
  image_url?: string;
  is_available: boolean;
  position: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ActionType = 'order' | 'pay' | 'book' | 'chat';

export type Action = {
  id: string;
  catalog_id: string;
  type: ActionType;
  is_enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type OrderStatus =
  | 'created'
  | 'submitted'
  | 'payment_reported'
  | 'accepted'
  | 'rejected'
  | 'ready'
  | 'paid'
  | 'completed'
  | 'cancelled'
  | 'new';

export type Order = {
  id: string;
  catalog_id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_comment?: string;
  items: Record<string, unknown>[];
  total_price: number;
  table_number?: string;
  order_number?: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

export type StaffAccessCode = {
  id: string;
  catalog_id: string;
  access_code: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

export type StaffMember = {
  id: string;
  catalog_id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  on_shift: boolean;
  linked_at: string;
  last_activity_at?: string;
};

export type PlaceType = 'single' | 'foodcourt';

export type Place = {
  id: string;
  name: string;
  address?: string;
  type: PlaceType;
  created_at: string;
  updated_at: string;
};

export type PlaceCatalog = {
  place_id: string;
  catalog_id: string;
  created_at: string;
};

export type QRLinkTargetType = 'catalog' | 'place';

export type QRLink = {
  id: string;
  target_type: QRLinkTargetType;
  target_id: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

// Form Data Types
export type CategoryFormData = {
  title: string;
  position?: number;
};

export type ItemFormData = {
  title: string;
  description?: string;
  price?: number;
  image_url?: string;
  is_available?: boolean;
  position?: number;
};

export type CatalogFormData = {
  title: string;
  description?: string;
  type: CatalogType;
  banner_url?: string;
  is_active?: boolean;
};

export type ActionFormData = {
  type: ActionType;
  is_enabled?: boolean;
  config?: Record<string, unknown>;
};
