import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { importProductsCsv } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type ImportProductsPageProps = {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    categories?: string;
    images?: string;
    defaults?: string;
    notice?: string;
    errors?: string;
    error?: string;
  }>;
};

export default async function ImportProductsPage({ searchParams }: ImportProductsPageProps) {
  await requireAdmin();
  const resolvedSearchParams = (await searchParams) ?? {};

  const hasResult =
    resolvedSearchParams.created ||
    resolvedSearchParams.updated ||
    resolvedSearchParams.categories ||
    resolvedSearchParams.images ||
    resolvedSearchParams.defaults ||
    resolvedSearchParams.notice ||
    resolvedSearchParams.error;

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Importar produtos</h1>
          <p className="text-sm text-muted-foreground">
            Envie um CSV para criar ou atualizar produtos pelo slug.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/produtos">Voltar aos produtos</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Arquivo CSV</CardTitle>
            <CardDescription>
              Use virgula, ponto e virgula ou tab como separador. Produtos com o mesmo slug
              serao atualizados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={importProductsCsv} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="csv">CSV de produtos</Label>
                <Input id="csv" name="csv" type="file" accept=".csv,text/csv" required />
              </div>
              <SubmitButton type="submit" pendingLabel="Importando...">
                Importar CSV
              </SubmitButton>
            </form>

            {hasResult ? (
              <>
                <Separator className="my-6" />
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="font-medium">
                    {resolvedSearchParams.error ? "Importação finalizada com erros" : "Importação concluída"}
                  </p>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <span>Criados: {resolvedSearchParams.created ?? "0"}</span>
                    <span>Atualizados: {resolvedSearchParams.updated ?? "0"}</span>
                    <span>Categorias novas: {resolvedSearchParams.categories ?? "0"}</span>
                    <span>Imagens vinculadas: {resolvedSearchParams.images ?? "0"}</span>
                    <span>Ajustes automaticos: {resolvedSearchParams.defaults ?? "0"}</span>
                  </div>
                  {resolvedSearchParams.notice ? (
                    <p className="mt-4 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
                      {resolvedSearchParams.notice}
                    </p>
                  ) : null}
                  {resolvedSearchParams.error ? (
                    <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {resolvedSearchParams.errors ? `${resolvedSearchParams.errors} erro(s): ` : null}
                      {resolvedSearchParams.error}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formato aceito</CardTitle>
            <CardDescription>
              Baixe o modelo e preencha uma linha por produto.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
            <Button asChild variant="outline">
              <a href="/templates/produtos.csv" download>
                Baixar modelo CSV
              </a>
            </Button>

            <div className="flex flex-col gap-2">
              <p className="font-medium text-foreground">Colunas principais</p>
              <p>
                <code>nome</code>, <code>slug</code>, <code>descricao</code>, <code>preco</code>,{" "}
                <code>preco_promocional</code>, <code>estoque</code>, <code>categoria</code>,{" "}
                <code>ativo</code>
              </p>
              <p>
                CSVs de estoque da Roxflow tambem funcionam com <code>item_name</code>,{" "}
                <code>quantity</code>, <code>cost_price</code> ou <code>cost</code>. Quando
                nao houver categoria, os produtos entram em <code>Geral</code>.
              </p>
              <p>
                A importacao e tolerante: campos ausentes recebem padroes editaveis depois.
                Produto sem preco entra inativo com preco <code>0</code>, evitando aparecer
                no catalogo publico antes da revisao.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-medium text-foreground">Imagens</p>
              <p>
                Use <code>image_paths</code> com caminhos do bucket <code>produtos</code>,
                separados por <code>|</code>. Exemplo:{" "}
                <code>products/id/foto-1.webp|products/id/foto-2.webp</code>.
              </p>
              <p>
                Se <code>image_paths</code> vier preenchido, a galeria cadastrada daquele
                produto será substituída pelos paths do CSV.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
