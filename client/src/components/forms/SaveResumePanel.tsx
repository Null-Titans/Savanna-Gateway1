import React, { useState } from 'react';
import { HardDrive, MessageSquare, Shield, Trash2 } from 'lucide-react';
import { useI18n } from '../../i18n';
import { ApiCapabilities, SaveStorageStatus } from '../../types/gateway';
import { SanitizedLocalDraft } from '../../utils/indexedDbDrafts';

interface SaveResumePanelProps {
  isSharedDevice: boolean | null;
  storageStatus: SaveStorageStatus;
  capabilities: ApiCapabilities;
  existingDeviceDraft: SanitizedLocalDraft | null;
  onSaveOnDevice: () => Promise<void>;
  onDeleteDeviceDraft: () => Promise<void>;
  onResumeDeviceDraft: () => void;
  onRequestSmsResume: (phone: string) => Promise<{ sent: boolean; message: string }>;
}

export const SaveResumePanel: React.FC<SaveResumePanelProps> = ({
  isSharedDevice,
  storageStatus,
  capabilities,
  existingDeviceDraft,
  onSaveOnDevice,
  onDeleteDeviceDraft,
  onResumeDeviceDraft,
  onRequestSmsResume,
}) => {
  const { t, format } = useI18n();
  const [smsPhone, setSmsPhone] = useState('');
  const [smsFeedback, setSmsFeedback] = useState<string | null>(null);
  const [deletedNotice, setDeletedNotice] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const statusText =
    storageStatus === 'device_indexeddb'
      ? t.saveResume.statusDeviceSaved
      : storageStatus === 'server_saved'
      ? t.saveResume.statusServerSaved
      : storageStatus === 'not_saved_error'
      ? t.saveResume.statusErrorKeptInMemory
      : t.saveResume.statusMemoryOnly;

  const handleSave = async () => {
    setIsBusy(true);
    setDeletedNotice(false);
    try {
      await onSaveOnDevice();
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    setIsBusy(true);
    try {
      await onDeleteDeviceDraft();
      setDeletedNotice(true);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsPhone.trim()) return;
    setIsBusy(true);
    try {
      const res = await onRequestSmsResume(smsPhone.trim());
      setSmsFeedback(res.message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="gw-save-resume-heading"
      className="rounded-xl border border-slate-300 bg-white p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <h3 id="gw-save-resume-heading" className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-slate-700" aria-hidden="true" />
          <span>{t.saveResume.panelTitle}</span>
        </h3>
        <span
          role="status"
          aria-live="polite"
          className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md px-2.5 py-1"
        >
          {statusText}
        </span>
      </div>

      {/* Existing opt-in draft found in IndexedDB */}
      {existingDeviceDraft && isSharedDevice !== true && (
        <div className="rounded-lg border border-blue-300 bg-blue-50 p-3.5 space-y-2">
          <p className="text-sm font-semibold text-blue-950">{t.saveResume.resumeFoundTitle}</p>
          <p className="text-xs text-blue-900">
            {format(t.saveResume.resumeFoundBody, {
              date: new Date(existingDeviceDraft.updatedAtIso).toLocaleString(),
            })}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={onResumeDeviceDraft}
              className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: 'var(--gw-primary)',
                color: 'var(--gw-primary-text)',
              }}
            >
              {t.saveResume.resumeButton}
            </button>
          </div>
        </div>
      )}

      {isSharedDevice === true ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-950">
          <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-900" aria-hidden="true" />
          <span>{t.saveResume.sharedPhoneWarning}</span>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">{t.saveResume.saveOnPhoneExplain}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isBusy || isSharedDevice === null}
              onClick={handleSave}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-slate-400 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              <HardDrive className="w-4 h-4" aria-hidden="true" />
              <span>{t.saveResume.saveOnPhoneButton}</span>
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={handleDelete}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-900 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>{t.saveResume.deleteSavedButton}</span>
            </button>
          </div>
          {deletedNotice && (
            <p role="status" className="text-sm font-medium text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-md px-3 py-2">
              {t.saveResume.deletedConfirm}
            </p>
          )}
        </div>
      )}

      {/* Honest SMS Resume UI (Addendum D1: only enabled when API reports SMS configured; never fakes delivery) */}
      <div className="border-t border-slate-200 pt-3 space-y-2">
        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-700" aria-hidden="true" />
          <span>{t.saveResume.smsTitle}</span>
        </h4>
        {!capabilities.smsResumeEnabled ? (
          <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
            {t.saveResume.smsNotConfigured}
          </p>
        ) : (
          <form onSubmit={handleSms} className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="gw-sms-resume-phone" className="block text-xs font-medium text-slate-700 mb-1">
                {t.saveResume.smsPhoneLabel}
              </label>
              <input
                id="gw-sms-resume-phone"
                type="tel"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-slate-400 px-3 py-2 text-sm"
                placeholder="+251 9..."
              />
            </div>
            <button
              type="submit"
              disabled={isBusy}
              className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: 'var(--gw-primary)',
                color: 'var(--gw-primary-text)',
              }}
            >
              {t.saveResume.smsSendButton}
            </button>
          </form>
        )}
        {smsFeedback && (
          <p role="status" className="text-xs text-slate-800 bg-slate-100 rounded-md px-3 py-2">
            {smsFeedback}
          </p>
        )}
      </div>
    </section>
  );
};
