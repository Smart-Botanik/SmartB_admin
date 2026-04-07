import { graphqlClient } from "@/services/graphql/client";

export const actionPathRegistryService = {
  listGroups: async () => {
    const query = `
      query ActionPathRegistryGroups {
        actionPathRegistryGroups {
          id
          path
          description
          order
          createdAt
          updatedAt
        }
      }
    `;

    const resp = await graphqlClient.request<{
      actionPathRegistryGroups: Array<{
        id: string;
        path: string;
        description?: string | null;
        order: number;
        createdAt: string;
        updatedAt: string;
      }>;
    }>({
      query,
      operationName: "ActionPathRegistryGroups",
    });

    return resp.actionPathRegistryGroups;
  },
  createGroup: async (params: { path: string; description?: string }) => {
    const query = `
      mutation CreateActionPathRegistryGroup($path: String!, $description: String) {
        createActionPathRegistryGroup(path: $path, description: $description) {
          id
          path
          description
          order
          createdAt
          updatedAt
        }
      }
    `;

    const resp = await graphqlClient.request<
      {
        createActionPathRegistryGroup: {
          id: string;
          path: string;
          description?: string | null;
          order: number;
          createdAt: string;
          updatedAt: string;
        };
      },
      { path: string; description?: string }
    >({
      query,
      variables: {
        path: params.path,
        description: params.description,
      },
      operationName: "CreateActionPathRegistryGroup",
    });

    return resp.createActionPathRegistryGroup;
  },
  updateGroup: async (params: {
    id: string;
    path?: string;
    description?: string;
  }) => {
    const query = `
      mutation UpdateActionPathRegistryGroup($id: ID!, $path: String, $description: String) {
        updateActionPathRegistryGroup(id: $id, path: $path, description: $description) {
          id
          path
          description
          order
          createdAt
          updatedAt
        }
      }
    `;

    const resp = await graphqlClient.request<
      {
        updateActionPathRegistryGroup: {
          id: string;
          path: string;
          description?: string | null;
          order: number;
          createdAt: string;
          updatedAt: string;
        };
      },
      { id: string; path?: string; description?: string }
    >({
      query,
      variables: {
        id: params.id,
        path: params.path,
        description: params.description,
      },
      operationName: "UpdateActionPathRegistryGroup",
    });

    return resp.updateActionPathRegistryGroup;
  },
  updateGroupsOrder: async (input: Array<{ id: string; order: number }>) => {
    const query = `
      mutation UpdateActionPathRegistryGroupsOrder($input: [UpdateActionPathRegistryGroupOrderInput!]!) {
        updateActionPathRegistryGroupsOrder(input: $input)
      }
    `;

    const resp = await graphqlClient.request<
      { updateActionPathRegistryGroupsOrder: boolean },
      { input: Array<{ id: string; order: number }> }
    >({
      query,
      variables: {
        input,
      },
      operationName: "UpdateActionPathRegistryGroupsOrder",
    });

    return resp.updateActionPathRegistryGroupsOrder;
  },
  list: async (params?: {
    limit?: number;
    offset?: number;
    targetType?: string;
  }) => {
    const query = `
      query ActionPathRegistries($limit: Int, $offset: Int, $targetType: String) {
        actionPathRegistries(limit: $limit, offset: $offset, targetType: $targetType) {
          items {
            id
            actionPath
            description
            targetType
            mapping
            conditions
            autoTagRules
            schema
            groupId
            position
            group {
              id
              path
              description
            }
            tagId
            tag {
              id
              label
              color
              icon
              category
            }
            createdAt
            updatedAt
          }
          total
        }
      }
    `;

    const resp = await graphqlClient.request<
      {
        actionPathRegistries: {
          items: Array<{
            id: string;
            actionPath: string;
            description?: string | null;
            targetType: string;
            mapping: Record<string, unknown>;
            conditions?: Array<{
              field: string;
              operator: "lt" | "gt" | "eq" | "lte" | "gte";
              value: string;
              tagId: string;
            }> | null;
            autoTagRules?: unknown;
            schema?: unknown;
            groupId?: string | null;
            position: number;
            group?: {
              id: string;
              path: string;
              description?: string | null;
            } | null;
            tagId?: string | null;
            tag?: {
              id: string;
              label: string;
              color?: string | null;
              icon?: string | null;
              category?: string | null;
            } | null;
            createdAt: string;
            updatedAt: string;
          }>;
          total: number;
        };
      },
      { limit?: number; offset?: number; targetType?: string }
    >({
      query,
      variables: {
        limit: params?.limit,
        offset: params?.offset,
        targetType: params?.targetType,
      },
      operationName: "ActionPathRegistries",
    });

    return resp.actionPathRegistries;
  },
  updateOrder: async (
    input: Array<{ id: string; groupId?: string | null; position: number }>,
  ) => {
    const query = `
      mutation UpdateActionPathRegistriesOrder($input: [UpdateActionPathRegistryOrderInput!]!) {
        updateActionPathRegistriesOrder(input: $input)
      }
    `;

    const resp = await graphqlClient.request<
      { updateActionPathRegistriesOrder: boolean },
      {
        input: Array<{ id: string; groupId?: string | null; position: number }>;
      }
    >({
      query,
      variables: {
        input,
      },
      operationName: "UpdateActionPathRegistriesOrder",
    });

    return resp.updateActionPathRegistriesOrder;
  },
  upsert: async (params: {
    description?: string;
    actionPath: string;
    targetType: string;
    mappingJson: string;
    conditionsJson?: string;
    autoTagRulesJson?: string;
    schemaJson?: string;
    tagId?: string | null;
  }) => {
    const query = `
      mutation UpsertActionPathRegistry($actionPath: String!, $targetType: String!, $mappingJson: String!, $conditionsJson: String, $autoTagRulesJson: String, $schemaJson: String, $tagId: ID, $description: String) {
        upsertActionPathRegistry(actionPath: $actionPath, targetType: $targetType, mappingJson: $mappingJson, conditionsJson: $conditionsJson, autoTagRulesJson: $autoTagRulesJson, schemaJson: $schemaJson, tagId: $tagId, description: $description)
      }
    `;

    const resp = await graphqlClient.request<
      { upsertActionPathRegistry: boolean },
      {
        actionPath: string;
        targetType: string;
        mappingJson: string;
        conditionsJson?: string;
        autoTagRulesJson?: string;
        schemaJson?: string;
        tagId?: string | null;
        description?: string;
      }
    >({
      query,
      variables: {
        actionPath: params.actionPath,
        targetType: params.targetType,
        mappingJson: params.mappingJson,
        conditionsJson: params.conditionsJson,
        autoTagRulesJson: params.autoTagRulesJson,
        schemaJson: params.schemaJson,
        tagId: params.tagId,
        description: params.description,
      },
      operationName: "UpsertActionPathRegistry",
    });

    return resp.upsertActionPathRegistry;
  },
};
