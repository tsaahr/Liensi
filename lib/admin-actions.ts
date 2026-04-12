"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { parse } from "csv-parse/sync";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { optimizeImageUpload, type OptimizedImageUpload } from "@/lib/image-processing";
import { getProductPricing } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { formatProductName, slugify, toNumber } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome."),
  slug: z.string().trim().optional()
});

const bannerSchema = z.object({
  title: z.string().trim().max(120, "Titulo muito longo.").optional(),
  eyebrow: z.string().trim().max(80, "Chamada muito longa.").optional(),
  subtitle: z.string().trim().max(240, "Texto muito longo.").optional(),
  button_label: z.string().trim().max(40, "Botao muito longo.").optional(),
  href: z.string().trim().max(500, "Link muito longo.").optional(),
  alt_text: z.string().trim().max(160, "Texto alternativo muito longo.").optional(),
  display_order: z.number().int().min(0, "Ordem invalida."),
  focal_point_x: z.number().int().min(0, "Foco horizontal invalido.").max(100, "Foco horizontal invalido."),
  focal_point_y: z.number().int().min(0, "Foco vertical invalido.").max(100, "Foco vertical invalido."),
  active: z.boolean()
});

const productSchema = z
  .object({
    sku: z.string().trim().max(80, "SKU muito longo.").optional(),
    name: z.string().trim().min(2, "Informe o nome."),
    slug: z.string().trim().optional(),
    description: z.string().trim().optional(),
    category_id: z.string().uuid("Selecione uma categoria."),
    price: z.number().min(0, "Preço inválido."),
    promotional_price: z.number().min(0, "Preço promocional inválido.").nullable(),
    stock: z.number().int().min(0, "Estoque inválido."),
    low_stock_threshold: z.number().int().min(0, "Limite de baixo estoque inválido."),
    active: z.boolean()
  })
  .refine(
    (data) =>
      data.promotional_price === null ||
      getProductPricing({
        price: data.price,
        promotionalPrice: data.promotional_price
      }).hasPromotion,
    "O preço promocional deve ser menor que o preço original."
);

const productVariantSchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().trim().min(1, "Informe o nome da variante.").max(120, "Nome muito longo."),
  sku: z.string().trim().max(80, "SKU da variante muito longo.").nullable(),
  color_hex: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor invalida. Use #RRGGBB.")
    .nullable(),
  stock: z.number().int().min(0, "Estoque da variante invalido."),
  display_order: z.number().int().min(0, "Ordem da variante invalida."),
  active: z.boolean(),
  deleted: z.boolean()
});

type CsvRecord = Record<string, string | undefined>;

type CsvStockMode = "replace" | "add";

type ProductVariantPayload = z.infer<typeof productVariantSchema>;

type ProductImportPayload = {
  sku: string | null;
  name: string;
  slug: string;
  description: string | null;
  category_id: string;
  price: number;
  promotional_price: number | null;
  stock: number;
  low_stock_threshold: number;
  active: boolean;
};

const DEFAULT_CATEGORY_NAME = "Geral";
const DEFAULT_PRICE = 0;
const DEFAULT_STOCK = 0;
const DEFAULT_LOW_STOCK_THRESHOLD = 3;

function adminRedirect(path: string, type: "success" | "error", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

function getCsvStockMode(formData: FormData): CsvStockMode {
  return formData.get("stock_mode") === "add" ? "add" : "replace";
}

const headerAliases = {
  name: [
    "nome",
    "name",
    "produto",
    "product",
    "titulo",
    "title",
    "item_name",
    "item",
    "nome_item",
    "produto_estoque"
  ],
  sku: ["sku", "codigo", "cod", "code", "referencia", "ref"],
  externalId: ["id", "inventory_id", "external_id", "codigo_externo"],
  inventoryName: ["item_name", "item", "nome_item", "produto_estoque"],
  slug: ["slug", "url"],
  description: ["descricao", "descrição", "description", "desc"],
  price: ["preco", "preço", "price", "valor", "cost_price", "cost", "custo"],
  promotionalPrice: [
    "preco_promocional",
    "preço_promocional",
    "promotional_price",
    "preco_promocao",
    "preço_promoção",
    "promo"
  ],
  stock: ["estoque", "stock", "quantidade", "qty", "quantity"],
  lowStockThreshold: [
    "estoque_minimo",
    "limite_estoque",
    "low_stock_threshold",
    "minimum_stock",
    "min_stock"
  ],
  category: ["categoria", "category"],
  categorySlug: ["categoria_slug", "category_slug", "slug_categoria"],
  active: ["ativo", "active", "status"],
  imagePaths: ["image_paths", "imagens", "imagens_paths", "image_path", "storage_paths"],
  coverImagePath: ["cover_image_path", "imagem_capa", "capa", "cover"]
};

const importHeaderAliases = {
  name: [...headerAliases.name, ...headerAliases.inventoryName],
  sku: headerAliases.sku,
  externalId: headerAliases.externalId,
  slug: headerAliases.slug,
  description: [
    ...headerAliases.description,
    "detalhes",
    "details",
    "observacao",
    "observacoes",
    "obs"
  ],
  price: [
    ...headerAliases.price,
    "preco_venda",
    "preco_de_venda",
    "valor_venda",
    "sale_price",
    "selling_price",
    "retail_price",
    "unit_price"
  ],
  promotionalPrice: [
    ...headerAliases.promotionalPrice,
    "discount_price",
    "preco_desconto",
    "price_discount"
  ],
  stock: [...headerAliases.stock, "qtd", "qte", "saldo", "inventory_quantity"],
  lowStockThreshold: headerAliases.lowStockThreshold,
  category: [
    ...headerAliases.category,
    "tipo",
    "grupo",
    "departamento",
    "department",
    "colecao",
    "collection",
    "familia",
    "family",
    "linha",
    "subcategoria",
    "subcategory"
  ],
  categorySlug: headerAliases.categorySlug,
  active: [...headerAliases.active, "publicado", "published", "visivel", "visible"],
  imagePaths: [
    ...headerAliases.imagePaths,
    "image_url",
    "image_urls",
    "images",
    "foto",
    "foto_url",
    "fotos",
    "url_imagem"
  ],
  coverImagePath: [...headerAliases.coverImagePath, "cover_url", "foto_capa", "url_capa"]
};

function normalizeHeader(value: string) {
  return slugify(value).replace(/-/g, "_");
}

function normalizeRecord(record: Record<string, string | undefined>): CsvRecord {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [normalizeHeader(key), value?.trim()])
  );
}

