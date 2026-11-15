import React, { useId, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Mic,
  MicOff,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { useSpeechInput } from '../../hooks/useSpeechInput';

interface VoiceTextFieldProps {
  id?: string;
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  required?: boolean;
  /** Addendum E3: Never allow speech recognition on sensitive identifiers (ID numbers) */
  sensitiveIdentifier?: boolean;
  /** Partner-assisted mode enables explicit "read aloud to assistant" reminder */
  partnerAssisted?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
}

export const VoiceTextField: React.FC<VoiceTextFieldProps> = ({
  id: providedId,
  label,
  value,
  onChange,
  placeholder,
  error,
  multiline = false,
  required = false,
  sensitiveIdentifier = false,
  partnerAssisted = false,
  autoComplete,
  inputMode = 'text',
}) => {
  const generatedId = useId();
  const fieldId = providedId || generatedId;
  const errorId = `${fieldId}-error`;
  const { language, t, setLanguage } = useI18n();
  const [readToAssistantChosen, setReadToAssistantChosen] = useState(false);

  const {
    status,
    transcript,
    setTranscript,
    detectedLanguage,
    errorDetail,
    recognitionAvailable,
    browserSttAvailable,
    languageNotSupportedInBrowser,
    canFallbackToBrowserEnglish,
    micPermission,
    voiceNoteUrl,
    startListening,
    stopListening,
    discardTranscript,
  } = useSpeechInput(language, (detected) => {
    if (detected !== language) {
      void setLanguage(detected);
    }
  });

  const handleUseTranscript = () => {
    if (transcript.trim()) {
      const combined = value.trim() ? `${value.trim()} ${transcript.trim()}` : transcript.trim();
      onChange(combined);
    }
    discardTranscript();
  };

  const liveAnnouncement =
    status === 'listening'
      ? t.voice.listeningState
      : status === 'transcribing'
      ? t.voice.transcribingState
      : status === 'reviewing'
      ? t.voice.transcriptLabel
      : status === 'permission_denied'
      ? t.voice.permissionDeniedMessage
      : '';

  const sharedInputClass = `w-full rounded-xl border px-4 py-3 text-base text-[#0F1E36] dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 min-h-[48px] transition-colors ${
    error
      ? 'border-2 border-red-700 dark:border-red-500 bg-red-50/30 dark:bg-red-950/30'
      : 'border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400'
  }`;

  const noSpeechHardwareAtAll = !recognitionAvailable && !browserSttAvailable;

  return (
    <div className="space-y-3">
      <label
        htmlFor={fieldId}
        className="block text-base font-semibold text-[#0F1E36] dark:text-white"
      >
        {label}{' '}
        {!required && (
          <span className="text-sm font-normal text-slate-600 dark:text-slate-400">
            ({t.common.optionalBadge})
          </span>
        )}
      </label>

      {multiline ? (
        <textarea
          id={fieldId}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={sharedInputClass}
        />
      ) : (
        <input
          id={fieldId}
          type="text"
          inputMode={inputMode}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={sharedInputClass}
        />
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-2 text-sm font-medium text-red-900 dark:text-red-100 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-700 rounded-lg px-3 py-2"
        >
          <AlertTriangle
            className="w-4 h-4 shrink-0 mt-0.5 text-red-800 dark:text-red-400"
            aria-hidden="true"
          />
          <span>{error}</span>
        </p>
      )}

      {/* Addendum E3: Sensitive identifier safeguard */}
      {sensitiveIdentifier ? (
        <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/40 p-4 text-sm text-[#0F1E36] dark:text-amber-100 space-y-2">
          <div className="flex items-start gap-2 font-bold text-[#0F1E36] dark:text-amber-200">
            <ShieldAlert
              className="w-4 h-4 shrink-0 mt-0.5 text-amber-800 dark:text-amber-400"
              aria-hidden="true"
            />
            <span>{t.voice.sensitiveDisabledTitle}</span>
          </div>
          <p className="text-slate-800 dark:text-amber-100/90">{t.voice.sensitiveDisabledBody}</p>
          {partnerAssisted && (
            <div className="pt-1">
              <label className="inline-flex items-start gap-2.5 cursor-pointer min-h-[44px] py-1">
                <input
                  type="checkbox"
                  checked={readToAssistantChosen}
                  onChange={(e) => setReadToAssistantChosen(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-400 dark:border-slate-600 accent-[#0F1E36] dark:accent-amber-500"
                />
                <span>{t.voice.readToAssistantOption}</span>
              </label>
              {readToAssistantChosen && (
                <p
                  className="mt-1 text-xs font-medium text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-md px-3 py-2"
                  role="note"
                >
                  {t.voice.readToAssistantReminder}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Polite live region for microphone state transitions */}
          <div className="gw-sr-only" role="status" aria-live="polite">
            {liveAnnouncement}
          </div>

          {noSpeechHardwareAtAll || (status === 'unsupported' && !browserSttAvailable) ? (
            <div className="flex items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300">
              <MicOff
                className="w-4 h-4 shrink-0 mt-0.5 text-[#1E3A5F] dark:text-amber-400"
                aria-hidden="true"
              />
              <span>{errorDetail || t.voice.unsupportedMessage}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {recognitionAvailable ? (
                <div className="flex flex-wrap items-center gap-3">
                  {status === 'listening' ? (
                    <button
                      type="button"
                      onClick={stopListening}
                      className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-md border-2 border-red-700 dark:border-red-500 bg-red-50 dark:bg-red-950/60 text-red-950 dark:text-red-100 font-semibold text-sm cursor-pointer"
                    >
                      <Mic
                        className="w-4 h-4 shrink-0 text-red-800 dark:text-red-400"
                        aria-hidden="true"
                      />
                      <span>
                        {t.voice.listeningState} ({t.voice.stopMic})
                      </span>
                    </button>
                  ) : status === 'transcribing' ? (
                    <div
                      role="status"
                      className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 font-medium text-sm"
                    >
                      <span>{t.voice.transcribingState}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startListening()}
                      className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 font-semibold text-sm hover:bg-amber-50 dark:hover:bg-slate-700 hover:border-amber-400 dark:hover:border-amber-400 transition-colors cursor-pointer"
                    >
                      <Mic
                        className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400"
                        aria-hidden="true"
                      />
                      <span>{t.voice.startMic}</span>
                    </button>
                  )}
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {t.voice.noAudioStoredNote}
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-2">
                    <MicOff
                      className="w-4 h-4 shrink-0 mt-0.5 text-[#1E3A5F] dark:text-amber-400"
                      aria-hidden="true"
                    />
                    <span>{errorDetail || t.voice.unsupportedMessage}</span>
                  </div>
                  {browserSttAvailable && (
                    <button
                      type="button"
                      onClick={() => startListening('en')}
                      className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-amber-50 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                      <span>{t.voice.fallbackEnglishButton}</span>
                    </button>
                  )}
                </div>
              )}

              {recognitionAvailable && micPermission === 'prompt' && status === 'idle' && (
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-[#F3F4F6]/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                  {t.voice.permissionPromptNote}
                </p>
              )}

              {(status === 'permission_denied' || micPermission === 'denied') && (
                <div
                  role="alert"
                  className="text-sm text-amber-950 dark:text-amber-100 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-xl px-3.5 py-3 space-y-2"
                >
                  <p>{t.voice.permissionDeniedMessage}</p>
                  <button
                    type="button"
                    onClick={() => startListening()}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-md border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 text-xs font-semibold text-[#0F1E36] dark:text-amber-100 hover:bg-amber-100/60 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{t.voice.retryMic}</span>
                  </button>
                </div>
              )}

              {status === 'error' && errorDetail && (
                <div
                  role="status"
                  className="text-sm text-amber-950 dark:text-amber-100 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-xl px-3.5 py-3 space-y-2"
                >
                  <p>{errorDetail}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startListening()}
                      className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-md border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 text-xs font-semibold text-[#0F1E36] dark:text-amber-100 hover:bg-amber-100/60 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t.voice.retryMic}</span>
                    </button>
                    {(languageNotSupportedInBrowser || canFallbackToBrowserEnglish) &&
                      browserSttAvailable && (
                        <button
                          type="button"
                          onClick={() => startListening('en')}
                          className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Mic className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                          <span>{t.voice.fallbackEnglishButton}</span>
                        </button>
                      )}
                  </div>
                  {voiceNoteUrl && (
                    <div className="pt-2 space-y-1.5 border-t border-amber-300/60 dark:border-amber-700/60">
                      <p className="text-xs font-medium">{t.voice.voiceNoteFallbackNotice}</p>
                      <audio controls src={voiceNoteUrl} className="w-full h-10" />
                    </div>
                  )}
                </div>
              )}

              {/* Editable transcript review stage (Addendum E2) */}
              {(status === 'reviewing' || (status === 'listening' && transcript.length > 0)) && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800/80 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor={`${fieldId}-transcript`}
                      className="block text-sm font-bold text-[#0F1E36] dark:text-white"
                    >
                      {t.voice.transcriptLabel}
                    </label>
                    {detectedLanguage && (
                      <span className="text-xs font-semibold text-[#1E3A5F] dark:text-amber-400">
                        {t.voice.detectedLanguageLabel}: {detectedLanguage.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <textarea
                    id={`${fieldId}-transcript`}
                    rows={2}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-base text-[#0F1E36] dark:text-slate-100"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleUseTranscript}
                      className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-md text-sm font-bold bg-amber-500 hover:bg-amber-400 text-[#0F1E36] transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>{t.voice.useThis}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startListening()}
                      className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#0F1E36] dark:text-slate-100 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400" aria-hidden="true" />
                      <span>{t.voice.tryAgain}</span>
                    </button>
                    <button
                      type="button"
                      onClick={discardTranscript}
                      className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      <span>{t.voice.discard}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
