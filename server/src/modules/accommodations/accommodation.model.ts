import mongoose, { Schema, type Document } from 'mongoose';

export type AccommodationStatus = 'pending' | 'under_review' | 'approved' | 'declined' | 'completed';

export interface IAccommodationRequest extends Document {
  learnerId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  category: string;
  encryptedDetails: string;
  status: AccommodationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AccommodationRequestSchema = new Schema<IAccommodationRequest>({
  learnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  encryptedDetails: { type: String, required: true, select: false },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'declined', 'completed'],
    default: 'pending',
    index: true,
  },
}, { timestamps: true, collection: 'accommodation_requests' });

AccommodationRequestSchema.index({ organizationId: 1, learnerId: 1, createdAt: -1 });

export const AccommodationRequest = mongoose.model<IAccommodationRequest>(
  'AccommodationRequest',
  AccommodationRequestSchema
);
