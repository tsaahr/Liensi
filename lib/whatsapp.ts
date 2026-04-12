import { whatsappNumber } from "@/lib/env";
import { digitsOnly } from "@/lib/utils";

export function getWhatsAppNumber() {
  return digitsOnly(whatsappNumber);
}

export function getWhatsAppHref(message: string) {
  const number = getWhatsAppNumber();

  if (!number) {
    return "";
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function getProductWhatsAppMessage(productName: string, productUrl?: string) {
  const baseMessage = `Ola, tenho interesse no produto: ${productName}`;
  return productUrl ? `${baseMessage} - ${productUrl}` : baseMessage;
}
