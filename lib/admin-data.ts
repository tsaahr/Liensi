import { createClient } from "@/lib/supabase/server";
import { supabaseUrl } from "@/lib/env";
import type { AnalyticsEvent, AnalyticsEventType } from "@/lib/analytics";
import type {
  CatalogBanner,
  Category,
  Product,
  ProductImage,
  ProductVariant,
  StockMovement
} from "@/lib/types";

type ProductRecord = Omit<Product, "category" | "images" | "variants"> & {
  categories: Category | Category[] | null;
  product_images: Array<Omit<ProductImage, "url">> | null;
  product_variants: ProductVariant[] | null;
};

type CatalogBannerRecord = Omit<
  CatalogBanner,
  "url" | "mobile_url" | "mobile_storage_path" | "focal_point_x" | "focal_point_y"
> & {
  mobile_storage_path?: string | null;
  focal_point_x?: number | null;
  focal_point_y?: number | null;
};

export type AdminAnalyticsProductRow = {
  key: string;
  product_id: string | null;
  product_slug: string | null;
  product_name: string;
  card_clicks: number;
  product_views: number;
  whatsapp_clicks: number;
  unique_visitors: number;
  unique_card_click_visitors: number;
  unique_product_view_visitors: number;
  unique_whatsapp_visitors: number;
  card_to_whatsapp_visitors: number;
  conversion_rate: number;
};

export type AdminAnalyticsSummary = {
  days: number;
  since: string;
  total_events: number;
  unique_visitors: number;
  event_counts: Record<AnalyticsEventType, number>;
  unique_event_visitors: Record<AnalyticsEventType, number>;
  top_products: AdminAnalyticsProductRow[];
  recent_events: AnalyticsEvent[];
  limit_reached: boolean;
};

const analyticsEventTypes: AnalyticsEventType[] = [
  "catalog_view",
  "product_card_click",
  "product_view",
  "whatsapp_click"
];

function getImageUrl(path: string) {
  return `${supabaseUrl}/storage/v1/object/public/produtos/${path}`;
}

function normalizeProduct(product: ProductRecord): Product {
  const category = Array.isArray(product.categories)
    ? product.categories[0] ?? null
    : product.categories;
  const images = [...(product.product_images ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .map((image) => ({
      ...image,
      url: getImageUrl(image.storage_path)
    }));
  const variants = [...(product.product_variants ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );

  return {
    id: product.id,
    category_id: product.category_id,
    sku: product.sku ?? null,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: Number(product.price),
    promotional_price:
      product.promotional_price === null ? null : Number(product.promotional_price),
    stock: product.stock,
    low_stock_threshold: product.low_stock_threshold ?? 3,
    active: product.active,
    created_at: product.created_at,
    updated_at: product.updated_at,
    category,
    images,
    variants
  };
}

function normalizeBanner(banner: CatalogBannerRecord): CatalogBanner {
  return {
    ...banner,
    mobile_storage_path: banner.mobile_storage_path ?? null,
    focal_point_x: banner.focal_point_x ?? 50,
    focal_point_y: banner.focal_point_y ?? 50,
    url: getImageUrl(banner.storage_path),
    mobile_url: banner.mobile_storage_path ? getImageUrl(banner.mobile_storage_path) : null
  };
}

export async function getAdminCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,created_at,updated_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Category[];
}

export async function getAdminProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,category_id,sku,name,slug,description,price,promotional_price,stock,low_stock_threshold,active,created_at,updated_at,categories(id,name,slug,created_at,updated_at),product_images(id,product_id,storage_path,alt_text,display_order,is_cover,created_at,updated_at),product_variants(id,product_id,name,sku,color_hex,stock,display_order,active,created_at,updated_at)"
    )
    .order("created_at", { ascending: false })
    .order("display_order", {
      referencedTable: "product_images",
      ascending: true
    })
    .order("display_order", {
      referencedTable: "product_variants",
      ascending: true
    });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as ProductRecord[]).map(normalizeProduct);
}

export async function getAdminBanners() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catalog_banners")
    .select(
      "id,title,eyebrow,subtitle,button_label,href,storage_path,mobile_storage_path,alt_text,display_order,focal_point_x,focal_point_y,active,created_at,updated_at"
    )
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CatalogBannerRecord[]).map(normalizeBanner);
}

export async function getAdminProduct(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,category_id,sku,name,slug,description,price,promotional_price,stock,low_stock_threshold,active,created_at,updated_at,categories(id,name,slug,created_at,updated_at),product_images(id,product_id,storage_path,alt_text,display_order,is_cover,created_at,updated_at),product_variants(id,product_id,name,sku,color_hex,stock,display_order,active,created_at,updated_at)"
    )
    .eq("id", id)
    .order("display_order", {
      referencedTable: "product_images",
      ascending: true
    })
    .order("display_order", {
      referencedTable: "product_variants",
      ascending: true
    })
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeProduct(data as unknown as ProductRecord) : null;
}

export async function getProductStockMovements(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      "id,product_id,variant_id,variant_name,quantity_delta,stock_before,stock_after,reason,note,created_by,created_by_email,created_at"
    )
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StockMovement[];
}

function emptyEventCounts() {
  return Object.fromEntries(analyticsEventTypes.map((type) => [type, 0])) as Record<
    AnalyticsEventType,
    number
  >;
}

