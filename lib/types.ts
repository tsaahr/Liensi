export type Category = {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string | null;
  display_order: number;
  is_cover: boolean;
  created_at?: string;
  updated_at?: string;
  url: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  color_hex: string | null;
  stock: number;
  display_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Product = {
  id: string;
  category_id: string;
  sku: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  stock: number;
  low_stock_threshold: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  category: Category | null;
  images: ProductImage[];
  variants: ProductVariant[];
};

export type CatalogBanner = {
  id: string;
  title: string;
  eyebrow: string | null;
  subtitle: string | null;
  button_label: string | null;
  href: string | null;
  storage_path: string;
  mobile_storage_path: string | null;
  alt_text: string | null;
  display_order: number;
  focal_point_x: number;
  focal_point_y: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  url: string;
  mobile_url: string | null;
};

export type StockMovement = {
  id: string;
  product_id: string;
  quantity_delta: number;
  stock_before: number;
  stock_after: number;
  reason: string;
  note: string | null;
  variant_id: string | null;
  variant_name: string | null;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
};
