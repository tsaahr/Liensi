"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductVariant } from "@/lib/types";

type VariantDraft = {
  key: string;
  id: string;
  name: string;
  sku: string;
  stock: string;
  active: boolean;
  deleted: boolean;
};

type ProductVariantsEditorProps = {
  variants: ProductVariant[];
};

function newVariantKey() {
  return `new-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyVariant(): VariantDraft {
  return {
    key: newVariantKey(),
    id: "",
    name: "",
    sku: "",
    stock: "0",
    active: true,
    deleted: false
  };
}

function HiddenVariantFields({
  row,
  order
}: {
  row: VariantDraft;
  order: number;
}) {
  return (
    <>
      <input type="hidden" name="variant_keys" value={row.key} />
      <input type="hidden" name={`variant_id_${row.key}`} value={row.id} />
      <input type="hidden" name={`variant_order_${row.key}`} value={order} />
      {row.deleted ? <input type="hidden" name={`variant_delete_${row.key}`} value="on" /> : null}
    </>
  );
}

export function ProductVariantsEditor({ variants }: ProductVariantsEditorProps) {
  const [rows, setRows] = useState<VariantDraft[]>(() =>
    [...variants]
      .sort((a, b) => a.display_order - b.display_order)
      .map((variant) => ({
        key: variant.id,
        id: variant.id,
        name: variant.name,
        sku: variant.sku ?? "",
        stock: String(variant.stock),
        active: variant.active,
        deleted: false
      }))
  );
  const visibleRows = rows.filter((row) => !row.deleted);
  const visibleOrder = useMemo(
    () => new Map(visibleRows.map((row, index) => [row.key, index])),
    [visibleRows]
  );
  const activeRows = visibleRows.filter((row) => row.active);
  const totalStock = activeRows.reduce((total, row) => {
    const stock = Number(row.stock);
    return total + (Number.isFinite(stock) && stock > 0 ? stock : 0);
  }, 0);

  function updateVariant(key: string, patch: Partial<VariantDraft>) {
    setRows((currentRows) =>
      currentRows.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  function addVariant() {
    setRows((currentRows) => [...currentRows, createEmptyVariant()]);
  }

  function removeVariant(key: string) {
    setRows((currentRows) =>
      currentRows.flatMap((row) => {
        if (row.key !== key) {
          return [row];
        }

        return row.id ? [{ ...row, deleted: true }] : [];
      })
    );
  }

  function moveVariant(key: string, direction: -1 | 1) {
    const currentVisibleIndex = visibleRows.findIndex((row) => row.key === key);
    const targetRow = visibleRows[currentVisibleIndex + direction];

    if (!targetRow) {
      return;
    }

    setRows((currentRows) => {
      const nextRows = [...currentRows];
      const from = nextRows.findIndex((row) => row.key === key);
      const to = nextRows.findIndex((row) => row.key === targetRow.key);

      if (from < 0 || to < 0) {
        return currentRows;
      }

      [nextRows[from], nextRows[to]] = [nextRows[to], nextRows[from]];
      return nextRows;
    });
  }

  return (
    <section className="rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Variantes e estoque</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use para tamanho, modelo, fragrancia ou outra opcao. Com variantes ativas, o estoque do
            catalogo vira a soma delas; sem variantes ativas, vale o estoque geral.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={addVariant}>
          Adicionar variante
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>{visibleRows.length} variante{visibleRows.length === 1 ? "" : "s"}</span>
        <span>{activeRows.length} ativa{activeRows.length === 1 ? "" : "s"}</span>
        <span>{totalStock} unidades nas variantes ativas</span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {rows.map((row) => {
          const order = visibleOrder.get(row.key) ?? 0;

          if (row.deleted) {
            return (
              <div key={row.key} hidden>
                <HiddenVariantFields row={row} order={order} />
                <input type="hidden" name={`variant_name_${row.key}`} value={row.name} />
                <input type="hidden" name={`variant_sku_${row.key}`} value={row.sku} />
                <input type="hidden" name={`variant_stock_${row.key}`} value={row.stock} />
              </div>
            );
          }

          const visibleIndex = visibleRows.findIndex((visibleRow) => visibleRow.key === row.key);

          return (
            <div key={row.key} className="rounded-md border bg-background p-3">
              <HiddenVariantFields row={row} order={order} />
              {row.active ? (
                <input type="hidden" name={`variant_active_${row.key}`} value="on" />
              ) : null}
              <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_116px]">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`variant_name_${row.key}`}>Nome da variante</Label>
                  <Input
                    id={`variant_name_${row.key}`}
                    name={`variant_name_${row.key}`}
                    value={row.name}
                    onChange={(event) => updateVariant(row.key, { name: event.target.value })}
                    placeholder="P, M, 110V, 220V..."
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`variant_sku_${row.key}`}>SKU opcional</Label>
                  <Input
                    id={`variant_sku_${row.key}`}
                    name={`variant_sku_${row.key}`}
                    value={row.sku}
                    onChange={(event) => updateVariant(row.key, { sku: event.target.value })}
                    placeholder="codigo da variacao"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`variant_stock_${row.key}`}>Estoque</Label>
                  <Input
                    id={`variant_stock_${row.key}`}
                    name={`variant_stock_${row.key}`}
                    type="number"
                    min={0}
                    value={row.stock}
                    onChange={(event) => updateVariant(row.key, { stock: event.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={row.active}
                    onChange={(event) =>
                      updateVariant(row.key, { active: event.target.checked })
                    }
                    className="size-4"
                  />
                  Variante ativa
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={visibleIndex <= 0}
                    onClick={() => moveVariant(row.key, -1)}
                  >
                    Subir
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={visibleIndex >= visibleRows.length - 1}
                    onClick={() => moveVariant(row.key, 1)}
                  >
                    Descer
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeVariant(row.key)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {visibleRows.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Nenhuma variante cadastrada. O produto continua usando o estoque geral.
        </p>
      ) : null}
    </section>
  );
}
