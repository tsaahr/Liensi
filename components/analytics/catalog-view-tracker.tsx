"use client";

import { useEffect } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics-client";

type CatalogViewTrackerProps = {
  search?: string;
  category?: string;
  sort?: string;
};

export function CatalogViewTracker({
  search = "",
  category = "",
  sort = "newest"
}: CatalogViewTrackerProps) {
  useEffect(() => {
    trackAnalyticsEvent({
      eventType: "catalog_view",
      metadata: {
        has_search: Boolean(search),
        category: category || null,
        sort
      }
    });
  }, [category, search, sort]);

  return null;
}
