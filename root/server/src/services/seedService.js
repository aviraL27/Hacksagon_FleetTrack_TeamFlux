import bcrypt from 'bcryptjs';
import {
  INITIAL_COMPANY_PROFILE,
  INITIAL_DRIVERS,
  INITIAL_MAINTENANCE_ALERTS,
  INITIAL_MAINTENANCE_HISTORY,
  INITIAL_MAINTENANCE_ENTRIES,
  INITIAL_ORDERS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_VEHICLES,
} from '../../../src/store/mockData.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Driver } from '../models/Driver.js';
import { MaintenanceAlert } from '../models/MaintenanceAlert.js';
import { MaintenanceEntry } from '../models/MaintenanceEntry.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { createActivityLog, createMaintenanceHistoryLog } from './activityService.js';
import { createEntityId } from '../utils/id.js';

function getSeedDate(minutesAgo = 0) {
  return new Date(Date.now() - minutesAgo * 60 * 1000);
}

function buildOwnerName(email) {
  const local = String(email || 'admin').split('@')[0];

  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

export async function seedTenantWorkspace({ ownerUser, tenant }) {
  const tenantId = tenant.id;
  const invitePasswordHash = await bcrypt.hash(createEntityId('invite'), 10);

  await Vehicle.insertMany(
    INITIAL_VEHICLES.map((vehicle) => ({
      recordId: vehicle.id,
      tenantId,
      registrationNumber: vehicle.registrationNumber,
      model: vehicle.model,
      type: vehicle.type,
      assignedDriver: vehicle.assignedDriver,
      assignedDriverId: null,
      status: vehicle.status,
      nextService: vehicle.nextService,
      serviceNote: vehicle.serviceNote,
      fuelAverage: vehicle.fuelAverage,
      vin: vehicle.vin,
      capacity: vehicle.capacity,
      hub: vehicle.hub,
      notes: vehicle.notes,
    }))
  );

  await Driver.insertMany(
    INITIAL_DRIVERS.map((driver) => ({
      recordId: driver.id,
      tenantId,
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
    }))
  );

  await Order.insertMany(
    INITIAL_ORDERS.map((order) => ({
      recordId: order.id,
      tenantId,
      customer: order.customer,
      origin: order.origin,
      destination: order.destination,
      route: order.route,
      detail: order.detail,
      weight: order.weight,
      status: order.status,
      driver: order.driver,
      driverId: order.driverId,
      vehicleId: null,
      priority: order.priority,
      eta: order.eta,
      speedLabel: order.speed,
      progress: order.progress,
      markerTone: order.markerTone,
      position: order.position,
      routePath: order.routePath,
      auditLogs: order.auditLogs,
      updatedAtTracking: new Date(),
    }))
  );

  await MaintenanceEntry.insertMany(
    INITIAL_MAINTENANCE_ENTRIES.map((entry) => ({
      recordId: entry.id,
      tenantId,
      registration: entry.registration,
      service: entry.service,
      lastService: entry.lastService,
      nextDue: entry.nextDue,
      status: entry.status,
      vendor: entry.vendor,
      costEstimate: entry.costEstimate,
      notes: entry.notes,
    }))
  );

  await MaintenanceAlert.insertMany(
    INITIAL_MAINTENANCE_ALERTS.map((alert) => ({
      recordId: alert.id,
      tenantId,
      level: alert.level,
      title: alert.title,
      note: alert.note,
      action: alert.action,
      tone: alert.tone,
      status: alert.status,
    }))
  );

  await User.insertMany(
    INITIAL_TEAM_MEMBERS.map((member, index) => ({
      recordId: member.id,
      tenantId,
      name: member.name,
      email: member.email,
      passwordHash: invitePasswordHash,
      role: member.role,
      status: member.status,
      isOwner: false,
      lastLoginAt: getSeedDate(index === 0 ? 2 : index === 1 ? 1440 : 7200),
    }))
  );

  ownerUser.name = buildOwnerName(ownerUser.email);
  ownerUser.role = 'Super Admin';
  ownerUser.status = 'Active';
  ownerUser.isOwner = true;
  ownerUser.lastLoginAt = new Date();
  await ownerUser.save();

  tenant.legalEntityName = tenant.legalEntityName || tenant.companyName;
  tenant.domainPrefix = tenant.domainPrefix || tenant.tenantSlug;
  tenant.headquartersAddress = tenant.headquartersAddress || INITIAL_COMPANY_PROFILE.headquartersAddress;
  await tenant.save();

  await Promise.all(
    INITIAL_MAINTENANCE_HISTORY.map((item, index) =>
      createMaintenanceHistoryLog({
        tenantId,
        registration: item.registration,
        service: item.service,
        technician: item.technician,
        result: item.result,
        occurredAt: getSeedDate((index + 1) * 90),
      })
    )
  );

  await Promise.all([
    createActivityLog({
      tenantId,
      category: 'Dispatch Update',
      title: `${INITIAL_DRIVERS[0].name} updated ${INITIAL_ORDERS[0].id}`,
      detail: `Delivery ETA was confirmed for ${INITIAL_ORDERS[0].eta} and the consignee was notified for the ${INITIAL_ORDERS[0].detail} lane.`,
      tone: 'success',
      occurredAt: getSeedDate(2),
    }),
    createActivityLog({
      tenantId,
      category: 'Maintenance',
      title: `Vehicle ${INITIAL_MAINTENANCE_ENTRIES[0].registration} entered scheduled maintenance`,
      detail: `${INITIAL_MAINTENANCE_ENTRIES[0].service} was started at ${INITIAL_MAINTENANCE_ENTRIES[0].vendor}.`,
      tone: 'warning',
      occurredAt: getSeedDate(60),
    }),
    createActivityLog({
      tenantId,
      category: 'Lane Planning',
      title: `${INITIAL_TEAM_MEMBERS[1].name} assigned new orders to the Jaipur lane`,
      detail: 'The queue was rebalanced to keep the evening dispatch window within the planned turnaround target.',
      tone: 'info',
      occurredAt: getSeedDate(180),
    }),
    createActivityLog({
      tenantId,
      category: 'Warehouse',
      title: 'Inbound scan completed for the Hyderabad consolidation batch',
      detail: 'Twenty three parcels cleared quality checks and were handed over to the outbound sorting team.',
      tone: 'success',
      occurredAt: getSeedDate(240),
    }),
    createActivityLog({
      tenantId,
      category: 'Driver Check-In',
      title: `${INITIAL_DRIVERS[2].name} checked in for the ${INITIAL_DRIVERS[2].detail} shift`,
      detail: 'Pre-trip review was completed and the vehicle health checklist was signed off without exceptions.',
      tone: 'info',
      occurredAt: getSeedDate(300),
    }),
  ]);
}

export async function clearTenantWorkspace(tenantId) {
  await Promise.all([
    ActivityLog.deleteMany({ tenantId }),
    Driver.deleteMany({ tenantId }),
    MaintenanceAlert.deleteMany({ tenantId }),
    MaintenanceEntry.deleteMany({ tenantId }),
    Order.deleteMany({ tenantId }),
    User.deleteMany({ tenantId, isOwner: false }),
    Vehicle.deleteMany({ tenantId }),
  ]);
}
