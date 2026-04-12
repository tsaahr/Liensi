import type { Product, ProductVariant } from "@/lib/types";

export function getActiveVariants(variants: ProductVariant[] = []) {
  return variants
    .filter((variant) => variant.active)
    .sort((a, b) => a.display_order - b.display_order);
}

export function productUsesVariants(product: Pick<Product, "variants">) {
  return getActiveVariants(product.variants).length > 0;
}

export function getProductStock(product: Pick<Product, "stock" | "variants">) {
  const activeVariants = getActiveVariants(product.variants);

  if (activeVariants.length === 0) {
    return product.stock;
  }

  return activeVariants.reduce((total, variant) => total + variant.stock, 0);
}

export function getVariantStockLabel(product: Pick<Product, "stock" | "variants">) {
  const activeVariants = getActiveVariants(product.variants);

  if (activeVariants.length === 0) {
    return "";
  }

  const inStock = activeVariants.filter((variant) => variant.stock > 0).length;

  return `${inStock}/${activeVariants.length} variacoes disponiveis`;
}
