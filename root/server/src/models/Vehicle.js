import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    registrationNumber: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    assignedDriver: { type: String, default: 'Unassigned', trim: true },
    assignedDriverId: { type: String, default: null },
    status: { type: String, required: true, trim: true },
    nextService: { type: String, required: true, trim: true },
    serviceNote: { type: String, required: true, trim: true },
    fuelAverage: { type: Number, required: true },
    vin: { type: String, required: true, trim: true },
    capacity: { type: String, required: true, trim: true },
    hub: { type: String, required: true, trim: true },
    notes: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ tenantId: 1, recordId: 1 }, { unique: true });

export const Vehicle = mongoose.model('Vehicle', vehicleSchema);
