import axios, { AxiosError, AxiosInstance } from "axios";
import { envConfig } from "@/config/env";
import { getAccessToken, clearTokens } from "@/utils/token";

export interface GraphqlErrorItem {
  message: string;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

export interface GraphqlResponse<TData> {
  data?: TData;
  errors?: GraphqlErrorItem[];
}

export class GraphqlRequestError extends Error {
  public readonly graphQLErrors?: GraphqlErrorItem[];
  public readonly statusCode?: number;

  constructor(params: {
    message: string;
    graphQLErrors?: GraphqlErrorItem[];
    statusCode?: number;
  }) {
    super(params.message);
    this.name = "GraphqlRequestError";
    this.graphQLErrors = params.graphQLErrors;
    this.statusCode = params.statusCode;
  }
}

class GraphqlClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: envConfig.apiUrl,
      timeout: envConfig.apiTimeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: false,
    });

    this.client.interceptors.request.use((config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (resp) => resp,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          clearTokens();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      },
    );
  }

  async request<
    TData,
    TVariables extends object = Record<string, never>,
  >(params: {
    query: string;
    variables?: TVariables;
    operationName?: string;
  }): Promise<TData> {
    try {
      const response = await this.client.post<GraphqlResponse<TData>>(
        "/graphql",
        {
          query: params.query,
          variables: params.variables,
          operationName: params.operationName,
        },
      );

      if (response.data.errors?.length) {
        throw new GraphqlRequestError({
          message: response.data.errors[0]?.message ?? "GraphQL request failed",
          graphQLErrors: response.data.errors,
          statusCode: response.status,
        });
      }

      if (!response.data.data) {
        throw new GraphqlRequestError({
          message: "Empty GraphQL response",
          statusCode: response.status,
        });
      }

      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        throw new GraphqlRequestError({
          message:
            (error.response?.data as any)?.message ??
            error.message ??
            "GraphQL network error",
          statusCode,
        });
      }

      throw error;
    }
  }
}

export const graphqlClient = new GraphqlClient();
