"use client";

import { useEffect, useRef } from "react";

type AdminMobileMenuToggleProps = {
  menuId: string;
};

export function AdminMobileMenuToggle({ menuId }: AdminMobileMenuToggleProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const menu = document.getElementById(menuId);

    if (!button || !menu) {
      return;
    }

    const toggleMenu = () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isOpen));
      menu.hidden = isOpen;
    };

    button.addEventListener("click", toggleMenu);

    return () => {
      button.removeEventListener("click", toggleMenu);
    };
  }, [menuId]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className="inline-flex size-11 items-center justify-center rounded-md border border-input bg-background text-xl leading-none shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:hidden"
      aria-controls={menuId}
      aria-expanded="false"
      aria-label="Abrir menu"
    >
      <span aria-hidden="true">☰</span>
    </button>
  );
}
