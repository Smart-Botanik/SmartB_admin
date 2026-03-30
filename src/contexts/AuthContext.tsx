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
} from "@/utils/token";
import {
  AuthState,
  AuthContextType,
  LoginRequest,
  User,
  STORAGE_KEYS,
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

          // Validate token with backend
          const user = await authApi.getCurrentUser();

          // Store user data
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

          dispatch({
            type: "AUTH_SUCCESS",
            payload: { user },
          });
        } catch (error) {
          // Token is invalid, clear everything
          clearTokens();
          dispatch({
            type: "AUTH_FAILURE",
            payload: { error: "Session expired. Please login again." },
          });
        }
      } else {
        // Clear any invalid tokens
        clearTokens();
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      dispatch({ type: "AUTH_START" });

      const response = await authApi.login(credentials);

      // Store tokens
      storeTokens(response.tokens);

      // Store user data
      localStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(response.user),
      );

      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: response.user },
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
  return user?.role === requiredRole;
};

// Hook to check if user is authenticated
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

export default AuthContext;
