import { create } from 'zustand';
import { authRequest } from '../services/authClient';
import { isTokenValid } from '../utils/auth';

let bootstrapPromise = null;
let refreshPromise = null;

function extractSession(session) {
  return {
    accessToken: session?.accessToken || null,
    tenant: session?.tenant || null,
    user: session?.user || null,
  };
}

export const useAuthStore = create((set, get) => ({
  accessToken: null,
  tenant: null,
  user: null,
  hasHydrated: false,
  isBootstrapping: false,
  setSession: (session) => {
    const nextSession = extractSession(session);
    set(nextSession);
    return nextSession;
  },
  clearSession: () => {
    set({
      accessToken: null,
      tenant: null,
      user: null,
    });
  },
  initializeAuth: async () => {
    if (bootstrapPromise) {
      return bootstrapPromise;
    }

    bootstrapPromise = (async () => {
      set({ isBootstrapping: true });

      try {
        const session = await authRequest('/auth/refresh', { method: 'POST' });
        get().setSession(session);
        return session;
      } catch {
        get().clearSession();
        return null;
      } finally {
        set({ hasHydrated: true, isBootstrapping: false });
        bootstrapPromise = null;
      }
    })();

    return bootstrapPromise;
  },
  login: async ({ email, password, rememberMe = false, tenantSlug }) => {
    const session = await authRequest('/auth/login', {
      method: 'POST',
      body: { email, password, rememberMe, tenantSlug },
    });

    get().setSession(session);
    set({ hasHydrated: true });
    return session;
  },
  register: async ({ companyName, email, password, rememberMe = false, tenantSlug }) => {
    const session = await authRequest('/auth/register', {
      method: 'POST',
      body: { companyName, email, password, rememberMe, tenantSlug },
    });

    get().setSession(session);
    set({ hasHydrated: true });
    return session;
  },
  refreshSession: async () => {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = authRequest('/auth/refresh', { method: 'POST' })
      .then((session) => {
        get().setSession(session);
        set({ hasHydrated: true });
        return session;
      })
      .catch((error) => {
        get().clearSession();
        set({ hasHydrated: true });
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });

    return refreshPromise;
  },
  logout: async () => {
    try {
      await authRequest('/auth/logout', { method: 'POST' });
    } finally {
      get().clearSession();
      set({ hasHydrated: true, isBootstrapping: false });
    }
  },
}));

export function getAuthSnapshot() {
  const { accessToken, hasHydrated, tenant, user } = useAuthStore.getState();

  return {
    accessToken,
    hasHydrated,
    isAuthenticated: isTokenValid(accessToken),
    tenant,
    tenantId: tenant?.tenantSlug || tenant?.domainPrefix || null,
    token: accessToken,
    user,
  };
}

export async function refreshAuthSession() {
  return useAuthStore.getState().refreshSession();
}

export function clearAuthSession() {
  useAuthStore.getState().clearSession();
}
