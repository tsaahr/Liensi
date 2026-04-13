import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Image as ImageIcon,
  Megaphone,
  Package,
  Settings,
  Tags
} from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminBanners, getAdminCategories, getAdminProducts } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { getProductReadiness } from "@/lib/product-readiness";
import { getProductStock } from "@/lib/product-stock";
import { getProductPricing } from "@/lib/pricing";
import { formatProductName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const [products, categories, banners] = await Promise.all([
    getAdminProducts(),
    getAdminCategories(),
    getAdminBanners()
  ]);
  const activeProducts = products.filter((product) => product.active);
  const inactiveProducts = products.filter((product) => !product.active);
  const outOfStockProducts = activeProducts.filter((product) => getProductStock(product) <= 0);
  const lowStockProducts = activeProducts.filter(
    (product) =>
      getProductStock(product) > 0 &&
      product.low_stock_threshold > 0 &&
      getProductStock(product) <= product.low_stock_threshold
  );
  const promotionalProducts = activeProducts.filter((product) =>
    getProductPricing(product).hasPromotion
  );
  const productsWithoutImages = activeProducts.filter((product) => product.images.length === 0);
  const incompleteProducts = activeProducts
    .map((product) => ({
      product,
      readiness: getProductReadiness(product)
    }))
    .filter((item) => !item.readiness.isComplete);
  const activeBanners = banners.filter((banner) => banner.active);
  const attentionItems = Array.from(new Map([
    ...outOfStockProducts.map((product) => ({
      label: formatProductName(product.name),
      detail: "Esgotado",
      href: `/admin/produtos/${product.id}/editar`
    })),
    ...lowStockProducts.map((product) => ({
      label: formatProductName(product.name),
      detail: `${getProductStock(product)} em estoque`,
      href: `/admin/produtos/${product.id}/editar`
    })),
    ...productsWithoutImages.map((product) => ({
      label: formatProductName(product.name),
      detail: "Sem imagem",
      href: `/admin/produtos/${product.id}/editar`
    })),
    ...incompleteProducts.map(({ product, readiness }) => ({
      label: formatProductName(product.name),
      detail: `${readiness.completed}/${readiness.total} pronto`,
      href: `/admin/produtos/${product.id}/editar`
    }))
  ].map((item) => [item.href, item])).values()).slice(0, 6);

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Painel</h1>
          <p className="text-sm text-muted-foreground">
            Um resumo rapido do catalogo e do que precisa de atencao.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/produtos/novo">Novo produto</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium">Produtos ativos</CardTitle>
            <Package data-icon="inline-start" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{activeProducts.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {inactiveProducts.length} inativo{inactiveProducts.length === 1 ? "" : "s"}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium">Esgotados</CardTitle>
            <Boxes data-icon="inline-start" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{outOfStockProducts.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {lowStockProducts.length} com estoque baixo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium">Promocoes</CardTitle>
            <Megaphone data-icon="inline-start" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{promotionalProducts.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Produtos ativos com desconto.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium">Banners ativos</CardTitle>
            <ImageIcon data-icon="inline-start" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{activeBanners.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {banners.length} banner{banners.length === 1 ? "" : "s"} cadastrado
              {banners.length === 1 ? "" : "s"}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium">Incompletos</CardTitle>
            <CheckCircle2 data-icon="inline-start" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{incompleteProducts.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Produtos ativos com cadastro a revisar.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Pontos de atencao</CardTitle>
            <CardDescription>
              Produtos esgotados, com estoque baixo ou sem imagem aparecem aqui primeiro.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {attentionItems.map((item) => (
              <Link
                key={`${item.href}-${item.detail}`}
                href={item.href}
                className="flex items-center justify-between gap-4 rounded-md border p-3 text-sm transition hover:bg-muted"
              >
                <span className="font-medium">{item.label}</span>
                <Badge variant="secondary">{item.detail}</Badge>
              </Link>
            ))}
            {attentionItems.length === 0 ? (
              <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nada urgente por enquanto.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atalhos</CardTitle>
            <CardDescription>Acoes comuns para manter a vitrine viva.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/produtos?stock=incomplete">
                <Package data-icon="inline-start" />
                Revisar incompletos
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/produtos/importar">
                <Boxes data-icon="inline-start" />
                Importar CSV
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/banners">
                <ImageIcon data-icon="inline-start" />
                Editar banners
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/financas">
                <CircleDollarSign data-icon="inline-start" />
                Ver financas
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/categorias">
                <Tags data-icon="inline-start" />
                Organizar categorias
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/configuracoes">
                <Settings data-icon="inline-start" />
                Configurar WhatsApp
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {productsWithoutImages.length > 0 ? (
        <div className="mt-6 rounded-lg border bg-background p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <AlertTriangle data-icon="inline-start" />
            {productsWithoutImages.length} produto{productsWithoutImages.length === 1 ? "" : "s"} ativo
            {productsWithoutImages.length === 1 ? "" : "s"} sem imagem
          </div>
          <p className="mt-1">
            Produtos sem imagem continuam funcionando, mas uma foto boa aumenta muito a confianca
            na vitrine.
          </p>
        </div>
      ) : null}

      <div className="mt-6 rounded-lg border bg-background p-4 text-sm text-muted-foreground">
        <p>
          {categories.length} categoria{categories.length === 1 ? "" : "s"} disponivel
          {categories.length === 1 ? "" : "s"} para organizar filtros do catalogo.
        </p>
      </div>
    </AdminShell>
  );
}
