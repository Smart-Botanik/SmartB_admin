export type BrandCategory = string;

export interface Brand {
  id: string;
  name: string;
  category: BrandCategory;
  createdAt?: string;
  updatedAt?: string;
  avatar?: {
    id: string;
    url: string;
  } | null;
}
