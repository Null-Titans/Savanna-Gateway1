import React from 'react';
import { Loader2, Square, Volume2 } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useReadAloud } from '../../hooks/useReadAloud';

interface ReadAloudButtonProps {
  textToRead: string;
  className?: string;
}

export const ReadAloudButton: React.FC<ReadAloudButtonProps> = ({ textToRead, className = '' }) => {
  const { language, t } = useI18n();
  const {
    isSpeaking,
    isLoadingAudio,
    synthesisSupported,
    hasAuthenticVoice,
    voiceStatusNote,
    read,
  } = useReadAloud(language);

  if (!synthesisSupported && !hasAuthenticVoice) {
    return (
      <p className="text-xs text-slate-600 mt-1" role="note">
        {t.common.readAloudUnavailable}
      </p>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void read(textToRead)}
        aria-pressed={isSpeaking}
        className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
      >
        {isLoadingAudio ? (
          <>
            <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />
            <span>{t.common.loadingAudio}</span>
          </>
        ) : isSpeaking ? (
          <>
            <Square className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t.common.stopReading}</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t.common.readAloud}</span>
          </>
        )}
      </button>
      {voiceStatusNote && (
        <p
          className="text-xs text-amber-950 bg-amber-50 border border-amber-300 rounded-md px-3 py-2 mt-2"
          role="status"
        >
          {voiceStatusNote}
        </p>
      )}
    </div>
  );
};
