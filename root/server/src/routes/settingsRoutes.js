import bcrypt from 'bcryptjs';
import express from 'express';
import { Tenant } from '../models/Tenant.js';
import { User } from '../models/User.js';
import { requireAuth, requireOwnerOrSuperAdmin } from '../middleware/auth.js';
import { createActivityLog } from '../services/activityService.js';
import { serializeTenantProfile, serializeUser } from '../services/serializers.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { createEntityId, normalizeEmail, normalizeTenantSlug } from '../utils/id.js';

const router = express.Router();

const DEFAULT_RESPONSIBILITIES_BY_ROLE = {
  'Super Admin': ['Dashboard', 'Settings', 'Live Tracking'],
  'Operations Manager': ['Orders', 'Drivers', 'Live Tracking'],
  'Fleet Dispatcher': ['Fleet', 'Orders', 'Live Tracking'],
  'Billing Manager': ['Billing', 'Orders', 'Settings'],
  'Maintenance Lead': ['Maintenance', 'Fleet'],
  'Driver Coordinator': ['Drivers', 'Orders'],
};

function sanitizeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function getDefaultResponsibilities(role = '') {
  return DEFAULT_RESPONSIBILITIES_BY_ROLE[role] || ['Orders', 'Live Tracking'];
}

function sanitizeResponsibilities(values, fallback = []) {
  const source = Array.isArray(values)
    ? values
    : typeof values === 'string'
      ? values.split(',')
      : fallback;

  return Array.from(
    new Set(
      source
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  );
}

router.use(requireAuth);

router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    res.json(serializeTenantProfile(req.tenant));
  })
);

router.patch(
  '/profile',
  requireOwnerOrSuperAdmin,
  asyncHandler(async (req, res) => {
    const nextDomainPrefix = normalizeTenantSlug(req.body.domainPrefix || req.tenant.domainPrefix);

    if (nextDomainPrefix !== req.tenant.domainPrefix) {
      const existingTenant = await Tenant.findOne({ tenantSlug: nextDomainPrefix, _id: { $ne: req.tenant.id } });

      if (existingTenant) {
        throw new ApiError(409, 'That domain prefix is already taken by another tenant.');
      }
    }

    req.tenant.legalEntityName = String(req.body.legalEntityName || req.tenant.legalEntityName).trim();
    req.tenant.domainPrefix = nextDomainPrefix;
    req.tenant.tenantSlug = nextDomainPrefix;
    req.tenant.headquartersAddress = String(req.body.headquartersAddress || req.tenant.headquartersAddress).trim();
    await req.tenant.save();

    await createActivityLog({
      tenantId: req.auth.tenantId,
      category: 'Admin',
      title: `${req.user.name} updated organization settings`,
      detail: 'Company profile details were refreshed for the current tenant workspace.',
      tone: 'info',
    });

    res.json(serializeTenantProfile(req.tenant));
  })
);

router.get(
  '/team',
  requireOwnerOrSuperAdmin,
  asyncHandler(async (req, res) => {
    const team = await User.find({ tenantId: req.auth.tenantId }).sort({ isOwner: -1, lastLoginAt: -1, createdAt: 1 });
    res.json(team.map((member) => serializeUser(member)));
  })
);

router.post(
  '/team',
  requireOwnerOrSuperAdmin,
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      throw new ApiError(400, 'Team member email is required.');
    }

    if (await User.exists({ tenantId: req.auth.tenantId, email })) {
      throw new ApiError(409, 'A team member with that email already exists in this tenant.');
    }

    const role = sanitizeText(req.body.role, 'Operations Manager') || 'Operations Manager';
    const status = sanitizeText(req.body.status, 'Pending') || 'Pending';

    const member = await User.create({
      recordId: createEntityId('manager'),
      tenantId: req.auth.tenantId,
      name: sanitizeText(req.body.name, 'New Manager') || 'New Manager',
      email,
      passwordHash: await bcrypt.hash(createEntityId('invite'), 10),
      role,
      status,
      phone: sanitizeText(req.body.phone),
      assignedHub: sanitizeText(req.body.assignedHub),
      responsibilities: sanitizeResponsibilities(req.body.responsibilities, getDefaultResponsibilities(role)),
      notes: sanitizeText(req.body.notes),
      isOwner: false,
      lastLoginAt: null,
    });

    await createActivityLog({
      tenantId: req.auth.tenantId,
      category: 'Admin',
      title: `${req.user.name} added ${member.name}`,
      detail: `${member.email} was added to the tenant team roster with ${member.role} access.`,
      tone: member.status === 'Pending' ? 'warning' : 'success',
    });

    res.status(201).json(serializeUser(member));
  })
);

router.patch(
  '/team/:id',
  requireOwnerOrSuperAdmin,
  asyncHandler(async (req, res) => {
    const member = await User.findOne({ tenantId: req.auth.tenantId, recordId: req.params.id });

    if (!member) {
      throw new ApiError(404, 'Team member not found.');
    }

    if (req.body.email) {
      const email = normalizeEmail(req.body.email);
      const conflict = await User.findOne({
        tenantId: req.auth.tenantId,
        email,
        _id: { $ne: member.id },
      });

      if (conflict) {
        throw new ApiError(409, 'A team member with that email already exists in this tenant.');
      }

      member.email = email;
    }

    const nextRole = sanitizeText(req.body.role, member.role) || member.role;

    member.name = sanitizeText(req.body.name, member.name) || member.name;
    member.role = nextRole;
    member.status = sanitizeText(req.body.status, member.status) || member.status;
    member.phone = sanitizeText(req.body.phone, member.phone);
    member.assignedHub = sanitizeText(req.body.assignedHub, member.assignedHub);
    member.notes = sanitizeText(req.body.notes, member.notes);
    member.responsibilities = Object.prototype.hasOwnProperty.call(req.body, 'responsibilities')
      ? sanitizeResponsibilities(req.body.responsibilities, getDefaultResponsibilities(nextRole))
      : sanitizeResponsibilities(member.responsibilities, getDefaultResponsibilities(nextRole));
    await member.save();

    await createActivityLog({
      tenantId: req.auth.tenantId,
      category: 'Admin',
      title: `${req.user.name} updated ${member.name}`,
      detail: `${member.role} ownership and profile details were refreshed in the team workspace.`,
      tone: 'info',
    });

    res.json(serializeUser(member));
  })
);

router.delete(
  '/team/:id',
  requireOwnerOrSuperAdmin,
  asyncHandler(async (req, res) => {
    const member = await User.findOne({ tenantId: req.auth.tenantId, recordId: req.params.id });

    if (!member) {
      throw new ApiError(404, 'Team member not found.');
    }

    if (member.isOwner) {
      throw new ApiError(400, 'The tenant owner cannot be deleted.');
    }

    await member.deleteOne();

    await createActivityLog({
      tenantId: req.auth.tenantId,
      category: 'Admin',
      title: `${req.user.name} removed ${member.name}`,
      detail: `${member.email} was removed from the active team roster.`,
      tone: 'warning',
    });

    res.json({ success: true });
  })
);

export default router;

