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
      <p
        className="inline-block rounded-md border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-[#0F1E36] dark:text-slate-200 mt-1"
        role="note"
      >
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
        className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 text-sm font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 hover:bg-amber-50 dark:hover:bg-slate-700 hover:border-amber-400 dark:hover:border-amber-400 transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
      >
        {isLoadingAudio ? (
          <>
            <Loader2 className="w-4 h-4 shrink-0 animate-spin text-amber-700 dark:text-amber-400" aria-hidden="true" />
            <span>{t.common.loadingAudio}</span>
          </>
        ) : isSpeaking ? (
          <>
            <Square className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
            <span>{t.common.stopReading}</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
            <span>{t.common.readAloud}</span>
          </>
        )}
      </button>
      {voiceStatusNote && (
        <p
          className="text-xs text-amber-950 dark:text-amber-100 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-md px-3 py-2 mt-2"
          role="status"
        >
          {voiceStatusNote}
        </p>
      )}
    </div>
  );
};
