import axios, { AxiosError, AxiosInstance } from "axios";
import { envConfig } from "@/config/env";
import { getAccessToken, clearTokens } from "@/utils/token";

/** REST client with the same base URL and auth behavior as GraphQL. */
class RestClient {
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

  get instance(): AxiosInstance {
    return this.client;
  }
}

export const restClient = new RestClient().instance;
