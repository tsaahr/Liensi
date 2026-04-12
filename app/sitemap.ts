import type { MetadataRoute } from "next";

import { getProductSlugs } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProductSlugs();
  const now = new Date();

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1
    },
    ...products.map((product) => ({
      url: `${siteUrl}/produto/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}
