export type MoneyInput = number | string | null | undefined;

export type ProductPricingInput = {
  price: MoneyInput;
  promotionalPrice?: MoneyInput;
  promotional_price?: MoneyInput;
};

export type ProductPricing = {
  originalPrice: number;
  promotionalPrice: number | null;
  currentPrice: number;
  hasPromotion: boolean;
  discountAmount: number;
  discountPercentage: number | null;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function parseMoneyInput(value: MoneyInput) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const numeric = trimmed.replace(/[^\d,.-]/g, "");

  if (!/\d/.test(numeric)) {
    return null;
  }

  const lastComma = numeric.lastIndexOf(",");
  const lastDot = numeric.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : ".";
  const normalized =
    decimalSeparator === ","
      ? numeric.replace(/\./g, "").replace(",", ".")
      : numeric.replace(/,/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRequiredMoney(value: MoneyInput) {
  const parsed = parseMoneyInput(value);

  if (parsed === null || parsed < 0) {
    return 0;
  }

  return roundMoney(parsed);
}

function normalizeOptionalMoney(value: MoneyInput) {
  const parsed = parseMoneyInput(value);

  if (parsed === null || parsed < 0) {
    return null;
  }

  return roundMoney(parsed);
}

export function getProductPricing(input: ProductPricingInput): ProductPricing {
  const originalPrice = normalizeRequiredMoney(input.price);
  const enteredPromotionalPrice = normalizeOptionalMoney(
    input.promotionalPrice ?? input.promotional_price ?? null
  );
  const hasPromotion =
    enteredPromotionalPrice !== null &&
    originalPrice > 0 &&
    enteredPromotionalPrice < originalPrice;
  const promotionalPrice = hasPromotion ? enteredPromotionalPrice : null;
  const currentPrice = promotionalPrice ?? originalPrice;
  const discountAmount = hasPromotion ? roundMoney(originalPrice - currentPrice) : 0;
  const discountPercentage =
    hasPromotion && originalPrice > 0
      ? Math.round((discountAmount / originalPrice) * 100)
      : null;

  return {
    originalPrice,
    promotionalPrice,
    currentPrice,
    hasPromotion,
    discountAmount,
    discountPercentage
  };
}
