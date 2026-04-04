import crypto from 'node:crypto';

export function createEntityId(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function createOrderId() {
  return `#FT-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function normalizeTenantSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}
