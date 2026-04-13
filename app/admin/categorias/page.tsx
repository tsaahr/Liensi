import { Plus, Trash2 } from "lucide-react";

import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminShell } from "@/components/admin/admin-shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createCategory,
  deleteCategory,
  moveProductsToCategory,
  updateCategory
} from "@/lib/admin-actions";
import { getAdminCategories, getAdminProducts } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatProductName } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CategoriesAdminPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function CategoriesAdminPage({ searchParams }: CategoriesAdminPageProps) {
  await requireAdmin();
  const resolvedSearchParams = (await searchParams) ?? {};
  const [categories, products] = await Promise.all([getAdminCategories(), getAdminProducts()]);

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Categorias</h1>
        <p className="text-sm text-muted-foreground">
          Organize os filtros exibidos no catálogo público.
        </p>
      </div>

      <AdminNotice success={resolvedSearchParams.success} error={resolvedSearchParams.error} />

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Nova categoria</CardTitle>
            <CardDescription>O slug é opcional e pode ser gerado pelo nome.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCategory} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" placeholder="opcional" />
              </div>
              <SubmitButton type="submit" pendingLabel="Criando...">
                <Plus data-icon="inline-start" />
                Criar categoria
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorias cadastradas</CardTitle>
            <CardDescription>{categories.length} categorias disponíveis.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell colSpan={3}>
                      <form
                        action={updateCategory.bind(null, category.id)}
                        className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto_auto]"
                      >
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`name-${category.id}`}>Nome</Label>
                          <Input
                            id={`name-${category.id}`}
                            name="name"
                            defaultValue={category.name}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`slug-${category.id}`}>Slug</Label>
                          <Input
                            id={`slug-${category.id}`}
                            name="slug"
                            defaultValue={category.slug}
                            required
                          />
                        </div>
                        <SubmitButton type="submit" variant="outline" pendingLabel="Salvando...">
                          Salvar
                        </SubmitButton>
                        <SubmitButton
                          formAction={deleteCategory.bind(null, category.id)}
                          type="submit"
                          variant="destructive"
                          pendingLabel="Excluindo..."
                          confirmMessage={`Excluir a categoria "${category.name}"? Produtos vinculados podem impedir a exclusao.`}
                        >
                          <Trash2 data-icon="inline-start" />
                          Excluir
                        </SubmitButton>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {categories.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma categoria cadastrada ainda.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Colocar produtos em categorias</CardTitle>
          <CardDescription>
            Abra uma categoria, marque produtos de outras categorias e salve para mover tudo junto.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {categories.map((category) => {
            const assignedProducts = products.filter((product) => product.category_id === category.id);
            const movableProducts = products.filter((product) => product.category_id !== category.id);

            return (
              <details key={category.id} className="rounded-lg border bg-background">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {assignedProducts.length} produto
                      {assignedProducts.length === 1 ? "" : "s"} nessa categoria.
                    </p>
                  </div>
                  <Badge variant="secondary">Abrir</Badge>
                </summary>

                <div className="border-t p-4">
                  <div className="mb-4 flex flex-col gap-2">
                    <p className="text-sm font-medium">Ja estao aqui</p>
                    <div className="flex flex-wrap gap-2">
                      {assignedProducts.slice(0, 12).map((product) => (
                        <Badge key={product.id} variant="outline">
                          {formatProductName(product.name)}
                        </Badge>
                      ))}
                      {assignedProducts.length > 12 ? (
                        <Badge variant="secondary">+{assignedProducts.length - 12}</Badge>
                      ) : null}
                      {assignedProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum produto ainda.</p>
                      ) : null}
                    </div>
                  </div>

                  <form
                    action={moveProductsToCategory.bind(null, category.id)}
                    className="flex flex-col gap-4"
                  >
                    <div className="grid gap-2 md:grid-cols-2">
                      {movableProducts.map((product) => (
                        <label
                          key={product.id}
                          className="flex min-h-14 cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition hover:bg-muted"
                        >
                          <input
                            type="checkbox"
                            name="product_ids"
                            value={product.id}
                            className="size-4 accent-primary"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              {formatProductName(product.name)}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              Hoje em {product.category?.name ?? "Sem categoria"}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>

                    {movableProducts.length === 0 ? (
                      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Todos os produtos ja estao nessa categoria.
                      </p>
                    ) : null}

                    <SubmitButton
                      type="submit"
                      variant="outline"
                      pendingLabel="Movendo..."
                      disabled={movableProducts.length === 0}
                      confirmMessage={`Mover os produtos marcados para "${category.name}"?`}
                    >
                      Mover selecionados para {category.name}
                    </SubmitButton>
                  </form>
                </div>
              </details>
            );
          })}

          {categories.length === 0 ? (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Crie uma categoria antes de organizar produtos.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
