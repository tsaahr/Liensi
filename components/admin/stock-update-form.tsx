"use client";

import { updateProductStock } from "@/lib/admin-actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { Input } from "@/components/ui/input";

type StockUpdateFormProps = {
  productId: string;
  stock: number;
};

export function StockUpdateForm({ productId, stock }: StockUpdateFormProps) {
  const action = updateProductStock.bind(null, productId);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <Input
        name="stock"
        type="number"
        min={0}
        defaultValue={stock}
        className="w-24"
        aria-label="Estoque"
      />
      <Input
        name="note"
        placeholder="nota"
        className="w-28"
        aria-label="Nota do ajuste de estoque"
      />
      <SubmitButton type="submit" size="sm" variant="outline" pendingLabel="Salvando...">
        Salvar
      </SubmitButton>
    </form>
  );
}
