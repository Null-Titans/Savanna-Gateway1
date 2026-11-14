export type UserRole =
  | 'PLATFORM_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'ORGANIZATION_MEMBER'
  | 'EMPLOYER'
  | 'PARTNER';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  firstName: string;
  lastName: string;
}

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'pending';
  branding: {
    logoUrl?: string;
    theme?: 'light' | 'dark' | 'high_contrast' | 'system';
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    customCss?: string;
  };
  settings: {
    supportedLanguages: string[];
    defaultLanguage: string;
    accessibilityMode?: {
      highContrastDefault?: boolean;
      screenReaderOptimized?: boolean;
      simplifiedUI?: boolean;
    };
    allowGuestOnboarding?: boolean;
  };
}

export interface ApiKeyContext {
  id: string;
  name: string;
  keyType: 'public_widget' | 'secret_admin';
  scopes: string[];
  organizationId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenant?: TenantContext;
      apiKey?: ApiKeyContext;
    }
  }
}

export {};
