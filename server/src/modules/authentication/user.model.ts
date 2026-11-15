import mongoose, { Schema, type Document, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { UserRole } from '../../types/express.js';

export type UserStatus = 'active' | 'suspended' | 'pending_verification';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: mongoose.Types.ObjectId;
  status: UserStatus;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeUser(): Record<string, unknown>;
}

export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  hashPassword(password: string): Promise<string>;
}

const UserSchema = new Schema<IUser, IUserModel>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never included in default queries
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 60,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 60,
    },
    role: {
      type: String,
      required: true,
      enum: [
        'PLATFORM_ADMIN',
        'ORGANIZATION_ADMIN',
        'ORGANIZATION_MEMBER',
        'EMPLOYER',
        'PARTNER',
        'LEARNER',
      ],
      default: 'ORGANIZATION_MEMBER',
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: function (this: IUser) {
        // PLATFORM_ADMIN can be global across all tenants
        return this.role !== 'PLATFORM_ADMIN';
      },
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending_verification'],
      default: 'active',
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Method to verify candidate password against stored bcrypt hash
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Strips sensitive fields for API response serialization
UserSchema.methods.toSafeUser = function (): Record<string, unknown> {
  return {
    id: this._id.toString(),
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    role: this.role,
    organizationId: this.organizationId ? this.organizationId.toString() : undefined,
    status: this.status,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

UserSchema.statics.findByEmail = async function (email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash').exec();
};

UserSchema.statics.hashPassword = async function (password: string): Promise<string> {
  const SALT_ROUNDS = 12;
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const User = mongoose.model<IUser, IUserModel>('User', UserSchema);

