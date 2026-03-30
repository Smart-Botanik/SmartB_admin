// Authentication types and interfaces

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "user";
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresAt: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: Partial<User>) => void;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
}

// JWT token payload structure
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
  iat: number; // issued at
  exp: number; // expiration
}

// Permission types for RBAC
export type Permission =
  | "users:read"
  | "users:write"
  | "plants:read"
  | "plants:write"
  | "diaries:read"
  | "diaries:write"
  | "brands:read"
  | "brands:write"
  | "products:read"
  | "products:write"
  | "media:read"
  | "media:write"
  | "admin:access";

export interface RolePermissions {
  admin: Permission[];
  user: Permission[];
}

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "admin_access_token",
  REFRESH_TOKEN: "admin_refresh_token",
  USER_DATA: "admin_user_data",
  TOKEN_EXPIRES_AT: "admin_token_expires_at",
} as const;
