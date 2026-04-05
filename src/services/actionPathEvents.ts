import { graphqlClient } from "@/services/graphql/client";

export interface ActionPathEvent {
  id: string;
  actionPath: string;
  targetType: string;
  targetId: string;
  payload: unknown;
  timestamp: string;
  isSystem: boolean;
}

export interface EventsListParams {
  limit?: number;
  offset?: number;
  targetType?: string;
  targetId?: string;
  actionPath?: string;
  isSystem?: boolean;
}

export interface EventsListResponse {
  items: ActionPathEvent[];
  total: number;
}

export const actionPathEventsService = {
  list: async (params: EventsListParams = {}): Promise<EventsListResponse> => {
    const query = `
      query Events(
        $limit: Int
        $offset: Int
        $targetType: String
        $targetId: String
        $actionPath: String
        $isSystem: Boolean
      ) {
        events(
          limit: $limit
          offset: $offset
          targetType: $targetType
          targetId: $targetId
          actionPath: $actionPath
          isSystem: $isSystem
        ) {
          total
          items {
            id
            actionPath
            targetType
            targetId
            payload
            timestamp
            isSystem
          }
        }
      }
    `;

    const resp = await graphqlClient.request<
      { events: EventsListResponse },
      {
        limit?: number;
        offset?: number;
        targetType?: string;
        targetId?: string;
        actionPath?: string;
        isSystem?: boolean;
      }
    >({
      query,
      variables: {
        limit: params.limit,
        offset: params.offset,
        targetType: params.targetType,
        targetId: params.targetId,
        actionPath: params.actionPath,
        isSystem: params.isSystem,
      },
      operationName: "Events",
    });

    return resp.events;
  },
};
