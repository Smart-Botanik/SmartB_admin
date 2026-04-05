import { graphqlClient } from "@/services/graphql/client";

export const actionPathRegistryService = {
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
            targetType
            mapping
            conditions
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
            targetType: string;
            mapping: Record<string, unknown>;
            conditions?: Array<{
              field: string;
              operator: "lt" | "gt" | "eq" | "lte" | "gte";
              value: string;
              tagId: string;
            }> | null;
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
  upsert: async (params: {
    actionPath: string;
    targetType: string;
    mappingJson: string;
    conditionsJson?: string;
    tagId?: string | null;
  }) => {
    const query = `
      mutation UpsertActionPathRegistry($actionPath: String!, $targetType: String!, $mappingJson: String!, $conditionsJson: String, $tagId: ID) {
        upsertActionPathRegistry(actionPath: $actionPath, targetType: $targetType, mappingJson: $mappingJson, conditionsJson: $conditionsJson, tagId: $tagId)
      }
    `;

    const resp = await graphqlClient.request<
      { upsertActionPathRegistry: boolean },
      {
        actionPath: string;
        targetType: string;
        mappingJson: string;
        conditionsJson?: string;
        tagId?: string | null;
      }
    >({
      query,
      variables: {
        actionPath: params.actionPath,
        targetType: params.targetType,
        mappingJson: params.mappingJson,
        conditionsJson: params.conditionsJson,
        tagId: params.tagId,
      },
      operationName: "UpsertActionPathRegistry",
    });

    return resp.upsertActionPathRegistry;
  },
};
