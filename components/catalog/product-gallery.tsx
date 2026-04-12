"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { CatalogImagePlaceholder } from "@/components/catalog/catalog-image-placeholder";
import { getProductMedia } from "@/lib/product-media";
import type { ProductImage } from "@/lib/types";
import { cn, formatProductName } from "@/lib/utils";

type ProductGalleryProps = {
  images: ProductImage[];
  name: string;
};

const SWIPE_THRESHOLD = 46;

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const media = useMemo(() => getProductMedia(images), [images]);
  const orderedImages = media.images;
  const cover = media.coverImage;
  const [selectedId, setSelectedId] = useState(cover?.id);
  const pointerStartX = useRef<number | null>(null);
  const selected = orderedImages.find((image) => image.id === selectedId) ?? cover;
  const selectedIndex = Math.max(
    0,
    orderedImages.findIndex((image) => image.id === selected?.id)
  );

  function moveImage(offset: number) {
    if (!media.hasMultipleImages) {
      return;
    }

    const nextIndex = (selectedIndex + offset + orderedImages.length) % orderedImages.length;
    setSelectedId(orderedImages[nextIndex]?.id);
  }

  function handlePointerUp(clientX: number) {
    if (!media.hasMultipleImages || pointerStartX.current === null) {
      pointerStartX.current = null;
      return;
    }

    const delta = clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD) {
      return;
    }

    moveImage(delta > 0 ? -1 : 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative aspect-[4/5] touch-pan-y overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]"
        onPointerDown={(event) => {
          pointerStartX.current = event.clientX;
        }}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
        onPointerUp={(event) => handlePointerUp(event.clientX)}
      >
        {selected?.url ? (
          <Image
            src={selected.url}
            alt={selected.alt_text ? formatProductName(selected.alt_text) : name}
            fill
            sizes="(min-width: 1024px) 58vw, 100vw"
            priority
            className="object-cover"
          />
        ) : (
          <CatalogImagePlaceholder label="Produto sem imagem" />
        )}
        {media.hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={() => moveImage(-1)}
              className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md border border-white/14 bg-[#0a0a0f]/58 text-white backdrop-blur transition hover:border-[#c084fc] hover:text-[#d8b4fe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c084fc]/35 sm:left-4"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => moveImage(1)}
              className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md border border-white/14 bg-[#0a0a0f]/58 text-white backdrop-blur transition hover:border-[#c084fc] hover:text-[#d8b4fe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c084fc]/35 sm:right-4"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute bottom-4 right-4 rounded-md border border-white/12 bg-[#0a0a0f]/62 px-3 py-1 text-xs font-semibold text-white/78 backdrop-blur">
              {selectedIndex + 1}/{orderedImages.length}
            </div>
          </>
        ) : null}
      </div>
      {media.hasMultipleImages ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {orderedImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedId(image.id)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md border bg-white/[0.04] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c084fc]/35",
                selected?.id === image.id
                  ? "border-[#c084fc] shadow-[0_0_22px_rgba(192,132,252,0.2)]"
                  : "border-white/10 hover:border-white/35"
              )}
              aria-label={`Ver imagem ${index + 1}`}
            >
              <Image
                src={image.url}
                alt={image.alt_text ? formatProductName(image.alt_text) : name}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
