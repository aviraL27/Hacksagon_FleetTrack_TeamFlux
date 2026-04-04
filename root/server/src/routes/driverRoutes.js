import express from 'express';
import { Driver } from '../models/Driver.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeDriver } from '../services/serializers.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { createEntityId } from '../utils/id.js';

const router = express.Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const drivers = await Driver.find({ tenantId: req.auth.tenantId }).sort({ createdAt: -1 });
    res.json(drivers.map((driver) => serializeDriver(driver)));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const driver = await Driver.create({
      recordId: createEntityId('driver'),
      tenantId: req.auth.tenantId,
      name: String(req.body.name || 'New Driver').trim(),
      licenseNumber: String(req.body.licenseNumber || 'License Pending').trim(),
      assignment: String(req.body.assignment || 'Unassigned').trim(),
      detail: String(req.body.detail || 'Awaiting dispatch').trim(),
      status: String(req.body.status || 'Available').trim(),
      score: Number(req.body.score) || 85,
      grade: String(req.body.grade || 'B').trim(),
      phone: String(req.body.phone || '+91').trim(),
      baseHub: String(req.body.baseHub || 'Primary Hub').trim(),
      experience: String(req.body.experience || '1 year').trim(),
      emergencyContact: String(req.body.emergencyContact || 'Not provided').trim(),
    });

    res.status(201).json(serializeDriver(driver));
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const driver = await Driver.findOne({ tenantId: req.auth.tenantId, recordId: req.params.id });

    if (!driver) {
      throw new ApiError(404, 'Driver not found.');
    }

    Object.assign(driver, {
      name: String(req.body.name || driver.name).trim(),
      licenseNumber: String(req.body.licenseNumber || driver.licenseNumber).trim(),
      assignment: String(req.body.assignment || driver.assignment).trim(),
      detail: String(req.body.detail || driver.detail).trim(),
      status: String(req.body.status || driver.status).trim(),
      score: Number(req.body.score) || driver.score,
      grade: String(req.body.grade || driver.grade).trim(),
      phone: String(req.body.phone || driver.phone).trim(),
      baseHub: String(req.body.baseHub || driver.baseHub).trim(),
      experience: String(req.body.experience || driver.experience).trim(),
      emergencyContact: String(req.body.emergencyContact || driver.emergencyContact).trim(),
    });

    await driver.save();
    res.json(serializeDriver(driver));
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const driver = await Driver.findOneAndDelete({ tenantId: req.auth.tenantId, recordId: req.params.id });

    if (!driver) {
      throw new ApiError(404, 'Driver not found.');
    }

    res.json({ success: true });
  })
);

export default router;
