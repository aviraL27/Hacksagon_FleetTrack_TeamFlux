import mongoose from 'mongoose';

const orderAuditLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    time: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    customer: { type: String, required: true, trim: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    route: { type: String, required: true, trim: true },
    detail: { type: String, required: true, trim: true },
    weight: { type: String, required: true, trim: true },
    status: { type: String, required: true, trim: true },
    driver: { type: String, required: true, trim: true },
    driverId: { type: String, default: null },
    vehicleId: { type: String, default: null },
    priority: { type: String, required: true, trim: true },
    eta: { type: String, required: true, trim: true },
    speedLabel: { type: String, required: true, trim: true },
    progress: { type: Number, required: true },
    markerTone: { type: String, required: true, trim: true },
    position: { type: [Number], default: [] },
    routePath: { type: [[Number]], default: [] },
    auditLogs: { type: [orderAuditLogSchema], default: [] },
    updatedAtTracking: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ tenantId: 1, recordId: 1 }, { unique: true });

export const Order = mongoose.model('Order', orderSchema);
