import { apiService } from "@/services/api";
import type {
  AppEvent,
  EventsListParams,
  EventsListResponse,
  FieldEvent,
} from "@/types/event";

const mockEvents: AppEvent[] = [
  {
    id: "evt_1",
    scope: "entity",
    targetType: "plant",
    targetId: "plant_123",
    action: "update",
    title: "Plant updated",
    message: "Updated plant profile fields",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    createdBy: { id: "admin_1", email: "admin@example.com" },
    data: { changed: ["name", "strain"] },
  },
  {
    id: "evt_2",
    scope: "entity",
    targetType: "diary",
    targetId: "diary_456",
    action: "create",
    title: "Diary created",
    message: "Created a new diary entry",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    createdBy: { id: "user_1", email: "user@example.com" },
    data: { mood: "good" },
  },
  {
    id: "evt_3",
    scope: "field",
    targetType: "plant",
    targetId: "plant_123",
    action: "update",
    fieldPath: "potSize",
    from: "5L",
    to: "10L",
    title: "Pot size changed",
    message: "Admin changed pot size",
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    createdBy: { id: "admin_1", email: "admin@example.com" },
  },
];

class EventsService {
  async list(params: EventsListParams = {}): Promise<EventsListResponse> {
    try {
      return await apiService.get<EventsListResponse>("/api/events", params);
    } catch {
      const filtered = mockEvents.filter((e) => {
        if (params.scope && e.scope !== params.scope) return false;
        if (params.targetType && e.targetType !== params.targetType) return false;
        if (params.targetId && e.targetId !== params.targetId) return false;
        if (params.action && e.action !== params.action) return false;
        if (params.fieldPath && e.scope === "field") {
          if ((e as FieldEvent).fieldPath !== params.fieldPath) return false;
        }
        if (params.query) {
          const q = params.query.toLowerCase();
          const hay = `${e.title ?? ""} ${e.message ?? ""} ${e.targetId}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      const limit = params.limit ?? 20;
      const offset = params.offset ?? 0;
      return {
        items: filtered.slice(offset, offset + limit),
        total: filtered.length,
      };
    }
  }

  async getById(id: string): Promise<AppEvent> {
    try {
      return await apiService.get<AppEvent>(`/api/events/${id}`);
    } catch {
      const found = mockEvents.find((e) => e.id === id);
      if (!found) throw new Error("Event not found");
      return found;
    }
  }

  async update(id: string, data: Partial<AppEvent>): Promise<AppEvent> {
    try {
      return await apiService.patch<AppEvent>(`/api/events/${id}`, data);
    } catch {
      const found = mockEvents.find((e) => e.id === id);
      if (!found) throw new Error("Event not found");
      const updated = { ...found, ...data, updatedAt: new Date().toISOString() } as AppEvent;
      return updated;
    }
  }
}

export const eventsService = new EventsService();