function getCsvValue(record: CsvRecord, aliases: string[]) {
  for (const alias of aliases) {
    const value = record[normalizeHeader(alias)];
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function formatDefaultValue(value: number | null) {
  return value === null ? "vazio" : String(value);
}

function parseCsvNumber(value: string, fieldName: string, rowNumber: number, fallback: number | null) {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      value: fallback,
      defaulted: true,
      message: `Linha ${rowNumber}: ${fieldName} ausente; usado ${formatDefaultValue(fallback)}.`
    };
  }

  const numeric = trimmed.replace(/[^\d,.-]/g, "");
  if (!/\d/.test(numeric)) {
    return {
      value: fallback,
      defaulted: true,
      message: `Linha ${rowNumber}: ${fieldName} invalido; usado ${formatDefaultValue(fallback)}.`
    };
  }
  const lastComma = numeric.lastIndexOf(",");
  const lastDot = numeric.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : ".";
  const normalized =
    decimalSeparator === ","
      ? numeric.replace(/\./g, "").replace(",", ".")
      : numeric.replace(/,/g, "");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return {
      value: fallback,
      defaulted: true,
      message: `Linha ${rowNumber}: ${fieldName} invalido; usado ${formatDefaultValue(fallback)}.`
    };
  }

  return { value: parsed, defaulted: false, message: "" };
}

function parseCsvInteger(
  value: string,
  fieldName: string,
  rowNumber: number,
  fallback = DEFAULT_STOCK
) {
  const parsed = parseCsvNumber(value, fieldName, rowNumber, fallback);
  const numericValue = parsed.value ?? fallback;
  const integer = Math.floor(numericValue);

  if (integer !== numericValue) {
    const safeInteger = Number.isFinite(integer) ? integer : fallback;

    return {
      value: safeInteger,
      defaulted: true,
      message: `Linha ${rowNumber}: ${fieldName} decimal; arredondado para ${safeInteger}.`
    };
  }

  return {
    value: integer,
    defaulted: parsed.defaulted,
    message: parsed.message
  };
}

function parseCsvBoolean(value: string) {
  const normalized = normalizeHeader(value);

  if (!normalized) {
    return true;
  }

  if (["1", "sim", "true", "ativo", "active", "yes", "y"].includes(normalized)) {
    return true;
  }

  if (["0", "nao", "não", "false", "inativo", "inactive", "no", "n"].includes(normalized)) {
    return false;
  }

  return true;
}

function cleanStoragePath(value: string) {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");

  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    const publicMarker = "/storage/v1/object/public/produtos/";
    const objectMarker = "/storage/v1/object/produtos/";
    const marker = url.pathname.includes(publicMarker) ? publicMarker : objectMarker;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex >= 0) {
      return decodeURIComponent(url.pathname.slice(markerIndex + marker.length)).replace(/^\/+/, "");
    }
  } catch {
    // Plain storage paths are expected most of the time.
  }

  return trimmed.replace(/^\/+/, "").replace(/^produtos\//, "");
}

function splitImagePaths(value: string) {
  return value
    .split(/[|\n;]+/)
    .map(cleanStoragePath)
    .filter(Boolean);
}

