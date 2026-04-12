import { Plus, Trash2 } from "lucide-react";

import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminShell } from "@/components/admin/admin-shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCategory, deleteCategory, updateCategory } from "@/lib/admin-actions";
import { getAdminCategories } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

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
  const categories = await getAdminCategories();

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
    </AdminShell>
  );
}
