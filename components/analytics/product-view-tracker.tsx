"use client";

import { useEffect } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics-client";

type ProductViewTrackerProps = {
  productId: string;
  productSlug: string;
  productName: string;
};

export function ProductViewTracker({
  productId,
  productSlug,
  productName
}: ProductViewTrackerProps) {
  useEffect(() => {
    trackAnalyticsEvent({
      eventType: "product_view",
      productId,
      productSlug,
      productName
    });
  }, [productId, productName, productSlug]);

  return null;
}
