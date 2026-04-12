import Link from "next/link";

export function CatalogHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0f]/82 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-xl font-light tracking-[0.36em] text-white outline-none transition focus-visible:text-[#d8b4fe] sm:text-2xl sm:tracking-[0.42em]"
          aria-label="Liensi"
          translate="no"
        >
          LIENSI
        </Link>
        <nav className="flex items-center gap-5 text-xs font-medium uppercase tracking-[0.22em] text-white/62">
          <Link
            className="transition hover:text-white focus-visible:outline-none focus-visible:text-[#d8b4fe]"
            href="/#catalogo"
          >
            Catálogo
          </Link>
        </nav>
      </div>
    </header>
  );
}
