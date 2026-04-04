import bcrypt from 'bcryptjs';
import express from 'express';
import { INITIAL_COMPANY_PROFILE } from '../../../src/store/mockData.js';
import { Tenant } from '../models/Tenant.js';
import { User } from '../models/User.js';
import { clearRefreshCookie, getRefreshTokenFromRequest, issueAuthSession, revokeRefreshSession, rotateAuthSession, verifyRefreshToken } from '../services/authService.js';
import { seedTenantWorkspace } from '../services/seedService.js';
import { serializeTenant, serializeUser } from '../services/serializers.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { createEntityId, normalizeEmail, normalizeTenantSlug } from '../utils/id.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const companyName = String(req.body.companyName || '').trim();
    const tenantSlug = normalizeTenantSlug(req.body.tenantSlug);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const rememberMe = Boolean(req.body.rememberMe);

    if (!companyName || !tenantSlug || !email || !password) {
      throw new ApiError(400, 'Company name, tenant slug, email, and password are required.');
    }

    if (password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters long.');
    }

    if (await Tenant.exists({ tenantSlug })) {
      throw new ApiError(409, 'That workspace subdomain is already in use.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const tenant = await Tenant.create({
      companyName,
      legalEntityName: companyName,
      tenantSlug,
      domainPrefix: tenantSlug,
      headquartersAddress: INITIAL_COMPANY_PROFILE.headquartersAddress,
    });

    const ownerUser = await User.create({
      recordId: createEntityId('manager'),
      tenantId: tenant.id,
      name: companyName,
      email,
      passwordHash,
      role: 'Super Admin',
      status: 'Active',
      isOwner: true,
      lastLoginAt: new Date(),
    });

    await seedTenantWorkspace({ ownerUser, tenant });

    const payload = await issueAuthSession({
      req,
      res,
      user: ownerUser,
      tenant,
      rememberMe,
    });

    res.status(201).json(payload);
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const tenantSlug = normalizeTenantSlug(req.body.tenantSlug);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const rememberMe = Boolean(req.body.rememberMe);

    if (!tenantSlug || !email || !password) {
      throw new ApiError(400, 'Tenant slug, email, and password are required.');
    }

    const tenant = await Tenant.findOne({ tenantSlug });

    if (!tenant) {
      throw new ApiError(401, 'Invalid workspace or credentials.');
    }

    const user = await User.findOne({ tenantId: tenant.id, email });

    if (!user) {
      throw new ApiError(401, 'Invalid workspace or credentials.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid workspace or credentials.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const payload = await issueAuthSession({
      req,
      res,
      user,
      tenant,
      rememberMe,
    });

    res.json(payload);
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = getRefreshTokenFromRequest(req);

    if (!token) {
      throw new ApiError(401, 'No refresh session is available.');
    }

    let payload;

    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new ApiError(401, 'Refresh session is invalid.');
    }

    const tenant = await Tenant.findById(payload.tenantId);
    const user = await User.findById(payload.sub);

    if (!tenant || !user) {
      throw new ApiError(401, 'Refresh session is invalid.');
    }

    const nextSession = await rotateAuthSession({
      req,
      res,
      token,
      user,
      tenant,
    });

    res.json(nextSession);
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = getRefreshTokenFromRequest(req);
    await revokeRefreshSession(token);
    clearRefreshCookie(res);
    res.json({ success: true });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({
      tenant: serializeTenant(req.tenant),
      user: serializeUser(req.user),
    });
  })
);

export default router;

