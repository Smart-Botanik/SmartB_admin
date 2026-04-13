import { graphqlClient } from "@/services/graphql/client";

export interface DiaryPlantSummary {
  id: string;
  name: string;
}

export interface DiaryListItem {
  id: string;
  title?: string | null;
  body: string;
  plants: DiaryPlantSummary[];
  createdAt: string;
  updatedAt: string;
}

function diaryFieldsGql() {
  return `
    id
    title
    body
    plants {
      id
      name
    }
    createdAt
    updatedAt
  `;
}

export const diariesService = {
  list: async (params?: { limit?: number; offset?: number }) => {
    const query = `
      query Diaries($limit: Int, $offset: Int) {
        diaries(limit: $limit, offset: $offset) {
          ${diaryFieldsGql()}
        }
      }
    `;

    const resp = await graphqlClient.request<
      { diaries: DiaryListItem[] },
      { limit?: number; offset?: number }
    >({
      query,
      variables: {
        limit: params?.limit,
        offset: params?.offset,
      },
      operationName: "Diaries",
    });

    return resp.diaries;
  },

  getById: async (id: string) => {
    const query = `
      query Diary($id: ID!) {
        diary(id: $id) {
          ${diaryFieldsGql()}
        }
      }
    `;

    const resp = await graphqlClient.request<
      { diary: DiaryListItem | null },
      { id: string }
    >({
      query,
      variables: { id },
      operationName: "Diary",
    });

    return resp.diary;
  },

  create: async (params: { title?: string | null; body: string }) => {
    const query = `
      mutation CreateDiary($input: CreateDiaryInput!) {
        createDiary(input: $input) {
          ${diaryFieldsGql()}
        }
      }
    `;

    const title =
      params.title === undefined || params.title === null
        ? null
        : String(params.title).trim() || null;

    const resp = await graphqlClient.request<
      { createDiary: DiaryListItem },
      { input: { title?: string | null; body: string } }
    >({
      query,
      variables: {
        input: {
          body: params.body.trim(),
          title,
        },
      },
      operationName: "CreateDiary",
    });

    return resp.createDiary;
  },

  update: async (
    id: string,
    input: { title?: string | null; body?: string },
  ) => {
    const query = `
      mutation UpdateDiary($id: ID!, $input: UpdateDiaryInput!) {
        updateDiary(id: $id, input: $input) {
          ${diaryFieldsGql()}
        }
      }
    `;

    const payload: { title?: string | null; body?: string } = {};
    if (input.title !== undefined) {
      const t = input.title;
      payload.title =
        t === null || t === "" ? null : String(t).trim() || null;
    }
    if (input.body !== undefined) {
      payload.body = input.body.trim();
    }

    const resp = await graphqlClient.request<
      { updateDiary: DiaryListItem },
      { id: string; input: typeof payload }
    >({
      query,
      variables: { id, input: payload },
      operationName: "UpdateDiary",
    });

    return resp.updateDiary;
  },

  delete: async (id: string) => {
    const query = `
      mutation DeleteDiary($id: ID!) {
        deleteDiary(id: $id)
      }
    `;

    const resp = await graphqlClient.request<
      { deleteDiary: boolean },
      { id: string }
    >({
      query,
      variables: { id },
      operationName: "DeleteDiary",
    });

    return resp.deleteDiary;
  },
};
