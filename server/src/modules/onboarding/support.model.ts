import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type SupportPreference =
  | 'help_completing'
  | 'communication_assistance'
  | 'alternative_materials'
  | 'flexible_scheduling'
  | 'other_support'
  | 'discuss_privately'
  | string;

export interface IPrivateSupportRequest extends Document {
  sessionReference: string;
  organizationId?: mongoose.Types.ObjectId;
  learnerName?: string;
  contactMethod?: string;
  contactValue?: string;
  supportPreferences: SupportPreference[];
  encryptedNotes: string; // AES-256-GCM encrypted notes - strictly inaccessible to employers
  status: 'pending_review' | 'assigned' | 'addressed';
  counselorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PrivateSupportRequestSchema = new Schema<IPrivateSupportRequest>(
  {
    sessionReference: {
      type: String,
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    learnerName: {
      type: String,
      trim: true,
    },
    contactMethod: {
      type: String,
      trim: true,
    },
    contactValue: {
      type: String,
      trim: true,
    },
    supportPreferences: {
      type: [String],
      default: [],
    },
    encryptedNotes: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending_review', 'assigned', 'addressed'],
      default: 'pending_review',
      index: true,
    },
    counselorId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'private_support_requests',
  }
);

export const PrivateSupportRequest: Model<IPrivateSupportRequest> =
  mongoose.model<IPrivateSupportRequest>(
    'PrivateSupportRequest',
    PrivateSupportRequestSchema
  );
