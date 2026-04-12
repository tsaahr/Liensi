import type { Product } from "@/lib/types";
import { getProductStock } from "@/lib/product-stock";

export type ProductReadinessItem = {
  key: "image" | "description" | "price" | "category" | "stock";
  label: string;
  complete: boolean;
};

export type ProductReadiness = {
  score: number;
  completed: number;
  total: number;
  items: ProductReadinessItem[];
  missingLabels: string[];
  isComplete: boolean;
};

export function getProductReadiness(product: Product): ProductReadiness {
  const items: ProductReadinessItem[] = [
    {
      key: "image",
      label: "Imagem",
      complete: product.images.length > 0
    },
    {
      key: "description",
      label: "Descricao",
      complete: Boolean(product.description?.trim())
    },
    {
      key: "price",
      label: "Preco",
      complete: product.price > 0
    },
    {
      key: "category",
      label: "Categoria",
      complete: Boolean(product.category)
    },
    {
      key: "stock",
      label: "Estoque",
      complete: getProductStock(product) > 0
    }
  ];
  const completed = items.filter((item) => item.complete).length;
  const total = items.length;
  const score = Math.round((completed / total) * 100);
  const missingLabels = items.filter((item) => !item.complete).map((item) => item.label);

  return {
    score,
    completed,
    total,
    items,
    missingLabels,
    isComplete: completed === total
  };
}
