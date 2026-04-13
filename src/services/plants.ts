import { graphqlClient } from "@/services/graphql/client";

export interface PlantLocationSummary {
  id: string;
  name: string;
}

export interface PlantListItem {
  id: string;
  name: string;
  current?: unknown;
  locationId?: string | null;
  location?: PlantLocationSummary | null;
  createdAt: string;
  updatedAt: string;
}

function plantFieldsGql() {
  return `
    id
    name
    current
    locationId
    location {
      id
      name
    }
    createdAt
    updatedAt
  `;
}

export const plantsService = {
  list: async (params?: { limit?: number; offset?: number }) => {
    const query = `
      query Plants($limit: Int, $offset: Int) {
        plants(limit: $limit, offset: $offset) {
          ${plantFieldsGql()}
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
          ${plantFieldsGql()}
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

  create: async (input: { name: string }) => {
    const query = `
      mutation CreatePlant($input: CreatePlantInput!) {
        createPlant(input: $input) {
          ${plantFieldsGql()}
        }
      }
    `;

    const resp = await graphqlClient.request<
      { createPlant: PlantListItem },
      { input: { name: string } }
    >({
      query,
      variables: { input: { name: input.name.trim() } },
      operationName: "CreatePlant",
    });

    return resp.createPlant;
  },

  update: async (id: string, input: { name?: string }) => {
    const query = `
      mutation UpdatePlant($id: ID!, $input: UpdatePlantInput!) {
        updatePlant(id: $id, input: $input) {
          ${plantFieldsGql()}
        }
      }
    `;

    const resp = await graphqlClient.request<
      { updatePlant: PlantListItem },
      { id: string; input: { name?: string } }
    >({
      query,
      variables: {
        id,
        input: input.name !== undefined ? { name: input.name.trim() } : {},
      },
      operationName: "UpdatePlant",
    });

    return resp.updatePlant;
  },

  delete: async (id: string) => {
    const query = `
      mutation DeletePlant($id: ID!) {
        deletePlant(id: $id)
      }
    `;

    const resp = await graphqlClient.request<
      { deletePlant: boolean },
      { id: string }
    >({
      query,
      variables: { id },
      operationName: "DeletePlant",
    });

    return resp.deletePlant;
  },
};
