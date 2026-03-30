import { User } from "@/types/auth";

/**
 * Get user initials from name
 */
export const getUserInitials = (user: User): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName.charAt(0).toUpperCase();
  }
  return user.username?.charAt(0).toUpperCase() || "U";
};

/**
 * Format user display name
 */
export const getUserDisplayName = (user: User): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  return user.username || "Unknown User";
};

/**
 * Check if user has specific role
 */
export const hasRole = (user: User | null, role: string): boolean => {
  if (!user) return false;
  return user.role === role;
};

/**
 * Check if user is admin
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, "ADMIN");
};

/**
 * Format user creation date
 */
export const formatUserCreationDate = (user: User): string => {
  if (!user.createdAt) return "Unknown";
  return new Date(user.createdAt).toLocaleDateString();
};
