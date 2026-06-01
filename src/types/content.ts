export type CropKind = "TOMATO" | "ZUCCHINI" | "EGGPLANT" | "CUCUMBER";

export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ContentMedia = {
  id: string;
  url: string;
};

export type CropGuide = {
  id: string;
  cropKind: CropKind;
  slug: string;
  title: string;
  excerpt?: string | null;
  body: unknown;
  bodySiteMd?: string | null;
  bodySiteMdResolved?: string | null;
  bodyTelegramMd?: string | null;
  cover?: ContentMedia | null;
  status: ContentStatus;
  publishedAt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  sortOrder: number;
  telegramPublishedAt?: string | null;
  telegramMessageId?: string | null;
  telegramPostUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SitePage = {
  id: string;
  key: string;
  title: string;
  sections: unknown;
  status: ContentStatus;
  publishedAt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const CROP_KIND_OPTIONS: Array<{ value: CropKind; label: string }> = [
  { value: "TOMATO", label: "Помидоры" },
  { value: "ZUCCHINI", label: "Кабачки" },
  { value: "EGGPLANT", label: "Баклажаны" },
  { value: "CUCUMBER", label: "Огурцы" },
];

export const CONTENT_STATUS_OPTIONS: Array<{ value: ContentStatus; label: string }> =
  [
    { value: "DRAFT", label: "Черновик" },
    { value: "PUBLISHED", label: "Опубликовано" },
    { value: "ARCHIVED", label: "В архиве" },
  ];

export function cropKindLabel(kind: CropKind): string {
  return CROP_KIND_OPTIONS.find(option => option.value === kind)?.label ?? kind;
}
