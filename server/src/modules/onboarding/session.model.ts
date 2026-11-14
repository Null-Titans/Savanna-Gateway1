import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type IdentityRoute =
  | 'national_id'
  | 'refugee_id'
  | 'other_document'
  | 'no_documents'
  | 'partner_referral'
  | 'none'
  | '';

export type RegistrationMode = 'self' | 'partner_assisted';

export interface IConsentRecord {
  learnerConsented: boolean;
  consentLanguage: string;
  partnerOrganizationName: string;
  representativeName: string;
  sharedFieldsSummary: string[];
  recordedAtIso: string;
}

export interface IOnboardingDraftData {
  isSharedDevice: boolean | null;
  registrationMode: RegistrationMode;
  fullName: string;
  contactMethod: 'phone' | 'email' | 'partner_contact' | 'none';
  contactValue: string;
  identityRoute: IdentityRoute;
  identityReferenceNumber: string; // Encrypted before storage if present
  partnerReferralOrg: string;
  supportPreferences: string[];
  supportNotes: string; // Kept private
  partnerConsent?: IConsentRecord;
  updatedAtIso: string;
}

export interface IOnboardingSession extends Document {
  sessionId: string;
  draftTokenHash: string; // SHA-256 of resume token
  organizationId?: mongoose.Types.ObjectId;
  widgetKey?: string;
  isSharedDevice: boolean;
  registrationMode: RegistrationMode;
  stepIndex: number;
  stepResponses: Map<string, unknown>;
  draft: IOnboardingDraftData;
  status: 'in_progress' | 'submitted' | 'expired';
  expiresAt: Date;
  submittedAt?: Date | null;
  submissionReceiptId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ConsentRecordSchema = new Schema<IConsentRecord>(
  {
    learnerConsented: { type: Boolean, required: true },
    consentLanguage: { type: String, default: 'en' },
    partnerOrganizationName: { type: String, trim: true, default: '' },
    representativeName: { type: String, trim: true, default: '' },
    sharedFieldsSummary: { type: [String], default: [] },
    recordedAtIso: { type: String, required: true },
  },
  { _id: false }
);

const OnboardingDraftDataSchema = new Schema<IOnboardingDraftData>(
  {
    isSharedDevice: { type: Boolean, default: null },
    registrationMode: {
      type: String,
      enum: ['self', 'partner_assisted'],
      default: 'self',
    },
    fullName: { type: String, trim: true, default: '' },
    contactMethod: {
      type: String,
      enum: ['phone', 'email', 'partner_contact', 'none'],
      default: 'none',
    },
    contactValue: { type: String, trim: true, default: '' },
    identityRoute: {
      type: String,
      enum: [
        'national_id',
        'refugee_id',
        'other_document',
        'no_documents',
        'partner_referral',
        'none',
        '',
      ],
      default: '',
    },
    identityReferenceNumber: { type: String, default: '' },
    partnerReferralOrg: { type: String, trim: true, default: '' },
    supportPreferences: { type: [String], default: [] },
    supportNotes: { type: String, default: '' },
    partnerConsent: { type: ConsentRecordSchema, required: false },
    updatedAtIso: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const OnboardingSessionSchema = new Schema<IOnboardingSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    draftTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    widgetKey: {
      type: String,
      index: true,
    },
    isSharedDevice: {
      type: Boolean,
      default: false,
    },
    registrationMode: {
      type: String,
      enum: ['self', 'partner_assisted'],
      default: 'self',
    },
    stepIndex: {
      type: Number,
      default: 0,
    },
    stepResponses: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => new Map(),
    },
    draft: {
      type: OnboardingDraftDataSchema,
      default: () => ({
        isSharedDevice: false,
        registrationMode: 'self',
        fullName: '',
        contactMethod: 'none',
        contactValue: '',
        identityRoute: '',
        identityReferenceNumber: '',
        partnerReferralOrg: '',
        supportPreferences: [],
        supportNotes: '',
        updatedAtIso: new Date().toISOString(),
      }),
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'expired'],
      default: 'in_progress',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    submissionReceiptId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'onboarding_sessions',
  }
);

export const OnboardingSession: Model<IOnboardingSession> =
  mongoose.model<IOnboardingSession>('OnboardingSession', OnboardingSessionSchema);
