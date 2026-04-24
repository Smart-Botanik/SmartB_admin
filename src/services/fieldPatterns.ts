import type { RegistrySemanticKind, RegistryValueType } from "@/services/registryFieldSpecs";

const FIELD_PATTERNS_STORAGE_KEY = "registry_field_patterns_v1";

export type FieldPattern = {
  key: string;
  title: string;
  valueType: RegistryValueType;
  semanticKind: RegistrySemanticKind;
  unit?: string;
  formatJson?: string;
  constraintsJson?: string;
};

const DEFAULT_PATTERNS: FieldPattern[] = [
  {
    key: "ph.decimal.v1",
    title: "pH decimal",
    valueType: "number",
    semanticKind: "ph",
    unit: "pH",
    formatJson: JSON.stringify({ mode: "decimal", precision: 1, step: 0.1 }, null, 2),
    constraintsJson: JSON.stringify({ min: 0, max: 14 }, null, 2),
  },
  {
    key: "ppm.integer.v1",
    title: "PPM integer",
    valueType: "number",
    semanticKind: "ppm",
    unit: "ppm",
    formatJson: JSON.stringify({ mode: "integer", step: 1 }, null, 2),
    constraintsJson: JSON.stringify({ min: 0, max: 5000 }, null, 2),
  },
  {
    key: "temperature.decimal.v1",
    title: "Temperature decimal",
    valueType: "number",
    semanticKind: "temperature",
    unit: "C",
    formatJson: JSON.stringify({ mode: "decimal", precision: 1, step: 0.1 }, null, 2),
    constraintsJson: JSON.stringify({ min: -20, max: 80 }, null, 2),
  },
];

const safeParse = (raw: string | null): FieldPattern[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FieldPattern[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const readPatterns = (): FieldPattern[] => {
  const saved = safeParse(window.localStorage.getItem(FIELD_PATTERNS_STORAGE_KEY));
  if (saved && saved.length > 0) {
    return saved;
  }
  window.localStorage.setItem(FIELD_PATTERNS_STORAGE_KEY, JSON.stringify(DEFAULT_PATTERNS));
  return DEFAULT_PATTERNS;
};

const writePatterns = (patterns: FieldPattern[]) => {
  window.localStorage.setItem(FIELD_PATTERNS_STORAGE_KEY, JSON.stringify(patterns));
};

export const fieldPatternsService = {
  list: async (): Promise<FieldPattern[]> => {
    return readPatterns().sort((a, b) => a.key.localeCompare(b.key));
  },

  upsert: async (input: FieldPattern): Promise<FieldPattern> => {
    const patterns = readPatterns();
    const index = patterns.findIndex(item => item.key === input.key);
    if (index >= 0) {
      patterns[index] = input;
    } else {
      patterns.push(input);
    }
    writePatterns(patterns);
    return input;
  },

  remove: async (key: string): Promise<void> => {
    const patterns = readPatterns().filter(item => item.key !== key);
    writePatterns(patterns);
  },
};

