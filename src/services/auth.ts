import axios, { AxiosInstance, AxiosError } from "axios";
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ApiError,
  STORAGE_KEYS,
} from "@/types/auth";
import { envConfig } from "@/config/env";
import { getAccessToken, getRefreshToken, clearTokens } from "@/utils/token";

class AuthApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: envConfig.apiUrl,
      timeout: envConfig.apiTimeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: false, // Important for CORS
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            const token = getAccessToken();
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            clearTokens();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Transform credentials to use identifier instead of email
      const loginData = {
        identifier: credentials.identifier,
        password: credentials.password,
      };

      const response = await this.api.post<LoginResponse>(
        "/auth/login",
        loginData,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.api.post("/auth/logout");
    } catch (error) {
      // Don't throw error for logout, just log it
      console.error("Logout error:", error);
    } finally {
      clearTokens();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await this.api.post<RefreshTokenResponse>(
        "/auth/refresh",
        {
          refreshToken,
        } as RefreshTokenRequest,
      );

      // Update the access token in storage
      localStorage.setItem(
        STORAGE_KEYS.ACCESS_TOKEN,
        response.data.accessToken,
      );
      localStorage.setItem(
        STORAGE_KEYS.TOKEN_EXPIRES_AT,
        response.data.expiresAt.toString(),
      );

      return response.data;
    } catch (error) {
      clearTokens();
      throw this.handleError(error);
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    try {
      const response = await this.api.get("/auth/me");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<any>) {
    try {
      const response = await this.api.put("/auth/profile", userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string) {
    try {
      const response = await this.api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    try {
      const response = await this.api.post("/auth/forgot-password", {
        email,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    try {
      const response = await this.api.post("/auth/reset-password", {
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string) {
    try {
      const response = await this.api.post("/auth/verify-email", {
        token,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors and return standardized error format
   */
  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const response = error.response;
      const message =
        response?.data?.message || error.message || "An error occurred";

      return {
        message,
        statusCode: response?.status,
        code: response?.data?.code,
      };
    }

    return {
      message: error.message || "An unexpected error occurred",
    };
  }

  /**
   * Clear all stored tokens
   */
  // private clearTokens(): void {
  //   localStorage.removeItem("admin_access_token");
  //   localStorage.removeItem("admin_refresh_token");
  //   localStorage.removeItem("admin_token_expires_at");
  //   localStorage.removeItem("admin_user_data");
  // }

  /**
   * Check if the API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.api.get("/health");
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const authApi = new AuthApiService();
export default authApi;
