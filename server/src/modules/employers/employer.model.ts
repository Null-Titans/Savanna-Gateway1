import mongoose, { Schema } from 'mongoose';

const employerProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160,
  },
  website: { type: String, trim: true, maxlength: 300 },
  industry: { type: String, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 3000 },
  contactName: { type: String, trim: true, maxlength: 120 },
  contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 40 },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending',
  },
}, { timestamps: true });

employerProfileSchema.index(
  { userId: 1, organizationId: 1 },
  { unique: true }
);

export const EmployerProfile =
  mongoose.models.EmployerProfile ||
  mongoose.model('EmployerProfile', employerProfileSchema);
