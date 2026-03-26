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
  placeId?: string;
} | {
  type: 'place';
  placeId?: string;
  catalogId?: string;
} | null;

export type AuthResponse = {
  user: User;
  entry: UserEntry;
};

export type CatalogType = 'goods' | 'services';
export type CatalogSubtype =
  | 'shop'
  | 'cafe_restaurant'
  | 'digital_store'
  | 'salon'
  | 'private_master'
  | 'studio_club';

export type Catalog = {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  type: CatalogType;
  subtype?: CatalogSubtype;
  banner_url?: string;
  address?: string;
  is_open_24_7?: boolean;
  work_start?: string;
  work_end?: string;
  emergency_phone?: string;
  emergency_telegram?: string;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category[];
  actions?: Action[];
  fulfillment_methods?: FulfillmentMethod[];
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
  detailed_description?: string;
  price?: number;
  image_url?: string;
  is_available: boolean;
  position: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ActionType = 'order' | 'pay' | 'book' | 'chat';

export type PaymentMethod =
  | 'payment_on_delivery'
  | 'payment_in_chat'
  | 'light_sbp'
  | 'online_yookassa';

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
  fulfillment_method?: FulfillmentMethodType;
  payment_method?: PaymentMethod;
  payment_provider?: 'yookassa';
  payment_external_id?: string;
  payment_status?: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  payment_confirmation_url?: string;
  payment_details?: Record<string, unknown>;
  delivery_address?: string;
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
  detailed_description?: string;
  price?: number;
  image_url?: string;
  is_available?: boolean;
  position?: number;
};

export type CatalogFormData = {
  title: string;
  description?: string;
  type: CatalogType;
  subtype?: CatalogSubtype;
  banner_url?: string;
  address?: string;
  is_open_24_7?: boolean;
  work_start?: string;
  work_end?: string;
  emergency_phone?: string;
  emergency_telegram?: string;
  is_active?: boolean;
};

export type FulfillmentMethodType =
  | 'pickup'
  | 'delivery'
  | 'digital'
  | 'to_table'
  | 'on_site'
  | 'at_client';

export type FulfillmentMethod = {
  id: string;
  catalog_id: string;
  method: FulfillmentMethodType;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type ActionFormData = {
  type: ActionType;
  is_enabled?: boolean;
  config?: Record<string, unknown>;
};

export type CatalogPaymentGateway = {
  id: string;
  catalog_id: string;
  provider: 'yookassa';
  is_enabled: boolean;
  shop_id: string;
  secret_key: string;
  success_return_url?: string;
  fail_return_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

export type CatalogPaymentGatewayFormData = {
  provider: 'yookassa';
  is_enabled?: boolean;
  shop_id: string;
  secret_key: string;
  success_return_url?: string;
  fail_return_url?: string;
};

export type CatalogAccessInvite = {
  id: string;
  catalog_id: string;
  code: string;
  role: 'editor';
  created_by: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CatalogUserAccess = {
  id: string;
  catalog_id: string;
  user_id: string;
  role: 'owner' | 'editor';
  granted_by?: string;
  created_at: string;
  updated_at: string;
  user?: Pick<User, 'id' | 'first_name' | 'last_name' | 'username'> | null;
};
