import Link from "next/link";
import { AlertTriangle, CircleDollarSign, Package, Percent, TrendingUp } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminProducts } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { getProductStock } from "@/lib/product-stock";
import { getProductPricing } from "@/lib/pricing";
import { formatCurrency, formatProductName } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export default async function FinancesAdminPage() {
  await requireAdmin();
  const products = await getAdminProducts();
  const activeProducts = products.filter((product) => product.active);
  const inactiveProducts = products.filter((product) => !product.active);
  const rows = products.map((product) => {
    const pricing = getProductPricing(product);
    const stock = getProductStock(product);
    const potentialRevenue = product.active ? stock * pricing.currentPrice : 0;
    const originalPotentialRevenue = product.active ? stock * pricing.originalPrice : 0;

    return {
      product,
      pricing,
      stock,
      potentialRevenue,
      discountImpact: Math.max(0, originalPotentialRevenue - potentialRevenue)
    };
  });
  const activeRows = rows.filter((row) => row.product.active);
  const totalUnits = activeRows.reduce((total, row) => total + row.stock, 0);
  const totalPotentialRevenue = activeRows.reduce(
    (total, row) => total + row.potentialRevenue,
    0
  );
  const totalDiscountImpact = activeRows.reduce((total, row) => total + row.discountImpact, 0);
  const averageUnitValue = totalUnits > 0 ? totalPotentialRevenue / totalUnits : 0;
  const outOfStockRows = activeRows.filter((row) => row.stock <= 0);
  const promotionalRows = activeRows.filter((row) => row.pricing.hasPromotion);
  const topRows = activeRows
    .filter((row) => row.stock > 0)
    .sort((a, b) => b.potentialRevenue - a.potentialRevenue)
    .slice(0, 10);

  const categoryRows = Array.from(
    activeRows.reduce(
      (groups, row) => {
        const categoryName = row.product.category?.name ?? "Sem categoria";
        const current =
          groups.get(categoryName) ??
          {
            name: categoryName,
            products: 0,
            units: 0,
            potentialRevenue: 0
          };

        current.products += 1;
        current.units += row.stock;
        current.potentialRevenue += row.potentialRevenue;
        groups.set(categoryName, current);

        return groups;
      },
      new Map<
        string,
        {
          name: string;
          products: number;
          units: number;
          potentialRevenue: number;
        }
      >()
    ).values()
  ).sort((a, b) => b.potentialRevenue - a.potentialRevenue);

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Financas</h1>
          <p className="text-sm text-muted-foreground">
            Leitura rapida do valor bruto potencial do estoque publicado.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/produtos">Revisar produtos</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium">Produtos cadastrados</CardTitle>
            <Package data-icon="inline-start" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatNumber(products.length)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeProducts.length} ativo{activeProducts.length === 1 ? "" : "s"} e{" "}
              {inactiveProducts.length} inativo{inactiveProducts.length === 1 ? "" : "s"}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium">Unidades em estoque</CardTitle>
            <TrendingUp data-icon="inline-start" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatNumber(totalUnits)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Soma produtos ativos, usando variantes quando existem.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium">Se vender tudo</CardTitle>
            <CircleDollarSign data-icon="inline-start" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatCurrency(totalPotentialRevenue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Valor bruto pelo preco atual, sem frete, custo ou taxa.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium">Media por unidade</CardTitle>
            <Percent data-icon="inline-start" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatCurrency(averageUnitValue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Valor medio do estoque ativo.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium">Atencao</CardTitle>
            <AlertTriangle data-icon="inline-start" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatNumber(outOfStockRows.length)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Esgotados ativos. {promotionalRows.length} em promocao.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Maior valor parado em estoque</CardTitle>
            <CardDescription>
              Produtos que mais pesam no valor potencial, ordenados pelo total em estoque.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Preco atual</TableHead>
                  <TableHead className="text-right">Potencial</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topRows.map((row) => (
                  <TableRow key={row.product.id}>
                    <TableCell>
                      <div className="font-medium">{formatProductName(row.product.name)}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.product.category?.name ?? "Sem categoria"}
                      </div>
                    </TableCell>
                    <TableCell>{formatNumber(row.stock)}</TableCell>
                    <TableCell>
                      <div>{formatCurrency(row.pricing.currentPrice)}</div>
                      {row.pricing.hasPromotion ? (
                        <Badge variant="secondary">
                          {row.pricing.discountPercentage ?? 0}% desconto
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(row.potentialRevenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {topRows.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Ainda nao ha estoque ativo para calcular.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo por categoria</CardTitle>
              <CardDescription>Ajuda a ver onde esta concentrado o valor do estoque.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {categoryRows.map((category) => (
                <div key={category.name} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="secondary">{formatCurrency(category.potentialRevenue)}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {category.products} produto{category.products === 1 ? "" : "s"} ·{" "}
                    {formatNumber(category.units)} unidade{category.units === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
              {categoryRows.length === 0 ? (
                <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Cadastre produtos ativos para ver o resumo por categoria.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leitura correta</CardTitle>
              <CardDescription>O que este numero inclui e o que nao inclui.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                Esta tela soma estoque ativo vezes preco atual. Se houver promocao, usa o preco
                promocional.
              </p>
              <p>
                Ela nao calcula lucro, margem, custo de compra, taxa, frete ou venda confirmada.
              </p>
              {totalDiscountImpact > 0 ? (
                <p className="font-medium text-foreground">
                  Desconto potencial ativo: {formatCurrency(totalDiscountImpact)}.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
