"use client";

import { CatalogHeader } from "@/components/catalog/catalog-header";

export default function ErrorPage({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="catalog-shell">
      <CatalogHeader />
      <section className="mx-auto flex min-h-[72vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#c084fc]">
          Liensi
        </p>
        <h1 className="mt-5 text-balance font-display text-6xl font-light leading-none text-white sm:text-7xl">
          Algo saiu do lugar.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-white/62">
          Tente carregar novamente. Se continuar, revise a conexao com o Supabase.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-md bg-[#c084fc] px-5 py-3 text-sm font-semibold text-[#11091a] transition hover:bg-[#d8b4fe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c084fc]/35"
        >
          Tentar novamente
        </button>
      </section>
    </main>
  );
}
