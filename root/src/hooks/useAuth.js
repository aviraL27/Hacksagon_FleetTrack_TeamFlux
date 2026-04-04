import { useAuthStore } from '../store/authStore';
import { isTokenValid } from '../utils/auth';

export default function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const register = useAuthStore((state) => state.register);
  const setSession = useAuthStore((state) => state.setSession);
  const tenant = useAuthStore((state) => state.tenant);
  const user = useAuthStore((state) => state.user);

  return {
    accessToken,
    clearSession,
    hasHydrated,
    initializeAuth,
    isAuthenticated: isTokenValid(accessToken),
    isBootstrapping,
    login,
    logout,
    refreshSession,
    register,
    setSession,
    tenant,
    tenantId: tenant?.tenantSlug || tenant?.domainPrefix || null,
    token: accessToken,
    user,
  };
}
