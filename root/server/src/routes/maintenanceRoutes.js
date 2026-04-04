import express from 'express';
import { MaintenanceAlert } from '../models/MaintenanceAlert.js';
import { MaintenanceEntry } from '../models/MaintenanceEntry.js';
import { requireAuth } from '../middleware/auth.js';
import { createActivityLog, createMaintenanceHistoryLog } from '../services/activityService.js';
import {
  serializeMaintenanceAlert,
  serializeMaintenanceEntry,
  serializeMaintenanceHistory,
} from '../services/serializers.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { createEntityId } from '../utils/id.js';

const router = express.Router();

router.use(requireAuth);

router.get(
  '/entries',
  asyncHandler(async (req, res) => {
    const entries = await MaintenanceEntry.find({ tenantId: req.auth.tenantId }).sort({ createdAt: -1 });
    res.json(entries.map((entry) => serializeMaintenanceEntry(entry)));
  })
);

router.post(
  '/entries',
  asyncHandler(async (req, res) => {
    const entry = await MaintenanceEntry.create({
      recordId: createEntityId('maintenance'),
      tenantId: req.auth.tenantId,
      registration: String(req.body.registration || 'Pending Registration').trim(),
      service: String(req.body.service || 'General Inspection').trim(),
      lastService: String(req.body.lastService || 'TBD').trim(),
      nextDue: String(req.body.nextDue || 'TBD').trim(),
      status: String(req.body.status || 'Good').trim(),
      vendor: String(req.body.vendor || 'Fleet Service Partner').trim(),
      costEstimate: String(req.body.costEstimate || 'INR 0').trim(),
      notes: String(req.body.notes || 'No additional notes recorded.').trim(),
    });

    await createActivityLog({
      tenantId: req.auth.tenantId,
      category: 'Maintenance',
      title: `${req.user.name} scheduled ${entry.service}`,
      detail: `${entry.registration} was added to the maintenance schedule.`,
      tone: entry.status === 'Critical' ? 'warning' : 'info',
    });

    res.status(201).json(serializeMaintenanceEntry(entry));
  })
);

router.patch(
  '/entries/:id',
  asyncHandler(async (req, res) => {
    const entry = await MaintenanceEntry.findOne({ tenantId: req.auth.tenantId, recordId: req.params.id });

    if (!entry) {
      throw new ApiError(404, 'Maintenance entry not found.');
    }

    Object.assign(entry, {
      registration: String(req.body.registration || entry.registration).trim(),
      service: String(req.body.service || entry.service).trim(),
      lastService: String(req.body.lastService || entry.lastService).trim(),
      nextDue: String(req.body.nextDue || entry.nextDue).trim(),
      status: String(req.body.status || entry.status).trim(),
      vendor: String(req.body.vendor || entry.vendor).trim(),
      costEstimate: String(req.body.costEstimate || entry.costEstimate).trim(),
      notes: String(req.body.notes || entry.notes).trim(),
    });

    await entry.save();
    res.json(serializeMaintenanceEntry(entry));
  })
);

router.delete(
  '/entries/:id',
  asyncHandler(async (req, res) => {
    const entry = await MaintenanceEntry.findOneAndDelete({ tenantId: req.auth.tenantId, recordId: req.params.id });

    if (!entry) {
      throw new ApiError(404, 'Maintenance entry not found.');
    }

    res.json({ success: true });
  })
);

router.get(
  '/alerts',
  asyncHandler(async (req, res) => {
    const alerts = await MaintenanceAlert.find({ tenantId: req.auth.tenantId }).sort({ createdAt: 1 });
    res.json(alerts.map((alert) => serializeMaintenanceAlert(alert)));
  })
);

router.patch(
  '/alerts/:id/read',
  asyncHandler(async (req, res) => {
    const alert = await MaintenanceAlert.findOne({ tenantId: req.auth.tenantId, recordId: req.params.id });

    if (!alert) {
      throw new ApiError(404, 'Maintenance alert not found.');
    }

    alert.status = 'Read';
    alert.action = 'Read';
    await alert.save();
    res.json(serializeMaintenanceAlert(alert));
  })
);

router.patch(
  '/alerts/:id/install',
  asyncHandler(async (req, res) => {
    const alert = await MaintenanceAlert.findOne({ tenantId: req.auth.tenantId, recordId: req.params.id });

    if (!alert) {
      throw new ApiError(404, 'Maintenance alert not found.');
    }

    alert.status = 'Installed';
    alert.action = 'Installed';
    await alert.save();

    await createMaintenanceHistoryLog({
      tenantId: req.auth.tenantId,
      registration: 'Fleet-wide',
      service: 'Telematics software update',
      technician: 'Remote Operations',
      result: 'Installed via tenant-wide maintenance action',
    });

    res.json(serializeMaintenanceAlert(alert));
  })
);

router.post(
  '/alerts/:id/schedule',
  asyncHandler(async (req, res) => {
    const alert = await MaintenanceAlert.findOne({ tenantId: req.auth.tenantId, recordId: req.params.id });

    if (!alert) {
      throw new ApiError(404, 'Maintenance alert not found.');
    }

    const entry = await MaintenanceEntry.create({
      recordId: createEntityId('maintenance'),
      tenantId: req.auth.tenantId,
      registration: String(req.body.registration || 'Pending Registration').trim(),
      service: String(req.body.service || 'General Inspection').trim(),
      lastService: String(req.body.lastService || 'TBD').trim(),
      nextDue: String(req.body.nextDue || 'TBD').trim(),
      status: String(req.body.status || 'Warning').trim(),
      vendor: String(req.body.vendor || 'Fleet Service Partner').trim(),
      costEstimate: String(req.body.costEstimate || 'INR 0').trim(),
      notes: String(req.body.notes || alert.note || 'Created from maintenance alert.').trim(),
    });

    alert.status = 'Scheduled';
    alert.action = 'Scheduled';
    await alert.save();

    await createMaintenanceHistoryLog({
      tenantId: req.auth.tenantId,
      registration: entry.registration,
      service: entry.service,
      technician: entry.vendor,
      result: 'Created from active maintenance alert',
    });

    res.status(201).json({
      alert: serializeMaintenanceAlert(alert),
      entry: serializeMaintenanceEntry(entry),
    });
  })
);

router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const history = await ActivityLog.find({
      tenantId: req.auth.tenantId,
      activityType: 'maintenance-history',
    }).sort({ occurredAt: -1 });

    res.json(history.map((item) => serializeMaintenanceHistory(item)));
  })
);

export default router;
