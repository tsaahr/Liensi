import { CatalogViewTracker } from "@/components/analytics/catalog-view-tracker";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogBannerCarousel } from "@/components/catalog/catalog-banner-carousel";
import { CatalogHeader } from "@/components/catalog/catalog-header";
import { ProductGrid } from "@/components/catalog/product-grid";
import { WhatsAppButton } from "@/components/catalog/whatsapp-button";
import { getCatalogBanners, getCatalogProducts, getCategories } from "@/lib/catalog";

export const revalidate = 60;

type HomeProps = {
  searchParams?: Promise<{
    q?: string;
    busca?: string;
    category?: string;
    categoria?: string;
    sort?: string;
    ordem?: string;
  }>;
};

function normalizeCategoryFilter(value?: string) {
  const category = value?.trim() ?? "";
  return category.toLocaleLowerCase("pt-BR") === "geral" ? "" : category;
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const search = (resolvedSearchParams.busca ?? resolvedSearchParams.q)?.trim() ?? "";
  const category = normalizeCategoryFilter(
    resolvedSearchParams.categoria ?? resolvedSearchParams.category
  );
  const sort = (resolvedSearchParams.ordem ?? resolvedSearchParams.sort)?.trim() ?? "mais-recentes";
  const hasSortFilter = sort !== "mais-recentes" && sort !== "newest";
  const [banners, categories, products] = await Promise.all([
    getCatalogBanners(),
    getCategories(),
    getCatalogProducts(search, category, sort)
  ]);

  return (
    <main className="catalog-shell pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <CatalogHeader />
      <CatalogBannerCarousel banners={banners} />
      <CatalogFilters
        categories={categories}
        selectedCategory={category}
        search={search}
        sort={sort}
        productCount={products.length}
      />
      <CatalogViewTracker search={search} category={category} sort={sort} />
      <ProductGrid products={products} hasFilters={Boolean(search || category || hasSortFilter)} />
      <WhatsAppButton />
    </main>
  );
}