function getCsvPayload(record: CsvRecord, categoryId: string, rowNumber: number) {
  const defaults: string[] = [];
  const sku = getCsvValue(record, importHeaderAliases.sku);
  const externalId = getCsvValue(record, importHeaderAliases.externalId);
  const rawName = getCsvValue(record, importHeaderAliases.name);
  const name = formatProductName(
    rawName || (sku ? `Produto ${sku}` : externalId ? `Produto ${externalId}` : "")
  );
  const rawSlug = getCsvValue(record, importHeaderAliases.slug);
  const description = getCsvValue(record, importHeaderAliases.description);
  const rawPrice = getCsvValue(record, importHeaderAliases.price);
  const rawPromotionalPrice = getCsvValue(record, importHeaderAliases.promotionalPrice);
  const rawStock = getCsvValue(record, importHeaderAliases.stock);
  const rawLowStockThreshold = getCsvValue(record, importHeaderAliases.lowStockThreshold);
  const price = parseCsvNumber(rawPrice, "preco", rowNumber, DEFAULT_PRICE);
  const promotionalPrice = parseCsvNumber(
    rawPromotionalPrice,
    "preco promocional",
    rowNumber,
    null
  );
  const stock = parseCsvInteger(rawStock, "estoque", rowNumber);
  const lowStockThreshold = parseCsvInteger(
    rawLowStockThreshold,
    "estoque minimo",
    rowNumber,
    DEFAULT_LOW_STOCK_THRESHOLD
  );

  if (!name) {
    throw new Error(`Linha ${rowNumber}: nome ausente. Adicione nome, item_name, sku ou id.`);
  }

  if (!rawName) {
    defaults.push(`Linha ${rowNumber}: nome gerado automaticamente.`);
  }

  if (price.defaulted && price.message) {
    defaults.push(price.message);
  }

  if (stock.defaulted && stock.message) {
    defaults.push(stock.message);
  }

  if (lowStockThreshold.defaulted && rawLowStockThreshold && lowStockThreshold.message) {
    defaults.push(lowStockThreshold.message);
  }

  if (promotionalPrice.defaulted && rawPromotionalPrice && promotionalPrice.message) {
    defaults.push(promotionalPrice.message);
  }

  const pricing = getProductPricing({
    price: price.value ?? DEFAULT_PRICE,
    promotionalPrice: promotionalPrice.value
  });

  if (promotionalPrice.value !== null && !pricing.hasPromotion) {
    defaults.push(`Linha ${rowNumber}: preco promocional ignorado por nao ser menor que o preco.`);
  }

  const rawActive = getCsvValue(record, importHeaderAliases.active);
  const active = rawActive ? parseCsvBoolean(rawActive) : Boolean(rawPrice && !price.defaulted);

  if (!rawActive && (!rawPrice || price.defaulted)) {
    defaults.push(`Linha ${rowNumber}: produto entrou inativo ate receber preco de venda.`);
  }

  const payload: ProductImportPayload = {
    sku: sku || externalId || null,
    name,
    slug: rawSlug ? slugify(rawSlug) : slugify(sku || externalId ? `${name}-${sku || externalId}` : name),
    description: description || null,
    category_id: categoryId,
    price: pricing.originalPrice,
    promotional_price: pricing.promotionalPrice,
    stock: stock.value,
    low_stock_threshold: rawLowStockThreshold
      ? lowStockThreshold.value
      : DEFAULT_LOW_STOCK_THRESHOLD,
    active
  };

  return { payload, defaults };
}

async function getOrCreateCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
  rawSlug: string,
  rowNumber: number
) {
  const missingCategory = !name.trim() && !rawSlug.trim();
  const categoryName = name.trim() || rawSlug.trim() || DEFAULT_CATEGORY_NAME;
  const categorySlug = rawSlug.trim() ? slugify(rawSlug) : slugify(categoryName);

  const { data: existing, error: selectError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Linha ${rowNumber}: erro ao buscar categoria (${selectError.message}).`);
  }

  if (existing?.id) {
    return { id: existing.id as string, created: false, defaulted: missingCategory, name: categoryName };
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: categoryName,
      slug: categorySlug
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Linha ${rowNumber}: erro ao criar categoria (${error.message}).`);
  }

  return { id: data.id as string, created: true, defaulted: missingCategory, name: categoryName };
}

async function replaceProductImagesFromCsv(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  productName: string,
  imagePaths: string[],
  coverImagePath: string
) {
  if (imagePaths.length === 0) {
    return 0;
  }

  const coverPath = cleanStoragePath(coverImagePath);
  await supabase.from("product_images").delete().eq("product_id", productId);

  const rows = imagePaths.map((storagePath, displayOrder) => ({
    product_id: productId,
    storage_path: storagePath,
    alt_text: productName,
    display_order: displayOrder,
    is_cover: coverPath ? storagePath === coverPath : displayOrder === 0
  }));

  if (!rows.some((row) => row.is_cover)) {
    rows[0].is_cover = true;
  }

  const { error } = await supabase.from("product_images").insert(rows);

  if (error) {
    throw new Error(`erro ao importar imagens (${error.message}).`);
  }

  return rows.length;
}

function refreshCatalog(paths: string[] = []) {
  revalidateTag("catalog", "max");
  revalidateTag("products", "max");
  revalidateTag("categories", "max");
  revalidateTag("banners", "max");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/banners");

  for (const path of paths) {
    revalidatePath(path);
  }
}

function normalizeOptionalText(value: string | undefined) {
  return value?.trim() || null;
}

function normalizeBannerHref(value: string | undefined) {
  const href = normalizeOptionalText(value);

  if (!href) {
    return null;
  }

  if (href.startsWith("/") || /^https?:\/\//i.test(href)) {
    return href;
  }

  return `https://${href}`;
}

function getBannerPayload(formData: FormData) {
  const displayOrder = Number(formData.get("display_order") ?? 0);
  const focalPointX = Number(formData.get("focal_point_x") ?? 50);
  const focalPointY = Number(formData.get("focal_point_y") ?? 50);
  const parsed = bannerSchema.parse({
    title: formData.get("title"),
    eyebrow: formData.get("eyebrow"),
    subtitle: formData.get("subtitle"),
    button_label: formData.get("button_label"),
    href: formData.get("href"),
    alt_text: formData.get("alt_text"),
    display_order: Number.isFinite(displayOrder) ? displayOrder : -1,
    focal_point_x: Number.isFinite(focalPointX) ? focalPointX : -1,
    focal_point_y: Number.isFinite(focalPointY) ? focalPointY : -1,
    active: formData.get("active") === "on"
  });

  return {
    title: parsed.title ?? "",
    eyebrow: normalizeOptionalText(parsed.eyebrow),
    subtitle: normalizeOptionalText(parsed.subtitle),
    button_label: normalizeOptionalText(parsed.button_label),
    href: normalizeBannerHref(parsed.href),
    alt_text: normalizeOptionalText(parsed.alt_text || parsed.title),
    display_order: parsed.display_order,
    focal_point_x: parsed.focal_point_x,
    focal_point_y: parsed.focal_point_y,
    active: parsed.active
  };
}

