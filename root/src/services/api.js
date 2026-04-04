import axios from 'axios';
import { clearAuthSession, getAuthSnapshot, refreshAuthSession } from '../store/authStore';
import { API_BASE_URL } from './authClient';

const LOGIN_ROUTES = ['/login', '/register'];
let isRedirectingToLogin = false;
let refreshPromise = null;

function redirectToLogin() {
  if (typeof window === 'undefined' || isRedirectingToLogin) {
    return;
  }

  if (LOGIN_ROUTES.includes(window.location.pathname)) {
    return;
  }

  isRedirectingToLogin = true;
  window.location.replace('/login');
}

function getRefreshPromise() {
  if (!refreshPromise) {
    refreshPromise = refreshAuthSession().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function handleUnauthorized() {
  clearAuthSession();
  redirectToLogin();
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const { isAuthenticated, token } = getAuthSnapshot();

  if (isAuthenticated && token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.skipAuthRefresh) {
      originalRequest._retry = true;

      try {
        const session = await getRefreshPromise();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        handleUnauthorized();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export async function apiRequest(config) {
  const response = await api(config);
  return response.data;
}

export function get(url, config) {
  return apiRequest({ ...config, method: 'get', url });
}

export function post(url, data, config) {
  return apiRequest({ ...config, data, method: 'post', url });
}

export function put(url, data, config) {
  return apiRequest({ ...config, data, method: 'put', url });
}

export function patch(url, data, config) {
  return apiRequest({ ...config, data, method: 'patch', url });
}

export function remove(url, config) {
  return apiRequest({ ...config, method: 'delete', url });
}

export { handleUnauthorized };
export default api;
