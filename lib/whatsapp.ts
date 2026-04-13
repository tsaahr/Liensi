import { whatsappNumber } from "@/lib/env";
import { digitsOnly } from "@/lib/utils";

export function getWhatsAppNumber(number = whatsappNumber) {
  return digitsOnly(number);
}

export function getWhatsAppHref(message: string, number = whatsappNumber) {
  const normalizedNumber = getWhatsAppNumber(number);

  if (!normalizedNumber) {
    return "";
  }

  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}

export function getProductWhatsAppMessage(productName: string) {
  return `Olá, tenho interesse no ${productName}`;
}
