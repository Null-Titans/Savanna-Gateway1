import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  AlertTriangle,
  AudioLines,
  CheckCircle2,
  Loader2,
  Mic,
  Radio,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { AccommodationCategory } from '../../types/gateway';
import {
  getSpeechLangTag,
  getSpeechRecognitionConstructor,
  SpeechRecognitionInstanceLike,
} from '../../services/speech/speechService';
import { useGeminiLive } from '../../hooks/useGeminiLive';

export type SpeechFilterVisualState = 'ready' | 'listening' | 'error';

export interface VoiceFilterResult {
  searchQuery: string;
  categories: AccommodationCategory[];
  transcript: string;
}

interface VoiceConversationFilterProps {
  currentSearchQuery: string;
  selectedCategories: AccommodationCategory[];
  resultCount: number;
  onApplyVoiceFilter: (result: VoiceFilterResult) => void;
  onClearVoiceFilter: () => void;
  context?: string;
}

const VOICE_CATEGORY_PATTERNS: Array<{
  category: AccommodationCategory;
  keywords: RegExp;
}> = [
  {
    category: 'remote_flexible',
    keywords: /\b(remote|work from home|wfh|hybrid|anywhere)\b|ርቀት|በቤት|fagoo/i,
  },
  {
    category: 'flexible_hours',
    keywords: /\b(flexible|part[\s-]?time|hours|schedule|shift)\b|ተለዋዋጭ|ሰዓት|yeroo/i,
  },
  {
    category: 'screen_reader_tools',
    keywords: /\b(screen[\s-]?reader|nvda|jaws|voiceover|audio|braille|blind)\b|ስክሪን/i,
  },
  {
    category: 'accessible_workplace',
    keywords: /\b(wheelchair|step[\s-]?free|ramp|accessible workplace|physical|hub)\b/i,
  },
  {
    category: 'assistive_tech',
    keywords: /\b(assistive|magnifier|headset|ergonomic|tech stipend)\b/i,
  },
  {
    category: 'communication_support',
    keywords: /\b(interpreter|sign language|captions?|written chat|communication)\b|ምልክት|ቋንቋ/i,
  },
];

const FILLER_WORDS_RE =
  /\b(show me|find me|search for|filter by|looking for|i need|jobs? with|roles? with|jobs?|roles?|accommodations?|please)\b/gi;

export function parseVoiceFilterCommand(rawTranscript: string): VoiceFilterResult {
  const cleaned = rawTranscript.replace(/\s+/g, ' ').trim();
  const matchedCategories: AccommodationCategory[] = [];

  for (const rule of VOICE_CATEGORY_PATTERNS) {
    if (rule.keywords.test(cleaned)) {
      matchedCategories.push(rule.category);
    }
  }

  let remainingQuery = cleaned.replace(FILLER_WORDS_RE, ' ');
  if (matchedCategories.length > 0) {
    for (const rule of VOICE_CATEGORY_PATTERNS) {
      if (matchedCategories.includes(rule.category)) {
        remainingQuery = remainingQuery.replace(new RegExp(rule.keywords.source, 'gi'), ' ');
      }
    }
  }

  remainingQuery = remainingQuery.replace(/[,.;!?]+/g, ' ').replace(/\s+/g, ' ').trim();

  return {
    searchQuery: remainingQuery,
    categories: matchedCategories,
    transcript: cleaned,
  };
}

const EXAMPLE_COMMANDS = [
  'Remote screen reader jobs',
  'Interpreter for interviews flexible hours',
  'Addis Ababa accessible workplace',
];

