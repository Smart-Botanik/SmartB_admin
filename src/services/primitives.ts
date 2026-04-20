import { graphqlClient } from "@/services/graphql/client";

export type PrimitiveValueType = "number" | "string" | "boolean" | "json";
export type PrimitiveStatus = "active" | "deprecated";

export interface Primitive {
  id: string;
  key: string;
  name: string;
  valueType: PrimitiveValueType;
  unit?: string | null;
  validation?: Record<string, unknown> | null;
  status: PrimitiveStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export const primitivesService = {
  list: async () => {
    const query = `
      query Primitives {
        primitives {
          id
          key
          name
          valueType
          unit
          validation
          status
          version
          createdAt
          updatedAt
        }
      }
    `;

    const resp = await graphqlClient.request<{ primitives: Primitive[] }>({
      query,
      operationName: "Primitives",
    });
    return resp.primitives;
  },

  create: async (input: {
    key: string;
    name: string;
    valueType: PrimitiveValueType;
    unit?: string;
    validationJson?: string;
  }) => {
    const query = `
      mutation CreatePrimitive($key: String!, $name: String!, $valueType: PrimitiveValueType!, $unit: String, $validationJson: String) {
        createPrimitive(key: $key, name: $name, valueType: $valueType, unit: $unit, validationJson: $validationJson) {
          id
          key
          name
          valueType
          unit
          validation
          status
          version
          createdAt
          updatedAt
        }
      }
    `;
    const resp = await graphqlClient.request<
      { createPrimitive: Primitive },
      {
        key: string;
        name: string;
        valueType: PrimitiveValueType;
        unit?: string;
        validationJson?: string;
      }
    >({
      query,
      variables: input,
      operationName: "CreatePrimitive",
    });
    return resp.createPrimitive;
  },

  update: async (input: {
    id: string;
    key?: string;
    name?: string;
    valueType?: PrimitiveValueType;
    unit?: string;
    status?: PrimitiveStatus;
    validationJson?: string;
  }) => {
    const query = `
      mutation UpdatePrimitive($id: ID!, $key: String, $name: String, $valueType: PrimitiveValueType, $unit: String, $status: PrimitiveStatus, $validationJson: String) {
        updatePrimitive(id: $id, key: $key, name: $name, valueType: $valueType, unit: $unit, status: $status, validationJson: $validationJson) {
          id
          key
          name
          valueType
          unit
          validation
          status
          version
          createdAt
          updatedAt
        }
      }
    `;
    const resp = await graphqlClient.request<
      { updatePrimitive: Primitive },
      {
        id: string;
        key?: string;
        name?: string;
        valueType?: PrimitiveValueType;
        unit?: string;
        status?: PrimitiveStatus;
        validationJson?: string;
      }
    >({
      query,
      variables: input,
      operationName: "UpdatePrimitive",
    });
    return resp.updatePrimitive;
  },
};
