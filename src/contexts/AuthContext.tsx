import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { authApi } from "@/services/auth";
import {
  getStoredTokens,
  storeTokens,
  clearTokens,
  isTokenValid,
  parseToken,
} from "@/utils/token";
import {
  AuthState,
  AuthContextType,
  LoginRequest,
  User,
  STORAGE_KEYS,
  AuthTokens,
} from "@/types/auth";

// Action types
type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User } }
  | { type: "AUTH_FAILURE"; payload: { error: string } }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "UPDATE_USER"; payload: { user: Partial<User> } }
  | { type: "SET_LOADING"; payload: { loading: boolean } };

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loading: false,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        tokens: getStoredTokens(),
        loading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: action.payload.error,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload.user } : null,
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload.loading,
      };
    default:
      return state;
  }
};

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const tokens = getStoredTokens();

      if (tokens && isTokenValid(tokens.accessToken)) {
        try {
          dispatch({ type: "AUTH_START" });

          // First, try to load user data from localStorage for immediate UI
          const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
          if (storedUserData) {
            try {
              const parsedUser = JSON.parse(storedUserData);
              dispatch({
                type: "AUTH_SUCCESS",
                payload: { user: parsedUser },
              });
            } catch (parseError) {
              console.warn("Failed to parse stored user data:", parseError);
            }
          }

          // Then validate token with backend and get fresh user data
          const user = await authApi.getCurrentUser();
          const payload = parseToken(tokens.accessToken);
          const userWithRole: User = {
            ...user,
            role: user?.role ?? payload?.role,
          };

          // Store fresh user data
          localStorage.setItem(
            STORAGE_KEYS.USER_DATA,
            JSON.stringify(userWithRole),
          );

          dispatch({
            type: "AUTH_SUCCESS",
            payload: { user: userWithRole },
          });
        } catch (error) {
          // Token is invalid, clear everything
          clearTokens();
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          dispatch({
            type: "AUTH_FAILURE",
            payload: { error: "Session expired. Please login again." },
          });
        }
      } else {
        // Clear any invalid tokens and user data
        clearTokens();
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      dispatch({ type: "AUTH_START" });

      const response = await authApi.login(credentials);

      // Validate response structure
      if (!response || !response.jwt) {
        throw new Error("Invalid login response: missing JWT token");
      }

      // Parse JWT to get expiration time
      const payload = parseToken(response.jwt);
      if (!payload) {
        throw new Error("Invalid JWT token format");
      }

      // Create tokens object from JWT
      const tokens: AuthTokens = {
        accessToken: response.jwt,
        refreshToken: response.jwt, // Using same JWT as refresh token for now
        expiresAt: payload.exp * 1000, // Convert to milliseconds
      };

      // Store tokens
      storeTokens(tokens);

      // Store user data
      if (!response.user) {
        throw new Error("Invalid login response: missing user data");
      }

      const userWithRole: User = {
        ...response.user,
        role: response.user.role ?? payload.role,
      };

      localStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(userWithRole),
      );

      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: userWithRole },
      });
    } catch (error: any) {
      const errorMessage = error.message || "Login failed. Please try again.";
      dispatch({
        type: "AUTH_FAILURE",
        payload: { error: errorMessage },
      });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearTokens();
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      dispatch({ type: "LOGOUT" });
    }
  };

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      await authApi.refreshToken();

      // Update tokens in state (note: user data remains the same)
      dispatch({
        type: "SET_LOADING",
        payload: { loading: false },
      });
    } catch (error: any) {
      const errorMessage =
        error.message || "Session expired. Please login again.";
      dispatch({
        type: "AUTH_FAILURE",
        payload: { error: errorMessage },
      });
      throw error;
    }
  }, []);

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // Update user function
  const updateUser = (userData: Partial<User>): void => {
    if (state.user) {
      const updatedUser = { ...state.user, ...userData };
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      dispatch({
        type: "UPDATE_USER",
        payload: { user: userData },
      });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    clearError,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Hook to check if user has specific role
export const useAuthRole = (requiredRole: "admin" | "user"): boolean => {
  const { user } = useAuth();
  const actual = user?.role?.toString().toLowerCase();
  return actual === requiredRole;
};

// Hook to check if user is authenticated
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

export default AuthContext;
