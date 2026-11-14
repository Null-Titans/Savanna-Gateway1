import mongoose from 'mongoose';
import {
  Organization,
  type IOrganization,
  type IOrganizationBranding,
  type IOrganizationSettings,
  type ApiKeyType,
  type IApiKey,
} from './organization.model.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors/index.js';
import { generateApiKey } from '../../shared/utils/crypto.js';

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  branding?: Partial<IOrganizationBranding>;
  settings?: Partial<IOrganizationSettings>;
}

export interface UpdateOrganizationInput {
  name?: string;
  branding?: Partial<IOrganizationBranding>;
  settings?: Partial<IOrganizationSettings>;
}

export interface CreateApiKeyResult {
  apiKey: {
    id: string;
    name: string;
    keyPrefix: string;
    keyType: ApiKeyType;
    scopes: string[];
    createdAt: Date;
    key: string; // Plain key displayed once
  };
}

export class OrganizationService {
  /**
   * Creates a new organization with default branding, multilingual settings, and an initial public widget key.
   */
  public static async createOrganization(
    input: CreateOrganizationInput
  ): Promise<{ organization: IOrganization; publicWidgetKey: string }> {
    const slug = input.slug.toLowerCase().trim();
    const existing = await Organization.findOne({ slug });
    if (existing) {
      throw new ConflictError(`Organization slug '${slug}' is already taken`);
    }

    // Generate initial public widget key
    const generatedKey = generateApiKey('pk_live_');

    const defaultLanguages = input.settings?.supportedLanguages ?? ['en', 'am', 'om'];

    const organization = new Organization({
      name: input.name.trim(),
      slug,
      branding: {
        theme: 'light',
        primaryColor: '#2563EB',
        ...input.branding,
      },
      settings: {
        supportedLanguages: defaultLanguages,
        defaultLanguage: input.settings?.defaultLanguage ?? 'en',
        accessibilityMode: {
          highContrastDefault: false,
          screenReaderOptimized: true,
          simplifiedUI: false,
          ...input.settings?.accessibilityMode,
        },
        allowGuestOnboarding: input.settings?.allowGuestOnboarding ?? true,
      },
      status: 'active',
      apiKeys: [
        {
          name: 'Default Public Onboarding Widget Key',
          keyPrefix: generatedKey.displayPrefix,
          keyHash: generatedKey.keyHash,
          keyType: 'public_widget',
          scopes: ['widget:read', 'onboarding:submit'],
          createdAt: new Date(),
        },
      ],
    });

    await organization.save();

    return {
      organization,
      publicWidgetKey: generatedKey.key,
    };
  }

  /**
   * Retrieves public branding & config without exposing any secret keys or internal metadata.
   */
  public static async getPublicConfig(idOrSlug: string): Promise<Record<string, unknown>> {
    const org = await Organization.findBySlugOrId(idOrSlug);
    if (!org) {
      throw new NotFoundError(`Organization '${idOrSlug}' not found`);
    }

    return org.toPublicConfig();
  }

  /**
   * Updates organization branding and configuration.
   */
  public static async updateOrganization(
    id: string,
    updates: UpdateOrganizationInput
  ): Promise<IOrganization> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid organization ID format');
    }

    const org = await Organization.findById(id);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    if (updates.name) {
      org.name = updates.name.trim();
    }

    if (updates.branding) {
      org.branding = {
        ...org.branding,
        ...updates.branding,
      };
    }

    if (updates.settings) {
      org.settings = {
        ...org.settings,
        ...updates.settings,
      };
    }

    await org.save();
    return org;
  }

  /**
   * Generates a new API key for the organization (public_widget or secret_admin).
   */
  public static async generateApiKey(
    orgId: string,
    name: string,
    keyType: ApiKeyType,
    scopes?: string[]
  ): Promise<CreateApiKeyResult> {
    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      throw new ValidationError('Invalid organization ID format');
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    const prefix = keyType === 'public_widget' ? 'pk_live_' : 'sk_live_';
    const generated = generateApiKey(prefix);

    const defaultScopes = keyType === 'public_widget'
      ? ['widget:read', 'onboarding:submit']
      : ['*'];

    const newKeyDoc: IApiKey = {
      id: new mongoose.Types.ObjectId().toString(),
      name: name.trim(),
      keyPrefix: generated.displayPrefix,
      keyHash: generated.keyHash,
      keyType,
      scopes: scopes && scopes.length > 0 ? scopes : defaultScopes,
      createdAt: new Date(),
      lastUsedAt: null,
      revokedAt: null,
    };

    org.apiKeys.push(newKeyDoc);
    await org.save();

    return {
      apiKey: {
        id: newKeyDoc.id,
        name: newKeyDoc.name,
        keyPrefix: newKeyDoc.keyPrefix,
        keyType: newKeyDoc.keyType,
        scopes: newKeyDoc.scopes,
        createdAt: newKeyDoc.createdAt,
        key: generated.key,
      },
    };
  }

  /**
   * Revokes an existing API key.
   */
  public static async revokeApiKey(orgId: string, keyId: string): Promise<void> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    const key = org.apiKeys.find((k) => k.id === keyId);
    if (!key) {
      throw new NotFoundError('API Key not found');
    }

    key.revokedAt = new Date();
    await org.save();
  }
}
