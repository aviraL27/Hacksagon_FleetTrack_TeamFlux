import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingScreen } from '../components/ui';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import useAuth from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';
import LogoutRoute from './LogoutRoute';

import Login from '../pages/Login';
import Register from '../pages/Register';
import Landing from '../pages/Landing';
import Dashboard from '../pages/Dashboard';
import Fleet from '../pages/Fleet';
import Drivers from '../pages/Drivers';
import Orders from '../pages/Orders';
import LiveTracking from '../pages/LiveTracking';
import Maintenance from '../pages/Maintenance';
import Settings from '../pages/Settings';

function HomeRedirect() {
  const { hasHydrated, isAuthenticated } = useAuth();

  if (!hasHydrated) {
    return <LoadingScreen label="Preparing your workspace" />;
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

function GuestOnly({ children }) {
  const { hasHydrated, isAuthenticated } = useAuth();

  if (!hasHydrated) {
    return <LoadingScreen label="Checking secure access" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/logout" element={<LogoutRoute />} />

        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <GuestOnly>
                <Login />
              </GuestOnly>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnly>
                <Register />
              </GuestOnly>
            }
          />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/driver" element={<Navigate to="/drivers" replace />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/tracking" element={<LiveTracking />} />
            <Route path="/live-tracking" element={<Navigate to="/tracking" replace />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
