import mongoose from 'mongoose';

const maintenanceEntrySchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    registration: { type: String, required: true, trim: true },
    service: { type: String, required: true, trim: true },
    lastService: { type: String, required: true, trim: true },
    nextDue: { type: String, required: true, trim: true },
    status: { type: String, required: true, trim: true },
    vendor: { type: String, required: true, trim: true },
    costEstimate: { type: String, required: true, trim: true },
    notes: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

maintenanceEntrySchema.index({ tenantId: 1, recordId: 1 }, { unique: true });

export const MaintenanceEntry = mongoose.model('MaintenanceEntry', maintenanceEntrySchema);
