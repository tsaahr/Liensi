import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/catalog/product-card";

type ProductGridProps = {
  products: Product[];
  hasFilters?: boolean;
};

export function ProductGrid({ products, hasFilters = false }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-12">
          <p className="font-display text-4xl font-light text-white">
            {hasFilters ? "Não encontramos esse produto." : "Catálogo em preparação."}
          </p>
          <p className="mt-3 text-sm text-white/58">
            {hasFilters
              ? "Tente outro termo ou remova os filtros para ver toda a curadoria."
              : "Os produtos aparecem aqui assim que estiverem disponíveis."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </section>
  );
}
