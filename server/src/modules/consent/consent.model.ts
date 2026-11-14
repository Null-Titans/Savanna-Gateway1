import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type ConsentPurpose =
  | 'career_guidance'
  | 'data_sharing_with_employers'
  | 'accessibility_accommodations'
  | 'voice_profile_storage'
  | 'general_onboarding';

export interface IConsent extends Document {
  learnerId?: string; // Pseudonymized / encrypted learner reference
  learnerIdHash?: string; // Deterministic SHA-256 hash for querying
  sessionReference: string; // Ephemeral onboarding session token or reference
  purpose: ConsentPurpose;
  grantedToOrganizationId: mongoose.Types.ObjectId;
  timestamp: Date;
  revokedAt?: Date | null;
  revocationReason?: string;
  metadata: {
    ipHash?: string;
    userAgent?: string;
    consentTextVersion: string;
    specificPermissions: string[];
  };
  isActive(): boolean;
}

export interface IConsentModel extends Model<IConsent> {
  findActiveConsent(
    reference: string,
    purpose: ConsentPurpose,
    organizationId: string | mongoose.Types.ObjectId
  ): Promise<IConsent | null>;
}

const ConsentSchema = new Schema<IConsent, IConsentModel>(
  {
    learnerId: {
      type: String,
      trim: true,
      index: true,
    },
    learnerIdHash: {
      type: String,
      index: true,
    },
    sessionReference: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    purpose: {
      type: String,
      required: true,
      enum: [
        'career_guidance',
        'data_sharing_with_employers',
        'accessibility_accommodations',
        'voice_profile_storage',
        'general_onboarding',
      ],
      index: true,
    },
    grantedToOrganizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
    revocationReason: {
      type: String,
      trim: true,
    },
    metadata: {
      ipHash: { type: String },
      userAgent: { type: String, trim: true },
      consentTextVersion: { type: String, required: true, default: '1.0' },
      specificPermissions: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
    collection: 'consents',
  }
);

// Compound index for fast tenant-scoped consent validation
ConsentSchema.index(
  { sessionReference: 1, purpose: 1, grantedToOrganizationId: 1, revokedAt: 1 },
  { name: 'idx_consent_tenant_lookup' }
);
ConsentSchema.index(
  { learnerIdHash: 1, purpose: 1, grantedToOrganizationId: 1, revokedAt: 1 },
  { name: 'idx_consent_learner_lookup' }
);

ConsentSchema.methods.isActive = function (): boolean {
  return this.revokedAt === null || this.revokedAt === undefined;
};

ConsentSchema.statics.findActiveConsent = async function (
  reference: string,
  purpose: ConsentPurpose,
  organizationId: string | mongoose.Types.ObjectId
): Promise<IConsent | null> {
  return this.findOne({
    $or: [{ sessionReference: reference }, { learnerIdHash: reference }],
    purpose,
    grantedToOrganizationId: organizationId,
    revokedAt: null,
  }).exec();
};

export const Consent = mongoose.model<IConsent, IConsentModel>('Consent', ConsentSchema);
