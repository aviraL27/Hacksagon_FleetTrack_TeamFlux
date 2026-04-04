import { formatLoggedAt, formatRelativeTime, formatShortDate } from '../utils/time.js';

export function serializeTenant(tenant) {
  return {
    id: tenant.id,
    companyName: tenant.companyName,
    legalEntityName: tenant.legalEntityName,
    tenantSlug: tenant.tenantSlug,
    domainPrefix: tenant.domainPrefix,
    headquartersAddress: tenant.headquartersAddress,
  };
}

export function serializeTenantProfile(tenant) {
  return {
    legalEntityName: tenant.legalEntityName,
    domainPrefix: tenant.domainPrefix,
    headquartersAddress: tenant.headquartersAddress,
  };
}

export function serializeUser(user) {
  return {
    id: user.recordId,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLogin: user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Invitation sent',
  };
}

export function serializeVehicle(vehicle) {
  return {
    id: vehicle.recordId,
    registrationNumber: vehicle.registrationNumber,
    model: vehicle.model,
    type: vehicle.type,
    assignedDriver: vehicle.assignedDriver,
    assignedDriverId: vehicle.assignedDriverId,
    status: vehicle.status,
    nextService: vehicle.nextService,
    serviceNote: vehicle.serviceNote,
    fuelAverage: vehicle.fuelAverage,
    vin: vehicle.vin,
    capacity: vehicle.capacity,
    hub: vehicle.hub,
    notes: vehicle.notes,
  };
}

export function serializeDriver(driver) {
  return {
    id: driver.recordId,
    name: driver.name,
    licenseNumber: driver.licenseNumber,
    assignment: driver.assignment,
    detail: driver.detail,
    status: driver.status,
    score: driver.score,
    grade: driver.grade,
    phone: driver.phone,
    baseHub: driver.baseHub,
    experience: driver.experience,
    emergencyContact: driver.emergencyContact,
  };
}

export function serializeOrder(order) {
  return {
    id: order.recordId,
    customer: order.customer,
    origin: order.origin,
    destination: order.destination,
    route: order.route,
    detail: order.detail,
    weight: order.weight,
    status: order.status,
    driver: order.driver,
    driverId: order.driverId,
    vehicleId: order.vehicleId,
    priority: order.priority,
    eta: order.eta,
    speed: order.speedLabel,
    speedLabel: order.speedLabel,
    progress: order.progress,
    markerTone: order.markerTone,
    position: order.position || [],
    routePath: order.routePath || [],
    auditLogs: order.auditLogs || [],
    updatedAt: order.updatedAtTracking || order.updatedAt,
    orderId: order.recordId,
  };
}

export function serializeTrackingPayload(order) {
  const serialized = serializeOrder(order);

  return {
    orderId: serialized.id,
    id: serialized.id,
    driverId: serialized.driverId,
    vehicleId: serialized.vehicleId,
    status: serialized.status,
    progress: serialized.progress,
    position: serialized.position,
    routePath: serialized.routePath,
    speedLabel: serialized.speedLabel,
    speed: serialized.speed,
    eta: serialized.eta,
    customer: serialized.customer,
    detail: serialized.detail,
    driver: serialized.driver,
    markerTone: serialized.markerTone,
    updatedAt: serialized.updatedAt,
  };
}

export function serializeMaintenanceEntry(entry) {
  return {
    id: entry.recordId,
    registration: entry.registration,
    service: entry.service,
    lastService: entry.lastService,
    nextDue: entry.nextDue,
    status: entry.status,
    vendor: entry.vendor,
    costEstimate: entry.costEstimate,
    notes: entry.notes,
  };
}

export function serializeMaintenanceAlert(alert) {
  return {
    id: alert.recordId,
    level: alert.level,
    title: alert.title,
    note: alert.note,
    action: alert.action,
    tone: alert.tone,
    status: alert.status,
  };
}

export function serializeMaintenanceHistory(log) {
  return {
    id: log.recordId,
    registration: log.metadata?.registration || 'Fleet-wide',
    service: log.metadata?.service || log.title,
    completedOn: log.metadata?.completedOn || formatShortDate(log.occurredAt),
    technician: log.metadata?.technician || 'Remote Operations',
    result: log.metadata?.result || log.detail,
  };
}

export function serializeActivityLog(log) {
  return {
    id: log.recordId,
    category: log.category,
    title: log.title,
    detail: log.detail,
    time: formatRelativeTime(log.occurredAt),
    loggedAt: formatLoggedAt(log.occurredAt),
    tone: log.tone,
  };
}
