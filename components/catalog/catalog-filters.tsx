import Link from "next/link";

import type { Category } from "@/lib/types";

type CatalogFiltersProps = {
  categories: Category[];
  selectedCategory?: string;
  search?: string;
  sort?: string;
  productCount: number;
};

const sortOptions = [
  { label: "Novidades", value: "newest" },
  { label: "Menor preco", value: "price-asc" },
  { label: "Maior preco", value: "price-desc" },
  { label: "Promocoes primeiro", value: "promo" }
];

export function CatalogFilters({
  categories,
  selectedCategory,
  search,
  sort = "newest",
  productCount
}: CatalogFiltersProps) {
  const hasFilters = Boolean(search || selectedCategory || sort !== "newest");

  return (
    <form
      action="/"
      id="catalogo"
      className="mx-auto flex w-full max-w-7xl scroll-mt-20 flex-col gap-4 px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
    >
      <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#c084fc]">
            Catalogo
          </p>
          <h2 className="mt-3 max-w-2xl text-balance font-display text-4xl font-light text-white sm:text-5xl">
            Escolha com calma.
          </h2>
          <p className="mt-3 text-sm text-white/54">
            {productCount} produto{productCount === 1 ? "" : "s"} encontrado
            {productCount === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[minmax(220px,280px)_190px_190px_auto]">
          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
            Buscar
            <input
              name="q"
              defaultValue={search}
              placeholder="Nome do produto..."
              className="h-11 rounded-md border border-white/10 bg-white/[0.06] px-4 text-sm font-normal normal-case tracking-normal text-white outline-none transition placeholder:text-white/42 focus:border-[#c084fc] focus:ring-2 focus:ring-[#c084fc]/25"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
            Categoria
            <select
              name="category"
              defaultValue={selectedCategory ?? ""}
              className="h-11 rounded-md border border-white/10 bg-[#11111a] px-4 text-sm font-normal normal-case tracking-normal text-white outline-none transition focus:border-[#c084fc] focus:ring-2 focus:ring-[#c084fc]/25"
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
            Ordem
            <select
              name="sort"
              defaultValue={sort}
              className="h-11 rounded-md border border-white/10 bg-[#11111a] px-4 text-sm font-normal normal-case tracking-normal text-white outline-none transition focus:border-[#c084fc] focus:ring-2 focus:ring-[#c084fc]/25"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="h-11 self-end rounded-md bg-[#c084fc] px-5 text-sm font-semibold text-[#11091a] transition hover:bg-[#d8b4fe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c084fc]/35"
          >
            Filtrar
          </button>
        </div>
      </div>

      {hasFilters ? (
        <Link
          href="/"
          className="w-fit text-sm font-medium text-white/62 underline-offset-4 transition hover:text-white hover:underline"
        >
          Limpar filtros
        </Link>
      ) : null}
    </form>
  );
}
