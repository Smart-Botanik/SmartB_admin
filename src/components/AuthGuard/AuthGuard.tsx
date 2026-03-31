import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "@/contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <Spin size="large" />
        <div>Checking authentication...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Higher-order component for protecting routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: "admin" | "user",
) => {
  return (props: P) => (
    <AuthGuard requiredRole={requiredRole}>
      <Component {...props} />
    </AuthGuard>
  );
};

// Public route component (redirects authenticated users away)
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    // Redirect to the page they were trying to access, or dashboard
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

// Role-specific guard components
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <AuthGuard requiredRole="admin">{children}</AuthGuard>;

export const UserRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <AuthGuard requiredRole="user">{children}</AuthGuard>;

export default AuthGuard;
