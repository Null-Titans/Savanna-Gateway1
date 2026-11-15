import mongoose, { Schema } from 'mongoose';

const partnerIntegrationSchema = new Schema({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  integrationType: {
    type: String,
    enum: ['lms', 'ats', 'ngo', 'university', 'employer_platform'],
    required: true,
  },
  externalOrganizationRef: { type: String, trim: true, maxlength: 160 },
  callbackUrl: { type: String, trim: true, maxlength: 500 },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending',
  },
}, { timestamps: true });

partnerIntegrationSchema.index({ organizationId: 1, name: 1 });

export const PartnerIntegration =
  mongoose.models.PartnerIntegration ||
  mongoose.model('PartnerIntegration', partnerIntegrationSchema);
