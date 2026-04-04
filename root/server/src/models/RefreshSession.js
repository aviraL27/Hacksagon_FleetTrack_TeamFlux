import mongoose from 'mongoose';

const refreshSessionSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, unique: true },
    tokenHash: { type: String, required: true },
    rememberMe: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    replacedBySessionId: { type: String, default: null },
    userAgent: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    lastUsedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const RefreshSession = mongoose.model('RefreshSession', refreshSessionSchema);
