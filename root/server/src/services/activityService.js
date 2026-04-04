import { ActivityLog } from '../models/ActivityLog.js';
import { createEntityId } from '../utils/id.js';

export async function createActivityLog({
  tenantId,
  activityType = 'general',
  category,
  title,
  detail,
  tone = 'info',
  metadata = {},
  occurredAt = new Date(),
}) {
  return ActivityLog.create({
    recordId: createEntityId('activity'),
    tenantId,
    activityType,
    category,
    title,
    detail,
    tone,
    metadata,
    occurredAt,
  });
}

export async function createMaintenanceHistoryLog({
  tenantId,
  registration,
  service,
  technician,
  result,
  occurredAt = new Date(),
}) {
  return createActivityLog({
    tenantId,
    activityType: 'maintenance-history',
    category: 'Maintenance',
    title: `${registration} maintenance updated`,
    detail: result,
    tone: 'info',
    metadata: {
      registration,
      service,
      technician,
      result,
    },
    occurredAt,
  });
}

export async function getRecentActivity(tenantId, limit = 5) {
  return ActivityLog.find({ tenantId }).sort({ occurredAt: -1 }).limit(limit);
}
