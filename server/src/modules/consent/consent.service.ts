import mongoose from 'mongoose';
import { Consent, type ConsentPurpose, type IConsent } from './consent.model.js';
import { hashSha256 } from '../../shared/utils/crypto.js';
import { NotFoundError } from '../../shared/errors/index.js';

export interface RecordConsentInput {
  learnerId?: string;
  sessionReference: string;
  purpose: ConsentPurpose;
  organizationId: string | mongoose.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  consentTextVersion?: string;
  specificPermissions?: string[];
}

export class ConsentService {
  /**
   * Records a user's informed consent.
   * Learner identifiers are hashed for fast, leak-free queries,
   * and IP addresses are strictly hashed to protect learner privacy.
   */
  public static async recordConsent(input: RecordConsentInput): Promise<IConsent> {
    const ipHash = input.ipAddress ? hashSha256(input.ipAddress) : undefined;
    const learnerIdHash = input.learnerId ? hashSha256(input.learnerId) : undefined;

    const consent = new Consent({
      learnerId: input.learnerId,
      learnerIdHash,
      sessionReference: input.sessionReference,
      purpose: input.purpose,
      grantedToOrganizationId: new mongoose.Types.ObjectId(input.organizationId),
      metadata: {
        ipHash,
        userAgent: input.userAgent,
        consentTextVersion: input.consentTextVersion ?? '1.0',
        specificPermissions: input.specificPermissions ?? [],
      },
    });

    return consent.save();
  }

  /**
   * Checks whether active, unrevoked consent exists for a given purpose within an organization.
   */
  public static async hasActiveConsent(
    referenceOrLearnerId: string,
    purpose: ConsentPurpose,
    organizationId: string | mongoose.Types.ObjectId
  ): Promise<boolean> {
    const referenceHash = hashSha256(referenceOrLearnerId);
    const existing = await Consent.findOne({
      $or: [
        { sessionReference: referenceOrLearnerId },
        { learnerId: referenceOrLearnerId },
        { learnerIdHash: referenceHash },
      ],
      purpose,
      grantedToOrganizationId: new mongoose.Types.ObjectId(organizationId),
      revokedAt: null,
    }).exec();

    return Boolean(existing);
  }

  /**
   * Revokes an existing consent with an optional reason.
   */
  public static async revokeConsent(
    consentId: string,
    organizationId?: string | mongoose.Types.ObjectId,
    reason = 'User requested revocation'
  ): Promise<IConsent> {
    const query: Record<string, unknown> = {
      _id: new mongoose.Types.ObjectId(consentId),
    };
    if (organizationId) {
      query['grantedToOrganizationId'] = new mongoose.Types.ObjectId(organizationId);
    }

    const consent = await Consent.findOne(query).exec();
    if (!consent) {
      throw new NotFoundError('Consent record not found');
    }

    consent.revokedAt = new Date();
    consent.revocationReason = reason;
    return consent.save();
  }
}
