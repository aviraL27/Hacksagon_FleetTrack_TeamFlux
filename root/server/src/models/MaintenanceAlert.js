import mongoose from 'mongoose';

const maintenanceAlertSchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    level: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    note: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    tone: { type: String, required: true, trim: true },
    status: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

maintenanceAlertSchema.index({ tenantId: 1, recordId: 1 }, { unique: true });

export const MaintenanceAlert = mongoose.model('MaintenanceAlert', maintenanceAlertSchema);
