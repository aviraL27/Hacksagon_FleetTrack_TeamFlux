import express from 'express';
import { Driver } from '../models/Driver.js';
import { Order } from '../models/Order.js';
import { requireAuth } from '../middleware/auth.js';
import { createActivityLog } from '../services/activityService.js';
import {
  buildDriverAssignmentUpdate,
  buildOrderForCreate,
  buildOrderStatusUpdate,
  generateUniqueOrderRecordId,
} from '../services/orderService.js';
import { serializeOrder } from '../services/serializers.js';
import { emitOrderUpdate } from '../services/socketService.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ tenantId: req.auth.tenantId }).sort({ createdAt: -1 });
    res.json(orders.map((order) => serializeOrder(order)));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const driverRecord =
      req.body.driver && req.body.driver !== 'Unassigned'
        ? await Driver.findOne({ tenantId: req.auth.tenantId, name: req.body.driver })
        : null;

    const recordId = req.body.id?.trim() || (await generateUniqueOrderRecordId(req.auth.tenantId));
    const order = await Order.create({
      tenantId: req.auth.tenantId,
      ...buildOrderForCreate(req.body, { driverRecord, recordId }),
    });

    await createActivityLog({
      tenantId: req.auth.tenantId,
      category: 'Dispatch Update',
      title: `${req.user.name} created ${order.recordId}`,
      detail: `${order.customer} was queued for the ${order.detail} route.`,
      tone: 'info',
    });

    emitOrderUpdate(order, { statusChanged: true });
    res.status(201).json(serializeOrder(order));
  })
);

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ tenantId: req.auth.tenantId, recordId: req.params.id });

    if (!order) {
      throw new ApiError(404, 'Order not found.');
    }

    const nextOrder = buildOrderStatusUpdate(order, req.body.status);
    const statusChanged = order.status !== nextOrder.status;
    Object.assign(order, nextOrder);
    await order.save();

    await createActivityLog({
      tenantId: req.auth.tenantId,
      category: 'Dispatch Update',
      title: `${req.user.name} updated ${order.recordId}`,
      detail: `Status moved to ${order.status} for ${order.customer}.`,
      tone: order.status === 'Delivered' ? 'success' : order.status === 'Delayed' ? 'warning' : 'info',
    });

    emitOrderUpdate(order, { statusChanged });
    res.json(serializeOrder(order));
  })
);

router.patch(
  '/:id/assign-driver',
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ tenantId: req.auth.tenantId, recordId: req.params.id });

    if (!order) {
      throw new ApiError(404, 'Order not found.');
    }

    const driverName = String(req.body.driver || 'Unassigned').trim() || 'Unassigned';
    const driverRecord =
      driverName === 'Unassigned'
        ? null
        : await Driver.findOne({ tenantId: req.auth.tenantId, name: driverName });

    Object.assign(order, buildDriverAssignmentUpdate(order, driverName, driverRecord));
    await order.save();

    await createActivityLog({
      tenantId: req.auth.tenantId,
      category: 'Lane Planning',
      title: `${req.user.name} reassigned ${order.recordId}`,
      detail: `${order.customer} is now assigned to ${order.driver}.`,
      tone: 'info',
    });

    emitOrderUpdate(order, { statusChanged: true });
    res.json(serializeOrder(order));
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findOneAndDelete({ tenantId: req.auth.tenantId, recordId: req.params.id });

    if (!order) {
      throw new ApiError(404, 'Order not found.');
    }

    await createActivityLog({
      tenantId: req.auth.tenantId,
      category: 'Dispatch Update',
      title: `${req.user.name} removed ${order.recordId}`,
      detail: `${order.customer} was removed from the dispatch board.`,
      tone: 'warning',
    });

    res.json({ success: true });
  })
);

export default router;
