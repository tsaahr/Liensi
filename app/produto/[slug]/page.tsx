import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProductViewTracker } from "@/components/analytics/product-view-tracker";
import { CatalogHeader } from "@/components/catalog/catalog-header";
import { Price } from "@/components/catalog/price";
import { ProductDescription } from "@/components/catalog/product-description";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductVariantPicker } from "@/components/catalog/product-variant-picker";
import { getProductBySlug, getProductSlugs } from "@/lib/catalog";
import { getProductMedia } from "@/lib/product-media";
import { getProductStock, productUsesVariants } from "@/lib/product-stock";
import { getProductPricing } from "@/lib/pricing";
import { getPublicSiteSettings } from "@/lib/settings";
import { formatProductName } from "@/lib/utils";

export const revalidate = 60;
export const dynamicParams = true;

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const products = await getProductSlugs();

  return products.map((product) => ({
    slug: product.slug
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Produto não encontrado"
    };
  }

  const displayName = formatProductName(product.name);
  const coverImage = getProductMedia(product.images).coverImage;
  const description =
    product.description ?? "Produto Liensi com atendimento direto pelo WhatsApp.";

  return {
    title: displayName,
    description,
    alternates: {
      canonical: `/produto/${product.slug}`
    },
    openGraph: {
      title: displayName,
      description,
      url: `/produto/${product.slug}`,
      type: "website",
      images: [
        {
          url: coverImage?.url ?? "/opengraph-image",
          width: 1200,
          height: 630,
          alt: displayName
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: displayName,
      description,
      images: [coverImage?.url ?? "/opengraph-image"]
    }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getPublicSiteSettings()
  ]);

  if (!product) {
    notFound();
  }

  const totalStock = getProductStock(product);
  const inStock = totalStock > 0;
  const usesVariants = productUsesVariants(product);
  const displayName = formatProductName(product.name);
  const pricing = getProductPricing(product);
  const categoryName = product.category?.name?.trim() || "Curadoria Liensi";
  const stockLabel = inStock
    ? usesVariants
      ? `${totalStock} ${totalStock === 1 ? "unidade disponível" : "unidades disponíveis"} no total`
      : `${totalStock} ${totalStock === 1 ? "unidade disponível" : "unidades disponíveis"}`
    : "Esgotado";

  return (
    <main className="catalog-shell pb-[calc(8rem+env(safe-area-inset-bottom))]">
      <CatalogHeader />
      <ProductViewTracker
        productId={product.id}
        productSlug={product.slug}
        productName={displayName}
      />
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <Link
          href="/#catalogo"
          className="inline-flex h-11 items-center gap-3 rounded-md border border-white/10 bg-white/[0.05] px-4 text-xs font-semibold uppercase tracking-[0.22em] text-white/72 transition hover:-translate-x-0.5 hover:border-[#c084fc]/60 hover:bg-[#c084fc]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c084fc]/45"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao catálogo
        </Link>
      </div>
      <section className="mx-auto grid w-full max-w-7xl items-start gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(380px,0.64fr)] lg:px-8 lg:py-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={product.images} name={displayName} />
        </div>
        <div className="flex flex-col gap-8 lg:pt-2">
          <div className="animate-fade-up">
            <p className="text-xs uppercase tracking-[0.26em] text-white/45">
              {categoryName}
            </p>
            <h1 className="mt-4 font-display text-6xl font-light leading-none text-white sm:text-7xl">
              {displayName}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-1 text-sm text-white/75">
                {stockLabel}
              </span>
              {pricing.hasPromotion ? (
                <span className="rounded-md bg-[#c084fc] px-3 py-1 text-sm font-semibold text-[#11091a]">
                  {pricing.discountPercentage
                    ? `${pricing.discountPercentage}% de desconto`
                    : "Promoção"}
                </span>
              ) : null}
            </div>
          </div>

          <Price
            price={product.price}
            promotionalPrice={product.promotional_price}
            className="text-3xl font-semibold text-white"
          />

          <ProductDescription description={product.description} />

          <ProductVariantPicker
            productId={product.id}
            productSlug={product.slug}
            productName={displayName}
            fallbackStock={product.stock}
            variants={product.variants}
            whatsappNumber={settings.whatsappNumber}
          />
        </div>
      </section>
    </main>
  );
}
