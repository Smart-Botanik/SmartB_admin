import { graphqlClient } from "@/services/graphql/client";

export interface PlantListItem {
  id: string;
  name: string;
  current?: unknown;
  createdAt: string;
  updatedAt: string;
}

export const plantsService = {
  list: async (params?: { limit?: number; offset?: number }) => {
    const query = `
      query Plants($limit: Int, $offset: Int) {
        plants(limit: $limit, offset: $offset) {
          id
          name
          current
          createdAt
          updatedAt
        }
      }
    `;

    const resp = await graphqlClient.request<
      { plants: PlantListItem[] },
      { limit?: number; offset?: number }
    >({
      query,
      variables: {
        limit: params?.limit,
        offset: params?.offset,
      },
      operationName: "Plants",
    });

    return resp.plants;
  },
  getById: async (id: string) => {
    const query = `
      query Plant($id: ID!) {
        plant(id: $id) {
          id
          name
          current
          createdAt
          updatedAt
        }
      }
    `;

    const resp = await graphqlClient.request<
      { plant: PlantListItem | null },
      { id: string }
    >({
      query,
      variables: { id },
      operationName: "Plant",
    });

    return resp.plant;
  },
};
