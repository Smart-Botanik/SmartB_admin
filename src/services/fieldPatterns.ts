import { graphqlClient } from "@/services/graphql/client";
import type { RegistrySemanticKind, RegistryValueType } from "@/services/registryFieldSpecs";

export type FieldPattern = {
  id?: string;
  key: string;
  title: string;
  valueType: RegistryValueType;
  semanticKind: RegistrySemanticKind;
  canonicalUnit?: string;
  allowedUnits?: string[];
  defaultInputUnit?: string;
  conversionProfile?: string;
  formatJson?: string;
  constraintsJson?: string;
  isActive?: boolean;
};

const parseOptionalJson = (payload?: string) => {
  if (!payload?.trim()) return undefined;
  return JSON.parse(payload);
};

const toPrettyJson = (payload?: unknown) => {
  if (!payload) return undefined;
  return JSON.stringify(payload, null, 2);
};

export const fieldPatternsService = {
  list: async (): Promise<FieldPattern[]> => {
    const query = `
      query RegistryFieldPatterns($isActive: Boolean) {
        registryFieldPatterns(isActive: $isActive) {
          id
          key
          title
          valueType
          semanticKind
          canonicalUnit
          allowedUnits
          defaultInputUnit
          conversionProfile
          formatJson
          constraintsJson
          isActive
        }
      }
    `;
    const resp = await graphqlClient.request<
      { registryFieldPatterns: Array<Omit<FieldPattern, "formatJson" | "constraintsJson"> & { formatJson?: unknown; constraintsJson?: unknown }> },
      { isActive?: boolean }
    >({
      query,
      variables: { isActive: true },
      operationName: "RegistryFieldPatterns",
    });
    return resp.registryFieldPatterns.map(item => ({
      ...item,
      formatJson: toPrettyJson(item.formatJson),
      constraintsJson: toPrettyJson(item.constraintsJson),
    }));
  },

  upsert: async (input: FieldPattern): Promise<FieldPattern> => {
    const query = `
      mutation UpsertRegistryFieldPattern($input: UpsertRegistryFieldPatternInput!) {
        upsertRegistryFieldPattern(input: $input) {
          id
          key
          title
          valueType
          semanticKind
          canonicalUnit
          allowedUnits
          defaultInputUnit
          conversionProfile
          formatJson
          constraintsJson
          isActive
        }
      }
    `;
    const resp = await graphqlClient.request<
      { upsertRegistryFieldPattern: Omit<FieldPattern, "formatJson" | "constraintsJson"> & { formatJson?: unknown; constraintsJson?: unknown } },
      { input: Record<string, unknown> }
    >({
      query,
      variables: {
        input: {
          key: input.key,
          title: input.title,
          valueType: input.valueType,
          semanticKind: input.semanticKind,
          canonicalUnit: input.canonicalUnit,
          allowedUnits: input.allowedUnits,
          defaultInputUnit: input.defaultInputUnit,
          conversionProfile: input.conversionProfile,
          formatJson: parseOptionalJson(input.formatJson),
          constraintsJson: parseOptionalJson(input.constraintsJson),
          isActive: input.isActive ?? true,
        },
      },
      operationName: "UpsertRegistryFieldPattern",
    });
    return {
      ...resp.upsertRegistryFieldPattern,
      formatJson: toPrettyJson(resp.upsertRegistryFieldPattern.formatJson),
      constraintsJson: toPrettyJson(resp.upsertRegistryFieldPattern.constraintsJson),
    };
  },

  remove: async (key: string): Promise<void> => {
    const existing = await fieldPatternsService.list();
    const target = existing.find(item => item.key === key);
    if (!target) return;
    await fieldPatternsService.upsert({
      ...target,
      isActive: false,
    });
  },
};

