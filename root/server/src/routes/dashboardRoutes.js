import express from 'express';
import { Driver } from '../models/Driver.js';
import { MaintenanceAlert } from '../models/MaintenanceAlert.js';
import { Order } from '../models/Order.js';
import { Vehicle } from '../models/Vehicle.js';
import { requireAuth } from '../middleware/auth.js';
import { getRecentActivity } from '../services/activityService.js';
import { serializeActivityLog } from '../services/serializers.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
const achievedWeights = [0.18, 0.09, 0.13, 0.22, 0.16, 0.08, 0.14];
const baselineWeights = [0.14, 0.09, 0.12, 0.2, 0.18, 0.11, 0.16];

function buildFleetMix(vehicles) {
  const groups = {
    'Heavy Trucks': { label: 'Heavy Trucks', units: 0, fill: 'linear-gradient(90deg,var(--accent),#8aa2ff)', focus: 'Inter-city haulage' },
    'Delivery Vans': { label: 'Delivery Vans', units: 0, fill: 'linear-gradient(90deg,#69d9ca,#75b6ff)', focus: 'Urban last-mile coverage' },
    'Support Cars': { label: 'Support Cars', units: 0, fill: 'linear-gradient(90deg,#7e8ca6,#bcc6d8)', focus: 'Field support and escalation' },
  };

  vehicles.forEach((vehicle) => {
    const type = vehicle.type.toLowerCase();

    if (type.includes('van') || type.includes('box')) {
      groups['Delivery Vans'].units += 1;
      return;
    }

    if (type.includes('truck') || type.includes('heavy')) {
      groups['Heavy Trucks'].units += 1;
      return;
    }

    groups['Support Cars'].units += 1;
  });

  return Object.values(groups);
}

function buildProgressSeries(dailyGoal, dailyAchieved) {
  return timeSlots.map((time, index) => ({
    time,
    delivered: Math.max(1, Math.round(dailyAchieved * achievedWeights[index])),
    baseline: Math.max(1, Math.round(dailyGoal * baselineWeights[index])),
  }));
}

router.use(requireAuth);

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const [vehicles, drivers, orders, alerts, activityLogs] = await Promise.all([
      Vehicle.find({ tenantId: req.auth.tenantId }),
      Driver.find({ tenantId: req.auth.tenantId }),
      Order.find({ tenantId: req.auth.tenantId }).sort({ updatedAtTracking: -1 }),
      MaintenanceAlert.find({ tenantId: req.auth.tenantId }),
      getRecentActivity(req.auth.tenantId, 5),
    ]);

    const totalFleet = vehicles.length;
    const activeDrivers = drivers.filter((driver) => driver.status === 'On Trip' || driver.status === 'Available').length;
    const ordersToday = orders.length;
    const maintenanceAlerts = alerts.filter((alert) => alert.status !== 'Read').length;
    const deliveredCount = orders.filter((order) => order.status === 'Delivered').length;
    const inTransitCount = orders.filter((order) => order.status === 'In Transit').length;
    const delayedCount = orders.filter((order) => order.status === 'Delayed').length;
    const dailyGoal = Math.max(24, ordersToday * 3);
    const dailyAchieved = deliveredCount * 3 + inTransitCount * 2 + delayedCount;

    res.json({
      dailyAchieved,
      dailyGoal,
      deliveryProgressSeries: buildProgressSeries(dailyGoal, dailyAchieved),
      dispatchQueue: orders.slice(0, 3).map((order) => ({
        id: order.recordId,
        customer: order.customer,
        route: order.detail,
        status: order.status,
      })),
      fleetMix: buildFleetMix(vehicles),
      recentActivity: activityLogs.slice(0, 3).map((item) => serializeActivityLog(item)),
      activityLogEntries: activityLogs.map((item) => serializeActivityLog(item)),
      stats: [
        { label: 'Total Fleet', value: String(totalFleet), note: `${vehicles.filter((vehicle) => vehicle.status === 'Active').length} units active across the tenant`, tone: 'success', icon: 'local_shipping' },
        { label: 'Active Drivers', value: String(activeDrivers), note: `${drivers.filter((driver) => driver.status === 'On Trip').length} teams currently on route`, tone: 'info', icon: 'badge' },
        { label: 'Orders Today', value: String(ordersToday), note: `${Math.min(100, Math.round((dailyAchieved / dailyGoal) * 100))}% of dispatch goal reached`, tone: 'warning', icon: 'inventory_2' },
        { label: 'Maintenance Alerts', value: String(maintenanceAlerts), note: maintenanceAlerts ? 'Immediate follow-up needed' : 'No active blockers', tone: maintenanceAlerts ? 'danger' : 'success', icon: 'warning' },
      ],
    });
  })
);

export default router;
