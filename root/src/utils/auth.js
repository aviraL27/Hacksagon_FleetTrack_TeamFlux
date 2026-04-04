export const LEGACY_TOKEN_STORAGE_KEY = 'fleet_track_jwt';
export const LEGACY_TENANT_STORAGE_KEY = 'fleet_track_tenant_id';
export const AUTH_STORAGE_KEY = 'fleet_track_auth';
export const DEFAULT_TENANT_ID = 'saarthi';

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

  try {
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function getTokenPayload(token) {
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  return decodeBase64Url(parts[1]);
}

export function isTokenValid(token) {
  if (!token) {
    return false;
  }

  const payload = getTokenPayload(token);
  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 > Date.now();
}

export function normalizeTenantSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
