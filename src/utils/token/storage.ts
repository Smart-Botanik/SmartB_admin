import { AuthTokens } from "@/types/auth";
import { STORAGE_KEYS } from "@/types/auth";

/**
 * Store authentication tokens in localStorage
 */
export const storeTokens = (tokens: AuthTokens): void => {
  try {
    if (!tokens) {
      throw new Error("Tokens object is undefined or null");
    }

    if (!tokens.accessToken) {
      throw new Error("Access token is missing");
    }

    if (!tokens.refreshToken) {
      throw new Error("Refresh token is missing");
    }

    if (!tokens.expiresAt) {
      throw new Error("Expiration time is missing");
    }

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    localStorage.setItem(
      STORAGE_KEYS.TOKEN_EXPIRES_AT,
      tokens.expiresAt.toString(),
    );
  } catch (error) {
    console.error("Failed to store tokens:", error);
    throw error; // Re-throw to let caller handle the error
  }
};

/**
 * Retrieve authentication tokens from localStorage
 */
export const getStoredTokens = (): AuthTokens | null => {
  try {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const expiresAtStr = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);

    if (!accessToken || !refreshToken || !expiresAtStr) return null;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt)) return null;

    return { accessToken, refreshToken, expiresAt };
  } catch (error) {
    console.error("Failed to retrieve tokens:", error);
    return null;
  }
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error("Failed to get access token:", error);
    return null;
  }
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error("Failed to get refresh token:", error);
    return null;
  }
};

/**
 * Clear all authentication tokens from localStorage
 */
export const clearTokens = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  } catch (error) {
    console.error("Failed to clear tokens:", error);
  }
};

/**
 * Check if tokens exist in localStorage
 */
export const hasStoredTokens = (): boolean => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  return !!(accessToken && refreshToken);
};
