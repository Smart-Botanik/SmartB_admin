import { graphqlClient } from "@/services/graphql/client";

export const plantEventsService = {
  createPlantEvent: async (params: {
    plantId: string;
    actionPath: string;
    payloadJson: string;
  }) => {
    const query = `
      mutation CreatePlantEvent($plantId: ID!, $actionPath: String!, $payloadJson: String!) {
        createPlantEvent(plantId: $plantId, actionPath: $actionPath, payloadJson: $payloadJson) {
          id
          name
          current
          createdAt
          updatedAt
        }
      }
    `;

    const resp = await graphqlClient.request<
      {
        createPlantEvent: {
          id: string;
          name: string;
          current: unknown;
          createdAt: string;
          updatedAt: string;
        };
      },
      { plantId: string; actionPath: string; payloadJson: string }
    >({
      query,
      variables: {
        plantId: params.plantId,
        actionPath: params.actionPath,
        payloadJson: params.payloadJson,
      },
      operationName: "CreatePlantEvent",
    });

    return resp.createPlantEvent;
  },
};
