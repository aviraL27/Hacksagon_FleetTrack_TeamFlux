import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { LoadingScreen } from '../components/ui';
import useAuth from '../hooks/useAuth';

export default function ProtectedRoute() {
  const { hasHydrated, isAuthenticated } = useAuth();

  if (!hasHydrated) {
    return <LoadingScreen label="Restoring your workspace" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
