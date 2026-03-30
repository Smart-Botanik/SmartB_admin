import { message } from "antd";
import { ApiError } from "@/types/auth";

/**
 * Handle authentication errors and show appropriate user feedback
 */
export const handleAuthError = (error: ApiError | unknown): string => {
  let errorMessage = "An unexpected error occurred";

  if (error && typeof error === "object" && "message" in error) {
    errorMessage = (error as ApiError).message;
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  // Show user-friendly message
  showUserFriendlyError(errorMessage);

  return errorMessage;
};

/**
 * Show user-friendly error messages based on error type
 */
const showUserFriendlyError = (errorText: string): void => {
  const lowerMessage = errorText.toLowerCase();

  if (
    lowerMessage.includes("invalid") ||
    lowerMessage.includes("credentials")
  ) {
    message.error("Invalid email or password. Please try again.");
  } else if (
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("forbidden")
  ) {
    message.error("You are not authorized to perform this action.");
  } else if (
    lowerMessage.includes("expired") ||
    lowerMessage.includes("token")
  ) {
    message.error("Your session has expired. Please login again.");
  } else if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("connection")
  ) {
    message.error(
      "Network error. Please check your connection and try again.",
    );
  } else if (
    lowerMessage.includes("too many") ||
    lowerMessage.includes("rate")
  ) {
    message.error("Too many attempts. Please try again later.");
  } else {
    message.error(errorText);
  }
};

/**
 * Handle successful authentication actions
 */
export const handleAuthSuccess = (
  action: "login" | "logout" | "register" | "profile",
): void => {
  switch (action) {
    case "login":
      message.success("Login successful!");
      break;
    case "logout":
      message.success("Logged out successfully");
      break;
    case "register":
      message.success("Registration successful!");
      break;
    case "profile":
      message.success("Profile updated successfully");
      break;
  }
};

/**
 * Show loading message for authentication actions
 */
export const showLoadingMessage = (action: "login" | "logout" | "register"): void => {
  const loadingMessages = {
    login: "Signing in...",
    logout: "Signing out...",
    register: "Creating account...",
  };

  message.loading(loadingMessages[action], 0);
};
