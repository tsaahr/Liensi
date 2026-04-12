import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { parseMoneyInput } from "@/lib/pricing";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

const PRODUCT_NAME_LOWERCASE_WORDS = new Set([
  "a",
  "as",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "para",
  "por"
]);

export function formatProductName(value: string) {
  let wordIndex = 0;
  const normalized = value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");

  return normalized.split(/([\s/-]+)/).map((part) => {
    if (!part || /^[\s/-]+$/.test(part)) {
      return part;
    }

    const word = part.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9]/g, "");
    const isFirstWord = wordIndex === 0;
    wordIndex += 1;

    if (!isFirstWord && PRODUCT_NAME_LOWERCASE_WORDS.has(word)) {
      return part;
    }

    const firstLetterIndex = part.search(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/);

    if (firstLetterIndex < 0) {
      return part;
    }

    return (
      part.slice(0, firstLetterIndex) +
      part.charAt(firstLetterIndex).toLocaleUpperCase("pt-BR") +
      part.slice(firstLetterIndex + 1)
    );
  }).join("");
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function toNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return parseMoneyInput(value);
}
