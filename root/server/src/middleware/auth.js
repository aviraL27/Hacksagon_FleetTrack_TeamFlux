import { Tenant } from '../models/Tenant.js';
import { User } from '../models/User.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../services/authService.js';

function readBearerToken(req) {
  const header = req.get('authorization') || '';

  if (!header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice(7).trim();
}

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = readBearerToken(req);

  if (!token) {
    throw new ApiError(401, 'Authentication required.');
  }

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Access token is invalid or expired.');
  }

  const user = await User.findOne({ _id: payload.sub, tenantId: payload.tenantId });

  if (!user) {
    throw new ApiError(401, 'Authenticated user was not found.');
  }

  const tenant = await Tenant.findById(payload.tenantId);

  if (!tenant) {
    throw new ApiError(401, 'Authenticated tenant was not found.');
  }

  req.user = user;
  req.tenant = tenant;
  req.auth = {
    tenantId: tenant.id,
    userId: user.id,
    role: user.role,
  };

  next();
});

export function requireOwnerOrSuperAdmin(req, res, next) {
  if (req.user?.isOwner || req.user?.role === 'Super Admin') {
    next();
    return;
  }

  next(new ApiError(403, 'This action requires owner or Super Admin access.'));
}
