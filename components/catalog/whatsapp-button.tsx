"use client";

import { useMemo } from "react";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { trackAnalyticsEvent } from "@/lib/analytics-client";
import { getProductWhatsAppMessage, getWhatsAppHref, getWhatsAppNumber } from "@/lib/whatsapp";

type WhatsAppButtonProps = {
  productId?: string;
  productSlug?: string;
  productName?: string;
  message?: string;
  whatsappNumber?: string;
  disabled?: boolean;
};

export function WhatsAppButton({
  productId,
  productSlug,
  productName,
  whatsappNumber,
  message = "Olá, quero falar com a Liensi.",
  disabled = false
}: WhatsAppButtonProps) {
  const whatsappMessage = useMemo(
    () => (productName ? getProductWhatsAppMessage(productName) : message),
    [message, productName]
  );
  const hasNumber = Boolean(getWhatsAppNumber(whatsappNumber));
  const href = getWhatsAppHref(whatsappMessage, whatsappNumber);
  const isDisabled = disabled || !hasNumber;

  const className =
    "fixed left-1/2 z-50 flex size-[clamp(64px,12vmin,120px)] -translate-x-1/2 items-center justify-center rounded-md bg-transparent p-0 text-[#25D366] drop-shadow-[0_10px_24px_rgba(37,211,102,0.48)] transition hover:-translate-y-1 hover:text-[#20bd5a] active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#25D366]";
  const iconClassName = "size-[clamp(46px,8.4vmin,84px)]";
  const style = {
    bottom: "max(4vh, calc(env(safe-area-inset-bottom) + 14px))"
  };

  if (isDisabled) {
    return (
      <button
        type="button"
        disabled
        className={className}
        style={style}
        aria-label={disabled ? "Produto esgotado" : "WhatsApp indisponível"}
        title={disabled ? "Produto esgotado" : "WhatsApp indisponível"}
      >
        <WhatsAppIcon className={iconClassName} />
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chamar no WhatsApp"
      className={className}
      style={style}
      onClick={() => {
        trackAnalyticsEvent({
          eventType: "whatsapp_click",
          productId: productId ?? null,
          productSlug: productSlug ?? null,
          productName: productName ?? null,
          metadata: {
            source: productName ? "product_page" : "catalog_floating"
          }
        });
      }}
    >
      <WhatsAppIcon className={iconClassName} />
    </a>
  );
}
