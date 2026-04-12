import { getProductPricing } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";

type PriceProps = {
  price: number;
  promotionalPrice: number | null;
  className?: string;
};

export function Price({ price, promotionalPrice, className }: PriceProps) {
  const pricing = getProductPricing({ price, promotionalPrice });

  if (!pricing.hasPromotion) {
    return <p className={className}>{formatCurrency(pricing.originalPrice)}</p>;
  }

  return (
    <div className={className}>
      <p className="text-sm text-white/42 line-through">
        {formatCurrency(pricing.originalPrice)}
      </p>
      <p>{formatCurrency(pricing.currentPrice)}</p>
    </div>
  );
}
