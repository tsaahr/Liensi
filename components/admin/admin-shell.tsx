import Link from "next/link";
import {
  BarChart3,
  CircleDollarSign,
  ExternalLink,
  Images,
  LayoutDashboard,
  Package,
  Settings,
  Tags,
  Upload,
  type LucideIcon
} from "lucide-react";

import { logout } from "@/app/admin/login/actions";
import { AdminMobileMenuToggle } from "@/components/admin/admin-mobile-menu-toggle";
import { Button } from "@/components/ui/button";

type AdminShellProps = {
  children: React.ReactNode;
};

type AdminNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  external?: boolean;
};

const mobileMenuId = "admin-mobile-navigation";

const navItems: AdminNavItem[] = [
  { href: "/admin", label: "Painel", shortLabel: "Painel", icon: LayoutDashboard },
  { href: "/", label: "Catalogo", shortLabel: "Cat.", icon: ExternalLink, external: true },
  { href: "/admin/produtos", label: "Produtos", shortLabel: "Prod.", icon: Package },
  { href: "/admin/categorias", label: "Categorias", shortLabel: "Cats.", icon: Tags },
  { href: "/admin/banners", label: "Banners", shortLabel: "Bann.", icon: Images },
  { href: "/admin/financas", label: "Financas", shortLabel: "Fin.", icon: CircleDollarSign },
  { href: "/admin/analytics", label: "Analytics", shortLabel: "Anal.", icon: BarChart3 },
  { href: "/admin/configuracoes", label: "Config", shortLabel: "Conf.", icon: Settings },
  { href: "/admin/produtos/importar", label: "Importar", shortLabel: "Imp.", icon: Upload }
];

const navLinkClassName =
  "h-10 w-10 gap-1 px-0 text-[13px] min-[900px]:w-auto min-[900px]:px-1.5 lg:h-9 lg:px-1.5 xl:px-2";

function AdminNavButton({ item }: { item: AdminNavItem }) {
  const Icon = item.icon;

  return (
    <Button variant="ghost" asChild className={navLinkClassName}>
      <Link
        href={item.href}
        target={item.external ? "_blank" : undefined}
        rel={item.external ? "noopener noreferrer" : undefined}
        aria-label={item.label}
      >
        <Icon data-icon="inline-start" aria-hidden="true" />
        <span className="hidden min-[900px]:inline lg:hidden">{item.shortLabel}</span>
        <span className="hidden lg:inline">{item.label}</span>
      </Link>
    </Button>
  );
}

function AdminMobileNavButton({ item }: { item: AdminNavItem }) {
  const Icon = item.icon;

  return (
    <Button variant="ghost" asChild className="h-11 w-full justify-start">
      <Link
        href={item.href}
        target={item.external ? "_blank" : undefined}
        rel={item.external ? "noopener noreferrer" : undefined}
      >
        <Icon data-icon="inline-start" aria-hidden="true" />
        {item.label}
      </Link>
    </Button>
  );
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <main className="min-h-screen bg-muted/30">
      <header className="overflow-hidden border-b bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-3">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <Link
              href="/admin/produtos"
              className="shrink-0 font-display text-2xl tracking-[0.22em]"
            >
              LIENSI
            </Link>
            <nav className="hidden min-w-0 flex-1 flex-nowrap items-center justify-end gap-1 overflow-hidden md:flex min-[900px]:gap-1.5 lg:gap-0.5 xl:gap-1.5">
              {navItems.map((item) => (
                <AdminNavButton key={item.href} item={item} />
              ))}
              <form action={logout} className="shrink-0">
                <Button
                  variant="outline"
                  type="submit"
                  className="h-10 px-2 text-[13px] lg:h-9 lg:px-1.5 xl:px-2"
                >
                  Sair
                </Button>
              </form>
            </nav>
            <AdminMobileMenuToggle menuId={mobileMenuId} />
          </div>
          <nav id={mobileMenuId} className="mt-3 md:hidden" hidden>
            <div className="flex flex-col gap-1 rounded-md border bg-background p-2">
              {navItems.map((item) => (
                <AdminMobileNavButton key={item.href} item={item} />
              ))}
              <form action={logout}>
                <Button variant="outline" type="submit" className="h-11 w-full justify-start">
                  Sair
                </Button>
              </form>
            </div>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
    </main>
  );
}
