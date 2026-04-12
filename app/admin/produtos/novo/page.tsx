import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminCategories } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getAdminCategories();

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Novo produto</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre os dados principais e envie as imagens iniciais.
        </p>
      </div>
      <ProductForm categories={categories} />
    </AdminShell>
  );
}
