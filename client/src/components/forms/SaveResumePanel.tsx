import React, { useEffect, useState } from 'react';
import { Download, HardDrive, MessageSquare, Shield, Trash2 } from 'lucide-react';
import { useI18n } from '../../i18n';
import { ApiCapabilities, SaveStorageStatus } from '../../types/gateway';
import { SanitizedLocalDraft } from '../../utils/indexedDbDrafts';
import { formatEthiopianDate } from '../../utils/coreHelpers.mjs';
import { gatewayApi } from '../../services/api/client';

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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!confirmDeleteOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setConfirmDeleteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmDeleteOpen]);

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
      await gatewayApi.deleteLearner();
      setDeletedNotice(true);
      setConfirmDeleteOpen(false);
    } finally {
      setIsBusy(false);
    }
  };

  const handleExportData = async () => {
    const exported = (await gatewayApi.exportLearner()) || existingDeviceDraft;
    const payload = exported || { notice: 'No saved draft or profile stored on this device.' };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-learner-data.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3
          id="gw-save-resume-heading"
          className="text-base font-bold text-[#0F1E36] dark:text-white flex items-center gap-2"
        >
          <HardDrive className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400" aria-hidden="true" />
          <span>{t.saveResume.panelTitle}</span>
        </h3>
        <span
          role="status"
          aria-live="polite"
          className="text-xs font-semibold text-[#0F1E36] dark:text-slate-200 bg-[#F3F4F6] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1"
        >
          {statusText}
        </span>
      </div>

      {/* Existing opt-in draft found in IndexedDB */}
      {existingDeviceDraft && isSharedDevice !== true && (
        <div className="rounded-xl border border-[#1E3A5F]/25 dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800/80 p-4 space-y-2">
          <p className="text-sm font-bold text-[#0F1E36] dark:text-white">
            {t.saveResume.resumeFoundTitle}
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-300">
            {format(t.saveResume.resumeFoundBody, {
              date: `${new Date(existingDeviceDraft.updatedAtIso).toLocaleString()} (${formatEthiopianDate(existingDeviceDraft.updatedAtIso)})`,
            })}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={onResumeDeviceDraft}
              className="min-h-[44px] px-4 py-2 rounded-md text-sm font-bold bg-amber-500 hover:bg-amber-400 text-[#0F1E36] transition-colors cursor-pointer"
            >
              {t.saveResume.resumeButton}
            </button>
          </div>
        </div>
      )}

      {isSharedDevice === true ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 p-3.5 text-sm text-[#0F1E36] dark:text-amber-100">
          <Shield
            className="w-4 h-4 shrink-0 mt-0.5 text-amber-800 dark:text-amber-400"
            aria-hidden="true"
          />
          <span>{t.saveResume.sharedPhoneWarning}</span>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {t.saveResume.saveOnPhoneExplain}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isBusy || isSharedDevice === null}
              onClick={handleSave}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 text-sm font-semibold hover:bg-[#F3F4F6] dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <HardDrive
                className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400"
                aria-hidden="true"
              />
              <span>{t.saveResume.saveOnPhoneButton}</span>
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => void handleExportData()}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 text-sm font-semibold hover:bg-[#F3F4F6] dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400" aria-hidden="true" />
              <span>{t.saveResume.exportDataButton}</span>
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => setConfirmDeleteOpen(true)}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-md border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-100 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-950/80 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>{t.saveResume.deleteSavedButton}</span>
            </button>
          </div>

          {confirmDeleteOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="gw-delete-dialog-title"
              className="rounded-xl border-2 border-red-700 dark:border-red-500 bg-red-50 dark:bg-red-950/80 p-4 space-y-3"
            >
              <h4 id="gw-delete-dialog-title" className="text-base font-bold text-red-950 dark:text-red-100">
                {t.saveResume.deleteConfirmTitle}
              </h4>
              <p className="text-sm text-red-900 dark:text-red-200">{t.saveResume.deleteConfirmBody}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleDelete}
                  className="min-h-[44px] px-4 py-2 rounded-md bg-red-800 hover:bg-red-900 text-white text-sm font-bold cursor-pointer"
                >
                  {t.saveResume.deleteConfirmYes}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 text-sm font-semibold cursor-pointer"
                >
                  {t.saveResume.deleteConfirmCancel}
                </button>
              </div>
            </div>
          )}

          {deletedNotice && (
            <p
              role="status"
              className="text-sm font-medium text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-md px-3 py-2"
            >
              {t.saveResume.deletedConfirm}
            </p>
          )}
        </div>
      )}

      {/* Honest SMS Resume UI (Addendum D1: only enabled when API reports SMS configured; never fakes delivery) */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
        <h4 className="text-sm font-bold text-[#0F1E36] dark:text-white flex items-center gap-2">
          <MessageSquare
            className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400"
            aria-hidden="true"
          />
          <span>{t.saveResume.smsTitle}</span>
        </h4>
        {!capabilities.smsResumeEnabled ? (
          <p className="text-xs text-slate-700 dark:text-slate-300 bg-[#F3F4F6] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5">
            {t.saveResume.smsNotConfigured}
          </p>
        ) : (
          <form onSubmit={handleSms} className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="gw-sms-resume-phone"
                className="block text-xs font-semibold text-[#0F1E36] dark:text-slate-200 mb-1"
              >
                {t.saveResume.smsPhoneLabel}
              </label>
              <input
                id="gw-sms-resume-phone"
                type="tel"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 px-3 py-2 text-sm text-[#0F1E36] dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400"
                placeholder="+251 9..."
              />
            </div>
            <button
              type="submit"
              disabled={isBusy}
              className="min-h-[44px] px-4 py-2 rounded-md text-sm font-bold bg-amber-500 hover:bg-amber-400 text-[#0F1E36] transition-colors cursor-pointer"
            >
              {t.saveResume.smsSendButton}
            </button>
          </form>
        )}
        {smsFeedback && (
          <p
            role="status"
            className="text-xs text-[#0F1E36] dark:text-slate-200 bg-[#F3F4F6] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2"
          >
            {smsFeedback}
          </p>
        )}
      </div>
    </section>
  );
};
