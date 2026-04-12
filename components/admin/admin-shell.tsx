import Link from "next/link";
import {
  BarChart3,
  ExternalLink,
  Images,
  LayoutDashboard,
  Package,
  Tags,
  Upload
} from "lucide-react";

import { logout } from "@/app/admin/login/actions";
import { Button } from "@/components/ui/button";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <Link href="/admin/produtos" className="font-display text-2xl tracking-[0.22em]">
            LIENSI
          </Link>
          <nav className="flex w-full items-center gap-2 overflow-x-auto pb-1 md:w-auto md:overflow-visible md:pb-0">
            <Button variant="ghost" asChild>
              <Link href="/admin">
                <LayoutDashboard data-icon="inline-start" />
                Painel
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink data-icon="inline-start" />
                Catalogo
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/admin/produtos">
                <Package data-icon="inline-start" />
                Produtos
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/admin/categorias">
                <Tags data-icon="inline-start" />
                Categorias
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/admin/banners">
                <Images data-icon="inline-start" />
                Banners
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/admin/analytics">
                <BarChart3 data-icon="inline-start" />
                Analytics
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/admin/produtos/importar">
                <Upload data-icon="inline-start" />
                Importar
              </Link>
            </Button>
            <form action={logout}>
              <Button variant="outline" type="submit">
                Sair
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
    </main>
  );
}
