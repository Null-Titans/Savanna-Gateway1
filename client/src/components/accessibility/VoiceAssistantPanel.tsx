import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Globe,
  Loader2,
  Mic,
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
    startListening,
    stopListening,
    discardTranscript,
  } = useSpeechInput(autoDetect ? 'auto' : language, handleDetectedLanguage);

  useEffect(() => {
    if (open) {
      closeBtnRef.current?.focus();
    } else {
      stopListening();
      stopAudio();
    }
  }, [open, stopAudio, stopListening]);

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
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50"
    >
      <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl border-l border-slate-300 flex flex-col">
        <div className="p-5 border-b border-slate-300 flex items-start justify-between gap-4 bg-slate-50">
          <div className="space-y-1">
            <h2
              id="gw-voice-assistant-title"
              className="text-lg font-bold text-slate-900 flex items-center gap-2"
            >
              <Mic className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{t.voiceAssistant.title}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-700">{t.voiceAssistant.subtitle}</p>
            <p className="text-xs font-medium text-slate-700">
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
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-slate-400 bg-white text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Strictly 3-Language Selector & Auto-Detect Control */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-700" aria-hidden="true" />
              <label
                htmlFor="gw-va-lang-select"
                className="text-sm font-semibold text-slate-900"
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
                className="min-h-[40px] rounded-lg border border-slate-400 bg-white px-2.5 py-1 text-sm font-medium text-slate-900"
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
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.voiceAssistant.clearChat}</span>
              </button>
            )}
          </div>

          <label className="inline-flex items-center gap-2.5 cursor-pointer text-sm text-slate-800">
            <input
              type="checkbox"
              checked={autoDetect}
              onChange={(e) => setAutoDetect(e.target.checked)}
              className="h-5 w-5 rounded border-slate-400"
            />
            <span>{t.voiceAssistant.autoDetectLabel}</span>
          </label>

          {languageNotice && (
            <p
              role="status"
              className="text-xs font-medium text-slate-900 bg-slate-100 border border-slate-300 rounded-md px-3 py-1.5"
            >
              {languageNotice}
            </p>
          )}
        </div>

        {/* Conversation Transcript */}
        <div
          className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-700">
              {t.voiceAssistant.emptyState}
            </div>
          ) : (
            messages.map((msg) => {
              const langMeta = LANGUAGE_REGISTRY.find((l) => l.code === msg.language);
              return (
                <div
                  key={msg.id}
                  lang={msg.language}
                  className={`rounded-xl border p-3.5 space-y-2 ${
                    msg.role === 'user'
                      ? 'bg-white border-slate-300 ml-6'
                      : 'bg-slate-100 border-slate-400 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-600 font-semibold">
                    <span>
                      {msg.role === 'user' ? 'You' : t.voiceAssistant.title} ·{' '}
                      {langMeta ? langMeta.nativeName : msg.language.toUpperCase()}
                    </span>
                    {msg.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => void read(msg.text, msg.language)}
                        className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-md border border-slate-400 bg-white text-xs font-medium text-slate-900 hover:bg-slate-50"
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
                  <p className="text-sm sm:text-base text-slate-900 leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                </div>
              );
            })
          )}

          {isSending && (
            <div
              role="status"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800"
            >
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>{t.voiceAssistant.thinkingStatus}</span>
            </div>
          )}

          {(isLoadingAudio || isSpeaking) && (
            <div
              role="status"
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900"
            >
              <span className="inline-flex items-center gap-2">
                {isLoadingAudio ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-4 h-4" aria-hidden="true" />
                )}
                <span>
                  {isLoadingAudio ? t.common.loadingAudio : t.voiceAssistant.speakingStatus}
                </span>
              </span>
              <button
                type="button"
                onClick={stopAudio}
                className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-md border border-slate-400 bg-slate-50 text-xs font-semibold text-slate-900"
              >
                <Square className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.voiceAssistant.stopSpeakingButton}</span>
              </button>
            </div>
          )}

          {voiceStatusNote && (
            <p
              role="status"
              className="text-xs text-amber-950 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2"
            >
              {voiceStatusNote}
            </p>
          )}

          {!hasAuthenticVoice && messages.some((m) => m.role === 'assistant') && !voiceStatusNote && (
            <p
              role="note"
              className="text-xs text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-2"
            >
              {t.voiceAssistant.providerUnavailable}
            </p>
          )}

          {(assistantError || micErrorDetail) && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{assistantError || micErrorDetail}</span>
            </div>
          )}
        </div>

        {/* Input & Microphone Controls */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(inputText);
          }}
          className="p-4 border-t border-slate-300 bg-white space-y-3"
        >
          <label htmlFor="gw-va-input" className="block text-sm font-semibold text-slate-900">
            {t.voiceAssistant.speakOrTypePrompt}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="gw-va-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.voiceAssistant.inputPlaceholder}
              className="flex-1 min-h-[44px] rounded-lg border border-slate-400 bg-white px-3.5 py-2 text-base text-slate-900"
            />
            <div className="flex items-center gap-2">
              {recognitionAvailable && (
                <button
                  type="button"
                  onClick={() => {
                    handledVoiceTranscriptRef.current = null;
                    if (micStatus === 'listening') {
                      stopListening();
                    } else {
                      stopAudio();
                      startListening();
                    }
                  }}
                  disabled={micStatus === 'transcribing' || isSending}
                  className={`inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    micStatus === 'listening'
                      ? 'border-2 border-red-700 bg-red-50 text-red-950'
                      : 'border-slate-400 bg-white text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {micStatus === 'transcribing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>{t.voice.transcribingState}</span>
                    </>
                  ) : micStatus === 'listening' ? (
                    <>
                      <Square className="w-4 h-4 text-red-800" aria-hidden="true" />
                      <span>{t.voice.stopMic}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" aria-hidden="true" />
                      <span>{t.voiceAssistant.speakButton}</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--gw-primary)',
                  color: 'var(--gw-primary-text)',
                }}
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>{t.voiceAssistant.sendButton}</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-600">{t.voice.noAudioStoredNote}</p>
        </form>
      </div>
    </div>
  );
};
