export type LocationStatus = "active" | "archived";

export type LocationType = "indoor" | "outdoor" | "greenhouse";

export type LocationSubType =
  | "indoor_growbox"
  | "indoor_cabinet"
  | "indoor_pc_case"
  | "indoor_shelf"
  | "indoor_room"
  | "outdoor_bed"
  | "outdoor_soil"
  | "outdoor_pot"
  | "greenhouse_classic"
  | "greenhouse_tunnel";

export type LocationWateringType =
  | "manual"
  | "drip"
  | "hydroponics"
  | "aeroponics";

export type LocationSpecKind = "lighting" | "enclosure" | "space" | "area";

export interface LocationSpecsLighting {
  specBlockId?: string;
  vegetationLamps?: unknown[] | null;
  bloomLamps?: unknown[] | null;
}

export interface LocationSpecsEnclosureProduct {
  id: string;
  name: string;
}

export interface LocationSpecsEnclosure {
  specBlockId?: string;
  product?: LocationSpecsEnclosureProduct | null;
  productId?: string | null;
  width?: number | null;
  height?: number | null;
  depth?: number | null;
}

export interface LocationSpecsSpace {
  specBlockId?: string;
  width?: number | null;
  height?: number | null;
  depth?: number | null;
}

export interface LocationSpecsArea {
  specBlockId?: string;
  width?: number | null;
  depth?: number | null;
}

export interface LocationSpecBlock {
  id?: string;
  position: number;
  kind: LocationSpecKind;
  lighting?: LocationSpecsLighting | null;
  enclosure?: LocationSpecsEnclosure | null;
  space?: LocationSpecsSpace | null;
  area?: LocationSpecsArea | null;
}

export interface AdminLocation {
  id: string;
  userId: string;
  name: string;
  status: LocationStatus;
  type: LocationType | null;
  subType: LocationSubType | null;
  wateringType: LocationWateringType | null;
  description: string | null;
  capacity: number | null;
  occupiedSlots: number | null;
  specBlocks: LocationSpecBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAdminLocationInput {
  name?: string | null;
  status?: LocationStatus | null;
  type?: LocationType | null;
  subType?: LocationSubType | null;
  wateringType?: LocationWateringType | null;
  description?: string | null;
  capacity?: number | null;
  occupiedSlots?: number | null;
  specBlocks?: LocationSpecBlock[];
}

export const LOCATION_STATUS_OPTIONS: { value: LocationStatus; label: string }[] =
  [
    { value: "active", label: "Активна" },
    { value: "archived", label: "Архив" },
  ];

export const LOCATION_TYPE_OPTIONS: { value: LocationType; label: string }[] = [
  { value: "indoor", label: "Помещение" },
  { value: "outdoor", label: "Улица / открытый грунт" },
  { value: "greenhouse", label: "Теплица" },
];

const SUBTYPE_LABELS: Record<LocationSubType, string> = {
  indoor_growbox: "Гроубокс",
  indoor_cabinet: "Шкаф",
  indoor_pc_case: "Корпус ПК",
  indoor_shelf: "Полка / стеллаж",
  indoor_room: "Комната",
  outdoor_bed: "Грядка",
  outdoor_soil: "Открытый грунт",
  outdoor_pot: "Горшок / контейнер",
  greenhouse_classic: "Классическая теплица",
  greenhouse_tunnel: "Туннель / арочная",
};

export function subTypeOptionsForType(
  type: LocationType | null | undefined,
): { value: LocationSubType; label: string }[] {
  if (!type) return [];
  const prefix = `${type}_` as const;
  return (Object.keys(SUBTYPE_LABELS) as LocationSubType[])
    .filter((s) => s.startsWith(prefix))
    .map((value) => ({ value, label: SUBTYPE_LABELS[value] }));
}

export const LOCATION_WATERING_OPTIONS: {
  value: LocationWateringType;
  label: string;
}[] = [
  { value: "manual", label: "Ручной полив" },
  { value: "drip", label: "Капельный" },
  { value: "hydroponics", label: "Гидропоника" },
  { value: "aeroponics", label: "Аэропоника" },
];
