import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type ApplicationStatus = 'submitted' | 'in_review' | 'shortlisted' | 'rejected';

export interface IApplication extends Document {
  id: string;
  jobId: mongoose.Types.ObjectId;
  applicantName: string;
  contactValue: string;
  relevantExperience: string;
  shareAccommodationRequest: boolean;
  accommodationRequestNote: string;
  explicitConsentToShare: boolean;
  status: ApplicationStatus;
  statusHistory: Array<{
    status: ApplicationStatus;
    changedAt: Date;
    note?: string;
  }>;
  submittedAtIso: string;
  createdAt: Date;
  updatedAt: Date;
  toEmployerSafeView(): Record<string, unknown>;
  toLearnerView(): Record<string, unknown>;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'JobListing',
      required: true,
      index: true,
    },
    applicantName: {
      type: String,
      required: true,
      trim: true,
    },
    contactValue: {
      type: String,
      required: true,
      trim: true,
    },
    relevantExperience: {
      type: String,
      default: '',
    },
    shareAccommodationRequest: {
      type: Boolean,
      default: false,
    },
    accommodationRequestNote: {
      type: String,
      default: '',
    },
    explicitConsentToShare: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['submitted', 'in_review', 'shortlisted', 'rejected'],
      default: 'submitted',
      index: true,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
    submittedAtIso: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: true,
    collection: 'job_applications',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ApplicationSchema.virtual('id').get(function (this: IApplication) {
  return this._id.toString();
});

/**
 * Strict Privacy Segregation:
 * Accommodation notes are ONLY surfaced to employers if the applicant
 * both requested sharing AND gave explicit consent.
 * Otherwise, the field is completely stripped.
 */
ApplicationSchema.methods.toEmployerSafeView = function (): Record<string, unknown> {
  const canShare = Boolean(this.shareAccommodationRequest && this.explicitConsentToShare);

  return {
    id: this._id.toString(),
    jobId: this.jobId.toString(),
    applicantName: this.applicantName,
    contactValue: this.contactValue,
    relevantExperience: this.relevantExperience,
    status: this.status,
    submittedAtIso: this.submittedAtIso,
    hasAccommodationRequest: Boolean(this.shareAccommodationRequest),
    accommodationRequestNote: canShare ? this.accommodationRequestNote : undefined,
    explicitConsentToShare: this.explicitConsentToShare,
  };
};

ApplicationSchema.methods.toLearnerView = function (): Record<string, unknown> {
  return {
    id: this._id.toString(),
    jobId: this.jobId.toString(),
    applicantName: this.applicantName,
    contactValue: this.contactValue,
    relevantExperience: this.relevantExperience,
    shareAccommodationRequest: this.shareAccommodationRequest,
    accommodationRequestNote: this.accommodationRequestNote,
    explicitConsentToShare: this.explicitConsentToShare,
    status: this.status,
    submittedAtIso: this.submittedAtIso,
  };
};

export const Application: Model<IApplication> = mongoose.model<IApplication>(
  'Application',
  ApplicationSchema
);
