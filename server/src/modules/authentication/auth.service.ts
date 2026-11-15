import jwt, { type SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { User, type IUser } from './user.model.js';
import { RefreshToken } from './refreshToken.model.js';
import { Organization } from '../organizations/organization.model.js';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../shared/errors/index.js';
import { hashSha256, generateSecureToken } from '../../shared/utils/crypto.js';
import type { UserRole, AuthenticatedUser } from '../../types/express.js';

export interface JwtTokenPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  organizationId?: string;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
  tokenType: 'Bearer';
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  organizationId?: string;
  organizationSlug?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  organizationId?: string;
}

const ACCESS_TOKEN_EXPIRY = '15m';
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 900s
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export class AuthService {
  /**
   * Generates a short-lived cryptographically signed JWT access token.
   */
  public static generateAccessToken(user: IUser): string {
    const payload: JwtTokenPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ? user.organizationId.toString() : undefined,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const signOptions: SignOptions = {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'savanna-career-gateway',
      audience: 'savanna-api-consumers',
    };

    return jwt.sign(payload, env.JWT_SECRET, signOptions);
  }

  /**
   * Generates a high-entropy refresh token and stores its secure hash in the database.
   */
  public static async createRefreshTokenSession(
    user: IUser,
    existingFamily?: string
  ): Promise<string> {
    const plainRefreshToken = generateSecureToken(40);
    const tokenHash = hashSha256(plainRefreshToken);
    const family = existingFamily || uuidv4();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await RefreshToken.create({
      userId: user._id,
      organizationId: user.organizationId,
      tokenHash,
      family,
      isRevoked: false,
      expiresAt,
    });

    return plainRefreshToken;
  }

  /**
   * Authenticates user credentials and issues a fresh token pair.
   */
  public static async login(input: LoginInput): Promise<{
    user: Record<string, unknown>;
    tokens: AuthTokens;
  }> {
    const user = await User.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password credentials', 'INVALID_CREDENTIALS');
    }

    if (user.status === 'suspended') {
      throw new ForbiddenError('User account has been suspended', 'ACCOUNT_SUSPENDED');
    }

    if (user.status === 'pending_verification') {
      throw new ForbiddenError('User account is pending verification', 'ACCOUNT_PENDING');
    }

    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password credentials', 'INVALID_CREDENTIALS');
    }

    // If an organization context was targeted, verify tenant association
    if (input.organizationId && user.role !== 'PLATFORM_ADMIN') {
      if (!user.organizationId || user.organizationId.toString() !== input.organizationId) {
        throw new ForbiddenError('User is not authorized for this organization', 'TENANT_MISMATCH');
      }
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshTokenSession(user);

    return {
      user: user.toSafeUser(),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
        tokenType: 'Bearer',
      },
    };
  }

  /**
   * Performs atomic refresh token rotation with reuse detection and family revocation.
   */
  public static async refreshTokens(rawRefreshToken: string): Promise<AuthTokens> {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new UnauthorizedError('Refresh token is required', 'MISSING_REFRESH_TOKEN');
    }

    const tokenHash = hashSha256(rawRefreshToken);
    const now = new Date();

    // Atomically claim the token. Only one request can rotate it.
    const existingToken = await RefreshToken.findOneAndUpdate(
      { tokenHash, isRevoked: false, expiresAt: { $gt: now } },
      { $set: { isRevoked: true, revocationReason: 'ROTATED' } },
      { new: false }
    ).exec();

    if (!existingToken) {
      const previousToken = await RefreshToken.findByTokenHash(tokenHash);

      if (!previousToken) {
        throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      }

      if (previousToken.expiresAt <= now) {
        throw new UnauthorizedError('Refresh token has expired. Please sign in again.', 'REFRESH_TOKEN_EXPIRED');
      }

      if (previousToken.revocationReason === 'LOGOUT') {
        throw new UnauthorizedError('Refresh token is no longer valid', 'INVALID_REFRESH_TOKEN');
      }

      if (previousToken.revocationReason === 'ROTATED' || previousToken.revocationReason === 'REUSE') {
        await RefreshToken.revokeFamily(previousToken.family, 'REUSE');
        throw new ForbiddenError(
          'Suspicious refresh token activity detected. All active sessions have been terminated for security.',
          'TOKEN_REUSE_DETECTED'
        );
      }

      throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const user = await User.findById(existingToken.userId);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('User account associated with this token is inactive', 'USER_INACTIVE');
    }

    const newRefreshToken = generateSecureToken(40);
    const newTokenHash = hashSha256(newRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await RefreshToken.create({
      userId: user._id,
      organizationId: user.organizationId,
      tokenHash: newTokenHash,
      family: existingToken.family,
      isRevoked: false,
      expiresAt,
    });

    // Close the race where replay detection revokes the family
    // before this successor token is inserted.
    const reuseDetected = await RefreshToken.exists({
      family: existingToken.family,
      revocationReason: 'REUSE',
    });

    if (reuseDetected) {
      await RefreshToken.revokeFamily(existingToken.family, 'REUSE');
    }

    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: newRefreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      tokenType: 'Bearer',
    };
  }
  /**
   * Explicitly revokes a refresh token session upon logout
   */
  public static async logout(rawRefreshToken: string): Promise<void> {
    if (!rawRefreshToken) return;

    const tokenHash = hashSha256(rawRefreshToken);
    const tokenDoc = await RefreshToken.findByTokenHash(tokenHash);
    if (tokenDoc) {
      tokenDoc.isRevoked = true;
      await tokenDoc.save();
    }
  }

  /**
   * Registers a new user within an organization or as an initial administrator.
   */
  public static async register(input: RegisterInput): Promise<{
    user: Record<string, unknown>;
    tokens: AuthTokens;
  }> {
    const existing = await User.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    let organizationObjectId: mongoose.Types.ObjectId | undefined;

    // Resolve organization reference if specified
    if (input.organizationId) {
      if (!mongoose.Types.ObjectId.isValid(input.organizationId)) {
        throw new ValidationError('Invalid organization ID format');
      }
      const org = await Organization.findById(input.organizationId);
      if (!org) throw new NotFoundError('Organization not found');
      organizationObjectId = org._id as mongoose.Types.ObjectId;
    } else if (input.organizationSlug) {
      const org = await Organization.findOne({ slug: input.organizationSlug.toLowerCase().trim() });
      if (!org) throw new NotFoundError(`Organization slug '${input.organizationSlug}' not found`);
      organizationObjectId = org._id as mongoose.Types.ObjectId;
    }

    const assignedRole: UserRole = input.role ?? 'ORGANIZATION_MEMBER';

    // Disallow arbitrary self-registration as PLATFORM_ADMIN
    if (assignedRole === 'PLATFORM_ADMIN') {
      throw new ForbiddenError('Self-registration for PLATFORM_ADMIN is prohibited');
    }

    if (!organizationObjectId) {
      throw new ValidationError('Organization ID or slug is required for member registration');
    }

    const passwordHash = await User.hashPassword(input.password);

    const user = new User({
      email: input.email.toLowerCase().trim(),
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      role: assignedRole,
      organizationId: organizationObjectId,
      status: 'active',
      lastLoginAt: new Date(),
    });

    await user.save();

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshTokenSession(user);

    return {
      user: user.toSafeUser(),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
        tokenType: 'Bearer',
      },
    };
  }

  /**
   * Verifies an access token and returns the typed AuthenticatedUser context
   */
  public static async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        issuer: 'savanna-career-gateway',
        audience: 'savanna-api-consumers',
      }) as JwtTokenPayload;

      // Verify that user still exists and remains active
      const user = await User.findById(decoded.sub).select('+status');
      if (!user) {
        throw new UnauthorizedError('User account not found', 'USER_NOT_FOUND');
      }

      if (user.status !== 'active') {
        throw new ForbiddenError(`User account is ${user.status}`, 'USER_INACTIVE');
      }

      return {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: user.organizationId ? user.organizationId.toString() : undefined,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Access token has expired', 'TOKEN_EXPIRED');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid access token signature', 'INVALID_TOKEN');
      }
      throw err;
    }
  }
}



