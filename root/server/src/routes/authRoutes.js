import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import express from 'express';
import env from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { PasswordResetOtp } from '../models/PasswordResetOtp.js';
import { INITIAL_COMPANY_PROFILE } from '../../../src/store/mockData.js';
import { Tenant } from '../models/Tenant.js';
import { User } from '../models/User.js';
import {
  clearRefreshCookie,
  getRefreshTokenFromRequest,
  issueAuthSession,
  revokeAllRefreshSessionsForUser,
  revokeRefreshSession,
  rotateAuthSession,
  verifyRefreshToken,
} from '../services/authService.js';
import { isSmtpConfigured, sendPasswordResetOtpEmail } from '../services/mailService.js';
import { seedTenantWorkspace } from '../services/seedService.js';
import { serializeTenant, serializeUser } from '../services/serializers.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { createEntityId, normalizeEmail, normalizeTenantSlug } from '../utils/id.js';

const router = express.Router();
const PASSWORD_RESET_SUCCESS_MESSAGE = 'If the account exists, a password reset OTP has been sent.';

function generateNumericOtp(length = 6) {
  const safeLength = Math.min(Math.max(length, 4), 8);
  const min = 10 ** (safeLength - 1);
  const max = 10 ** safeLength;

  return String(crypto.randomInt(min, max));
}

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
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const tenantSlug = normalizeTenantSlug(req.body.tenantSlug);
    const email = normalizeEmail(req.body.email);

    if (!tenantSlug || !email) {
      throw new ApiError(400, 'Tenant slug and email are required.');
    }

    if (!isSmtpConfigured()) {
      throw new ApiError(503, 'Password reset email delivery is not configured on the server.');
    }

    const tenant = await Tenant.findOne({ tenantSlug });

    if (tenant) {
      const user = await User.findOne({ tenantId: tenant.id, email });

      if (user) {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const hasRecentRequest = await PasswordResetOtp.exists({
          tenantId: tenant.id,
          userId: user.id,
          consumedAt: null,
          createdAt: { $gte: oneMinuteAgo },
        });

        if (!hasRecentRequest) {
          const otp = generateNumericOtp(env.passwordResetOtpLength);
          const expiresAt = new Date(Date.now() + env.passwordResetOtpTtlMinutes * 60 * 1000);

          await PasswordResetOtp.updateMany(
            {
              tenantId: tenant.id,
              userId: user.id,
              consumedAt: null,
            },
            {
              consumedAt: new Date(),
            }
          );

          await PasswordResetOtp.create({
            tenantId: tenant.id,
            userId: user.id,
            otpHash: await bcrypt.hash(otp, 10),
            expiresAt,
            requestedIp: req.ip || '',
            requestedUserAgent: req.get('user-agent') || '',
          });

          await sendPasswordResetOtpEmail({ email: user.email, otp });
        }
      }
    }

    res.json({
      success: true,
      message: PASSWORD_RESET_SUCCESS_MESSAGE,
    });
  })
);

router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const tenantSlug = normalizeTenantSlug(req.body.tenantSlug);
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();
    const password = String(req.body.password || '');

    if (!tenantSlug || !email || !otp || !password) {
      throw new ApiError(400, 'Tenant slug, email, OTP, and new password are required.');
    }

    if (password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters long.');
    }

    const tenant = await Tenant.findOne({ tenantSlug });
    const user = tenant ? await User.findOne({ tenantId: tenant.id, email }) : null;

    if (!tenant || !user) {
      throw new ApiError(400, 'Invalid reset request.');
    }

    const otpRequest = await PasswordResetOtp.findOne({
      tenantId: tenant.id,
      userId: user.id,
      consumedAt: null,
    }).sort({ createdAt: -1 });

    if (!otpRequest || otpRequest.expiresAt.getTime() <= Date.now()) {
      throw new ApiError(400, 'OTP is invalid or expired.');
    }

    if (otpRequest.attempts >= env.passwordResetMaxAttempts) {
      throw new ApiError(429, 'OTP has been locked after too many attempts. Request a new code.');
    }

    const isOtpValid = await bcrypt.compare(otp, otpRequest.otpHash);

    if (!isOtpValid) {
      otpRequest.attempts += 1;

      if (otpRequest.attempts >= env.passwordResetMaxAttempts) {
        otpRequest.consumedAt = new Date();
      }

      await otpRequest.save();
      throw new ApiError(400, 'OTP is invalid or expired.');
    }

    const isSamePassword = await bcrypt.compare(password, user.passwordHash);

    if (isSamePassword) {
      throw new ApiError(400, 'New password must be different from your current password.');
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();

    otpRequest.consumedAt = new Date();
    await otpRequest.save();

    await PasswordResetOtp.updateMany(
      {
        tenantId: tenant.id,
        userId: user.id,
        consumedAt: null,
      },
      {
        consumedAt: new Date(),
      }
    );

    await revokeAllRefreshSessionsForUser({
      tenantId: tenant.id,
      userId: user.id,
    });
    clearRefreshCookie(res);

    res.json({
      success: true,
      message: 'Password reset successful. Please sign in with your new password.',
    });
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

