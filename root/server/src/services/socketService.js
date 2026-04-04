import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { Order } from '../models/Order.js';
import { serializeOrder, serializeTrackingPayload } from './serializers.js';
import { buildTrackingStep } from './orderService.js';
import { verifyAccessToken } from './authService.js';

let io = null;
let simulationTimer = null;
let isSimulationTickRunning = false;

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

async function emitTrackingSnapshot(socket, tenantId) {
  if (!isDatabaseReady()) {
    console.warn('Skipping tracking snapshot because MongoDB is not connected.');
    return;
  }

  try {
    const orders = await Order.find({ tenantId }).sort({ createdAt: -1 });
    socket.emit('tracking:snapshot', orders.map((order) => serializeOrder(order)));
  } catch (error) {
    console.error('Unable to emit tracking snapshot:', error);
  }
}

function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Missing access token.'));
    }

    const payload = verifyAccessToken(token);
    socket.data.auth = {
      tenantId: payload.tenantId,
      userId: payload.sub,
      role: payload.role,
    };

    return next();
  } catch {
    return next(new Error('Unauthorized socket connection.'));
  }
}

export function initializeSocket(httpServer, { corsOrigin }) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const tenantRoom = socket.data.auth.tenantId;
    socket.join(tenantRoom);
    void emitTrackingSnapshot(socket, tenantRoom);

    socket.on('tenant:join', ({ tenantId } = {}) => {
      if (tenantId && tenantId === tenantRoom) {
        socket.join(tenantRoom);
        void emitTrackingSnapshot(socket, tenantRoom);
      }
    });
  });

  if (!simulationTimer) {
    simulationTimer = setInterval(runTrackingSimulationTick, 5000);
  }

  return io;
}

export function emitOrderUpdate(order, { statusChanged = false } = {}) {
  if (!io) {
    return;
  }

  const room = order.tenantId?.toString?.() || order.tenantId;
  const trackingPayload = serializeTrackingPayload(order);

  io.to(room).emit('tracking:location:update', trackingPayload);

  if (statusChanged) {
    io.to(room).emit('tracking:status:update', trackingPayload);
  }
}

async function runTrackingSimulationTick() {
  if (!io || !isDatabaseReady() || isSimulationTickRunning) {
    return;
  }

  isSimulationTickRunning = true;

  try {
    const orders = await Order.find({ status: { $in: ['In Transit', 'Delayed'] } });

    for (const order of orders) {
      try {
        const previousStatus = order.status;
        const nextState = buildTrackingStep(order);

        if (!nextState) {
          continue;
        }

        Object.assign(order, nextState);
        await order.save();
        emitOrderUpdate(order, { statusChanged: previousStatus !== order.status });
      } catch (error) {
        console.error(`Tracking simulation update failed for order ${order.recordId}:`, error);
      }
    }
  } catch (error) {
    console.error('Tracking simulation tick skipped because MongoDB is unavailable:', error);
  } finally {
    isSimulationTickRunning = false;
  }
}
