import { notFound } from "next/navigation";

import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminCategories, getAdminProduct, getProductStockMovements } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatProductName } from "@/lib/utils";

export const dynamic = "force-dynamic";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  await requireAdmin();
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const [categories, product, stockMovements] = await Promise.all([
    getAdminCategories(),
    getAdminProduct(id),
    getProductStockMovements(id)
  ]);

  if (!product) {
    notFound();
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Editar produto</h1>
        <p className="text-sm text-muted-foreground">{formatProductName(product.name)}</p>
      </div>
      <AdminNotice success={resolvedSearchParams.success} error={resolvedSearchParams.error} />
      <ProductForm product={product} categories={categories} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Historico de estoque</CardTitle>
          <CardDescription>Ultimas movimentacoes registradas para este produto.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Movimento</TableHead>
                <TableHead>Variante</TableHead>
                <TableHead>Antes</TableHead>
                <TableHead>Depois</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short"
                    }).format(new Date(movement.created_at))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={movement.quantity_delta < 0 ? "secondary" : "default"}>
                      {movement.quantity_delta > 0 ? "+" : ""}
                      {movement.quantity_delta}
                    </Badge>
                  </TableCell>
                  <TableCell>{movement.variant_name ?? "Estoque geral"}</TableCell>
                  <TableCell>{movement.stock_before}</TableCell>
                  <TableCell>{movement.stock_after}</TableCell>
                  <TableCell>{movement.reason.replace(/_/g, " ")}</TableCell>
                  <TableCell className="max-w-64">
                    <span className="line-clamp-2">
                      {movement.note || movement.created_by_email || "-"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {stockMovements.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma movimentacao registrada ainda.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
