import { OnboardingDraft } from '../types/gateway';

/**
 * Privacy-first local draft storage (Addendum D1):
 * - NEVER store identity numbers, tokens, or private support preferences in localStorage.
 * - Keep answers in memory by default.
 * - Only write to IndexedDB when the user explicitly opts in AND confirms this is NOT a shared phone.
 * - Exclude sensitive fields (identityReferenceNumber, supportPreferences, supportNotes, partnerConsent)
 *   from local IndexedDB storage.
 */

const DB_NAME = 'accessible_gateway_drafts';
const DB_VERSION = 1;
const STORE_NAME = 'non_sensitive_drafts';
const DRAFT_KEY = 'active_onboarding_draft';

export interface SanitizedLocalDraft {
  registrationMode: 'self' | 'partner_assisted';
  fullName: string;
  contactMethod: 'phone' | 'email' | 'partner_contact' | 'none';
  contactValue: string;
  identityRoute: OnboardingDraft['identityRoute'];
  partnerReferralOrg: string;
  updatedAtIso: string;
  excludedSensitiveNotice: string;
}

export function sanitizeDraftForLocalDevice(draft: OnboardingDraft): SanitizedLocalDraft {
  return {
    registrationMode: draft.registrationMode,
    fullName: draft.fullName,
    contactMethod: draft.contactMethod,
    contactValue: draft.contactValue,
    identityRoute: draft.identityRoute,
    partnerReferralOrg: draft.partnerReferralOrg,
    updatedAtIso: new Date().toISOString(),
    excludedSensitiveNotice:
      'Identity numbers and private support preferences are excluded from device storage for privacy.',
  };
}

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB.'));
  });
}

export async function saveDraftToIndexedDB(draft: OnboardingDraft): Promise<SanitizedLocalDraft> {
  const sanitized = sanitizeDraftForLocalDevice(draft);
  const db = await openDraftDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(sanitized, DRAFT_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve(sanitized);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Failed to save draft to IndexedDB.'));
    };
  });
}

export async function loadDraftFromIndexedDB(): Promise<SanitizedLocalDraft | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const db = await openDraftDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(DRAFT_KEY);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as SanitizedLocalDraft) || null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error || new Error('Failed to read draft from IndexedDB.'));
      };
    });
  } catch {
    return null;
  }
}

export async function deleteDraftFromIndexedDB(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await openDraftDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(DRAFT_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error || new Error('Failed to delete draft from IndexedDB.'));
      };
    });
  } catch {
    // Best-effort clear
  }
}
