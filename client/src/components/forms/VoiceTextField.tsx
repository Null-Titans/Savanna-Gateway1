import React, { useId, useState } from 'react';
import { AlertTriangle, Check, Mic, MicOff, RotateCcw, ShieldAlert, Trash2 } from 'lucide-react';
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

  const sharedInputClass = `w-full rounded-lg border px-4 py-3 text-base text-slate-900 bg-white placeholder:text-slate-500 min-h-[48px] ${
    error ? 'border-2 border-red-700 bg-red-50/30' : 'border-slate-400'
  }`;

  return (
    <div className="space-y-3">
      <label htmlFor={fieldId} className="block text-base font-semibold text-slate-900">
        {label}{' '}
        {!required && (
          <span className="text-sm font-normal text-slate-600">({t.common.optionalBadge})</span>
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
        <p id={errorId} role="alert" className="flex items-start gap-2 text-sm font-medium text-red-900 bg-red-50 border border-red-300 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-800" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      {/* Addendum E3: Sensitive identifier safeguard */}
      {sensitiveIdentifier ? (
        <div className="rounded-lg border border-slate-300 bg-slate-50 p-3.5 text-sm text-slate-800 space-y-2">
          <div className="flex items-start gap-2 font-semibold text-slate-900">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-slate-700" aria-hidden="true" />
            <span>{t.voice.sensitiveDisabledTitle}</span>
          </div>
          <p className="text-slate-700">{t.voice.sensitiveDisabledBody}</p>
          {partnerAssisted && (
            <div className="pt-1">
              <label className="inline-flex items-start gap-2.5 cursor-pointer min-h-[44px] py-1">
                <input
                  type="checkbox"
                  checked={readToAssistantChosen}
                  onChange={(e) => setReadToAssistantChosen(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-400"
                />
                <span>{t.voice.readToAssistantOption}</span>
              </label>
              {readToAssistantChosen && (
                <p className="mt-1 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-300 rounded-md px-3 py-2" role="note">
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

          {!recognitionAvailable || status === 'unsupported' ? (
            <div className="flex items-start gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
              <MicOff className="w-4 h-4 shrink-0 mt-0.5 text-slate-600" aria-hidden="true" />
              <span>{errorDetail || t.voice.unsupportedMessage}</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {status === 'listening' ? (
                  <button
                    type="button"
                    onClick={stopListening}
                    className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg border-2 border-red-700 bg-red-50 text-red-950 font-semibold text-sm"
                  >
                    <Mic className="w-4 h-4 shrink-0 text-red-800" aria-hidden="true" />
                    <span>{t.voice.listeningState} ({t.voice.stopMic})</span>
                  </button>
                ) : status === 'transcribing' ? (
                  <div
                    role="status"
                    className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg border border-slate-400 bg-slate-100 text-slate-900 font-medium text-sm"
                  >
                    <span>{t.voice.transcribingState}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startListening}
                    className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg border border-slate-400 bg-white text-slate-900 font-medium text-sm hover:bg-slate-50 transition-colors"
                  >
                    <Mic className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{t.voice.startMic}</span>
                  </button>
                )}
                <span className="text-xs text-slate-600">{t.voice.noAudioStoredNote}</span>
              </div>

              {status === 'permission_denied' && (
                <p role="alert" className="text-sm text-amber-950 bg-amber-50 border border-amber-300 rounded-lg px-3.5 py-2.5">
                  {t.voice.permissionDeniedMessage}
                </p>
              )}

              {status === 'error' && errorDetail && (
                <p role="status" className="text-sm text-amber-950 bg-amber-50 border border-amber-300 rounded-lg px-3.5 py-2.5">
                  {errorDetail}
                </p>
              )}

              {/* Editable transcript review stage (Addendum E2) */}
              {(status === 'reviewing' || (status === 'listening' && transcript.length > 0)) && (
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor={`${fieldId}-transcript`} className="block text-sm font-semibold text-slate-900">
                      {t.voice.transcriptLabel}
                    </label>
                    {detectedLanguage && (
                      <span className="text-xs font-medium text-slate-700">
                        {t.voice.detectedLanguageLabel}: {detectedLanguage.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <textarea
                    id={`${fieldId}-transcript`}
                    rows={2}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-base text-slate-900"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleUseTranscript}
                      className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      style={{
                        backgroundColor: 'var(--gw-primary)',
                        color: 'var(--gw-primary-text)',
                      }}
                    >
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>{t.voice.useThis}</span>
                    </button>
                    <button
                      type="button"
                      onClick={startListening}
                      className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-400 bg-white text-slate-900 text-sm font-medium hover:bg-slate-100"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                      <span>{t.voice.tryAgain}</span>
                    </button>
                    <button
                      type="button"
                      onClick={discardTranscript}
                      className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-100"
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
