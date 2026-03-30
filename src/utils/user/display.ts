/**
 * Get user display name
 */
export const getUserDisplayName = (user: {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
}): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  return user.username || user.email || "Unknown User";
};

/**
 * Get user initials for avatar
 */
export const getUserInitials = (user: {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
}): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName[0].toUpperCase();
  }
  if (user.email) {
    return user.email.substring(0, 2).toUpperCase();
  }
  return user.username?.charAt(0).toUpperCase() || "U";
};

/**
 * Check if user has admin role
 */
export const isAdmin = (user: { role?: string }): boolean => {
  return user.role === "admin";
};

/**
 * Check if user has specific role
 */
export const hasRole = (
  user: { role?: string } | null,
  role: string,
): boolean => {
  if (!user) return false;
  return user.role === role;
};
