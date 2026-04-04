import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LoadingScreen, ThemeToggle } from '../components/ui';
import { useDashboardStore } from '../store/dashboardStore';
import { useDriverStore } from '../store/driverStore';
import { useMaintenanceStore } from '../store/maintenanceStore';
import { useOrderStore } from '../store/orderStore';
import { useTeamStore } from '../store/teamStore';
import { useVehicleStore } from '../store/vehicleStore';
import useAuth from '../hooks/useAuth';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: 'dashboard' },
  { label: 'Fleet', to: '/fleet', icon: 'local_shipping' },
  { label: 'Live Tracking', to: '/tracking', icon: 'share' },
  { label: 'Drivers', to: '/drivers', icon: 'badge' },
  { label: 'Orders', to: '/orders', icon: 'inventory_2' },
  { label: 'Maintenance', to: '/maintenance', icon: 'build' },
  { label: 'Settings', to: '/settings', icon: 'settings' },
];

export default function DashboardLayout() {
  const fetchDrivers = useDriverStore((state) => state.fetchAll);
  const fetchDashboardSummary = useDashboardStore((state) => state.fetchSummary);
  const fetchMaintenance = useMaintenanceStore((state) => state.fetchAll);
  const fetchOrders = useOrderStore((state) => state.fetchAll);
  const fetchTeam = useTeamStore((state) => state.fetchAll);
  const fetchVehicles = useVehicleStore((state) => state.fetchAll);
  const user = useAuth().user;
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    Promise.allSettled([
      fetchVehicles(),
      fetchDrivers(),
      fetchOrders(),
      fetchMaintenance(),
      fetchTeam(),
      fetchDashboardSummary(),
    ]).finally(() => {
      if (isActive) {
        setIsWorkspaceReady(true);
      }
    });

    return () => {
      isActive = false;
    };
  }, [fetchDashboardSummary, fetchDrivers, fetchMaintenance, fetchOrders, fetchTeam, fetchVehicles]);

  if (!isWorkspaceReady) {
    return <LoadingScreen label="Syncing your fleet workspace" />;
  }

  return (
    <div className="app-shell min-h-screen bg-[var(--app-bg)] text-[var(--text)]">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-[var(--border)] [background:var(--sidebar-bg-gradient)] px-4 py-6 backdrop-blur-xl">
        <div className="px-3 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">
            FleetTrack
          </p>
          <h1 className="mt-3 font-headline text-2xl font-bold text-[var(--text)]">Operations</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Unified dispatch command center</p>
        </div>

        <nav aria-label="Dashboard navigation" className="grid flex-1 auto-rows-fr gap-2.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex h-full min-h-[58px] items-center gap-3 rounded-[22px] px-5 py-4 text-[15px] transition duration-200',
                  isActive
                    ? 'bg-[var(--accent-soft)] font-semibold text-[var(--text)] shadow-[inset_0_0_0_1px_var(--accent-outline)]'
                    : 'font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex w-5 justify-center">
                    {isActive ? (
                      <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
                    ) : null}
                  </span>
                  <span
                    className={[
                      'material-symbols-outlined text-[22px]',
                      isActive ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]',
                    ].join(' ')}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pt-5">
          <div className="mb-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3">
            <p className="font-subheading text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">
              Signed In
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--text)]">
              {user?.name || user?.email || 'Active session'}
            </p>
          </div>
          <NavLink
            to="/logout"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--panel-elevated)] px-4 text-sm font-semibold text-[var(--text)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--panel-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:ring-offset-2 focus:ring-offset-[var(--app-bg)]"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Sign Out
          </NavLink>
        </div>
      </aside>

      <main className="min-h-screen pl-[264px]">
        <div className="mx-auto min-h-screen max-w-[1580px] px-8 py-8 xl:px-10 xl:py-10">
          <div className="mb-6 flex justify-end">
            <ThemeToggle />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