function getFile(formData: FormData, fieldName: string) {
  const file = formData.get(fieldName);

  if (file instanceof File && file.size > 0) {
    return file;
  }

  return null;
}

async function uploadOptimizedImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string,
  image: OptimizedImageUpload
) {
  const { error } = await supabase.storage.from("produtos").upload(path, image.buffer, {
    cacheControl: "3600",
    contentType: image.contentType,
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function removeStoragePaths(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: Array<string | null | undefined>
) {
  const safePaths = paths.filter(Boolean) as string[];

  if (safePaths.length > 0) {
    await supabase.storage.from("produtos").remove(safePaths);
  }
}

async function uploadBannerImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File,
  target: "desktop" | "mobile"
) {
  const optimized = await optimizeImageUpload(
    file,
    target === "desktop" ? "bannerDesktop" : "bannerMobile"
  );
  const path = `banners/${target}-${crypto.randomUUID()}.${optimized.extension}`;
  await uploadOptimizedImage(supabase, path, optimized);
  return path;
}

async function recordStockMovement(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    productId: string;
    variantId?: string | null;
    variantName?: string | null;
    stockBefore: number;
    stockAfter: number;
    reason: string;
    note?: string | null;
    admin: { id: string; email?: string | null };
  }
) {
  if (input.stockBefore === input.stockAfter && input.reason !== "initial_stock") {
    return;
  }

  const { error } = await supabase.from("stock_movements").insert({
    product_id: input.productId,
    variant_id: input.variantId ?? null,
    variant_name: normalizeOptionalText(input.variantName ?? undefined),
    quantity_delta: input.stockAfter - input.stockBefore,
    stock_before: input.stockBefore,
    stock_after: input.stockAfter,
    reason: input.reason,
    note: normalizeOptionalText(input.note ?? undefined),
    created_by: input.admin.id,
    created_by_email: input.admin.email ?? null
  });

  if (error) {
    throw new Error(`Nao foi possivel registrar o historico de estoque: ${error.message}`);
  }
}

function getProductPayload(formData: FormData) {
  const price = toNumber(formData.get("price"));
  const promotionalPrice = toNumber(formData.get("promotional_price"));
  const stock = Number(formData.get("stock") ?? 0);
  const lowStockThreshold = Number(formData.get("low_stock_threshold") ?? DEFAULT_LOW_STOCK_THRESHOLD);

  const parsed = productSchema.parse({
    sku: formData.get("sku") ?? undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    category_id: formData.get("category_id"),
    price: price ?? -1,
    promotional_price: promotionalPrice,
    stock,
    low_stock_threshold: Number.isFinite(lowStockThreshold) ? lowStockThreshold : -1,
    active: formData.get("active") === "on"
  });
  const name = formatProductName(parsed.name);

  return {
    sku: normalizeOptionalText(parsed.sku),
    name,
    slug: parsed.slug ? slugify(parsed.slug) : slugify(name),
    description: parsed.description || null,
    category_id: parsed.category_id,
    price: parsed.price,
    promotional_price: parsed.promotional_price,
    stock: parsed.stock,
    low_stock_threshold: parsed.low_stock_threshold,
    active: parsed.active
  };
}

function normalizeVariantColor(value: string) {
  const color = normalizeOptionalText(value);

  if (!color) {
    return null;
  }

  return color.startsWith("#") ? color : `#${color}`;
}

function getProductVariantPayloads(formData: FormData) {
  return formData.getAll("variant_keys").flatMap((entry, index) => {
    const key = String(entry);
    const id = normalizeOptionalText(String(formData.get(`variant_id_${key}`) ?? ""));
    const deleted = formData.get(`variant_delete_${key}`) === "on";
    const name = String(formData.get(`variant_name_${key}`) ?? "").trim();

    if (!deleted && !name) {
      return [];
    }

    if (deleted && !id) {
      return [];
    }

    const stock = Number(formData.get(`variant_stock_${key}`) ?? 0);
    const displayOrder = Number(formData.get(`variant_order_${key}`) ?? index);

    return [
      productVariantSchema.parse({
        id,
        name: name || "Variante removida",
        sku: normalizeOptionalText(String(formData.get(`variant_sku_${key}`) ?? "")),
        color_hex: normalizeVariantColor(String(formData.get(`variant_color_hex_${key}`) ?? "")),
        stock: Number.isFinite(stock) ? stock : -1,
        display_order: Number.isInteger(displayOrder) ? displayOrder : index,
        active: formData.get(`variant_active_${key}`) === "on",
        deleted
      })
    ];
  });
}

async function syncProductVariants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  variants: ProductVariantPayload[],
  admin: { id: string; email?: string | null }
) {
  if (variants.length === 0) {
    return;
  }

  const { data: currentVariants, error: currentError } = await supabase
    .from("product_variants")
    .select("id,name,stock")
    .eq("product_id", productId);

  if (currentError) {
    throw new Error(`Nao foi possivel buscar variantes: ${currentError.message}`);
  }

  const currentById = new Map(
    (currentVariants ?? []).map((variant) => [
      String(variant.id),
      {
        id: String(variant.id),
        name: String(variant.name),
        stock: Number(variant.stock ?? 0)
      }
    ])
  );

  for (const variant of variants) {
    if (variant.deleted && variant.id) {
      const current = currentById.get(variant.id);

      if (current) {
        await recordStockMovement(supabase, {
          productId,
          variantId: current.id,
          variantName: current.name,
          stockBefore: current.stock,
          stockAfter: 0,
          reason: "variant_deleted",
          note: "Variante removida do produto.",
          admin
        });
      }

      const { error } = await supabase
        .from("product_variants")
        .delete()
        .eq("id", variant.id)
        .eq("product_id", productId);

      if (error) {
        throw new Error(`Nao foi possivel remover variante: ${error.message}`);
      }

      continue;
    }

    if (variant.deleted) {
      continue;
    }

    const payload = {
      product_id: productId,
      name: variant.name,
      sku: variant.sku,
      color_hex: variant.color_hex,
      stock: variant.stock,
      display_order: variant.display_order,
      active: variant.active
    };

    if (variant.id) {
      const current = currentById.get(variant.id);
      const { error } = await supabase
        .from("product_variants")
        .update(payload)
        .eq("id", variant.id)
        .eq("product_id", productId);

      if (error) {
        throw new Error(`Nao foi possivel atualizar variante: ${error.message}`);
      }

      if (current) {
        await recordStockMovement(supabase, {
          productId,
          variantId: variant.id,
          variantName: variant.name,
          stockBefore: current.stock,
          stockAfter: variant.stock,
          reason: "variant_stock_edit",
          note: "Estoque da variante salvo no formulario do produto.",
          admin
        });
      }

      continue;
    }

    const { data, error } = await supabase
      .from("product_variants")
      .insert(payload)
      .select("id,name,stock")
      .single();

    if (error) {
      throw new Error(`Nao foi possivel criar variante: ${error.message}`);
    }

    await recordStockMovement(supabase, {
      productId,
      variantId: String(data.id),
      variantName: String(data.name),
      stockBefore: 0,
      stockAfter: Number(data.stock ?? 0),
      reason: "variant_initial_stock",
      note: "Estoque inicial da variante.",
      admin
    });
  }
}

