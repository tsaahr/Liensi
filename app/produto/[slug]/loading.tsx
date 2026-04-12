import { CatalogHeader } from "@/components/catalog/catalog-header";

export default function ProductLoading() {
  return (
    <main className="catalog-shell pb-[calc(8rem+env(safe-area-inset-bottom))]">
      <CatalogHeader />
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.58fr)] lg:px-8 lg:py-16">
        <div className="aspect-[4/5] animate-pulse rounded-lg border border-white/10 bg-white/[0.05]" />
        <div className="flex flex-col justify-center gap-7">
          <div className="h-4 w-36 animate-pulse rounded bg-white/10" />
          <div className="space-y-3">
            <div className="h-16 w-full max-w-lg animate-pulse rounded bg-white/10" />
            <div className="h-16 w-3/4 animate-pulse rounded bg-white/10" />
          </div>
          <div className="h-10 w-48 animate-pulse rounded bg-white/10" />
          <div className="space-y-3 border-y border-white/10 py-6">
            <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded bg-white/10" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      </section>
    </main>
  );
}
