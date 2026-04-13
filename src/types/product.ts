import type { Brand } from "@/types/brand";

/**
 * Значения `category` как в legacy Strapi (`api::product.product` enumeration).
 * См. `backend/src/api/product/content-types/product/schema.json`.
 */
export const PRODUCT_CATEGORY_OPTIONS = [
  { value: "conditioner", label: "Кондиционер / увлажнение" },
  { value: "filter", label: "Фильтр" },
  { value: "lamp", label: "Лампа / свет" },
  { value: "nutrient", label: "Удобрения" },
  { value: "seed", label: "Семена" },
  { value: "substrate", label: "Субстрат" },
  { value: "tent", label: "Гроутент" },
  { value: "ventilation", label: "Вентиляция" },
] as const;

export type ProductCategoryValue = (typeof PRODUCT_CATEGORY_OPTIONS)[number]["value"];

const CATEGORY_LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  PRODUCT_CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
);

export function getProductCategoryLabel(category: string): string {
  return CATEGORY_LABEL_BY_VALUE[category] ?? category;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: Brand;
  createdAt?: string;
  updatedAt?: string;
  avatar?: {
    id: string;
    url: string;
  } | null;
}
