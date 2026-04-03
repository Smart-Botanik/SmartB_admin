export type EventScope = "entity" | "field";

export type EventTargetType = "plant" | "diary";

export type EventAction = "create" | "update" | "delete";

export interface EventActor {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface BaseEvent {
  id: string;
  scope: EventScope;
  targetType: EventTargetType;
  targetId: string;
  action: EventAction;
  createdAt: string;
  updatedAt?: string;
  createdBy?: EventActor;
  title?: string;
  message?: string;
}

export interface EntityEvent extends BaseEvent {
  scope: "entity";
  data?: Record<string, unknown>;
}

export interface FieldEvent extends BaseEvent {
  scope: "field";
  fieldPath: string;
  from?: unknown;
  to?: unknown;
}

export type AppEvent = EntityEvent | FieldEvent;

export interface EventsListParams {
  limit?: number;
  offset?: number;
  query?: string;
  scope?: EventScope;
  targetType?: EventTargetType;
  targetId?: string;
  fieldPath?: string;
  action?: EventAction;
  createdById?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export interface EventsListResponse {
  items: AppEvent[];
  total: number;
}
