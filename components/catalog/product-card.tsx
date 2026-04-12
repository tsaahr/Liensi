import Image from "next/image";

import { TrackedProductLink } from "@/components/analytics/tracked-product-link";
import { CatalogImagePlaceholder } from "@/components/catalog/catalog-image-placeholder";
import type { Product } from "@/lib/types";
import { Price } from "@/components/catalog/price";
import { getProductMedia } from "@/lib/product-media";
import { getProductPricing } from "@/lib/pricing";
import { getProductStock, productUsesVariants } from "@/lib/product-stock";
import { formatProductName } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
  index: number;
};

export function ProductCard({ product, index }: ProductCardProps) {
  const { coverImage } = getProductMedia(product.images);
  const pricing = getProductPricing(product);
  const displayName = formatProductName(product.name);
  const totalStock = getProductStock(product);
  const categoryName = product.category?.name?.trim() || "Curadoria Liensi";

  return (
    <TrackedProductLink
      href={`/produto/${product.slug}`}
      className="catalog-card group block overflow-hidden rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c084fc]/45"
      style={{ animationDelay: `${index * 70}ms` }}
      productId={product.id}
      productSlug={product.slug}
      productName={displayName}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-white/[0.04]">
        {coverImage?.url ? (
          <Image
            src={coverImage.url}
            alt={coverImage.alt_text ? formatProductName(coverImage.alt_text) : displayName}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <CatalogImagePlaceholder />
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {pricing.hasPromotion ? (
            <span className="rounded-md bg-[#c084fc] px-2.5 py-1 text-xs font-semibold text-[#11091a]">
              {pricing.discountPercentage
                ? `${pricing.discountPercentage}% de desconto`
                : "Promoção"}
            </span>
          ) : null}
          {totalStock <= 0 ? (
            <span className="rounded-md bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#0a0a0f]">
              Esgotado
            </span>
          ) : null}
          {productUsesVariants(product) ? (
            <span className="rounded-md border border-white/12 bg-[#0a0a0f]/72 px-2.5 py-1 text-xs font-semibold text-white/80">
              Opções
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex min-h-40 flex-col justify-between gap-5 p-5">
        <div>
          <p className="truncate text-xs uppercase tracking-[0.24em] text-white/45">
            {categoryName}
          </p>
          <h3 className="mt-2 line-clamp-2 min-h-[3.9rem] font-display text-3xl font-light leading-[0.96] text-pretty text-white">
            {displayName}
          </h3>
        </div>
        <Price
          price={product.price}
          promotionalPrice={product.promotional_price}
          className="text-lg font-semibold text-white"
        />
      </div>
    </TrackedProductLink>
  );
}
