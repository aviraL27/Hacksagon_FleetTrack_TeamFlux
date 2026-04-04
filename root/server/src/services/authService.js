import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { RefreshSession } from '../models/RefreshSession.js';
import { serializeTenant, serializeUser } from './serializers.js';
import { ApiError } from '../utils/asyncHandler.js';
import { createEntityId, hashToken } from '../utils/id.js';

function getRefreshLifetimeDays(rememberMe = false) {
  return rememberMe ? env.refreshTokenTtlDaysRememberMe : env.refreshTokenTtlDaysDefault;
}

function buildCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/api/auth',
    expires: expiresAt,
  };
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      tenantId: user.tenantId.toString(),
      role: user.role,
      email: user.email,
      recordId: user.recordId,
    },
    env.jwtAccessSecret,
    { expiresIn: env.accessTokenTtlSeconds }
  );
}

function signRefreshToken({ sessionId, userId, tenantId, rememberMe }) {
  const expiresInDays = getRefreshLifetimeDays(rememberMe);

  return jwt.sign(
    {
      sub: userId.toString(),
      tenantId: tenantId.toString(),
      sid: sessionId,
    },
    env.jwtRefreshSecret,
    { expiresIn: `${expiresInDays}d` }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

export function clearRefreshCookie(res) {
  res.clearCookie(env.refreshCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/api/auth',
  });
}

export function getRefreshTokenFromRequest(req) {
  return req.cookies?.[env.refreshCookieName] || null;
}

async function createRefreshSession({ req, rememberMe, tenantId, userId }) {
  const sessionId = createEntityId('session');
  const refreshToken = signRefreshToken({ sessionId, userId, tenantId, rememberMe });
  const expiresAt = new Date(Date.now() + getRefreshLifetimeDays(rememberMe) * 24 * 60 * 60 * 1000);

  const session = await RefreshSession.create({
    sessionId,
    tenantId,
    userId,
    rememberMe,
    tokenHash: hashToken(refreshToken),
    expiresAt,
    ipAddress: req.ip || '',
    userAgent: req.get('user-agent') || '',
    lastUsedAt: new Date(),
  });

  return { expiresAt, refreshToken, session };
}

export async function issueAuthSession({ req, res, user, tenant, rememberMe = false }) {
  const accessToken = signAccessToken(user);
  const { expiresAt, refreshToken } = await createRefreshSession({
    req,
    rememberMe,
    tenantId: tenant.id,
    userId: user.id,
  });

  res.cookie(env.refreshCookieName, refreshToken, buildCookieOptions(expiresAt));

  return {
    accessToken,
    tenant: serializeTenant(tenant),
    user: serializeUser(user),
  };
}

export async function rotateAuthSession({ req, res, token, user, tenant }) {
  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Refresh session is invalid.');
  }

  const currentSession = await RefreshSession.findOne({
    sessionId: payload.sid,
    tenantId: payload.tenantId,
    userId: payload.sub,
  });

  if (!currentSession || currentSession.revokedAt || currentSession.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(401, 'Refresh session is no longer valid.');
  }

  if (currentSession.tokenHash !== hashToken(token)) {
    throw new ApiError(401, 'Refresh session token mismatch.');
  }

  currentSession.revokedAt = new Date();
  currentSession.lastUsedAt = new Date();
  await currentSession.save();

  const nextPayload = await issueAuthSession({
    req,
    res,
    user,
    tenant,
    rememberMe: currentSession.rememberMe,
  });

  return nextPayload;
}

export async function revokeRefreshSession(token) {
  if (!token) {
    return;
  }

  try {
    const payload = verifyRefreshToken(token);

    await RefreshSession.findOneAndUpdate(
      {
        sessionId: payload.sid,
        tenantId: payload.tenantId,
        userId: payload.sub,
        tokenHash: hashToken(token),
        revokedAt: null,
      },
      {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      }
    );
  } catch {
    return;
  }
}