export const VoiceConversationFilter: React.FC<VoiceConversationFilterProps> = ({
  currentSearchQuery,
  selectedCategories,
  resultCount,
  onApplyVoiceFilter,
  onClearVoiceFilter,
  context = 'career',
}) => {
  const { language, t } = useI18n();
  const headingId = useId();
  const liveInputId = useId();

  const [activeTab, setActiveTab] = useState<'filter' | 'live'>('filter');
  const [speechState, setSpeechState] = useState<SpeechFilterVisualState>('ready');
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [liveTextInput, setLiveTextInput] = useState('');

  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);
  const speechStateRef = useRef<SpeechFilterVisualState>('ready');
  const latestTranscriptRef = useRef('');

  const {
    status: liveStatus,
    errorMessage: liveError,
    liveInputDraft,
    liveOutputDraft,
    entries: liveEntries,
    startSession: startLiveSession,
    stopSession: stopLiveSession,
    sendText: sendLiveText,
    clearEntries: clearLiveEntries,
  } = useGeminiLive(language, context);

  const setSpeechStateSafe = useCallback((next: SpeechFilterVisualState) => {
    speechStateRef.current = next;
    setSpeechState(next);
  }, []);

  const stopSpeechFilter = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      recognitionRef.current = null;
    }
    if (speechStateRef.current === 'listening') {
      setSpeechStateSafe('ready');
    }
  }, [setSpeechStateSafe]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore abort errors
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const applySpokenPhrase = useCallback(
    (spokenText: string) => {
      const parsed = parseVoiceFilterCommand(spokenText);
      onApplyVoiceFilter(parsed);
      const summaryParts: string[] = [];
      if (parsed.categories.length > 0) {
        summaryParts.push(`${parsed.categories.length} workplace support filter(s)`);
      }
      if (parsed.searchQuery) {
        summaryParts.push(`keyword "${parsed.searchQuery}"`);
      }
      setLiveAnnouncement(
        summaryParts.length > 0
          ? `Applied voice filter: ${summaryParts.join(' and ')}.`
          : `Heard "${parsed.transcript}". Updated job filter.`
      );
    },
    [onApplyVoiceFilter]
  );

  const startSpeechFilter = useCallback(() => {
    setErrorMessage(null);
    const Ctor = getSpeechRecognitionConstructor();

    if (!Ctor) {
      setSpeechStateSafe('error');
      const msg =
        'Native browser Speech Recognition is not supported in this browser. Try Chrome/Edge or use the example chips or search box below.';
      setErrorMessage(msg);
      setLiveAnnouncement(msg);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort errors
      }
      recognitionRef.current = null;
    }

    try {
      const recognition = new Ctor();
      // Browser Web Speech API supports en-US / am-ET cleanly; fall back to en-US for om
      recognition.lang = language === 'om' ? 'en-US' : getSpeechLangTag(language);
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      latestTranscriptRef.current = '';
      setTranscript('');

      recognition.onstart = () => {
        setSpeechStateSafe('listening');
        setLiveAnnouncement('Listening for job or accommodation voice filter. Speak now.');
      };

      recognition.onresult = (event) => {
        const parts: string[] = [];
        let hasFinal = false;
        for (let i = 0; i < event.results.length; i += 1) {
          const resItem = event.results[i];
          const text = resItem?.[0]?.transcript;
          if (text) parts.push(text);
          if (resItem?.isFinal) hasFinal = true;
        }
        const combined = parts.join(' ').replace(/\s+/g, ' ').trim();
        latestTranscriptRef.current = combined;
        setTranscript(combined);

        if (hasFinal && combined) {
          applySpokenPhrase(combined);
        }
      };

      recognition.onerror = (ev) => {
        recognitionRef.current = null;
        setSpeechStateSafe('error');
        let friendly = 'Voice recognition stopped. You can try again or use text search.';
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
          friendly =
            'Microphone access was blocked. Allow microphone permission in your browser and tap Retry.';
        } else if (ev.error === 'no-speech') {
          friendly = 'No speech was heard. Speak closer to your microphone and try again.';
        } else if (ev.error === 'audio-capture') {
          friendly = 'No working microphone was detected on this device.';
        } else if (ev.error === 'network') {
          friendly =
            'Browser speech recognition could not connect. Check your network or use Live Voice / text search.';
        } else if (ev.error === 'language-not-supported') {
          friendly =
            'This browser speech engine does not support the active language. Switch language or use text filtering.';
        }
        setErrorMessage(friendly);
        setLiveAnnouncement(friendly);
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        if (speechStateRef.current === 'listening') {
          const finalCaptured = latestTranscriptRef.current.trim();
          if (finalCaptured) {
            applySpokenPhrase(finalCaptured);
            setSpeechStateSafe('ready');
          } else {
            setSpeechStateSafe('error');
            const msg = 'No speech was captured. Tap Try again or select an example filter.';
            setErrorMessage(msg);
            setLiveAnnouncement(msg);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setSpeechStateSafe('error');
      const msg = 'Could not initialize browser speech recognition.';
      setErrorMessage(msg);
      setLiveAnnouncement(msg);
    }
  }, [applySpokenPhrase, language, setSpeechStateSafe]);

  const hasActiveFilter = Boolean(currentSearchQuery || selectedCategories.length > 0 || transcript);

  const visualStateBadge =
    speechState === 'listening'
      ? {
          label: 'Listening',
          classes:
            'border-amber-500 bg-amber-50 text-[#0F1E36] dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-500',
          icon: <AudioLines className="w-4 h-4 text-amber-700 dark:text-amber-400 animate-pulse" aria-hidden="true" />,
        }
      : speechState === 'error'
      ? {
          label: 'Error',
          classes:
            'border-red-700 bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-200 dark:border-red-500',
          icon: <AlertTriangle className="w-4 h-4 text-red-700 dark:text-red-400" aria-hidden="true" />,
        }
      : {
          label: 'Ready',
          classes:
            'border-emerald-700 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-500',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />,
        };

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-5"
    >
      {/* Polite ARIA Live Region for state, filter, and transcript announcements */}
      <div className="gw-sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Component Header & Mode Switcher */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3
              id={headingId}
              className="text-lg sm:text-xl font-bold text-[#0F1E36] dark:text-white tracking-tight"
            >
              Voice Filter &amp; Real-Time Conversation
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${visualStateBadge.classes}`}
            >
              {visualStateBadge.icon}
              <span>State: {visualStateBadge.label}</span>
            </span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 gw-prose-measure">
            Filter jobs hands-free using browser Speech Recognition, or speak in real time with
            Gemini Live (<span className="font-mono text-xs">gemini-3.8-live</span>).
          </p>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Voice assistant modes">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'filter'}
            onClick={() => setActiveTab('filter')}
            className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'filter'
                ? 'border-[#0F1E36] bg-[#0F1E36] text-white dark:border-amber-400 dark:bg-amber-500 dark:text-[#0F1E36]'
                : 'border-slate-300 dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-700'
            }`}
          >
            <Mic className="w-4 h-4" aria-hidden="true" />
            <span>Voice Filter</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'live'}
            onClick={() => {
              stopSpeechFilter();
              setActiveTab('live');
            }}
            className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'live'
                ? 'border-[#0F1E36] bg-[#0F1E36] text-white dark:border-amber-400 dark:bg-amber-500 dark:text-[#0F1E36]'
                : 'border-slate-300 dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>Live Voice (gemini-3.8-live)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Native Browser Speech Recognition Job & Accommodation Filtering */}
      {activeTab === 'filter' && (
        <div role="tabpanel" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {speechState === 'listening' ? (
              <button
                type="button"
                onClick={stopSpeechFilter}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg border-2 border-red-700 dark:border-red-500 bg-red-50 dark:bg-red-950/60 text-red-950 dark:text-red-100 text-sm font-bold transition-colors cursor-pointer"
              >
                <Square className="w-4 h-4" aria-hidden="true" />
                <span>Stop Listening</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startSpeechFilter}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0F1E36] text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Mic className="w-4 h-4" aria-hidden="true" />
                <span>Speak to Filter Jobs</span>
              </button>
            )}

            {hasActiveFilter && (
              <button
                type="button"
                onClick={() => {
                  setTranscript('');
                  setErrorMessage(null);
                  setSpeechStateSafe('ready');
                  onClearVoiceFilter();
                  setLiveAnnouncement('Cleared voice and accommodation filters.');
                }}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-[#F3F4F6] dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span>{t.career.clearFilters}</span>
              </button>
            )}

            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              {resultCount} matching {resultCount === 1 ? 'role' : 'roles'}
            </span>
          </div>

          {transcript && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-[#1E3A5F]/25 dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800/80 px-4 py-3 text-sm text-[#0F1E36] dark:text-slate-100"
            >
              <span className="font-bold">Recognized speech: </span>
              <span>“{transcript}”</span>
            </div>
          )}

          {speechState === 'error' && errorMessage && (
            <div
              role="alert"
              className="rounded-xl border-2 border-red-700 dark:border-red-500 bg-red-50 dark:bg-red-950/60 p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-red-950 dark:text-red-100"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="font-medium">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={startSpeechFilter}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg bg-red-800 hover:bg-red-900 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>{t.common.retry}</span>
              </button>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Try speaking or tapping an example command
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSpeechStateSafe('ready');
                    setTranscript(cmd);
                    applySpokenPhrase(cmd);
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 text-xs sm:text-sm font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-amber-50 dark:hover:bg-slate-700 hover:border-amber-400 transition-colors cursor-pointer"
                >
                  “{cmd}”
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Real-Time Gemini Live API (gemini-3.8-live) Conversation */}
      {activeTab === 'live' && (
        <div role="tabpanel" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F3F4F6] dark:bg-slate-800/70 p-4">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-[#0F1E36] dark:text-white">
              <Radio
                className={`w-4 h-4 ${
                  liveStatus === 'connected'
                    ? 'text-emerald-700 dark:text-emerald-400 animate-pulse'
                    : liveStatus === 'connecting'
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                aria-hidden="true"
              />
              <span>
                {liveStatus === 'connected'
                  ? 'Live Audio Connected (gemini-3.8-live)'
                  : liveStatus === 'connecting'
                  ? 'Connecting to Gemini Live…'
                  : liveStatus === 'error'
                  ? 'Live Voice Unavailable'
                  : 'Ready for Real-Time Voice Conversation'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {liveStatus === 'connected' || liveStatus === 'connecting' ? (
                <button
                  type="button"
                  onClick={stopLiveSession}
                  className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border-2 border-red-700 dark:border-red-500 bg-red-50 dark:bg-red-950/60 text-red-950 dark:text-red-100 text-sm font-bold cursor-pointer"
                >
                  <Square className="w-4 h-4" aria-hidden="true" />
                  <span>End Live Session</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void startLiveSession()}
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0F1E36] text-sm font-bold shadow-xs cursor-pointer"
                >
                  <AudioLines className="w-4 h-4" aria-hidden="true" />
                  <span>Start Live Voice</span>
                </button>
              )}

              {liveEntries.length > 0 && (
                <button
                  type="button"
                  onClick={clearLiveEntries}
                  className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-[#0F1E36] dark:text-slate-100 cursor-pointer"
                >
                  {t.voiceAssistant.clearChat}
                </button>
              )}
            </div>
          </div>

          {liveError && (
            <div
              role="alert"
              className="rounded-xl border-2 border-red-700 dark:border-red-500 bg-red-50 dark:bg-red-950/60 p-4 flex items-start gap-2.5 text-sm text-red-950 dark:text-red-100"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{liveError}</span>
            </div>
          )}

          {/* Live Transcript Stream */}
          <div
            aria-live="polite"
            className="max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F3F4F6]/60 dark:bg-slate-950 p-4 space-y-2.5"
          >
            {liveEntries.length === 0 && !liveInputDraft && !liveOutputDraft ? (
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Press <strong>Start Real-Time Voice</strong> to speak with the Savanna Gateway guide
                using <span className="font-mono text-xs">gemini-3.8-live</span>. Spoken questions
                and audio replies appear here live.
              </p>
            ) : (
              <>
                {liveEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-xl border p-3 text-sm ${
                      entry.role === 'user'
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ms-6'
                        : 'bg-[#0F1E36]/[0.05] dark:bg-slate-800 border-[#0F1E36]/20 dark:border-slate-700 me-6'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      {entry.role === 'user' ? 'You' : 'Gemini Live Guide'}
                    </div>
                    <p className="text-[#0F1E36] dark:text-slate-100">{entry.text}</p>
                  </div>
                ))}
                {liveInputDraft && (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm ms-6">
                    <span className="text-xs font-bold uppercase text-slate-500">You (live): </span>
                    <span>{liveInputDraft}</span>
                  </div>
                )}
                {liveOutputDraft && (
                  <div className="rounded-xl border border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 text-sm me-6">
                    <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300">
                      Gemini Live (speaking):{' '}
                    </span>
                    <span>{liveOutputDraft}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {liveStatus === 'connected' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (sendLiveText(liveTextInput)) {
                  setLiveTextInput('');
                }
              }}
              className="flex flex-wrap gap-2"
            >
              <label htmlFor={liveInputId} className="gw-sr-only">
                Send a text message into the active Live session
              </label>
              <input
                id={liveInputId}
                type="text"
                value={liveTextInput}
                onChange={(e) => setLiveTextInput(e.target.value)}
                placeholder="Type to message the live voice session…"
                className="flex-1 min-w-[200px] min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-[#0F1E36] dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!liveTextInput.trim()}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg bg-[#0F1E36] hover:bg-[#1E3A5F] text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>{t.voiceAssistant.sendButton}</span>
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
};
