import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type AccommodationCategory =
  | 'remote_flexible'
  | 'flexible_hours'
  | 'screen_reader_tools'
  | 'accessible_workplace'
  | 'assistive_tech'
  | 'communication_support'
  | 'other_accommodations'
  | string;

export type EmploymentType =
  | 'Full-time'
  | 'Part-time'
  | 'Apprenticeship'
  | 'Contract'
  | 'Fellowship';

export interface IEmployerAccommodationDetails {
  workEnvironmentAccessibility: string;
  remoteOrFlexibleArrangements: string;
  assistiveTechnologyAvailable: string;
  communicationOptions: string;
  interviewAccommodations: string;
  applicationProcessAccommodations: string;
  additionalSupportOffered: string;
}

export interface IJobListing extends Document {
  id: string; // Expose string id for client compatibility
  employerId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  title: string;
  organization: string;
  location: string;
  isRemote: boolean;
  employmentType: EmploymentType;
  descriptionSummary: string;
  requiredSkills: string[];
  accommodationCategories: AccommodationCategory[];
  accommodationsOffered: string[];
  accommodationDetails: IEmployerAccommodationDetails;
  applicationDeadline?: string;
  postedAtIso: string;
  status: 'published' | 'draft' | 'archived' | 'closed';
  isDemoData: boolean;
  createdAt: Date;
  updatedAt: Date;
  toSafePosting(): Record<string, unknown>;
}

const AccommodationDetailsSchema = new Schema<IEmployerAccommodationDetails>(
  {
    workEnvironmentAccessibility: { type: String, default: '' },
    remoteOrFlexibleArrangements: { type: String, default: '' },
    assistiveTechnologyAvailable: { type: String, default: '' },
    communicationOptions: { type: String, default: '' },
    interviewAccommodations: { type: String, default: '' },
    applicationProcessAccommodations: { type: String, default: '' },
    additionalSupportOffered: { type: String, default: '' },
  },
  { _id: false }
);

const JobListingSchema = new Schema<IJobListing>(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    organization: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    isRemote: {
      type: Boolean,
      default: false,
      index: true,
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Apprenticeship', 'Contract', 'Fellowship'],
      default: 'Full-time',
      index: true,
    },
    descriptionSummary: {
      type: String,
      required: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    accommodationCategories: {
      type: [String],
      default: [],
      index: true,
    },
    accommodationsOffered: {
      type: [String],
      default: [],
    },
    accommodationDetails: {
      type: AccommodationDetailsSchema,
      default: () => ({
        workEnvironmentAccessibility: '',
        remoteOrFlexibleArrangements: '',
        assistiveTechnologyAvailable: '',
        communicationOptions: '',
        interviewAccommodations: '',
        applicationProcessAccommodations: '',
        additionalSupportOffered: '',
      }),
    },
    applicationDeadline: {
      type: String,
    },
    postedAtIso: {
      type: String,
      default: () => new Date().toISOString(),
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived', 'closed'],
      default: 'published',
      index: true,
    },
    isDemoData: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'job_listings',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual id string getter
JobListingSchema.virtual('id').get(function (this: IJobListing) {
  return this._id.toString();
});

JobListingSchema.methods.toSafePosting = function (): Record<string, unknown> {
  return {
    id: this._id.toString(),
    title: this.title,
    organization: this.organization,
    location: this.location,
    isRemote: this.isRemote,
    employmentType: this.employmentType,
    descriptionSummary: this.descriptionSummary,
    requiredSkills: this.requiredSkills,
    accommodationCategories: this.accommodationCategories,
    accommodationsOffered: this.accommodationsOffered,
    accommodationDetails: this.accommodationDetails,
    applicationDeadline: this.applicationDeadline,
    postedAtIso: this.postedAtIso || this.createdAt.toISOString(),
    isDemoData: this.isDemoData,
  };
};

export const JobListing: Model<IJobListing> = mongoose.model<IJobListing>(
  'JobListing',
  JobListingSchema
);
