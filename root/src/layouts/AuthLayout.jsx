import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeToggle } from '../components/ui';

export default function AuthLayout() {
  return (
    <div className="app-shell min-h-screen bg-[var(--app-bg)] text-[var(--text)] antialiased">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <main className="flex min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
