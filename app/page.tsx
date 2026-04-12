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
    category?: string;
    sort?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const search = resolvedSearchParams.q?.trim() ?? "";
  const category = resolvedSearchParams.category?.trim() ?? "";
  const sort = resolvedSearchParams.sort?.trim() ?? "newest";
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
      <ProductGrid products={products} hasFilters={Boolean(search || category || sort !== "newest")} />
      <WhatsAppButton />
    </main>
  );
}
