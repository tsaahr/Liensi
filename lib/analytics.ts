export const analyticsEventTypes = [
  "catalog_view",
  "product_card_click",
  "product_view",
  "whatsapp_click"
] as const;

export type AnalyticsEventType = (typeof analyticsEventTypes)[number];

export type AnalyticsTrackInput = {
  eventType: AnalyticsEventType;
  productId?: string | null;
  productSlug?: string | null;
  productName?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export type AnalyticsEvent = {
  id: string;
  event_type: AnalyticsEventType;
  visitor_id: string;
  product_id: string | null;
  product_slug: string | null;
  product_name: string | null;
  path: string | null;
  referrer: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export const analyticsEventLabels: Record<AnalyticsEventType, string> = {
  catalog_view: "Visita ao catalogo",
  product_card_click: "Clique no produto",
  product_view: "Pagina do produto",
  whatsapp_click: "Clique no WhatsApp"
};
