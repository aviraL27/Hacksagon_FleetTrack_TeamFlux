import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, trim: true },
    assignment: { type: String, required: true, trim: true },
    detail: { type: String, required: true, trim: true },
    status: { type: String, required: true, trim: true },
    score: { type: Number, required: true },
    grade: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    baseHub: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    emergencyContact: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

driverSchema.index({ tenantId: 1, recordId: 1 }, { unique: true });

export const Driver = mongoose.model('Driver', driverSchema);
