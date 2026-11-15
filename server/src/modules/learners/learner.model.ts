import mongoose, { Schema, type Document } from 'mongoose';

export interface ILearnerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  displayName: string;
  preferredLanguage: 'en' | 'am' | 'om';
  education: string;
  skills: string[];
  accessibilityPreferences: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LearnerProfileSchema = new Schema<ILearnerProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  displayName: { type: String, required: true, trim: true, maxlength: 120 },
  preferredLanguage: { type: String, enum: ['en', 'am', 'om'], default: 'en' },
  education: { type: String, default: '', maxlength: 2000 },
  skills: { type: [String], default: [] },
  accessibilityPreferences: { type: [String], default: [] },
}, { timestamps: true, collection: 'learner_profiles' });

LearnerProfileSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const LearnerProfile = mongoose.model<ILearnerProfile>('LearnerProfile', LearnerProfileSchema);
