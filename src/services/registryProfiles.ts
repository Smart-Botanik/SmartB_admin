import { graphqlClient } from "@/services/graphql/client";

export type RegistryProfileKind =
  | "event_write"
  | "timeseries_read"
  | "snapshot_build";

export interface RegistryProfileField {
  id: string;
  fieldId: string;
  required: boolean;
  position: number;
}

export interface RegistryProfile {
  id: string;
  key: string;
  entity: string;
  kind: RegistryProfileKind;
  title: string;
  description?: string | null;
  version: number;
  isActive: boolean;
  fields: RegistryProfileField[];
  createdAt: string;
  updatedAt: string;
}

type UpsertRegistryProfileInput = {
  key: string;
  entity: string;
  kind: RegistryProfileKind;
  title: string;
  description?: string;
  isActive?: boolean;
};

type SetRegistryProfileFieldsInput = {
  profileKey: string;
  fieldIds: string[];
  requiredFieldIds?: string[];
};

export interface RegistryBuildPreviewError {
  fieldId?: string | null;
  code: string;
  message: string;
}

export interface RegistryBuildPreviewResult {
  payload: Record<string, unknown>;
  errors: RegistryBuildPreviewError[];
}

type RegistryBuildPreviewInput = {
  profileKey: string;
  valuesJson: Record<string, unknown>;
};

export const registryProfilesService = {
  list: async (params?: {
    entity?: string;
    kind?: RegistryProfileKind;
    isActive?: boolean;
  }) => {
    const query = `
      query RegistryProfiles($entity: String, $kind: RegistryProfileKind, $isActive: Boolean) {
        registryProfiles(entity: $entity, kind: $kind, isActive: $isActive) {
          id
          key
          entity
          kind
          title
          description
          version
          isActive
          createdAt
          updatedAt
          fields {
            id
            fieldId
            required
            position
          }
        }
      }
    `;

    const resp = await graphqlClient.request<
      { registryProfiles: RegistryProfile[] },
      { entity?: string; kind?: RegistryProfileKind; isActive?: boolean }
    >({
      query,
      variables: params ?? {},
      operationName: "RegistryProfiles",
    });

    return resp.registryProfiles;
  },

  getByKey: async (key: string) => {
    const query = `
      query RegistryProfile($key: String!) {
        registryProfile(key: $key) {
          id
          key
          entity
          kind
          title
          description
          version
          isActive
          createdAt
          updatedAt
          fields {
            id
            fieldId
            required
            position
          }
        }
      }
    `;

    const resp = await graphqlClient.request<
      { registryProfile: RegistryProfile | null },
      { key: string }
    >({
      query,
      variables: { key },
      operationName: "RegistryProfile",
    });

    return resp.registryProfile;
  },

  upsert: async (input: UpsertRegistryProfileInput) => {
    const query = `
      mutation UpsertRegistryProfile($input: UpsertRegistryProfileInput!) {
        upsertRegistryProfile(input: $input) {
          id
          key
          entity
          kind
          title
          description
          version
          isActive
          createdAt
          updatedAt
          fields {
            id
            fieldId
            required
            position
          }
        }
      }
    `;

    const resp = await graphqlClient.request<
      { upsertRegistryProfile: RegistryProfile },
      { input: UpsertRegistryProfileInput }
    >({
      query,
      variables: { input },
      operationName: "UpsertRegistryProfile",
    });

    return resp.upsertRegistryProfile;
  },

  setFields: async (input: SetRegistryProfileFieldsInput) => {
    const query = `
      mutation SetRegistryProfileFields($input: SetRegistryProfileFieldsInput!) {
        setRegistryProfileFields(input: $input) {
          id
          key
          entity
          kind
          title
          description
          version
          isActive
          createdAt
          updatedAt
          fields {
            id
            fieldId
            required
            position
          }
        }
      }
    `;

    const resp = await graphqlClient.request<
      { setRegistryProfileFields: RegistryProfile },
      { input: SetRegistryProfileFieldsInput }
    >({
      query,
      variables: { input },
      operationName: "SetRegistryProfileFields",
    });

    return resp.setRegistryProfileFields;
  },

  buildPreview: async (input: RegistryBuildPreviewInput) => {
    const query = `
      query RegistryBuildPreview($input: RegistryBuildPreviewInput!) {
        registryBuildPreview(input: $input) {
          payload
          errors {
            fieldId
            code
            message
          }
        }
      }
    `;

    const resp = await graphqlClient.request<
      { registryBuildPreview: RegistryBuildPreviewResult },
      { input: RegistryBuildPreviewInput }
    >({
      query,
      variables: { input },
      operationName: "RegistryBuildPreview",
    });

    return resp.registryBuildPreview;
  },
};

