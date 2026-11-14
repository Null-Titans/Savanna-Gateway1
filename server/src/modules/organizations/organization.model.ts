import mongoose, { Schema, type Document, type Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type OrganizationStatus = 'active' | 'suspended' | 'pending';
export type ApiKeyType = 'public_widget' | 'secret_admin';

export interface IApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  keyType: ApiKeyType;
  scopes: string[];
  createdAt: Date;
  lastUsedAt?: Date | null;
  revokedAt?: Date | null;
}

export interface IOrganizationBranding {
  logoUrl?: string;
  theme: 'light' | 'dark' | 'high_contrast' | 'system';
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  customCss?: string;
}

export interface IOrganizationSettings {
  supportedLanguages: string[]; // ['en', 'am', 'om'] or ['English', 'Amharic', 'Oromo']
  defaultLanguage: string;
  accessibilityMode: {
    highContrastDefault: boolean;
    screenReaderOptimized: boolean;
    simplifiedUI: boolean;
  };
  allowGuestOnboarding: boolean;
}

export interface IOrganization extends Document {
  name: string;
  slug: string;
  branding: IOrganizationBranding;
  settings: IOrganizationSettings;
  status: OrganizationStatus;
  apiKeys: IApiKey[];
  createdAt: Date;
  updatedAt: Date;
  toPublicConfig(): Record<string, unknown>;
}

export interface IOrganizationModel extends Model<IOrganization> {
  findBySlugOrId(identifier: string): Promise<IOrganization | null>;
  findByApiKeyHash(hash: string): Promise<{ organization: IOrganization; apiKey: IApiKey } | null>;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    id: {
      type: String,
      default: () => uuidv4(),
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    keyPrefix: {
      type: String,
      required: true,
      trim: true,
    },
    keyHash: {
      type: String,
      required: true,
      index: true,
    },
    keyType: {
      type: String,
      required: true,
      enum: ['public_widget', 'secret_admin'],
    },
    scopes: {
      type: [String],
      default: function (this: IApiKey) {
        return this.keyType === 'public_widget'
          ? ['widget:read', 'onboarding:submit']
          : ['*'];
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const BrandingSchema = new Schema<IOrganizationBranding>(
  {
    logoUrl: { type: String, trim: true },
    theme: {
      type: String,
      enum: ['light', 'dark', 'high_contrast', 'system'],
      default: 'light',
    },
    primaryColor: {
      type: String,
      default: '#2563EB',
      match: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    },
    secondaryColor: {
      type: String,
      default: '#4F46E5',
    },
    accentColor: {
      type: String,
      default: '#F59E0B',
    },
    backgroundColor: {
      type: String,
      default: '#FFFFFF',
    },
    customCss: { type: String },
  },
  { _id: false }
);

const SettingsSchema = new Schema<IOrganizationSettings>(
  {
    supportedLanguages: {
      type: [String],
      default: ['en', 'am', 'om'], // English, Amharic, Oromo
      validate: {
        validator: (langs: string[]) => langs.length > 0,
        message: 'At least one supported language is required',
      },
    },
    defaultLanguage: {
      type: String,
      default: 'en',
    },
    accessibilityMode: {
      highContrastDefault: { type: Boolean, default: false },
      screenReaderOptimized: { type: Boolean, default: true },
      simplifiedUI: { type: Boolean, default: false },
    },
    allowGuestOnboarding: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const OrganizationSchema = new Schema<IOrganization, IOrganizationModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      index: true,
    },
    branding: {
      type: BrandingSchema,
      default: () => ({}),
    },
    settings: {
      type: SettingsSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active',
      index: true,
    },
    apiKeys: {
      type: [ApiKeySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'organizations',
  }
);

OrganizationSchema.methods.toPublicConfig = function (): Record<string, unknown> {
  return {
    id: this._id.toString(),
    name: this.name,
    slug: this.slug,
    branding: {
      logoUrl: this.branding?.logoUrl,
      theme: this.branding?.theme ?? 'light',
      primaryColor: this.branding?.primaryColor ?? '#2563EB',
      secondaryColor: this.branding?.secondaryColor,
      accentColor: this.branding?.accentColor,
      backgroundColor: this.branding?.backgroundColor,
    },
    settings: {
      supportedLanguages: this.settings?.supportedLanguages ?? ['en', 'am', 'om'],
      defaultLanguage: this.settings?.defaultLanguage ?? 'en',
      accessibilityMode: this.settings?.accessibilityMode ?? {
        highContrastDefault: false,
        screenReaderOptimized: true,
        simplifiedUI: false,
      },
      allowGuestOnboarding: this.settings?.allowGuestOnboarding ?? true,
    },
  };
};

OrganizationSchema.statics.findBySlugOrId = async function (
  identifier: string
): Promise<IOrganization | null> {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return this.findById(identifier).exec();
  }
  return this.findOne({ slug: identifier.toLowerCase().trim() }).exec();
};

OrganizationSchema.statics.findByApiKeyHash = async function (
  hash: string
): Promise<{ organization: IOrganization; apiKey: IApiKey } | null> {
  const org = await this.findOne({
    'apiKeys.keyHash': hash,
    'apiKeys.revokedAt': null,
    status: 'active',
  }).exec();

  if (!org) return null;

  const key = org.apiKeys.find(
    (k) => k.keyHash === hash && k.revokedAt === null
  );

  if (!key) return null;

  return { organization: org, apiKey: key };
};

export const Organization = mongoose.model<IOrganization, IOrganizationModel>(
  'Organization',
  OrganizationSchema
);
