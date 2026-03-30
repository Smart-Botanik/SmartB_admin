/**
 * Redirect to login with return URL
 */
export const redirectToLogin = (returnUrl?: string): void => {
  const currentPath = window.location.pathname;
  const redirectPath = returnUrl || currentPath;

  if (redirectPath !== "/login") {
    window.location.href = `/login?redirect=${encodeURIComponent(redirectPath)}`;
  } else {
    window.location.href = "/login";
  }
};
