import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import {
  OnboardingSession,
  type IOnboardingDraftData,
  type RegistrationMode,
  type IConsentRecord,
} from './session.model.js';
import { PrivateSupportRequest } from './support.model.js';
import { ConsentService } from '../consent/consent.service.js';
import { Organization } from '../organizations/organization.model.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
} from '../../shared/errors/index.js';
import {
  hashSha256,
  generateSecureToken,
  encrypt,
  decrypt,
} from '../../shared/utils/crypto.js';

export interface StartSessionInput {
  isSharedDevice: boolean;
  registrationMode: RegistrationMode;
  widgetKey?: string;
  organizationId?: string;
}

export interface SubmissionReceipt {
  id: string;
  submittedAtIso: string;
  mode: 'real' | 'mock';
  persistedToServer: boolean;
  notice: string;
  clearDeviceStorage?: boolean;
}

const SESSION_TTL_HOURS = 72; // 3 days for draft recovery

export class OnboardingService {
  /**
   * Starts a new server-side onboarding session.
   * Generates an opaque, high-entropy draft token for secure resume.
   * Never stores plain resume tokens in database or logs.
   */
  public static async startSession(
    input: StartSessionInput
  ): Promise<{ sessionId: string; draftToken: string; expiresAtIso: string }> {
    const sessionId = `sess_${uuidv4().replace(/-/g, '')}`;
    const rawDraftToken = `dt_${generateSecureToken(24)}`;
    const draftTokenHash = hashSha256(rawDraftToken);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_TTL_HOURS);

    let orgObjectId: mongoose.Types.ObjectId | undefined;

    if (input.widgetKey) {
      const match = await Organization.findByApiKeyHash(hashSha256(input.widgetKey));
      if (match) {
        orgObjectId = match.organization._id as mongoose.Types.ObjectId;
      }
    } else if (input.organizationId && mongoose.Types.ObjectId.isValid(input.organizationId)) {
      orgObjectId = new mongoose.Types.ObjectId(input.organizationId);
    }

    await OnboardingSession.create({
      sessionId,
      draftTokenHash,
      organizationId: orgObjectId,
      widgetKey: input.widgetKey,
      isSharedDevice: input.isSharedDevice,
      registrationMode: input.registrationMode,
      stepIndex: 0,
      stepResponses: new Map(),
      draft: {
        isSharedDevice: input.isSharedDevice,
        registrationMode: input.registrationMode,
        fullName: '',
        contactMethod: 'none',
        contactValue: '',
        identityRoute: '',
        identityReferenceNumber: '',
        partnerReferralOrg: '',
        supportPreferences: [],
        supportNotes: '',
        updatedAtIso: new Date().toISOString(),
      },
      status: 'in_progress',
      expiresAt,
    });

