// Environment configuration for the admin frontend

export interface EnvConfig {
  apiUrl: string;
  apiTimeout: number;
  jwtRefreshInterval: number;
  appName: string;
  appVersion: string;
  enableDebug: boolean;
  enableAnalytics: boolean;
  sentryDsn?: string;
  googleAnalyticsId?: string;
}

// Get environment variables with fallbacks
export const getEnvConfig = (): EnvConfig => {
  return {
    apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3001",
    apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
    jwtRefreshInterval:
      Number(import.meta.env.VITE_JWT_REFRESH_INTERVAL) || 300000,
    appName: import.meta.env.VITE_APP_NAME || "Growing App Admin",
    appVersion: import.meta.env.VITE_APP_VERSION || "1.0.0",
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === "true",
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  };
};

// Export singleton instance
export const envConfig = getEnvConfig();

// Development helpers
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const isTest = import.meta.env.MODE === "test";

// Debug logging utility
export const debugLog = (...args: any[]) => {
  if (envConfig.enableDebug) {
    console.log("[DEBUG]", ...args);
  }
};

export default envConfig;
