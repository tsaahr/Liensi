"use client";

import { useEffect, useMemo, useState } from "react";

import { ProductImageManager } from "@/components/admin/product-image-manager";
import { ProductVariantsEditor } from "@/components/admin/product-variants-editor";
import { SubmitButton } from "@/components/admin/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveProduct } from "@/lib/admin-actions";
import { getProductMedia } from "@/lib/product-media";
import { getProductStock, productUsesVariants } from "@/lib/product-stock";
import { getProductPricing } from "@/lib/pricing";
import type { Category, Product } from "@/lib/types";
import { formatCurrency, formatProductName, slugify } from "@/lib/utils";

type ProductFormProps = {
  product?: Product | null;
  categories: Category[];
};

export function ProductForm({ product, categories }: ProductFormProps) {
  const [sku, setSku] = useState(product?.sku ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ? String(product.price) : "");
  const [promotionalPrice, setPromotionalPrice] = useState(
    product?.promotional_price ? String(product.promotional_price) : ""
  );
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(product?.low_stock_threshold ?? 3)
  );
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));
  const action = useMemo(() => saveProduct.bind(null, product?.id ?? null), [product?.id]);
  const existingCover = useMemo(
    () => getProductMedia(product?.images ?? []).coverImage,
    [product?.images]
  );
  const pricing = getProductPricing({ price, promotionalPrice });
  const stockNumber = Number(stock);
  const usesSavedVariants = product ? productUsesVariants(product) : false;
  const effectiveStockNumber = product && usesSavedVariants ? getProductStock(product) : stockNumber;
  const thresholdNumber = Number(lowStockThreshold);
  const hasStock = Number.isFinite(effectiveStockNumber) && effectiveStockNumber > 0;
  const isLowStock =
    hasStock &&
    Number.isFinite(thresholdNumber) &&
    thresholdNumber > 0 &&
    effectiveStockNumber <= thresholdNumber;
  const displayName = formatProductName(name || "Nome do produto");
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const previewImage = uploadPreviewUrl ?? existingCover?.url;
  const checklist = [
    { label: "Imagem", complete: Boolean(previewImage) },
    { label: "Descricao", complete: Boolean(description.trim()) },
    { label: "Preco", complete: pricing.originalPrice > 0 },
    { label: "Categoria", complete: Boolean(categoryId) },
    { label: "Estoque", complete: hasStock }
  ];
  const completedChecklistItems = checklist.filter((item) => item.complete).length;

  useEffect(() => {
    return () => {
      if (uploadPreviewUrl) {
        URL.revokeObjectURL(uploadPreviewUrl);
      }
    };
  }, [uploadPreviewUrl]);

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Dados do produto</CardTitle>
          <CardDescription>Nome, preço, descrição, estoque e categoria.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sku">SKU / c&oacute;digo interno</Label>
              <Input
                id="sku"
                name="sku"
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                placeholder="opcional"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setName(nextName);
                  if (!slugTouched) {
                    setSlug(slugify(nextName));
                  }
                }}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(slugify(event.target.value));
                }}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="low_stock_threshold">Aviso de baixo estoque</Label>
              <Input
                id="low_stock_threshold"
                name="low_stock_threshold"
                type="number"
                min={0}
                value={lowStockThreshold}
                onChange={(event) => setLowStockThreshold(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={7}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Preço</Label>
              <Input
                id="price"
                name="price"
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="promotional_price">Preço promocional</Label>
              <Input
                id="promotional_price"
                name="promotional_price"
                inputMode="decimal"
                value={promotionalPrice}
                onChange={(event) => setPromotionalPrice(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="stock">Estoque geral</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min={0}
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Usado quando o produto nao tiver variantes ativas.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="category_id">Categoria</Label>
              <select
                id="category_id"
                name="category_id"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                required
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="" disabled>
                  Selecione uma categoria
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                <input
                  type="checkbox"
                  name="active"
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                  className="size-4"
                />
                Produto ativo
              </label>
            </div>
          </div>

          <ProductVariantsEditor variants={product?.variants ?? []} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pr&eacute;via da vitrine</CardTitle>
            <CardDescription>Veja como o produto deve aparecer antes de salvar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border bg-background">
              <div className="relative aspect-[4/5] bg-muted">
                {previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewImage}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-display text-4xl tracking-[0.28em] text-muted-foreground">
                      LIENSI
                    </span>
                  </div>
                )}
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  {!active ? <Badge variant="secondary">Inativo</Badge> : null}
                  {pricing.hasPromotion ? (
                    <Badge>{pricing.discountPercentage}% OFF</Badge>
                  ) : null}
                  {usesSavedVariants ? <Badge variant="secondary">Variantes</Badge> : null}
                  {!hasStock ? <Badge variant="secondary">Esgotado</Badge> : null}
                  {isLowStock ? <Badge variant="secondary">Baixo estoque</Badge> : null}
                </div>
              </div>
              <div className="flex min-h-32 flex-col justify-between gap-4 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {selectedCategory?.name ?? "Sem categoria"}
                  </p>
                  <h3 className="mt-2 font-display text-3xl font-light leading-none">
                    {displayName}
                  </h3>
                  {sku ? <p className="mt-2 text-xs text-muted-foreground">SKU {sku}</p> : null}
                </div>
                <div className="font-semibold">
                  {pricing.hasPromotion ? (
                    <div>
                      <p className="text-sm text-muted-foreground line-through">
                        {formatCurrency(pricing.originalPrice)}
                      </p>
                      <p>{formatCurrency(pricing.currentPrice)}</p>
                    </div>
                  ) : (
                    <p>{formatCurrency(pricing.originalPrice)}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagens</CardTitle>
            <CardDescription>Envie uma ou mais imagens do produto.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              name="images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => {
                const file = event.target.files?.[0];
                setUploadPreviewUrl(file ? URL.createObjectURL(file) : null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou WebP ate 10 MB. Novas imagens viram WebP e serao adicionadas ao
              final da galeria.
            </p>
          </CardContent>
        </Card>

        {product ? (
          <Card>
            <CardHeader>
              <CardTitle>Galeria</CardTitle>
              <CardDescription>Reordene as imagens e defina a capa.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductImageManager productId={product.id} images={product.images} />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
            <CardDescription>
              {completedChecklistItems} de {checklist.length} pontos prontos para a vitrine.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {checklist.map((item) => (
              <Badge key={item.label} variant={item.complete ? "default" : "secondary"}>
                {item.complete ? "OK" : "Falta"} {item.label}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <SubmitButton type="submit" size="lg" pendingLabel="Salvando produto...">
          Salvar produto
        </SubmitButton>
      </div>
    </form>
  );
}