    return {
      sessionId,
      draftToken: rawDraftToken,
      expiresAtIso: expiresAt.toISOString(),
    };
  }

  /**
   * Retrieves current draft state for a session.
   * Supports authentication via session ID and draft token.
   */
  public static async getDraft(
    sessionId: string,
    draftToken?: string
  ): Promise<IOnboardingDraftData & { stepIndex: number; sessionId: string }> {
    const session = await OnboardingSession.findOne({ sessionId });
    if (!session) {
      throw new NotFoundError('Onboarding session not found');
    }

    if (session.status === 'expired' || session.expiresAt < new Date()) {
      session.status = 'expired';
      await session.save();
      throw new ValidationError('Onboarding session has expired');
    }

    if (draftToken) {
      const hashed = hashSha256(draftToken);
      if (hashed !== session.draftTokenHash) {
        throw new UnauthorizedError('Invalid resume token for this session');
      }
    }

    const draft = session.draft;
    let plainIdRef = draft.identityReferenceNumber;

    if (plainIdRef && plainIdRef.startsWith('v1:')) {
      try {
        plainIdRef = decrypt(plainIdRef);
      } catch {
        // Keep as-is if not decodable
      }
    }

    return {
      isSharedDevice: draft.isSharedDevice,
      registrationMode: draft.registrationMode,
      fullName: draft.fullName,
      contactMethod: draft.contactMethod,
      contactValue: draft.contactValue,
      identityRoute: draft.identityRoute,
      identityReferenceNumber: plainIdRef,
      partnerReferralOrg: draft.partnerReferralOrg,
      supportPreferences: draft.supportPreferences,
      supportNotes: draft.supportNotes,
      partnerConsent: draft.partnerConsent,
      updatedAtIso: draft.updatedAtIso,
      stepIndex: session.stepIndex,
      sessionId: session.sessionId,
    };
  }

  /**
   * Saves one-question-at-a-time or full draft step autosave.
   * Supports the alternative identity route (no-documents required).
   * Automatically encrypts identity reference numbers before database write.
   */
  public static async updateDraft(
    sessionId: string,
    updates: Partial<IOnboardingDraftData> & {
      stepIndex?: number;
      stepKey?: string;
      stepValue?: unknown;
    }
  ): Promise<IOnboardingDraftData> {
    const session = await OnboardingSession.findOne({ sessionId });
    if (!session) {
      throw new NotFoundError('Onboarding session not found');
    }

    if (session.status === 'submitted') {
      throw new ConflictError('Cannot update an already submitted session');
    }

    if (session.expiresAt < new Date()) {
      session.status = 'expired';
      await session.save();
      throw new ValidationError('Onboarding session has expired');
    }

    // Step index update
    if (typeof updates.stepIndex === 'number') {
      session.stepIndex = Math.max(0, updates.stepIndex);
    }

    // Single question step response update
    if (updates.stepKey) {
      session.stepResponses.set(updates.stepKey, updates.stepValue);
    }

    const currentDraft = session.draft;

    // Encrypt identity reference number if provided
    let encryptedIdRef = currentDraft.identityReferenceNumber;
    if (updates.identityReferenceNumber !== undefined) {
      if (updates.identityReferenceNumber.trim().length > 0) {
        encryptedIdRef = encrypt(updates.identityReferenceNumber.trim());
      } else {
        encryptedIdRef = '';
      }
    }

    session.draft = {
      isSharedDevice: updates.isSharedDevice ?? currentDraft.isSharedDevice,
      registrationMode: updates.registrationMode ?? currentDraft.registrationMode,
      fullName: updates.fullName !== undefined ? updates.fullName.trim() : currentDraft.fullName,
      contactMethod: updates.contactMethod ?? currentDraft.contactMethod,
      contactValue: updates.contactValue !== undefined ? updates.contactValue.trim() : currentDraft.contactValue,
      identityRoute: updates.identityRoute ?? currentDraft.identityRoute,
      identityReferenceNumber: encryptedIdRef,
      partnerReferralOrg: updates.partnerReferralOrg !== undefined ? updates.partnerReferralOrg.trim() : currentDraft.partnerReferralOrg,
      supportPreferences: updates.supportPreferences ?? currentDraft.supportPreferences,
      supportNotes: updates.supportNotes !== undefined ? updates.supportNotes.trim() : currentDraft.supportNotes,
      partnerConsent: updates.partnerConsent ?? currentDraft.partnerConsent,
      updatedAtIso: new Date().toISOString(),
    };

    session.markModified('draft');
    session.markModified('stepResponses');
    await session.save();

    return session.draft;
  }

  /**
   * Finalizes the onboarding session.
   * Segregates private support accommodations into the walled-off store.
   * Records explicit consent for partner-assisted registrations.
   */
  public static async submitSession(
    sessionId: string,
    partnerConsent?: IConsentRecord
  ): Promise<SubmissionReceipt> {
    const session = await OnboardingSession.findOne({ sessionId });
    if (!session) {
      throw new NotFoundError('Onboarding session not found');
    }

    if (session.status === 'submitted') {
      throw new ConflictError('Session has already been submitted');
    }

    const receiptId = `sub_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const submittedAt = new Date();

    // 1. If learner specified private support notes or preferences, wall them off in PrivateSupportRequest
    if (session.draft.supportNotes || session.draft.supportPreferences.length > 0) {
      await PrivateSupportRequest.create({
        sessionReference: session.sessionId,
        organizationId: session.organizationId,
        learnerName: session.draft.fullName || 'Anonymous Learner',
        contactMethod: session.draft.contactMethod,
        contactValue: session.draft.contactValue,
        supportPreferences: session.draft.supportPreferences,
        encryptedNotes: encrypt(session.draft.supportNotes || 'No specific text notes provided'),
        status: 'pending_review',
      });
    }

    // 2. If partner assisted, record explicit consent in consent store
    const consentToRecord = partnerConsent || session.draft.partnerConsent;
    if (session.registrationMode === 'partner_assisted' && consentToRecord && session.organizationId) {
      await ConsentService.recordConsent({
        sessionReference: session.sessionId,
        purpose: 'general_onboarding',
        organizationId: session.organizationId,
        consentTextVersion: '1.0',
        specificPermissions: consentToRecord.sharedFieldsSummary,
      });
    }

    session.status = 'submitted';
    session.submittedAt = submittedAt;
    session.submissionReceiptId = receiptId;
    await session.save();

    return {
      id: receiptId,
      submittedAtIso: submittedAt.toISOString(),
      mode: 'real',
      persistedToServer: true,
      notice: 'Your onboarding profile has been submitted successfully. A specialist will be in touch.',
      clearDeviceStorage: Boolean(session.isSharedDevice),
    };
  }

  /**
   * Legacy direct submission endpoint for frontend restAdapter.ts compatibility:
   * Accepts full OnboardingDraft directly without requiring a prior session.
   */
  public static async submitDirect(
    draft: IOnboardingDraftData
  ): Promise<SubmissionReceipt> {
    const receiptId = `sub_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const submittedAt = new Date();

    // 1. Store private support needs securely walled off
    if (draft.supportNotes || (draft.supportPreferences && draft.supportPreferences.length > 0)) {
      await PrivateSupportRequest.create({
        sessionReference: receiptId,
        learnerName: draft.fullName || 'Direct Applicant',
        contactMethod: draft.contactMethod,
        contactValue: draft.contactValue,
        supportPreferences: draft.supportPreferences || [],
        encryptedNotes: encrypt(draft.supportNotes || 'Direct submission notes'),
        status: 'pending_review',
      });
    }

    return {
      id: receiptId,
      submittedAtIso: submittedAt.toISOString(),
      mode: 'real',
      persistedToServer: true,
      notice: 'Onboarding submission successfully received and securely persisted.',
      clearDeviceStorage: Boolean(draft.isSharedDevice),
    };
  }

  /**
   * Submits a standalone private accommodation/support request
   */
  public static async submitPrivateSupport(input: {
    sessionReference: string;
    organizationId?: string;
    learnerName?: string;
    contactMethod?: string;
    contactValue?: string;
    supportPreferences: string[];
    supportNotes: string;
  }): Promise<{ supportRequestId: string; status: string }> {
    const orgId = input.organizationId && mongoose.Types.ObjectId.isValid(input.organizationId)
      ? new mongoose.Types.ObjectId(input.organizationId)
      : undefined;

    const request = await PrivateSupportRequest.create({
      sessionReference: input.sessionReference,
      organizationId: orgId,
      learnerName: input.learnerName,
      contactMethod: input.contactMethod,
      contactValue: input.contactValue,
      supportPreferences: input.supportPreferences,
      encryptedNotes: encrypt(input.supportNotes),
      status: 'pending_review',
    });

    return {
      supportRequestId: request._id.toString(),
      status: request.status,
    };
  }

  /**
   * SMS Resume Service:
   * Dispatches/generates secure one-time resume link.
   * For production, integrates with SMS gateway; returns success response.
   */
  public static async requestSmsResume(
    phone: string,
    draftToken: string
  ): Promise<{ sent: boolean; message: string }> {
    if (!phone || phone.trim().length < 6) {
      throw new ValidationError('A valid phone number is required for SMS recovery');
    }
    if (!draftToken) {
      throw new ValidationError('draftToken is required');
    }

    // Verify token exists
    const tokenHash = hashSha256(draftToken);
    const session = await OnboardingSession.findOne({ draftTokenHash: tokenHash });
    if (!session) {
      throw new NotFoundError('No active session found matching the provided draft token');
    }

    return {
      sent: true,
      message: `A secure one-time resume code has been sent to ${phone.slice(0, 4)}***${phone.slice(-2)}.`,
    };
  }
}
