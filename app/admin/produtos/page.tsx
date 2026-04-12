import Link from "next/link";
import { Edit, ExternalLink, Plus, Trash2, Upload } from "lucide-react";

import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminShell } from "@/components/admin/admin-shell";
import { StockUpdateForm } from "@/components/admin/stock-update-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteProduct, toggleProductStatus } from "@/lib/admin-actions";
import { getAdminProducts } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { getProductReadiness } from "@/lib/product-readiness";
import { getActiveVariants, getProductStock, productUsesVariants } from "@/lib/product-stock";
import { getProductPricing } from "@/lib/pricing";
import { formatCurrency, formatProductName } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ProductsAdminPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
    stock?: string;
  }>;
};

export default async function ProductsAdminPage({ searchParams }: ProductsAdminPageProps) {
  await requireAdmin();
  const resolvedSearchParams = (await searchParams) ?? {};
  const products = await getAdminProducts();
  const inventoryFilter = resolvedSearchParams.stock ?? "all";
  const filteredProducts = products.filter((product) => {
    const pricing = getProductPricing(product);
    const totalStock = getProductStock(product);
    const isLowStock =
      product.active &&
      totalStock > 0 &&
      product.low_stock_threshold > 0 &&
      totalStock <= product.low_stock_threshold;

    if (inventoryFilter === "active") {
      return product.active;
    }

    if (inventoryFilter === "inactive") {
      return !product.active;
    }

    if (inventoryFilter === "out") {
      return product.active && getProductStock(product) <= 0;
    }

    if (inventoryFilter === "low") {
      return isLowStock;
    }

    if (inventoryFilter === "promo") {
      return product.active && pricing.hasPromotion;
    }

    if (inventoryFilter === "incomplete") {
      return product.active && !getProductReadiness(product).isComplete;
    }

    return true;
  });
  const filterLinks = [
    { label: "Todos", value: "all" },
    { label: "Ativos", value: "active" },
    { label: "Inativos", value: "inactive" },
    { label: "Esgotados", value: "out" },
    { label: "Baixo estoque", value: "low" },
    { label: "Promocoes", value: "promo" },
    { label: "Incompletos", value: "incomplete" }
  ];

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie catálogo, estoque, status e imagens.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/produtos/importar">
              <Upload data-icon="inline-start" />
              Importar CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/produtos/novo">
              <Plus data-icon="inline-start" />
              Novo produto
            </Link>
          </Button>
        </div>
      </div>

      <AdminNotice success={resolvedSearchParams.success} error={resolvedSearchParams.error} />

      <div className="mb-6 flex flex-wrap gap-2">
        {filterLinks.map((filter) => (
          <Button
            key={filter.value}
            asChild
            size="sm"
            variant={inventoryFilter === filter.value ? "default" : "outline"}
          >
            <Link
              href={
                filter.value === "all"
                  ? "/admin/produtos"
                  : `/admin/produtos?stock=${filter.value}`
              }
            >
              {filter.label}
            </Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo</CardTitle>
          <CardDescription>
            {filteredProducts.length} de {products.length} produtos cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const pricing = getProductPricing(product);
                const isLowStock =
                  product.active &&
                  getProductStock(product) > 0 &&
                  product.low_stock_threshold > 0 &&
                  getProductStock(product) <= product.low_stock_threshold;
                const readiness = getProductReadiness(product);
                const usesVariants = productUsesVariants(product);
                const totalStock = getProductStock(product);
                const activeVariants = getActiveVariants(product.variants);

                return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-medium">{formatProductName(product.name)}</div>
                    <div className="text-xs text-muted-foreground">
                      /{product.slug}
                      {product.sku ? ` · SKU ${product.sku}` : ""}
                    </div>
                    {!readiness.isComplete ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="secondary">{readiness.score}% pronto</Badge>
                        {readiness.missingLabels.slice(0, 2).map((label) => (
                          <Badge key={label} variant="outline">
                            Falta {label}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>{product.category?.name ?? "-"}</TableCell>
                  <TableCell>
                    {pricing.hasPromotion ? (
                      <div>
                        <span className="text-muted-foreground line-through">
                          {formatCurrency(pricing.originalPrice)}
                        </span>
                        <div>{formatCurrency(pricing.currentPrice)}</div>
                      </div>
                    ) : (
                      formatCurrency(pricing.originalPrice)
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {totalStock <= 0 ? <Badge variant="secondary">Esgotado</Badge> : null}
                      {isLowStock ? <Badge variant="secondary">Baixo estoque</Badge> : null}
                      {usesVariants ? <Badge variant="outline">Variantes</Badge> : null}
                    </div>
                    {usesVariants ? (
                      <div className="text-xs text-muted-foreground">
                        {totalStock} no total em {activeVariants.length} variante
                        {activeVariants.length === 1 ? "" : "s"}.
                      </div>
                    ) : (
                      <StockUpdateForm productId={product.id} stock={product.stock} />
                    )}
                  </TableCell>
                  <TableCell>
                    <form action={toggleProductStatus.bind(null, product.id, !product.active)}>
                      <SubmitButton type="submit" size="sm" variant="ghost" pendingLabel="Alterando...">
                        <Badge variant={product.active ? "default" : "secondary"}>
                          {product.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </SubmitButton>
                    </form>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {product.active ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/produto/${product.slug}`} target="_blank">
                            <ExternalLink data-icon="inline-start" />
                            Ver pagina
                          </Link>
                        </Button>
                      ) : null}
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/produtos/${product.id}/editar`}>
                          <Edit data-icon="inline-start" />
                          Editar
                        </Link>
                      </Button>
                      <form action={deleteProduct.bind(null, product.id)}>
                        <SubmitButton
                          type="submit"
                          size="sm"
                          variant="destructive"
                          pendingLabel="Excluindo..."
                          confirmMessage={`Excluir "${formatProductName(product.name)}" definitivamente?`}
                        >
                          <Trash2 data-icon="inline-start" />
                          Excluir
                        </SubmitButton>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredProducts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado para este filtro.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
