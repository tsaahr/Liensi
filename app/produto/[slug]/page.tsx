import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductViewTracker } from "@/components/analytics/product-view-tracker";
import { CatalogHeader } from "@/components/catalog/catalog-header";
import { Price } from "@/components/catalog/price";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductVariantPicker } from "@/components/catalog/product-variant-picker";
import { getProductBySlug, getProductSlugs } from "@/lib/catalog";
import { getProductMedia } from "@/lib/product-media";
import { getProductStock, productUsesVariants } from "@/lib/product-stock";
import { getProductPricing } from "@/lib/pricing";
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
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const totalStock = getProductStock(product);
  const inStock = totalStock > 0;
  const usesVariants = productUsesVariants(product);
  const displayName = formatProductName(product.name);
  const pricing = getProductPricing(product);

  return (
    <main className="catalog-shell pb-[calc(8rem+env(safe-area-inset-bottom))]">
      <CatalogHeader />
      <ProductViewTracker
        productId={product.id}
        productSlug={product.slug}
        productName={displayName}
      />
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.58fr)] lg:px-8 lg:py-16">
        <ProductGallery images={product.images} name={displayName} />
        <div className="flex flex-col justify-center gap-8">
          <div className="animate-fade-up">
            <Link
              href="/#catalogo"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c084fc] transition hover:text-[#d8b4fe]"
            >
              Voltar ao catálogo
            </Link>
            <p className="mt-8 text-xs uppercase tracking-[0.26em] text-white/45">
              {product.category?.name ?? "Sem categoria"}
            </p>
            <h1 className="mt-4 font-display text-6xl font-light leading-none text-white sm:text-7xl">
              {displayName}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-1 text-sm text-white/75">
                {inStock
                  ? usesVariants
                    ? `${totalStock} em estoque total`
                    : `${totalStock} em estoque`
                  : "Esgotado"}
              </span>
              {pricing.hasPromotion ? (
                <span className="rounded-md bg-[#c084fc] px-3 py-1 text-sm font-semibold text-[#11091a]">
                  {pricing.discountPercentage ? `${pricing.discountPercentage}% OFF` : "Promoção"}
                </span>
              ) : null}
            </div>
          </div>

          <Price
            price={product.price}
            promotionalPrice={product.promotional_price}
            className="text-3xl font-semibold text-white"
          />

          <div className="max-w-xl border-y border-white/10 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/42">
              Detalhes
            </p>
            <p className="mt-4 whitespace-pre-line text-base leading-8 text-white/66">
              {product.description ||
                "Informacoes adicionais podem ser confirmadas diretamente no atendimento."}
            </p>
          </div>

          <ProductVariantPicker
            productId={product.id}
            productSlug={product.slug}
            productName={displayName}
            fallbackStock={product.stock}
            variants={product.variants}
          />
        </div>
      </section>
    </main>
  );
}