function getImageFiles(formData: FormData) {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function prepareProductImages(files: File[]) {
  return Promise.all(files.map((file) => optimizeImageUpload(file, "product")));
}

async function getNextImageOrder(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_images")
    .select("display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Number(data?.display_order ?? -1) + 1;
}

async function productHasCover(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("is_cover", true)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

async function uploadImages(
  productId: string,
  productName: string,
  images: OptimizedImageUpload[]
) {
  if (images.length === 0) {
    return;
  }

  const supabase = await createClient();
  let nextOrder = await getNextImageOrder(productId);
  let hasCover = await productHasCover(productId);

  for (const image of images) {
    const path = `products/${productId}/${crypto.randomUUID()}.${image.extension}`;
    await uploadOptimizedImage(supabase, path, image);

    const { error: insertError } = await supabase.from("product_images").insert({
      product_id: productId,
      storage_path: path,
      alt_text: productName,
      display_order: nextOrder,
      is_cover: !hasCover
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    hasCover = true;
    nextOrder += 1;
  }
}

export async function saveProduct(productId: string | null, formData: FormData) {
  const admin = await requireAdmin();

  const supabase = await createClient();
  const payload = getProductPayload(formData);
  const variants = getProductVariantPayloads(formData);
  const files = getImageFiles(formData);
  const preparedImages = await prepareProductImages(files);

  if (productId) {
    const { data: current } = await supabase
      .from("products")
      .select("slug,stock")
      .eq("id", productId)
      .maybeSingle();

    const { error } = await supabase.from("products").update(payload).eq("id", productId);

    if (error) {
      throw new Error(error.message);
    }

    await uploadImages(productId, payload.name, preparedImages);
    await syncProductVariants(supabase, productId, variants, admin);
    await recordStockMovement(supabase, {
      productId,
      stockBefore: Number(current?.stock ?? payload.stock),
      stockAfter: payload.stock,
      reason: "product_edit",
      note: "Estoque salvo no formulario do produto.",
      admin
    });
    refreshCatalog([
      `/produto/${payload.slug}`,
      current?.slug ? `/produto/${current.slug}` : `/produto/${payload.slug}`
    ]);
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await uploadImages(data.id, payload.name, preparedImages);
    await syncProductVariants(supabase, data.id, variants, admin);
    await recordStockMovement(supabase, {
      productId: data.id,
      stockBefore: 0,
      stockAfter: payload.stock,
      reason: "initial_stock",
      note: "Estoque inicial do cadastro.",
      admin
    });
    refreshCatalog([`/produto/${payload.slug}`]);
  }

  adminRedirect(
    "/admin/produtos",
    "success",
    productId ? "Produto atualizado com sucesso." : "Produto criado com sucesso."
  );
}

export async function importProductsCsv(formData: FormData) {
  const admin = await requireAdmin();

  const file = formData.get("csv");
  const stockMode = getCsvStockMode(formData);

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/produtos/importar?error=Selecione um arquivo CSV.");
  }

  const content = await file.text();
  const supabase = await createClient();
  let records: CsvRecord[];

  try {
    const parsedRecords = parse(content, {
      bom: true,
      columns: true,
      delimiter: [",", ";", "\t"],
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    }) as Array<Record<string, string | undefined>>;

    records = parsedRecords.map(normalizeRecord);
  } catch (error) {
    const message = error instanceof Error ? error.message : "CSV inválido.";
    redirect(`/admin/produtos/importar?error=${encodeURIComponent(message)}`);
  }

  if (records.length === 0) {
    redirect("/admin/produtos/importar?error=CSV sem linhas para importar.");
  }

  let created = 0;
  let updated = 0;
  let categoriesCreated = 0;
  let images = 0;
  let defaultsApplied = 0;
  const errors: string[] = [];
  const defaults: string[] = [];

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const rowNumber = index + 2;

    try {
      const categoryName = getCsvValue(record, importHeaderAliases.category);
      const categorySlug = getCsvValue(record, importHeaderAliases.categorySlug);
      const category = await getOrCreateCategory(supabase, categoryName, categorySlug, rowNumber);
      if (category.created) {
        categoriesCreated += 1;
      }

      if (category.defaulted) {
        defaultsApplied += 1;
        defaults.push(`Linha ${rowNumber}: categoria ausente; usado ${category.name}.`);
      }

      const { payload, defaults: payloadDefaults } = getCsvPayload(record, category.id, rowNumber);
      defaultsApplied += payloadDefaults.length;
      defaults.push(...payloadDefaults);

      const imagePaths = splitImagePaths(getCsvValue(record, importHeaderAliases.imagePaths));
      const coverImagePath = getCsvValue(record, importHeaderAliases.coverImagePath);

      const { data: existing, error: existingError } = await supabase
        .from("products")
        .select("id,stock")
        .eq("slug", payload.slug)
        .maybeSingle();

      if (existingError) {
        throw new Error(`Linha ${rowNumber}: erro ao buscar produto (${existingError.message}).`);
      }

      let productId: string;

      if (existing?.id) {
        const stockBefore = Number(existing.stock ?? 0);
        const stockAfter = stockMode === "add" ? stockBefore + payload.stock : payload.stock;
        const updatePayload = {
          ...payload,
          stock: stockAfter
        };
        const { error } = await supabase.from("products").update(updatePayload).eq("id", existing.id);

        if (error) {
          throw new Error(`Linha ${rowNumber}: erro ao atualizar produto (${error.message}).`);
        }

        productId = existing.id as string;
        await recordStockMovement(supabase, {
          productId,
          stockBefore,
          stockAfter,
          reason: "csv_import",
          note:
            stockMode === "add"
              ? `Importacao CSV linha ${rowNumber}: somado ${payload.stock} ao estoque existente.`
              : `Importacao CSV linha ${rowNumber}: estoque substituido pelo CSV.`,
          admin
        });
        updated += 1;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          throw new Error(`Linha ${rowNumber}: erro ao criar produto (${error.message}).`);
        }

        productId = data.id as string;
        await recordStockMovement(supabase, {
          productId,
          stockBefore: 0,
          stockAfter: payload.stock,
          reason: "csv_import",
          note: `Criado por importacao CSV linha ${rowNumber}.`,
          admin
        });
        created += 1;
      }

      images += await replaceProductImagesFromCsv(
        supabase,
        productId,
        payload.name,
        imagePaths,
        coverImagePath
      );
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Linha ${rowNumber}: erro desconhecido.`);
    }
  }

  refreshCatalog();
  revalidatePath("/admin/produtos/importar");

  const params = new URLSearchParams({
    created: String(created),
    updated: String(updated),
    categories: String(categoriesCreated),
    images: String(images),
    defaults: String(defaultsApplied),
    stockMode
  });

  if (errors.length > 0) {
    params.set("errors", String(errors.length));
    params.set("error", errors.slice(0, 4).join(" | "));
  }

  if (defaults.length > 0) {
    params.set("notice", defaults.slice(0, 5).join(" | "));
  }

  redirect(`/admin/produtos/importar?${params.toString()}`);
}

export async function updateProductStock(productId: string, formData: FormData) {
  const admin = await requireAdmin();

  const stock = Number(formData.get("stock") ?? 0);
  const note = String(formData.get("note") ?? "");
  if (!Number.isInteger(stock) || stock < 0) {
    adminRedirect("/admin/produtos", "error", "Estoque invalido. Use zero ou um numero inteiro.");
  }

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("products")
    .select("slug,stock")
    .eq("id", productId)
    .single();

  if (currentError) {
    adminRedirect("/admin/produtos", "error", `Nao foi possivel localizar o produto: ${currentError.message}`);
  }

  const { data, error } = await supabase
    .from("products")
    .update({ stock })
    .eq("id", productId)
    .select("slug")
    .single();

  if (error) {
    adminRedirect("/admin/produtos", "error", `Nao foi possivel atualizar o estoque: ${error.message}`);
  }

  await recordStockMovement(supabase, {
    productId,
    stockBefore: Number(current.stock),
    stockAfter: stock,
    reason: "manual_adjustment",
    note,
    admin
  });
  refreshCatalog([`/produto/${data.slug}`]);
  adminRedirect("/admin/produtos", "success", "Estoque atualizado.");
}

export async function toggleProductStatus(productId: string, active: boolean) {
  await requireAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ active })
    .eq("id", productId)
    .select("slug")
    .single();

  if (error) {
    adminRedirect("/admin/produtos", "error", `Nao foi possivel alterar o status: ${error.message}`);
  }

  refreshCatalog([`/produto/${data.slug}`]);
  adminRedirect(
    "/admin/produtos",
    "success",
    active ? "Produto ativado no catalogo." : "Produto desativado do catalogo."
  );
}

export async function deleteProduct(productId: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("slug, product_images(storage_path)")
    .eq("id", productId)
    .maybeSingle();

  const imagePaths =
    product?.product_images?.map((image: { storage_path: string }) => image.storage_path) ?? [];

  if (imagePaths.length > 0) {
    await supabase.storage.from("produtos").remove(imagePaths);
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    adminRedirect("/admin/produtos", "error", `Nao foi possivel excluir o produto: ${error.message}`);
  }

  refreshCatalog([product?.slug ? `/produto/${product.slug}` : "/"]);
  adminRedirect("/admin/produtos", "success", "Produto excluido com sucesso.");
}

export async function updateImageOrder(productId: string, formData: FormData) {
  await requireAdmin();

  const editPath = `/admin/produtos/${productId}/editar`;
  let order: string[];

  try {
    const parsedOrder = JSON.parse(String(formData.get("order") ?? "[]"));
    order = Array.isArray(parsedOrder) ? parsedOrder.map(String) : [];
  } catch {
    adminRedirect(editPath, "error", "Nao foi possivel ler a nova ordem das imagens.");
  }

  const supabase = await createClient();

  const updates = await Promise.all(
    order.map((id, display_order) =>
      supabase.from("product_images").update({ display_order }).eq("id", id).eq("product_id", productId)
    )
  );
  const updateError = updates.find((result) => result.error)?.error;

  if (updateError) {
    adminRedirect(editPath, "error", `Nao foi possivel salvar a ordem: ${updateError.message}`);
  }

  const { data } = await supabase.from("products").select("slug").eq("id", productId).maybeSingle();
  refreshCatalog([data?.slug ? `/produto/${data.slug}` : "/"]);
  adminRedirect(editPath, "success", "Ordem das imagens salva.");
}

export async function setCoverImage(productId: string, imageId: string) {
  await requireAdmin();

  const editPath = `/admin/produtos/${productId}/editar`;
  const supabase = await createClient();
  const [{ data: image, error: imageError }, { data: product }] = await Promise.all([
    supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .eq("id", imageId)
      .maybeSingle(),
    supabase.from("products").select("slug").eq("id", productId).maybeSingle()
  ]);

  if (imageError) {
    adminRedirect(editPath, "error", `Nao foi possivel buscar a imagem: ${imageError.message}`);
  }

  if (!image) {
    refreshCatalog([product?.slug ? `/produto/${product.slug}` : "/"]);
    adminRedirect(editPath, "error", "Imagem nao encontrada. Atualize a pagina e tente novamente.");
  }

  const { error: resetError } = await supabase
    .from("product_images")
    .update({ is_cover: false })
    .eq("product_id", productId);

  if (resetError) {
    adminRedirect(editPath, "error", `Nao foi possivel redefinir a capa: ${resetError.message}`);
  }

  const { error } = await supabase
    .from("product_images")
    .update({ is_cover: true })
    .eq("product_id", productId)
    .eq("id", imageId);

  if (error) {
    adminRedirect(editPath, "error", `Nao foi possivel definir a capa: ${error.message}`);
  }

  refreshCatalog([product?.slug ? `/produto/${product.slug}` : "/"]);
  adminRedirect(editPath, "success", "Imagem de capa atualizada.");
}

export async function deleteProductImage(productId: string, imageId: string) {
  await requireAdmin();

  const editPath = `/admin/produtos/${productId}/editar`;
  const supabase = await createClient();
  const [{ data: image, error: imageError }, { data: product }] = await Promise.all([
    supabase
      .from("product_images")
      .select("storage_path,is_cover")
      .eq("product_id", productId)
      .eq("id", imageId)
      .maybeSingle(),
    supabase.from("products").select("slug").eq("id", productId).maybeSingle()
  ]);

  if (imageError) {
    adminRedirect(editPath, "error", `Nao foi possivel buscar a imagem: ${imageError.message}`);
  }

  if (!image) {
    refreshCatalog([product?.slug ? `/produto/${product.slug}` : "/"]);
    adminRedirect(editPath, "error", "Imagem nao encontrada. Atualize a pagina e tente novamente.");
  }

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId);
  if (error) {
    adminRedirect(editPath, "error", `Nao foi possivel remover a imagem do produto: ${error.message}`);
  }

  if (image.is_cover) {
    const { data: nextCover, error: nextCoverError } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextCoverError) {
      await supabase.storage.from("produtos").remove([image.storage_path]);
      refreshCatalog([product?.slug ? `/produto/${product.slug}` : "/"]);
      adminRedirect(
        editPath,
        "error",
        `Imagem removida, mas nao foi possivel buscar a proxima capa: ${nextCoverError.message}`
      );
    }

    if (nextCover) {
      const { error: coverError } = await supabase
        .from("product_images")
        .update({ is_cover: true })
        .eq("id", nextCover.id)
        .eq("product_id", productId);

      if (coverError) {
        await supabase.storage.from("produtos").remove([image.storage_path]);
        refreshCatalog([product?.slug ? `/produto/${product.slug}` : "/"]);
        adminRedirect(
          editPath,
          "error",
          `Imagem removida, mas nao foi possivel definir a nova capa: ${coverError.message}`
        );
      }
    }
  }

  const { error: storageError } = await supabase.storage.from("produtos").remove([image.storage_path]);

  refreshCatalog([product?.slug ? `/produto/${product.slug}` : "/"]);

  if (storageError) {
    adminRedirect(
      editPath,
      "success",
      "Imagem removida do produto. O arquivo no Storage pode precisar de limpeza manual."
    );
  }

  adminRedirect(editPath, "success", "Imagem excluida com sucesso.");
}

export async function createBanner(formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();
  const desktopImage = getFile(formData, "desktop_image");
  const mobileImage = getFile(formData, "mobile_image");

  if (!desktopImage) {
    adminRedirect("/admin/banners", "error", "Envie uma imagem desktop para criar o banner.");
  }

  const payload = getBannerPayload(formData);
  let storagePath: string | null = null;
  let mobileStoragePath: string | null = null;

  try {
    storagePath = await uploadBannerImage(supabase, desktopImage, "desktop");
    mobileStoragePath = mobileImage
      ? await uploadBannerImage(supabase, mobileImage, "mobile")
      : null;
  } catch (error) {
    await removeStoragePaths(supabase, [storagePath, mobileStoragePath]);
    const message = error instanceof Error ? error.message : "Imagem invalida.";
    adminRedirect("/admin/banners", "error", message);
  }

  if (!storagePath) {
    adminRedirect("/admin/banners", "error", "Nao foi possivel processar a imagem desktop.");
  }

  const { error } = await supabase.from("catalog_banners").insert({
    ...payload,
    storage_path: storagePath,
    mobile_storage_path: mobileStoragePath
  });

  if (error) {
    await removeStoragePaths(supabase, [storagePath, mobileStoragePath]);
    adminRedirect("/admin/banners", "error", `Nao foi possivel criar o banner: ${error.message}`);
  }

  refreshCatalog();
  adminRedirect("/admin/banners", "success", "Banner criado com sucesso.");
}

export async function updateBanner(bannerId: string, formData: FormData) {
  await requireAdmin();

  const supabase = await createClient();
  const payload = getBannerPayload(formData);
  const desktopImage = getFile(formData, "desktop_image");
  const mobileImage = getFile(formData, "mobile_image");
  let storagePath: string | null = null;
  let mobileStoragePath: string | null = null;

  const { data: current, error: currentError } = await supabase
    .from("catalog_banners")
    .select("storage_path,mobile_storage_path")
    .eq("id", bannerId)
    .single();

  if (currentError) {
    adminRedirect("/admin/banners", "error", `Nao foi possivel localizar o banner: ${currentError.message}`);
  }

  try {
    if (desktopImage) {
      storagePath = await uploadBannerImage(supabase, desktopImage, "desktop");
    }

    if (mobileImage) {
      mobileStoragePath = await uploadBannerImage(supabase, mobileImage, "mobile");
    }
  } catch (error) {
    await removeStoragePaths(supabase, [storagePath, mobileStoragePath]);
    const message = error instanceof Error ? error.message : "Imagem invalida.";
    adminRedirect("/admin/banners", "error", message);
  }

  const { error } = await supabase
    .from("catalog_banners")
    .update({
      ...payload,
      ...(storagePath ? { storage_path: storagePath } : {}),
      ...(mobileStoragePath ? { mobile_storage_path: mobileStoragePath } : {})
    })
    .eq("id", bannerId);

  if (error) {
    await removeStoragePaths(supabase, [storagePath, mobileStoragePath]);

    adminRedirect("/admin/banners", "error", `Nao foi possivel atualizar o banner: ${error.message}`);
  }

  const oldPaths = [
    storagePath ? current?.storage_path : null,
    mobileStoragePath ? current?.mobile_storage_path : null
  ].filter(Boolean) as string[];

  if (oldPaths.length > 0) {
    await removeStoragePaths(supabase, oldPaths);
  }

  refreshCatalog();
  adminRedirect("/admin/banners", "success", "Banner atualizado com sucesso.");
}

export async function deleteBanner(bannerId: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { data: banner } = await supabase
    .from("catalog_banners")
    .select("storage_path,mobile_storage_path")
    .eq("id", bannerId)
    .maybeSingle();

  const { error } = await supabase.from("catalog_banners").delete().eq("id", bannerId);

  if (error) {
    adminRedirect("/admin/banners", "error", `Nao foi possivel excluir o banner: ${error.message}`);
  }

  const paths = [banner?.storage_path, banner?.mobile_storage_path].filter(Boolean) as string[];

  if (paths.length > 0) {
    await removeStoragePaths(supabase, paths);
  }

  refreshCatalog();
  adminRedirect("/admin/banners", "success", "Banner excluido com sucesso.");
}

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const parsed = categorySchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug")
  });

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    name: parsed.name,
    slug: parsed.slug ? slugify(parsed.slug) : slugify(parsed.name)
  });

  if (error) {
    adminRedirect("/admin/categorias", "error", `Nao foi possivel criar a categoria: ${error.message}`);
  }

  refreshCatalog();
  adminRedirect("/admin/categorias", "success", "Categoria criada com sucesso.");
}

export async function updateCategory(categoryId: string, formData: FormData) {
  await requireAdmin();

  const parsed = categorySchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug")
  });

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.name,
      slug: parsed.slug ? slugify(parsed.slug) : slugify(parsed.name)
    })
    .eq("id", categoryId);

  if (error) {
    adminRedirect("/admin/categorias", "error", `Nao foi possivel salvar a categoria: ${error.message}`);
  }

  refreshCatalog();
  adminRedirect("/admin/categorias", "success", "Categoria atualizada com sucesso.");
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);

  if (error) {
    adminRedirect(
      "/admin/categorias",
      "error",
      `Nao foi possivel excluir a categoria. Verifique se ainda existem produtos vinculados. ${error.message}`
    );
  }

  refreshCatalog();
  adminRedirect("/admin/categorias", "success", "Categoria excluida com sucesso.");
}
