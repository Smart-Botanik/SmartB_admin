import { graphqlClient } from "@/services/graphql/client";

export type TagListItem = {
  id: string;
  label: string;
  targetType?: string | null;
  color?: string | null;
  icon?: string | null;
  category?: string | null;
};

export type TagCreateInput = {
  label: string;
  targetType?: string;
  color?: string;
  icon?: string;
  category?: string;
};

export type TagUpdateInput = {
  id: string;
  label?: string;
  targetType?: string | null;
  color?: string | null;
  icon?: string | null;
  category?: string | null;
};

export const tagsService = {
  list: async (params?: {
    limit?: number;
    offset?: number;
    query?: string;
    category?: string;
    targetType?: string;
  }) => {
    const query = `
      query Tags($limit: Int, $offset: Int, $query: String, $category: String, $targetType: String) {
        tags(limit: $limit, offset: $offset, query: $query, category: $category, targetType: $targetType) {
          items {
            id
            label
            targetType
            color
            icon
            category
            createdAt
            updatedAt
          }
          total
        }
      }
    `;

    const resp = await graphqlClient.request<
      {
        tags: {
          items: TagListItem[];
          total: number;
        };
      },
      {
        limit?: number;
        offset?: number;
        query?: string;
        category?: string;
        targetType?: string;
      }
    >({
      query,
      variables: {
        limit: params?.limit,
        offset: params?.offset,
        query: params?.query,
        category: params?.category,
        targetType: params?.targetType,
      },
      operationName: "Tags",
    });

    return resp.tags;
  },

  create: async (params: TagCreateInput) => {
    const query = `
      mutation CreateTag($label: String!, $targetType: String, $color: String, $icon: String, $category: String) {
        createTag(label: $label, targetType: $targetType, color: $color, icon: $icon, category: $category) {
          id
          label
          targetType
          color
          icon
          category
          createdAt
          updatedAt
        }
      }
    `;

    const resp = await graphqlClient.request<
      { createTag: TagListItem },
      {
        label: string;
        targetType?: string;
        color?: string;
        icon?: string;
        category?: string;
      }
    >({
      query,
      variables: {
        label: params.label,
        targetType: params.targetType,
        color: params.color,
        icon: params.icon,
        category: params.category,
      },
      operationName: "CreateTag",
    });

    return resp.createTag;
  },

  update: async (params: TagUpdateInput) => {
    const query = `
      mutation UpdateTag($id: ID!, $label: String, $targetType: String, $color: String, $icon: String, $category: String) {
        updateTag(id: $id, label: $label, targetType: $targetType, color: $color, icon: $icon, category: $category) {
          id
          label
          targetType
          color
          icon
          category
          createdAt
          updatedAt
        }
      }
    `;

    const resp = await graphqlClient.request<
      { updateTag: TagListItem },
      {
        id: string;
        label?: string;
        targetType?: string | null;
        color?: string | null;
        icon?: string | null;
        category?: string | null;
      }
    >({
      query,
      variables: {
        id: params.id,
        label: params.label,
        targetType: params.targetType,
        color: params.color,
        icon: params.icon,
        category: params.category,
      },
      operationName: "UpdateTag",
    });

    return resp.updateTag;
  },

  delete: async (params: { id: string }) => {
    const query = `
      mutation DeleteTag($id: ID!) {
        deleteTag(id: $id)
      }
    `;

    const resp = await graphqlClient.request<
      { deleteTag: boolean },
      { id: string }
    >({
      query,
      variables: {
        id: params.id,
      },
      operationName: "DeleteTag",
    });

    return resp.deleteTag;
  },
};
