import mongoose from 'mongoose';

const passwordResetOtpSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    consumedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    requestedIp: { type: String, default: '' },
    requestedUserAgent: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

passwordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetOtpSchema.index({ tenantId: 1, userId: 1, consumedAt: 1, expiresAt: -1 });

export const PasswordResetOtp = mongoose.model('PasswordResetOtp', passwordResetOtpSchema);
