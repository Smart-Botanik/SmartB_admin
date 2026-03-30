/**
 * Format last login time
 */
export const formatLastLogin = (date: string | Date): string => {
  const loginDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - loginDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffMins / 1440);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
};

/**
 * Format user creation date
 */
export const formatUserCreationDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString();
};
