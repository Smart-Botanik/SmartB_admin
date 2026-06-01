import type { RegistryProfile } from "@/services/registryProfiles";

export type RegistryReadinessLevel = "ready" | "partial" | "pending";

export type RegistryPilotProfileCardConfig = {
  key: string;
  title: string;
  entity: string;
  kind: string;
  description: string;
  gate: string;
  builderEntity: "Plant" | "Diary" | "Location";
  tier: "core" | "pilot";
};

export const CORE_PLANT_PROFILE_KEYS = [
  "watering.event.v1",
  "watering.chart.v1",
  "current.snapshot.v1",
] as const;

export const REGISTRY_PILOT_PROFILES: RegistryPilotProfileCardConfig[] = [
  {
    key: "watering.event.v1",
    title: "watering.event.v1",
    entity: "Plant",
    kind: "event_write",
    description:
      "Write profile for Plant watering event payloads (solution, drainage, nutrients). Gate before Event Definitions.",
    gate: "FieldSpecs → Profile Builder → Build Preview → Event Definition",
    builderEntity: "Plant",
    tier: "core",
  },
  {
    key: "watering.chart.v1",
    title: "watering.chart.v1",
    entity: "Plant",
    kind: "timeseries_read",
    description:
      "Read profile for chart series: pH/PPM on solution and drainage. Excludes JSON nutrients array.",
    gate: "Events stream → chart query by period (main frontend FE-REG-R4)",
    builderEntity: "Plant",
    tier: "core",
  },
  {
    key: "current.snapshot.v1",
    title: "current.snapshot.v1",
    entity: "Plant",
    kind: "snapshot_build",
    description:
      "Snapshot build profile: all Plant watering fields marked includeInCurrent for Plant.current projection.",
    gate: "Event apply → materialize current (includeInCurrent policy)",
    builderEntity: "Plant",
    tier: "core",
  },
  {
    key: "diary.setup.config.v1",
    title: "diary.setup.config.v1",
    entity: "Diary",
    kind: "event_write",
    description: "Diary setup payload: wateringType and roomType under diary.* canonical paths.",
    gate: "Profile Builder (Diary) → Build Preview → Create Diary Event",
    builderEntity: "Diary",
    tier: "pilot",
  },
  {
    key: "location.indoor.equipment.v1",
    title: "location.indoor.equipment.v1",
    entity: "Location",
    kind: "event_write",
    description: "Location indoor equipment: enclosure dimensions, lamps, product references.",
    gate: "Profile Builder (Location) → Build Preview",
    builderEntity: "Location",
    tier: "pilot",
  },
];

export type RegistryReadinessGates = {
  backend: RegistryReadinessLevel;
  admin: RegistryReadinessLevel;
  frontend: RegistryReadinessLevel;
  backendHint: string;
  adminHint: string;
  frontendHint: string;
};

export function resolveRegistryReadinessGates(
  fieldSpecCount: number,
  profiles: RegistryProfile[],
): RegistryReadinessGates {
  const profileByKey = new Map(profiles.map(profile => [profile.key, profile]));
  const coreReady = CORE_PLANT_PROFILE_KEYS.every(key => profileByKey.has(key));
  const catalogReady = fieldSpecCount > 0;

  const backend: RegistryReadinessLevel =
    catalogReady && coreReady ? "ready" : catalogReady ? "partial" : "pending";

  const admin: RegistryReadinessLevel =
    catalogReady && profiles.length >= CORE_PLANT_PROFILE_KEYS.length
      ? coreReady
        ? "ready"
        : "partial"
      : catalogReady
        ? "partial"
        : "pending";

  return {
    backend,
    admin,
    frontend: "pending",
    backendHint:
      backend === "ready"
        ? "Schema, seed, buildPreview API, core Plant trio seeded"
        : backend === "partial"
          ? "Catalog connected; run registry field-spec seed for core profiles"
          : "Run backend seed + GraphQL registry module",
    adminHint:
      admin === "ready"
        ? "Hub, Field Specs, Profile Builder runtime form connected"
        : admin === "partial"
          ? "Admin UI connected; complete core profile cards in seed"
          : "Connect admin to Nest GraphQL registry queries",
    frontendHint: "Pending FE-REG-R1…R4: read catalog, payload builder, chart flow",
  };
}

export function readinessTagColor(level: RegistryReadinessLevel): "green" | "gold" | "default" {
  if (level === "ready") return "green";
  if (level === "partial") return "gold";
  return "default";
}

export function readinessLabel(level: RegistryReadinessLevel): string {
  if (level === "ready") return "ready";
  if (level === "partial") return "partial";
  return "pending";
}
