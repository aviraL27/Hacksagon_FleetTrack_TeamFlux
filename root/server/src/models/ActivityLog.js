import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    activityType: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    detail: { type: String, required: true, trim: true },
    tone: { type: String, required: true, trim: true },
    occurredAt: { type: Date, required: true, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ tenantId: 1, recordId: 1 }, { unique: true });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
