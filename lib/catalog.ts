import { unstable_cache } from "next/cache";

import { getProductPricing } from "@/lib/pricing";
import { createPublicClient } from "@/lib/supabase/public";
import type { CatalogBanner, Category, Product, ProductImage, ProductVariant } from "@/lib/types";

export type ProductSort = "newest" | "price-asc" | "price-desc" | "promo";

type ProductRecord = Omit<Product, "category" | "images" | "variants"> & {
  categories: Category | Category[] | null;
  product_images: Array<Omit<ProductImage, "url">> | null;
  product_variants?: ProductVariant[] | null;
};

export type ProductSlug = {
  slug: string;
  updated_at: string | null;
};

type CatalogBannerRecord = Omit<
  CatalogBanner,
  "url" | "mobile_url" | "mobile_storage_path" | "focal_point_x" | "focal_point_y"
> & {
  mobile_storage_path?: string | null;
  focal_point_x?: number | null;
  focal_point_y?: number | null;
};

function imageUrl(path: string) {
  const supabase = createPublicClient();
  if (!supabase) {
    return "";
  }

  return supabase.storage.from("produtos").getPublicUrl(path).data.publicUrl;
}

function normalizeProduct(product: ProductRecord): Product {
  const category = Array.isArray(product.categories)
    ? product.categories[0] ?? null
    : product.categories;
  const images = [...(product.product_images ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .map((image) => ({
      ...image,
      url: imageUrl(image.storage_path)
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
    url: imageUrl(banner.storage_path),
    mobile_url: banner.mobile_storage_path ? imageUrl(banner.mobile_storage_path) : null
  };
}

function isMissingBannerImageColumn(errorMessage: string) {
  return (
    errorMessage.includes("mobile_storage_path") ||
    errorMessage.includes("focal_point_x") ||
    errorMessage.includes("focal_point_y")
  );
}

function isMissingProductVariantsRelation(errorMessage: string) {
  return errorMessage.includes("product_variants");
}

function normalizeProductSort(sort?: string): ProductSort {
  if (sort === "price-asc" || sort === "price-desc" || sort === "promo") {
    return sort;
  }

  return "newest";
}

function productDate(product: Product) {
  return product.created_at ? Date.parse(product.created_at) || 0 : 0;
}

function sortCatalogProducts(products: Product[], sort: ProductSort) {
  return [...products].sort((a, b) => {
    if (sort === "price-asc" || sort === "price-desc") {
      const priceA = getProductPricing(a).currentPrice;
      const priceB = getProductPricing(b).currentPrice;
      return sort === "price-asc" ? priceA - priceB : priceB - priceA;
    }

    if (sort === "promo") {
      const pricingA = getProductPricing(a);
      const pricingB = getProductPricing(b);

      if (Number(pricingB.hasPromotion) !== Number(pricingA.hasPromotion)) {
        return Number(pricingB.hasPromotion) - Number(pricingA.hasPromotion);
      }

      return (
        (pricingB.discountPercentage ?? 0) - (pricingA.discountPercentage ?? 0) ||
        productDate(b) - productDate(a)
      );
    }

    return productDate(b) - productDate(a);
  });
}

async function fetchCategories() {
  const supabase = createPublicClient();
  if (!supabase) {
    return [] as Category[];
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,created_at,updated_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function fetchCatalogProducts(search?: string, categorySlug?: string, sort?: string) {
  const supabase = createPublicClient();
  if (!supabase) {
    return [] as Product[];
  }

  const selectWithVariants =
    "id,category_id,name,slug,description,price,promotional_price,stock,active,created_at,updated_at,categories!inner(id,name,slug,created_at,updated_at),product_images(id,product_id,storage_path,alt_text,display_order,is_cover,created_at,updated_at),product_variants(id,product_id,name,sku,color_hex,stock,display_order,active,created_at,updated_at)";
  const fallbackSelect =
    "id,category_id,name,slug,description,price,promotional_price,stock,active,created_at,updated_at,categories!inner(id,name,slug,created_at,updated_at),product_images(id,product_id,storage_path,alt_text,display_order,is_cover,created_at,updated_at)";

  const buildQuery = (select: string, withVariants: boolean) => {
    let query = supabase
      .from("products")
      .select(select)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .order("display_order", {
        referencedTable: "product_images",
        ascending: true
      });

    if (withVariants) {
      query = query.order("display_order", {
        referencedTable: "product_variants",
        ascending: true
      });
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (categorySlug) {
      query = query.eq("categories.slug", categorySlug);
    }

    return query;
  };

  const { data, error } = await buildQuery(selectWithVariants, true);

  if (error) {
    if (isMissingProductVariantsRelation(error.message)) {
      const { data: fallbackData, error: fallbackError } = await buildQuery(fallbackSelect, false);

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return sortCatalogProducts(
        ((fallbackData ?? []) as unknown as ProductRecord[]).map(normalizeProduct),
        normalizeProductSort(sort)
      );
    }

    throw new Error(error.message);
  }

  return sortCatalogProducts(
    ((data ?? []) as unknown as ProductRecord[]).map(normalizeProduct),
    normalizeProductSort(sort)
  );
}

async function fetchCatalogBanners() {
  const supabase = createPublicClient();
  if (!supabase) {
    return [] as CatalogBanner[];
  }

  const selectWithResponsiveImage =
    "id,title,eyebrow,subtitle,button_label,href,storage_path,mobile_storage_path,alt_text,display_order,focal_point_x,focal_point_y,active,created_at,updated_at";
  const fallbackSelect =
    "id,title,eyebrow,subtitle,button_label,href,storage_path,alt_text,display_order,active,created_at,updated_at";

  const queryBanners = (select: string) =>
    supabase
      .from("catalog_banners")
      .select(select)
      .eq("active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

  const { data, error } = await queryBanners(selectWithResponsiveImage);

  if (error) {
    if (isMissingBannerImageColumn(error.message)) {
      const { data: fallbackData, error: fallbackError } = await queryBanners(fallbackSelect);

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return ((fallbackData ?? []) as unknown as CatalogBannerRecord[]).map(normalizeBanner);
    }

    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as CatalogBannerRecord[]).map(normalizeBanner);
}

async function fetchProductBySlug(slug: string) {
  const supabase = createPublicClient();
  if (!supabase) {
    return null;
  }

  const selectWithVariants =
    "id,category_id,name,slug,description,price,promotional_price,stock,active,created_at,updated_at,categories!inner(id,name,slug,created_at,updated_at),product_images(id,product_id,storage_path,alt_text,display_order,is_cover,created_at,updated_at),product_variants(id,product_id,name,sku,color_hex,stock,display_order,active,created_at,updated_at)";
  const fallbackSelect =
    "id,category_id,name,slug,description,price,promotional_price,stock,active,created_at,updated_at,categories!inner(id,name,slug,created_at,updated_at),product_images(id,product_id,storage_path,alt_text,display_order,is_cover,created_at,updated_at)";

  const queryProduct = (select: string, withVariants: boolean) => {
    let query = supabase
      .from("products")
      .select(select)
      .eq("active", true)
      .eq("slug", slug)
      .order("display_order", {
        referencedTable: "product_images",
        ascending: true
      });

    if (withVariants) {
      query = query.order("display_order", {
        referencedTable: "product_variants",
        ascending: true
      });
    }

    return query.maybeSingle();
  };

  const { data, error } = await queryProduct(selectWithVariants, true);

  if (error) {
    if (isMissingProductVariantsRelation(error.message)) {
      const { data: fallbackData, error: fallbackError } = await queryProduct(fallbackSelect, false);

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return fallbackData ? normalizeProduct(fallbackData as unknown as ProductRecord) : null;
    }

    throw new Error(error.message);
  }

  return data ? normalizeProduct(data as unknown as ProductRecord) : null;
}

async function fetchProductSlugs() {
  const supabase = createPublicClient();
  if (!supabase) {
    return [] as ProductSlug[];
  }

  const { data, error } = await supabase
    .from("products")
    .select("slug,updated_at")
    .eq("active", true)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProductSlug[];
}

export function getCategories() {
  return unstable_cache(fetchCategories, ["categories"], {
    revalidate: 60,
    tags: ["catalog", "categories"]
  })();
}

export function getCatalogProducts(search?: string, categorySlug?: string, sort?: string) {
  const normalizedSearch = search?.trim() ?? "";
  const normalizedCategory = categorySlug?.trim() ?? "";
  const normalizedSort = normalizeProductSort(sort);

  return unstable_cache(
    () => fetchCatalogProducts(normalizedSearch, normalizedCategory, normalizedSort),
    ["catalog-products", normalizedSearch, normalizedCategory, normalizedSort],
    {
      revalidate: 60,
      tags: ["catalog", "products"]
    }
  )();
}

export function getCatalogBanners() {
  return unstable_cache(fetchCatalogBanners, ["catalog-banners"], {
    revalidate: 60,
    tags: ["catalog", "banners"]
  })();
}

export function getProductBySlug(slug: string) {
  return unstable_cache(() => fetchProductBySlug(slug), ["product", slug], {
    revalidate: 60,
    tags: ["catalog", "products", `product:${slug}`]
  })();
}

export function getProductSlugs() {
  return unstable_cache(fetchProductSlugs, ["product-slugs"], {
    revalidate: 60,
    tags: ["catalog", "products"]
  })();
}