function getProductAnalyticsKey(event: AnalyticsEvent) {
  return event.product_id ?? event.product_slug ?? event.product_name ?? "";
}

function getProductAnalyticsName(event: AnalyticsEvent) {
  return event.product_name ?? event.product_slug ?? "Produto sem nome";
}

export async function getAdminAnalytics(days = 30) {
  const supabase = await createClient();
  const safeDays = [7, 30, 90].includes(days) ? days : 30;
  const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("analytics_events")
    .select(
      "id,event_type,visitor_id,product_id,product_slug,product_name,path,referrer,user_agent,metadata,created_at"
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    throw new Error(error.message);
  }

  const events = (data ?? []) as unknown as AnalyticsEvent[];
  const eventCounts = emptyEventCounts();
  const uniqueEventVisitorSets = Object.fromEntries(
    analyticsEventTypes.map((type) => [type, new Set<string>()])
  ) as Record<AnalyticsEventType, Set<string>>;
  const uniqueVisitors = new Set<string>();
  const productGroups = new Map<
    string,
    {
      key: string;
      product_id: string | null;
      product_slug: string | null;
      product_name: string;
      card_clicks: number;
      product_views: number;
      whatsapp_clicks: number;
      unique_visitors: Set<string>;
      unique_card_click_visitors: Set<string>;
      unique_product_view_visitors: Set<string>;
      unique_whatsapp_visitors: Set<string>;
    }
  >();

  for (const event of events) {
    eventCounts[event.event_type] += 1;
    uniqueVisitors.add(event.visitor_id);
    uniqueEventVisitorSets[event.event_type].add(event.visitor_id);

    const productKey = getProductAnalyticsKey(event);

    if (!productKey) {
      continue;
    }

    const current =
      productGroups.get(productKey) ??
      {
        key: productKey,
        product_id: event.product_id,
        product_slug: event.product_slug,
        product_name: getProductAnalyticsName(event),
        card_clicks: 0,
        product_views: 0,
        whatsapp_clicks: 0,
        unique_visitors: new Set<string>(),
        unique_card_click_visitors: new Set<string>(),
        unique_product_view_visitors: new Set<string>(),
        unique_whatsapp_visitors: new Set<string>()
      };

    current.product_id = current.product_id ?? event.product_id;
    current.product_slug = current.product_slug ?? event.product_slug;
    current.product_name =
      current.product_name === "Produto sem nome" ? getProductAnalyticsName(event) : current.product_name;
    current.unique_visitors.add(event.visitor_id);

    if (event.event_type === "product_card_click") {
      current.card_clicks += 1;
      current.unique_card_click_visitors.add(event.visitor_id);
    }

    if (event.event_type === "product_view") {
      current.product_views += 1;
      current.unique_product_view_visitors.add(event.visitor_id);
    }

    if (event.event_type === "whatsapp_click") {
      current.whatsapp_clicks += 1;
      current.unique_whatsapp_visitors.add(event.visitor_id);
    }

    productGroups.set(productKey, current);
  }

  const topProducts = Array.from(productGroups.values())
    .map((product) => {
      const uniqueCardClickVisitors = product.unique_card_click_visitors.size;
      const uniqueProductViewVisitors = product.unique_product_view_visitors.size;
      const uniqueWhatsappVisitors = product.unique_whatsapp_visitors.size;
      const cardToWhatsappVisitors = Array.from(product.unique_card_click_visitors).filter(
        (visitorId) => product.unique_whatsapp_visitors.has(visitorId)
      ).length;

      return {
        key: product.key,
        product_id: product.product_id,
        product_slug: product.product_slug,
        product_name: product.product_name,
        card_clicks: product.card_clicks,
        product_views: product.product_views,
        whatsapp_clicks: product.whatsapp_clicks,
        unique_visitors: product.unique_visitors.size,
        unique_card_click_visitors: uniqueCardClickVisitors,
        unique_product_view_visitors: uniqueProductViewVisitors,
        unique_whatsapp_visitors: uniqueWhatsappVisitors,
        card_to_whatsapp_visitors: cardToWhatsappVisitors,
        conversion_rate:
          uniqueCardClickVisitors > 0
            ? Math.round((cardToWhatsappVisitors / uniqueCardClickVisitors) * 100)
            : uniqueProductViewVisitors > 0
              ? Math.round((uniqueWhatsappVisitors / uniqueProductViewVisitors) * 100)
            : 0
      };
    })
    .sort((a, b) => {
      if (b.whatsapp_clicks !== a.whatsapp_clicks) {
        return b.whatsapp_clicks - a.whatsapp_clicks;
      }

      if (b.product_views !== a.product_views) {
        return b.product_views - a.product_views;
      }

      return b.card_clicks - a.card_clicks;
    })
    .slice(0, 12);

  return {
    days: safeDays,
    since,
    total_events: events.length,
    unique_visitors: uniqueVisitors.size,
    event_counts: eventCounts,
    unique_event_visitors: Object.fromEntries(
      analyticsEventTypes.map((type) => [type, uniqueEventVisitorSets[type].size])
    ) as Record<AnalyticsEventType, number>,
    top_products: topProducts,
    recent_events: events.slice(0, 25),
    limit_reached: events.length === 5000
  } satisfies AdminAnalyticsSummary;
}
