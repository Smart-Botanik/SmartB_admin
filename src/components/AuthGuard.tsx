import React, { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '@/contexts/AuthContext'

interface AuthGuardProps {
  children: ReactNode
  requireRole?: 'admin' | 'user'
  fallbackPath?: string
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireRole,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
        }}
      >
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#666' }}>Loading...</div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // Check role requirements
  if (requireRole && user?.role !== requireRole) {
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ from: location }} 
        replace 
      />
    )
  }

  return <>{children}</>
}

// Higher-order component for protecting routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requireRole?: 'admin' | 'user'
) => {
  const WrappedComponent = (props: P) => (
    <AuthGuard requireRole={requireRole}>
      <Component {...props} />
    </AuthGuard>
  )
  
  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Component for public routes that should redirect if already authenticated
export const PublicRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (isAuthenticated) {
    // Redirect to the page they were trying to access, or dashboard
    const from = location.state?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}

// Component for admin-only routes
export const AdminRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthGuard requireRole="admin" fallbackPath="/login">
      {children}
    </AuthGuard>
  )
}

// Component for user routes (admin or user)
export const UserRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthGuard requireRole="user" fallbackPath="/login">
      {children}
    </AuthGuard>
  )
}

export default AuthGuard
