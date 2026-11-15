import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type RefreshTokenRevocationReason = 'ROTATED' | 'LOGOUT' | 'REUSE' | 'EXPIRED';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  tokenHash: string;
  family: string;
  isRevoked: boolean;
  revocationReason?: RefreshTokenRevocationReason;
  expiresAt: Date;
  replacedByTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefreshTokenModel extends Model<IRefreshToken> {
  findByTokenHash(tokenHash: string): Promise<IRefreshToken | null>;
  revokeFamily(
    family: string,
    reason?: RefreshTokenRevocationReason
  ): Promise<void>;
}

const RefreshTokenSchema = new Schema<IRefreshToken, IRefreshTokenModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    family: {
      type: String,
      required: true,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revocationReason: {
      type: String,
      enum: ['ROTATED', 'LOGOUT', 'REUSE', 'EXPIRED'],
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    replacedByTokenHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'refresh_tokens',
  }
);

RefreshTokenSchema.statics.findByTokenHash = async function (
  tokenHash: string
): Promise<IRefreshToken | null> {
  return this.findOne({ tokenHash }).exec();
};

RefreshTokenSchema.statics.revokeFamily = async function (
  family: string,
  reason: RefreshTokenRevocationReason = 'REUSE'
): Promise<void> {
  await this.updateMany(
    { family },
    { $set: { isRevoked: true, revocationReason: reason } }
  ).exec();
};

export const RefreshToken = mongoose.model<IRefreshToken, IRefreshTokenModel>(
  'RefreshToken',
  RefreshTokenSchema
);
