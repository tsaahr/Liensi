"use client";

import { useMemo, useState } from "react";

import { WhatsAppButton } from "@/components/catalog/whatsapp-button";
import { getActiveVariants } from "@/lib/product-stock";
import type { ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProductVariantPickerProps = {
  productId: string;
  productSlug: string;
  productName: string;
  fallbackStock: number;
  variants: ProductVariant[];
};

export function ProductVariantPicker({
  productId,
  productSlug,
  productName,
  fallbackStock,
  variants
}: ProductVariantPickerProps) {
  const activeVariants = useMemo(() => getActiveVariants(variants), [variants]);
  const firstAvailableVariant =
    activeVariants.find((variant) => variant.stock > 0) ?? activeVariants[0] ?? null;
  const [selectedVariantId, setSelectedVariantId] = useState(firstAvailableVariant?.id ?? "");
  const selectedVariant =
    activeVariants.find((variant) => variant.id === selectedVariantId) ?? firstAvailableVariant;
  const usesVariants = activeVariants.length > 0;
  const availableStock = usesVariants ? selectedVariant?.stock ?? 0 : fallbackStock;
  const whatsappProductName =
    usesVariants && selectedVariant ? `${productName} - ${selectedVariant.name}` : productName;

  return (
    <div className="flex flex-col gap-5">
      {usesVariants ? (
        <div className="border-y border-white/10 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/42">
            Variantes
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {activeVariants.map((variant) => {
              const selected = selectedVariant?.id === variant.id;
              const outOfStock = variant.stock <= 0;

              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={cn(
                    "flex min-h-14 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c084fc]/35",
                    selected
                      ? "border-[#c084fc] bg-[#c084fc]/12 text-white shadow-[0_0_24px_rgba(192,132,252,0.14)]"
                      : "border-white/10 bg-white/[0.04] text-white/72 hover:border-white/28 hover:text-white",
                    outOfStock && "cursor-not-allowed opacity-45 hover:border-white/10"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {variant.color_hex ? (
                      <span
                        className="size-4 shrink-0 rounded-full border border-white/20"
                        style={{ backgroundColor: variant.color_hex }}
                        aria-hidden="true"
                      />
                    ) : null}
                    <span className="truncate">{variant.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-white/48">
                    {outOfStock ? "Esgotado" : `${variant.stock} un.`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <WhatsAppButton
        productId={productId}
        productSlug={productSlug}
        productName={whatsappProductName}
        disabled={availableStock <= 0}
      />
    </div>
  );
}
