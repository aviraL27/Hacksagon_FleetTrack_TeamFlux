import React, { useEffect } from 'react';
import AppRoutes from './routes/index';
import { ThemeProvider } from './context/ThemeContext';
import { useAuthStore } from './store/authStore';

function SessionBootstrap() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <SessionBootstrap />
      <AppRoutes />
    </ThemeProvider>
  );
}
