import { restClient } from "@/services/restClient";

export type AdminAppRole = "USER" | "ADMIN";

export interface AdminUserRow {
  id: string;
  email: string;
  username: string;
  role: AdminAppRole;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const adminUsersService = {
  async list(params: AdminUsersListParams = {}) {
    const { data } = await restClient.get<{
      items: AdminUserRow[];
      total: number;
    }>("/admin/users", {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search?.trim() || undefined,
      },
    });
    return data;
  },

  async create(body: {
    email: string;
    username: string;
    password: string;
    role: AdminAppRole;
  }) {
    const { data } = await restClient.post<AdminUserRow>("/admin/users", body);
    return data;
  },
};
