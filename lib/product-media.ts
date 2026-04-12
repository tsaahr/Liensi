import type { ProductImage } from "@/lib/types";

export type ProductMedia = {
  images: ProductImage[];
  coverImage: ProductImage | null;
  slides: ProductImage[];
  hasImages: boolean;
  hasMultipleImages: boolean;
};

export function getProductMedia(images: ProductImage[] | null | undefined): ProductMedia {
  const orderedImages = [...(images ?? [])].sort((a, b) => a.display_order - b.display_order);
  const coverImage = orderedImages.find((image) => image.is_cover) ?? orderedImages[0] ?? null;

  return {
    images: orderedImages,
    coverImage,
    slides: orderedImages,
    hasImages: orderedImages.length > 0,
    hasMultipleImages: orderedImages.length > 1
  };
}
