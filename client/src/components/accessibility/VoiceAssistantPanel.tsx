import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Globe,
  Loader2,
  Mic,
  RotateCcw,
  Send,
  Square,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { LANGUAGE_REGISTRY } from '../../i18n/types';
import { useReadAloud } from '../../hooks/useReadAloud';
import { useSpeechInput } from '../../hooks/useSpeechInput';
import { useGeminiLive } from '../../hooks/useGeminiLive';
import { GatewayModule, SupportedLanguage } from '../../types/gateway';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  language: SupportedLanguage;
  provider?: string;
}

interface VoiceAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  activeModule: GatewayModule;
}

export const VoiceAssistantPanel: React.FC<VoiceAssistantPanelProps> = ({
  open,
  onClose,
  activeModule,
}) => {
  const { language, t, setLanguage, format } = useI18n();
  const [autoDetect, setAutoDetect] = useState(true);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [languageNotice, setLanguageNotice] = useState<string | null>(null);

  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const handledVoiceTranscriptRef = useRef<string | null>(null);

  const {
    isSpeaking,
    isLoadingAudio,
    hasAuthenticVoice,
    usingNeuralVoice,
    voiceStatusNote,
    read,
    stop: stopAudio,
  } = useReadAloud(language);

  const handleDetectedLanguage = useCallback(
    (detected: SupportedLanguage) => {
      if (autoDetect && detected !== language) {
        const meta = LANGUAGE_REGISTRY.find((l) => l.code === detected);
        setLanguageNotice(
          format(t.voiceAssistant.switchedLanguageNotice, {
            language: meta ? meta.nativeName : detected.toUpperCase(),
          })
        );
        void setLanguage(detected);
      }
    },
    [autoDetect, format, language, setLanguage, t.voiceAssistant.switchedLanguageNotice]
  );

  const {
    status: micStatus,
    transcript: micTranscript,
    detectedLanguage: micDetectedLang,
    errorDetail: micErrorDetail,
    recognitionAvailable,
    browserSttAvailable,
    languageNotSupportedInBrowser,
    canFallbackToBrowserEnglish,
    micPermission,
    startListening,
    stopListening,
    discardTranscript,
  } = useSpeechInput(autoDetect ? 'auto' : language, handleDetectedLanguage);

  const {
    status: liveStatus,
    errorMessage: liveError,
    liveInputDraft,
    liveOutputDraft,
    entries: liveEntries,
    startSession: startLiveSession,
    stopSession: stopLiveSession,
  } = useGeminiLive(language, activeModule);

  useEffect(() => {
    if (open) {
      closeBtnRef.current?.focus();
    } else {
      stopListening();
      stopAudio();
      stopLiveSession();
    }
  }, [open, stopAudio, stopListening, stopLiveSession]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const sendMessage = useCallback(
    async (rawText: string, explicitLang?: SupportedLanguage) => {
      const cleaned = rawText.trim();
      if (!cleaned || isSending) return;

      setAssistantError(null);
      setIsSending(true);
      const userLang = explicitLang || language;
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: cleaned,
        language: userLang,
      };
      const nextHistory = [...messages, userMsg];
      setMessages(nextHistory);
      setInputText('');

      try {
        const res = await fetch('/api/speech/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: cleaned,
            language: userLang,
            autoDetect,
            context: { activeModule },
            history: nextHistory.slice(-6).map((m) => ({
              role: m.role,
              text: m.text,
            })),
          }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          replyText?: string;
          language?: SupportedLanguage;
          provider?: string;
          error?: string;
        };

        if (!res.ok || !data.replyText) {
          throw new Error(data.error || 'Voice assistant could not answer right now.');
        }

        const replyLang: SupportedLanguage = data.language || userLang;
        if (autoDetect && replyLang !== language) {
          const meta = LANGUAGE_REGISTRY.find((l) => l.code === replyLang);
          setLanguageNotice(
            format(t.voiceAssistant.switchedLanguageNotice, {
              language: meta ? meta.nativeName : replyLang.toUpperCase(),
            })
          );
          await setLanguage(replyLang);
        }

        const botMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: data.replyText,
          language: replyLang,
          provider: data.provider,
        };
        setMessages((prev) => [...prev, botMsg]);

        // Speak response strictly in its matched language
        void read(data.replyText, replyLang);
      } catch (err) {
        setAssistantError(
          err instanceof Error
            ? err.message
            : 'Unable to reach voice assistant. Please try again.'
        );
      } finally {
        setIsSending(false);
      }
    },
    [
      activeModule,
      autoDetect,
      format,
      isSending,
      language,
      messages,
      read,
      setLanguage,
      t.voiceAssistant.switchedLanguageNotice,
    ]
  );

  // Automatically submit finalized voice transcripts from the microphone
  useEffect(() => {
    if (
      micStatus === 'reviewing' &&
      micTranscript.trim() &&
      handledVoiceTranscriptRef.current !== micTranscript
    ) {
      handledVoiceTranscriptRef.current = micTranscript;
      const textToSend = micTranscript.trim();
      const langToSend = micDetectedLang || language;
      discardTranscript();
      void sendMessage(textToSend, langToSend);
    }
  }, [discardTranscript, language, micDetectedLang, micStatus, micTranscript, sendMessage]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gw-voice-assistant-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex justify-end bg-[#0F1E36]/60 dark:bg-black/70 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 text-[#0F1E36] dark:text-slate-100 h-screen overflow-y-auto overscroll-contain shadow-2xl border-s border-slate-200 dark:border-slate-800 flex flex-col">
        <div
          className="p-5 sm:p-6 flex items-start justify-between gap-4 bg-[#0F1E36] text-white shrink-0 border-b border-white/10 dark:border-slate-800"
          style={{ backgroundColor: 'var(--gw-primary)', color: 'var(--gw-primary-text)' }}
        >
          <div className="space-y-1">
            <h2
              id="gw-voice-assistant-title"
              className="text-lg font-bold text-white flex items-center gap-2 tracking-tight"
            >
              <span className="w-7 h-7 rounded-full bg-amber-500 text-[#0F1E36] flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4" aria-hidden="true" />
              </span>
              <span>{t.voiceAssistant.title}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-200">{t.voiceAssistant.subtitle}</p>
            <p className="text-xs font-semibold text-amber-400">
              {usingNeuralVoice
                ? t.voiceAssistant.providerBadgeNeural
                : t.voiceAssistant.providerBadgeBrowser}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={t.voiceAssistant.closeButton}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md border border-white/25 bg-[#162947] text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Strictly 3-Language Selector & Auto-Detect Control */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400" aria-hidden="true" />
              <label
                htmlFor="gw-va-lang-select"
                className="text-sm font-semibold text-[#0F1E36] dark:text-slate-100"
              >
                {t.common.languageLabel}:
              </label>
              <select
                id="gw-va-lang-select"
                value={language}
                onChange={(e) => {
                  const next = e.target.value as SupportedLanguage;
                  setLanguageNotice(null);
                  void setLanguage(next);
                }}
                className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 px-3 py-1 text-sm font-semibold text-[#0F1E36] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400"
              >
                {LANGUAGE_REGISTRY.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  stopAudio();
                  setMessages([]);
                  setAssistantError(null);
                  setLanguageNotice(null);
                }}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-[#F3F4F6] dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.voiceAssistant.clearChat}</span>
              </button>
            )}
          </div>

          <label className="inline-flex items-center gap-2.5 cursor-pointer text-sm font-medium text-[#0F1E36] dark:text-slate-200">
            <input
              type="checkbox"
              checked={autoDetect}
              onChange={(e) => setAutoDetect(e.target.checked)}
              className="h-5 w-5 rounded border-slate-400 dark:border-slate-600 accent-[#0F1E36] dark:accent-amber-500"
            />
            <span>{t.voiceAssistant.autoDetectLabel}</span>
          </label>

          {languageNotice && (
            <p
              role="status"
              className="text-xs font-medium text-[#0F1E36] dark:text-amber-100 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2"
            >
              {languageNotice}
            </p>
          )}

          {/* Real-Time Gemini Live (gemini-3.8-live) Conversation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800/80 px-3 py-2.5">
            <span className="text-xs font-semibold text-[#0F1E36] dark:text-slate-100">
              {liveStatus === 'connected'
                ? 'Live Voice Active (gemini-3.8-live)'
                : liveStatus === 'connecting'
                ? 'Connecting Live Voice…'
                : 'Real-Time Voice (gemini-3.8-live)'}
            </span>
            {liveStatus === 'connected' || liveStatus === 'connecting' ? (
              <button
                type="button"
                onClick={stopLiveSession}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1 rounded-lg border-2 border-red-700 dark:border-red-500 bg-red-50 dark:bg-red-950/60 text-xs font-bold text-red-950 dark:text-red-100 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" aria-hidden="true" />
                <span>End Live</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  stopAudio();
                  void startLiveSession();
                }}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1 rounded-lg bg-[#0F1E36] hover:bg-[#1E3A5F] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span>Start Live Voice</span>
              </button>
            )}
          </div>
          {liveError && (
            <p
              role="alert"
              className="text-xs font-medium text-red-900 dark:text-red-100 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-700 rounded-xl px-3 py-2"
            >
              {liveError}
            </p>
          )}
        </div>

        {/* Conversation Transcript (independently scroll-contained) */}
        <div
          className="flex-1 min-h-0 p-4 space-y-3 overflow-y-auto overscroll-contain bg-[#F3F4F6] dark:bg-slate-950"
          aria-live="polite"
        >
          {messages.length === 0 && liveEntries.length === 0 && !liveInputDraft && !liveOutputDraft ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {t.voiceAssistant.emptyState}
            </div>
          ) : (
            <>
              {liveEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-2xl border p-3.5 text-sm shadow-xs ${
                    entry.role === 'user'
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ml-6'
                      : 'bg-amber-50/70 dark:bg-slate-800 border-amber-300 dark:border-slate-700 mr-4'
                  }`}
                >
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {entry.role === 'user' ? 'You (Live)' : 'Gemini Live'}
                  </div>
                  <p className="text-[#0F1E36] dark:text-slate-100">{entry.text}</p>
                </div>
              ))}
              {liveInputDraft && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white dark:bg-slate-900 p-3 text-sm ml-6">
                  {liveInputDraft}
                </div>
              )}
              {liveOutputDraft && (
                <div className="rounded-xl border border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 text-sm mr-4">
                  {liveOutputDraft}
                </div>
              )}
              {messages.map((msg) => {
              const langMeta = LANGUAGE_REGISTRY.find((l) => l.code === msg.language);
              return (
                <div
                  key={msg.id}
                  lang={msg.language}
                  className={`rounded-2xl border p-4 space-y-2 shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ml-6'
                      : 'bg-[#0F1E36]/[0.04] dark:bg-slate-800/90 border-[#0F1E36]/20 dark:border-slate-700 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <span>
                      {msg.role === 'user' ? 'You' : t.voiceAssistant.title} ·{' '}
                      {langMeta ? langMeta.nativeName : msg.language.toUpperCase()}
                    </span>
                    {msg.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => void read(msg.text, msg.language)}
                        className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-[#F3F4F6] dark:hover:bg-slate-700 normal-case tracking-normal transition-colors cursor-pointer"
                      >
                        {isSpeaking ? (
                          <>
                            <Square className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{t.common.stopReading}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{t.common.readAloud}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-sm sm:text-base text-[#0F1E36] dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                </div>
              );
            })}
            </>
          )}

          {isSending && (
            <div
              role="status"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 shadow-xs text-sm font-medium text-[#0F1E36] dark:text-slate-100"
            >
              <Loader2 className="w-4 h-4 animate-spin text-amber-700 dark:text-amber-400" aria-hidden="true" />
              <span>{t.voiceAssistant.thinkingStatus}</span>
            </div>
          )}

          {(isLoadingAudio || isSpeaking) && (
            <div
              role="status"
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 shadow-xs text-sm text-[#0F1E36] dark:text-slate-100"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                {isLoadingAudio ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-700 dark:text-amber-400" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                )}
                <span>
                  {isLoadingAudio ? t.common.loadingAudio : t.voiceAssistant.speakingStatus}
                </span>
              </span>
              <button
                type="button"
                onClick={stopAudio}
                className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-[#F3F4F6] dark:bg-slate-800 text-xs font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.voiceAssistant.stopSpeakingButton}</span>
              </button>
            </div>
          )}

          {voiceStatusNote && (
            <p
              role="status"
              className="text-xs text-[#0F1E36] dark:text-amber-100 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-xl px-3.5 py-2.5"
            >
              {voiceStatusNote}
            </p>
          )}

          {!hasAuthenticVoice && messages.some((m) => m.role === 'assistant') && !voiceStatusNote && (
            <p
              role="note"
              className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5"
            >
              {t.voiceAssistant.providerUnavailable}
            </p>
          )}

          {(micStatus === 'permission_denied' || micPermission === 'denied') && (
            <div
              role="alert"
              className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 px-3.5 py-3 text-xs sm:text-sm text-[#0F1E36] dark:text-amber-100 space-y-2"
            >
              <p className="font-medium">{t.voice.permissionDeniedMessage}</p>
              <button
                type="button"
                onClick={() => {
                  handledVoiceTranscriptRef.current = null;
                  stopAudio();
                  startListening();
                }}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-md border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 text-xs font-semibold text-[#0F1E36] dark:text-amber-100 hover:bg-amber-100/60 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.voice.retryMic}</span>
              </button>
            </div>
          )}

          {(assistantError || (micErrorDetail && micStatus !== 'permission_denied')) && (
            <div
              role="alert"
              className="flex flex-col gap-2 rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/50 px-3.5 py-2.5 text-sm text-red-900 dark:text-red-100"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{assistantError || micErrorDetail}</span>
              </div>
              {(languageNotSupportedInBrowser || canFallbackToBrowserEnglish) &&
                browserSttAvailable && (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        handledVoiceTranscriptRef.current = null;
                        stopAudio();
                        startListening('en');
                      }}
                      className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                      <span>{t.voice.fallbackEnglishButton}</span>
                    </button>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Input & Microphone Controls */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(inputText);
          }}
          className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shrink-0"
        >
          <label
            htmlFor="gw-va-input"
            className="block text-sm font-semibold text-[#0F1E36] dark:text-white"
          >
            {t.voiceAssistant.speakOrTypePrompt}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="gw-va-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.voiceAssistant.inputPlaceholder}
              className="flex-1 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 px-3.5 py-2 text-base text-[#0F1E36] dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400"
            />
            <div className="flex items-center gap-2">
              {(recognitionAvailable || browserSttAvailable) && (
                <button
                  type="button"
                  onClick={() => {
                    handledVoiceTranscriptRef.current = null;
                    if (micStatus === 'listening') {
                      stopListening();
                    } else {
                      stopAudio();
                      startListening(recognitionAvailable ? undefined : 'en');
                    }
                  }}
                  disabled={micStatus === 'transcribing' || isSending}
                  className={`inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-md text-sm font-semibold border transition-colors cursor-pointer ${
                    micStatus === 'listening'
                      ? 'border-2 border-red-700 dark:border-red-500 bg-red-50 dark:bg-red-950/60 text-red-950 dark:text-red-100'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 hover:bg-amber-50 dark:hover:bg-slate-700 hover:border-amber-400 dark:hover:border-amber-400'
                  }`}
                >
                  {micStatus === 'transcribing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-700 dark:text-amber-400" aria-hidden="true" />
                      <span>{t.voice.transcribingState}</span>
                    </>
                  ) : micStatus === 'listening' ? (
                    <>
                      <Square className="w-4 h-4 text-red-800 dark:text-red-400" aria-hidden="true" />
                      <span>{t.voice.stopMic}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                      <span>{t.voiceAssistant.speakButton}</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-md text-sm font-bold bg-amber-500 hover:bg-amber-400 text-[#0F1E36] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>{t.voiceAssistant.sendButton}</span>
              </button>
            </div>
          </div>
          {micPermission === 'prompt' && recognitionAvailable && (
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {t.voice.permissionPromptNote}
            </p>
          )}
          <p className="text-xs text-slate-600 dark:text-slate-400">{t.voice.noAudioStoredNote}</p>
        </form>
      </div>
    </div>
  );
};
