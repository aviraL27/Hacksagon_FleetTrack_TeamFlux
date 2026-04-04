import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, default: 'Operations Manager' },
    status: { type: String, required: true, default: 'Active' },
    phone: { type: String, default: '', trim: true },
    assignedHub: { type: String, default: '', trim: true },
    responsibilities: { type: [String], default: [] },
    notes: { type: String, default: '', trim: true },
    isOwner: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, recordId: 1 }, { unique: true });

export const User = mongoose.model('User', userSchema);

