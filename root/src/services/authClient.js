const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function authRequest(path, { body, method = 'GET' } = {}) {
  const response = await fetch(buildUrl(path), {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Authentication request failed.');
  }

  return data;
}

export function requestPasswordResetOtp({ email, tenantSlug }) {
  return authRequest('/auth/forgot-password', {
    method: 'POST',
    body: { email, tenantSlug },
  });
}

export function resetPasswordWithOtp({ email, otp, password, tenantSlug }) {
  return authRequest('/auth/reset-password', {
    method: 'POST',
    body: { email, otp, password, tenantSlug },
  });
}

export { API_BASE_URL };
