import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    legalEntityName: { type: String, required: true, trim: true },
    tenantSlug: { type: String, required: true, trim: true, unique: true },
    domainPrefix: { type: String, required: true, trim: true },
    headquartersAddress: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

export const Tenant = mongoose.model('Tenant', tenantSchema);
