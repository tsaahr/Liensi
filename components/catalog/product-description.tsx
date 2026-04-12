"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type ProductDescriptionProps = {
  description: string | null;
};

const fallbackDescription =
  "Informações adicionais podem ser confirmadas diretamente no atendimento.";

export function ProductDescription({ description }: ProductDescriptionProps) {
  const text = description?.trim() || fallbackDescription;
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  const measureOverflow = useCallback(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    setCanExpand(content.scrollHeight > content.clientHeight + 2);
  }, []);

  useEffect(() => {
    const content = contentRef.current;

    if (!content || expanded) {
      return;
    }

    measureOverflow();

    const observer = new ResizeObserver(measureOverflow);
    observer.observe(content);

    return () => observer.disconnect();
  }, [expanded, measureOverflow, text]);

  return (
    <div className="w-full max-w-2xl border-y border-white/10 py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/42">
        Detalhes
      </p>
      <div className="relative">
        <p
          ref={contentRef}
          className={cn(
            "mt-4 whitespace-pre-line text-base leading-8 text-white/66 transition-[max-height] duration-300",
            !expanded && "max-h-56 overflow-hidden"
          )}
        >
          {text}
        </p>
        {canExpand && !expanded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/88 to-transparent" />
        ) : null}
      </div>
      {canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#c084fc] transition hover:text-[#d8b4fe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c084fc]/45"
          aria-expanded={expanded}
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      ) : null}
    </div>
  );
}
