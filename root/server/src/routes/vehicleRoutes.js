import express from 'express';
import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeVehicle } from '../services/serializers.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { createEntityId } from '../utils/id.js';

const router = express.Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const vehicles = await Vehicle.find({ tenantId: req.auth.tenantId }).sort({ createdAt: -1 });
    res.json(vehicles.map((vehicle) => serializeVehicle(vehicle)));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const assignedDriver = String(req.body.assignedDriver || 'Unassigned').trim() || 'Unassigned';
    const driverRecord =
      assignedDriver === 'Unassigned'
        ? null
        : await Driver.findOne({ tenantId: req.auth.tenantId, name: assignedDriver });

    const vehicle = await Vehicle.create({
      recordId: createEntityId('vehicle'),
      tenantId: req.auth.tenantId,
      registrationNumber: String(req.body.registrationNumber || 'Pending Registration').trim(),
      model: String(req.body.model || 'Unknown Model').trim(),
      type: String(req.body.type || 'Heavy Truck').trim(),
      assignedDriver,
      assignedDriverId: driverRecord?.recordId || null,
      status: String(req.body.status || 'Idle').trim(),
      nextService: String(req.body.nextService || 'TBD').trim(),
      serviceNote: String(req.body.serviceNote || 'Service plan pending').trim(),
      fuelAverage: Number(req.body.fuelAverage) || 12,
      vin: String(req.body.vin || 'VIN-PENDING').trim(),
      capacity: String(req.body.capacity || 'TBD').trim(),
      hub: String(req.body.hub || 'Primary Hub').trim(),
      notes: String(req.body.notes || 'No additional notes recorded.').trim(),
    });

    res.status(201).json(serializeVehicle(vehicle));
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findOne({ tenantId: req.auth.tenantId, recordId: req.params.id });

    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found.');
    }

    const assignedDriver = String(req.body.assignedDriver || vehicle.assignedDriver || 'Unassigned').trim() || 'Unassigned';
    const driverRecord =
      assignedDriver === 'Unassigned'
        ? null
        : await Driver.findOne({ tenantId: req.auth.tenantId, name: assignedDriver });

    Object.assign(vehicle, {
      registrationNumber: String(req.body.registrationNumber || vehicle.registrationNumber).trim(),
      model: String(req.body.model || vehicle.model).trim(),
      type: String(req.body.type || vehicle.type).trim(),
      assignedDriver,
      assignedDriverId: driverRecord?.recordId || null,
      status: String(req.body.status || vehicle.status).trim(),
      nextService: String(req.body.nextService || vehicle.nextService).trim(),
      serviceNote: String(req.body.serviceNote || vehicle.serviceNote).trim(),
      fuelAverage: Number(req.body.fuelAverage) || vehicle.fuelAverage,
      vin: String(req.body.vin || vehicle.vin).trim(),
      capacity: String(req.body.capacity || vehicle.capacity).trim(),
      hub: String(req.body.hub || vehicle.hub).trim(),
      notes: String(req.body.notes || vehicle.notes).trim(),
    });

    await vehicle.save();
    res.json(serializeVehicle(vehicle));
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findOneAndDelete({ tenantId: req.auth.tenantId, recordId: req.params.id });

    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found.');
    }

    res.json({ success: true });
  })
);

export default router;
