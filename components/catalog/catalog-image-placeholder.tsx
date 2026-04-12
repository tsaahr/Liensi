import { cn } from "@/lib/utils";

type CatalogImagePlaceholderProps = {
  className?: string;
  label?: string;
};

export function CatalogImagePlaceholder({
  className,
  label = "Imagem em breve"
}: CatalogImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(192,132,252,0.2),rgba(255,255,255,0.045)_46%,rgba(0,0,0,0)_100%)] px-4 text-center",
        className
      )}
    >
      <span className="font-display text-4xl tracking-[0.28em] text-white/40 sm:text-5xl">
        LIENSI
      </span>
      <span className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/34">
        {label}
      </span>
    </div>
  );
}
