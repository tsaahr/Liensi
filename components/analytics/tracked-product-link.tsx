"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

import { trackAnalyticsEvent } from "@/lib/analytics-client";

type TrackedProductLinkProps = {
  href: string;
  className?: string;
  style?: CSSProperties;
  productId: string;
  productSlug: string;
  productName: string;
  children: ReactNode;
};

export function TrackedProductLink({
  href,
  className,
  style,
  productId,
  productSlug,
  productName,
  children
}: TrackedProductLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={() => {
        trackAnalyticsEvent({
          eventType: "product_card_click",
          productId,
          productSlug,
          productName
        });
      }}
    >
      {children}
    </Link>
  );
}
