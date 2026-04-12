"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { CatalogBanner } from "@/lib/types";
import { cn } from "@/lib/utils";

type CatalogBannerCarouselProps = {
  banners: CatalogBanner[];
};

const SWIPE_THRESHOLD = 52;

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export function CatalogBannerCarousel({ banners }: CatalogBannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pointerStartX = useRef<number | null>(null);
  const hasMultipleBanners = banners.length > 1;
  const activeBanner = banners[activeIndex] ?? banners[0];

  useEffect(() => {
    if (!hasMultipleBanners) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 6500);

    return () => window.clearInterval(intervalId);
  }, [banners.length, hasMultipleBanners]);

  if (!activeBanner) {
    return null;
  }

  function moveBanner(offset: number) {
    setActiveIndex((current) => (current + offset + banners.length) % banners.length);
  }

  function handlePointerUp(clientX: number) {
    if (!hasMultipleBanners || pointerStartX.current === null) {
      pointerStartX.current = null;
      return;
    }

    const delta = clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD) {
      return;
    }

    moveBanner(delta > 0 ? -1 : 1);
  }

  const cta =
    activeBanner.href && activeBanner.button_label ? (
      isExternalHref(activeBanner.href) ? (
        <a
          href={activeBanner.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-fit items-center rounded-md bg-[#c084fc] px-5 text-sm font-semibold text-[#11091a] transition hover:bg-[#d8b4fe]"
        >
          {activeBanner.button_label}
        </a>
      ) : (
        <Link
          href={activeBanner.href}
          className="inline-flex h-11 w-fit items-center rounded-md bg-[#c084fc] px-5 text-sm font-semibold text-[#11091a] transition hover:bg-[#d8b4fe]"
        >
          {activeBanner.button_label}
        </Link>
      )
    ) : null;

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div
        className="relative min-h-[420px] touch-pan-y sm:min-h-[560px]"
        onPointerDown={(event) => {
          pointerStartX.current = event.clientX;
        }}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
        onPointerUp={(event) => handlePointerUp(event.clientX)}
      >
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={cn(
              "absolute inset-0 transition duration-700 ease-out",
              index === activeIndex ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={index !== activeIndex}
          >
            <picture className="block h-full w-full">
              {banner.mobile_url ? (
                <source media="(max-width: 767px)" srcSet={banner.mobile_url} />
              ) : null}
              <img
                src={banner.url}
                alt={(banner.alt_text ?? banner.title) || "Banner Liensi"}
                loading={index === 0 ? "eager" : "lazy"}
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `${banner.focal_point_x}% ${banner.focal_point_y}%`
                }}
              />
            </picture>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,15,0.92),rgba(10,10,15,0.42)_46%,rgba(10,10,15,0.18)),linear-gradient(0deg,rgba(10,10,15,0.62),rgba(10,10,15,0.08)_46%,rgba(10,10,15,0.38))]" />
          </div>
        ))}

        <div className="relative z-10 mx-auto flex min-h-[420px] w-full max-w-7xl items-center px-4 py-16 sm:min-h-[560px] sm:px-6 lg:px-8">
          <div key={activeBanner.id} className="max-w-2xl animate-fade-up">
            {activeBanner.eyebrow ? (
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.38em] text-[#c084fc]">
                {activeBanner.eyebrow}
              </p>
            ) : null}
            {activeBanner.title ? (
              <h1 className="font-display text-6xl font-light leading-[0.92] tracking-wide text-white sm:text-8xl">
                {activeBanner.title}
              </h1>
            ) : null}
            {activeBanner.subtitle ? (
              <p className="mt-7 max-w-xl text-base leading-8 text-white/72 sm:text-lg">
                {activeBanner.subtitle}
              </p>
            ) : null}
            {cta ? <div className="mt-8">{cta}</div> : null}
          </div>
        </div>

        {hasMultipleBanners ? (
          <div className="absolute bottom-5 left-1/2 z-10 flex w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              {banners.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "h-1.5 rounded-full transition",
                    index === activeIndex ? "w-9 bg-[#c084fc]" : "w-4 bg-white/36 hover:bg-white/70"
                  )}
                  aria-label={`Ir para banner ${index + 1}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveBanner(-1)}
                className="flex size-10 items-center justify-center rounded-md border border-white/15 bg-[#0a0a0f]/54 text-white transition hover:border-[#c084fc] hover:text-[#d8b4fe]"
                aria-label="Banner anterior"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => moveBanner(1)}
                className="flex size-10 items-center justify-center rounded-md border border-white/15 bg-[#0a0a0f]/54 text-white transition hover:border-[#c084fc] hover:text-[#d8b4fe]"
                aria-label="Próximo banner"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
