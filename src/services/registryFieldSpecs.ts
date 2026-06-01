import { graphqlClient } from "@/services/graphql/client";

export type RegistryValueType =
  | "number"
  | "string"
  | "boolean"
  | "date"
  | "enum"
  | "json";
export type RegistrySemanticKind =
  | "generic"
  | "ph"
  | "ppm"
  | "temperature"
  | "length"
  | "concentration";
export type RegistryFieldSpecStatus = "active" | "deprecated";

export interface RegistryFieldSpec {
  id: string;
  fieldId: string;
  entity: string;
  label: string;
  valueType: RegistryValueType;
  semanticKind: RegistrySemanticKind;
  unit?: string | null;
  canonicalPath: string;
  required: boolean;
  formatJson?: Record<string, unknown> | null;
  constraintsJson?: Record<string, unknown> | null;
  fieldPatternKey?: string | null;
  includeInCurrent: boolean;
  status: RegistryFieldSpecStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegistryFieldSpecUsage {
  fieldId: string;
  profileKeys: string[];
  profileCount: number;
  isDeprecated: boolean;
}

type TUpsertInput = {
  fieldId: string;
  entity: string;
  label: string;
  valueType: RegistryValueType;
  semanticKind?: RegistrySemanticKind;
  unit?: string;
  canonicalPath: string;
  required?: boolean;
  formatJson?: string;
  constraintsJson?: string;
  fieldPatternKey?: string;
  includeInCurrent?: boolean;
  status?: RegistryFieldSpecStatus;
};

const parseOptionalJson = (payload?: string) => {
  if (!payload?.trim()) return undefined;
  return JSON.parse(payload);
};

export const registryFieldSpecsService = {
  list: async (params?: { entity?: string; status?: RegistryFieldSpecStatus }) => {
    const query = `
      query RegistryFieldSpecs($entity: String, $status: RegistryFieldSpecStatus) {
        registryFieldSpecs(entity: $entity, status: $status) {
          id
          fieldId
          entity
          label
          valueType
          semanticKind
          unit
          canonicalPath
          required
          formatJson
          constraintsJson
          fieldPatternKey
          includeInCurrent
          status
          version
          createdAt
          updatedAt
        }
      }
    `;

    const resp = await graphqlClient.request<
      { registryFieldSpecs: RegistryFieldSpec[] },
      { entity?: string; status?: RegistryFieldSpecStatus }
    >({
      query,
      variables: params ?? {},
      operationName: "RegistryFieldSpecs",
    });

    return resp.registryFieldSpecs;
  },

  upsert: async (input: TUpsertInput) => {
    const query = `
      mutation UpsertRegistryFieldSpec($input: UpsertRegistryFieldSpecInput!) {
        upsertRegistryFieldSpec(input: $input) {
          id
          fieldId
          entity
          label
          valueType
          semanticKind
          unit
          canonicalPath
          required
          formatJson
          constraintsJson
          fieldPatternKey
          includeInCurrent
          status
          version
          createdAt
          updatedAt
        }
      }
    `;

    const resp = await graphqlClient.request<
      { upsertRegistryFieldSpec: RegistryFieldSpec },
      { input: Omit<TUpsertInput, "formatJson" | "constraintsJson"> & { formatJson?: unknown; constraintsJson?: unknown } }
    >({
      query,
      variables: {
        input: {
          ...input,
          formatJson: parseOptionalJson(input.formatJson),
          constraintsJson: parseOptionalJson(input.constraintsJson),
          fieldPatternKey: input.fieldPatternKey,
        },
      },
      operationName: "UpsertRegistryFieldSpec",
    });

    return resp.upsertRegistryFieldSpec;
  },

  getUsage: async (fieldId: string) => {
    const query = `
      query RegistryFieldSpecUsage($fieldId: String!) {
        registryFieldSpecUsage(fieldId: $fieldId) {
          fieldId
          profileKeys
          profileCount
          isDeprecated
        }
      }
    `;

    const resp = await graphqlClient.request<
      { registryFieldSpecUsage: RegistryFieldSpecUsage },
      { fieldId: string }
    >({
      query,
      variables: { fieldId },
      operationName: "RegistryFieldSpecUsage",
    });

    return resp.registryFieldSpecUsage;
  },

  deprecate: async (fieldId: string) => {
    const query = `
      mutation DeprecateRegistryFieldSpec($fieldId: String!) {
        deprecateRegistryFieldSpec(fieldId: $fieldId) {
          id
          fieldId
          entity
          label
          valueType
          semanticKind
          unit
          canonicalPath
          required
          formatJson
          constraintsJson
          fieldPatternKey
          includeInCurrent
          status
          version
          createdAt
          updatedAt
        }
      }
    `;

    const resp = await graphqlClient.request<
      { deprecateRegistryFieldSpec: RegistryFieldSpec },
      { fieldId: string }
    >({
      query,
      variables: { fieldId },
      operationName: "DeprecateRegistryFieldSpec",
    });

    return resp.deprecateRegistryFieldSpec;
  },
};

