import { graphqlClient } from "@/services/graphql/client";

export interface TagItem {
  id: string;
  label: string;
  targetType?: string | null;
  color?: string | null;
  icon?: string | null;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TagListItem = TagItem;

function tagFieldsGql() {
  return `
    id
    label
    targetType
    color
    icon
    category
    createdAt
    updatedAt
  `;
}

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
            ${tagFieldsGql()}
          }
          total
        }
      }
    `;

    const resp = await graphqlClient.request<
      { tags: { items: TagItem[]; total: number } },
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

  create: async (input: {
    label: string;
    targetType?: string;
    color?: string;
    icon?: string;
    category?: string;
  }) => {
    const query = `
      mutation CreateTag($label: String!, $targetType: String, $color: String, $icon: String, $category: String) {
        createTag(label: $label, targetType: $targetType, color: $color, icon: $icon, category: $category) {
          ${tagFieldsGql()}
        }
      }
    `;

    const resp = await graphqlClient.request<
      { createTag: TagItem },
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
        label: input.label.trim(),
        targetType: input.targetType,
        color: input.color,
        icon: input.icon,
        category: input.category,
      },
      operationName: "CreateTag",
    });

    return resp.createTag;
  },

  update: async (
    idOrInput:
      | string
      | {
          id: string;
          label?: string | null;
          targetType?: string | null;
          color?: string | null;
          icon?: string | null;
          category?: string | null;
        },
    maybeInput?: {
      label?: string;
      targetType?: string;
      color?: string;
      icon?: string;
      category?: string;
    },
  ) => {
    const id = typeof idOrInput === "string" ? idOrInput : idOrInput.id;
    const input =
      typeof idOrInput === "string"
        ? maybeInput
        : {
            label: idOrInput.label ?? undefined,
            targetType: idOrInput.targetType ?? undefined,
            color: idOrInput.color ?? undefined,
            icon: idOrInput.icon ?? undefined,
            category: idOrInput.category ?? undefined,
          };

    if (!input) {
      throw new Error("Tag update input is required");
    }

    const query = `
      mutation UpdateTag($id: ID!, $label: String, $targetType: String, $color: String, $icon: String, $category: String) {
        updateTag(id: $id, label: $label, targetType: $targetType, color: $color, icon: $icon, category: $category) {
          ${tagFieldsGql()}
        }
      }
    `;

    const resp = await graphqlClient.request<
      { updateTag: TagItem },
      {
        id: string;
        label?: string;
        targetType?: string;
        color?: string;
        icon?: string;
        category?: string;
      }
    >({
      query,
      variables: {
        id,
        label: input.label?.trim(),
        targetType: input.targetType,
        color: input.color,
        icon: input.icon,
        category: input.category,
      },
      operationName: "UpdateTag",
    });

    return resp.updateTag;
  },

  delete: async (idOrInput: string | { id: string }) => {
    const id = typeof idOrInput === "string" ? idOrInput : idOrInput.id;
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
      variables: { id },
      operationName: "DeleteTag",
    });

    return resp.deleteTag;
  },
};
