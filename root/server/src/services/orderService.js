import {
  buildRouteDetail,
  buildRouteLabel,
  createOrderAuditLog,
  getDefaultEta,
  getDefaultSpeedLabel,
  getDefaultTrackingProgress,
  getMarkerToneFromStatus,
  getRoutePath,
  getRoutePosition,
} from '../../../src/store/mockData.js';
import { Order } from '../models/Order.js';
import { createOrderId } from '../utils/id.js';

const DEFAULT_ORIGIN = 'Mumbai, MH';
const DEFAULT_DESTINATION = 'Pune, MH';

function clampProgress(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function prependAuditLog(logs, title) {
  return [createOrderAuditLog(title), ...(logs || [])];
}

export async function generateUniqueOrderRecordId(tenantId) {
  let nextId = createOrderId();

  while (await Order.exists({ tenantId, recordId: nextId })) {
    nextId = createOrderId();
  }

  return nextId;
}

export function normalizeOrderPayload(input, { currentOrder = null, driverRecord = null, recordId = null } = {}) {
  const origin = input.origin?.trim() || currentOrder?.origin || DEFAULT_ORIGIN;
  const destination = input.destination?.trim() || currentOrder?.destination || DEFAULT_DESTINATION;
  const status = input.status?.trim() || currentOrder?.status || 'Pending';
  const driver = input.driver?.trim() || currentOrder?.driver || 'Unassigned';
  const progress =
    typeof input.progress === 'number'
      ? clampProgress(input.progress)
      : currentOrder?.progress ?? getDefaultTrackingProgress(status);

  return {
    recordId: recordId || input.id || currentOrder?.recordId,
    customer: input.customer?.trim() || currentOrder?.customer || 'New Customer',
    origin,
    destination,
    route: buildRouteLabel(origin, destination),
    detail: buildRouteDetail(origin, destination),
    weight: input.weight?.trim() || currentOrder?.weight || '0 kg',
    status,
    driver,
    driverId: driver === 'Unassigned' ? null : driverRecord?.recordId ?? input.driverId ?? currentOrder?.driverId ?? null,
    vehicleId: input.vehicleId ?? currentOrder?.vehicleId ?? null,
    priority: input.priority?.trim() || currentOrder?.priority || 'Medium',
    eta:
      input.eta?.trim() ||
      (status === 'Delivered' ? 'Completed' : currentOrder?.eta || getDefaultEta(status)),
    speedLabel:
      input.speedLabel?.trim() ||
      input.speed?.trim() ||
      (status === 'Delivered' ? 'Delivered just now' : currentOrder?.speedLabel || getDefaultSpeedLabel(status)),
    progress,
    markerTone: getMarkerToneFromStatus(status),
    position: input.position || getRoutePosition(origin, destination, progress) || currentOrder?.position || [],
    routePath: input.routePath || getRoutePath(origin, destination) || currentOrder?.routePath || [],
    auditLogs: input.auditLogs || currentOrder?.auditLogs || [],
    updatedAtTracking: new Date(),
  };
}

export function buildOrderForCreate(input, { driverRecord = null, recordId }) {
  return normalizeOrderPayload(
    {
      ...input,
      auditLogs: [
        createOrderAuditLog('Order created from dispatch board'),
        createOrderAuditLog('Dispatch board queued'),
      ],
    },
    { driverRecord, recordId }
  );
}

export function buildOrderStatusUpdate(order, nextStatus) {
  const status = nextStatus?.trim() || order.status;
  const nextProgress =
    status === 'Delivered'
      ? 1
      : status === 'Pending'
        ? 0.08
        : Math.max(order.progress, getDefaultTrackingProgress(status));

  return normalizeOrderPayload(
    {
      ...order.toObject(),
      status,
      progress: nextProgress,
      eta: status === 'Delivered' ? 'Completed' : getDefaultEta(status),
      speedLabel: status === 'Delivered' ? 'Delivered just now' : getDefaultSpeedLabel(status),
      auditLogs:
        order.status === status
          ? order.auditLogs
          : prependAuditLog(order.auditLogs, `Status updated to ${status}`),
    },
    { currentOrder: order, recordId: order.recordId }
  );
}

export function buildDriverAssignmentUpdate(order, driverName, driverRecord = null) {
  const normalizedDriver = driverName?.trim() || 'Unassigned';

  return normalizeOrderPayload(
    {
      ...order.toObject(),
      driver: normalizedDriver,
      driverId: normalizedDriver === 'Unassigned' ? null : driverRecord?.recordId ?? order.driverId,
      status: normalizedDriver === 'Unassigned' ? 'Pending' : order.status,
      auditLogs:
        order.driver === normalizedDriver
          ? order.auditLogs
          : prependAuditLog(order.auditLogs, `Driver updated to ${normalizedDriver}`),
    },
    { currentOrder: order, driverRecord, recordId: order.recordId }
  );
}

export function buildTrackingStep(order) {
  if (!Array.isArray(order.routePath) || order.routePath.length < 2) {
    return null;
  }

  if (order.status === 'Delivered' || order.status === 'Pending') {
    return null;
  }

  const nextProgress = Math.min(1, order.progress + (order.status === 'Delayed' ? 0.02 : 0.04));
  const nextStatus = nextProgress >= 1 ? 'Delivered' : order.status;
  const nextSpeedLabel =
    nextStatus === 'Delivered'
      ? 'Delivered just now'
      : `${Math.max(38, Math.min(72, Math.round(42 + nextProgress * 32)))} km/h`;

  return normalizeOrderPayload(
    {
      ...order.toObject(),
      status: nextStatus,
      progress: nextProgress,
      speedLabel: nextSpeedLabel,
      eta: nextStatus === 'Delivered' ? 'Completed' : order.eta,
      position: getRoutePosition(order.origin, order.destination, nextProgress),
      auditLogs:
        nextStatus === 'Delivered' && order.status !== 'Delivered'
          ? prependAuditLog(order.auditLogs, 'Delivery confirmed by live simulation')
          : order.auditLogs,
    },
    { currentOrder: order, recordId: order.recordId }
  );
}
