import type { AdminLocation, UpdateAdminLocationInput } from "@/types/location";
import { graphqlClient } from "@/services/graphql";

export interface LocationsListParams {
  limit?: number;
  offset?: number;
}

interface LocationsQueryResponse {
  locations: AdminLocation[];
}

const LOCATIONS_QUERY = `
  query AdminLocations($limit: Int, $offset: Int) {
    locations(limit: $limit, offset: $offset) {
      id
      userId
      name
      status
      type
      subType
      wateringType
      description
      capacity
      occupiedSlots
      createdAt
      updatedAt
    }
  }
`;

const LOCATION_QUERY = `
  query AdminLocation($id: ID!) {
    location(id: $id) {
      id
      userId
      name
      status
      type
      subType
      wateringType
      description
      capacity
      occupiedSlots
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_LOCATION_MUTATION = `
  mutation AdminUpdateLocation($id: ID!, $input: UpdateLocationInput!) {
    updateLocation(id: $id, input: $input) {
      id
      userId
      name
      status
      type
      subType
      wateringType
      description
      capacity
      occupiedSlots
      createdAt
      updatedAt
    }
  }
`;

interface LocationQueryResponse {
  location: AdminLocation | null;
}

interface UpdateLocationResponse {
  updateLocation: AdminLocation;
}

class LocationsService {
  async list(params: LocationsListParams = {}) {
    const data = await graphqlClient.request<
      LocationsQueryResponse,
      LocationsListParams
    >({
      query: LOCATIONS_QUERY,
      variables: {
        limit: params.limit ?? 200,
        offset: params.offset ?? 0,
      },
      operationName: "AdminLocations",
    });
    return { items: data.locations, total: data.locations.length };
  }

  async getById(id: string) {
    const data = await graphqlClient.request<LocationQueryResponse, { id: string }>(
      {
        query: LOCATION_QUERY,
        variables: { id },
        operationName: "AdminLocation",
      },
    );
    return data.location;
  }

  async update(id: string, input: UpdateAdminLocationInput) {
    const data = await graphqlClient.request<
      UpdateLocationResponse,
      { id: string; input: UpdateAdminLocationInput }
    >({
      query: UPDATE_LOCATION_MUTATION,
      variables: { id, input },
      operationName: "AdminUpdateLocation",
    });
    return data.updateLocation;
  }
}

export const locationsService = new LocationsService();
