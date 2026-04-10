export type BrandCategory = string;

export interface Brand {
  id: string;
  name: string;
  category: BrandCategory;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  avatar?: {
    id: string;
    url: string;
  } | null;
}

/** Значения category для API (Prisma BrandCategory). */
export const BRAND_CATEGORY_OPTIONS = [
  { value: "BREADER", label: "Breader" },
  { value: "TENT", label: "Tent" },
  { value: "LAMP", label: "Lamp" },
  { value: "COMMON", label: "Common" },
] as const;
