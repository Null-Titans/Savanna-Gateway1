import { SpeechLanguageOption, SupportedLanguage } from '../../types/gateway';
import { LANGUAGE_REGISTRY } from '../../i18n/types';

export interface ServerSpeechCapabilities {
  geminiConfigured: boolean;
  supportedLanguages: SupportedLanguage[];
  checked: boolean;
}

export interface SpeechCapabilities {
  recognitionSupported: boolean;
  serverSttAvailable: boolean;
  serverTtsAvailable: boolean;
  synthesisSupported: boolean;
  hasNativeBrowserVoice: boolean;
  hasAnyAuthenticVoice: boolean;
  matchedVoiceName: string | null;
  speechLangTag: string;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

export interface SpeechRecognitionInstanceLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstanceLike;

const ETHIOPIC_REGEX = /[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF]/;
const OROMO_LEXICAL_REGEX =
  /\b(akkam|nagaa|maaloo|galatoomi|galatoomaa|eeyyee|lakkii|maqaa|gargaarsa|deeggarsa|hojiin|hojii|hojjetaa|barataa|barnoota|galmee|keessan|keessa|irraa|argachuu|barbaada|barbaadu|afaan|oromoo|oromiffa|oromiffaa|ani|ati|nuti|isaan|maal|maaliif|eessa|yoom|akkamitti|fayyaa|mijataa|gaaffii|deebii|barbaachisa|bilbila|waraqaa|eenyummaa|dhaabbata|michuu|iccitii|itti|fufi|duubatti|sirreessi|maxxansi|hayyama|dubbisi|dubbachuu|sagalee|qajeelfama|ergaa|fudhadhu|dhaabi)\b/i;

let cachedServerCaps: ServerSpeechCapabilities = {
  geminiConfigured: false,
  supportedLanguages: ['en', 'am', 'om'],
  checked: false,
};

let activeAudioElement: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;
let activeAbortController: AbortController | null = null;

export function resetCachedSpeechCapabilitiesForTest(): void {
  cachedServerCaps = {
    geminiConfigured: false,
    supportedLanguages: ['en', 'am', 'om'],
    checked: false,
  };
}

export async function fetchServerSpeechCapabilities(): Promise<ServerSpeechCapabilities> {
  if (cachedServerCaps.checked) {
    return cachedServerCaps;
  }
  if (typeof fetch === 'undefined' || typeof window === 'undefined') {
    return cachedServerCaps;
  }
  try {
    const res = await fetch('/api/speech/capabilities');
    if (res.ok) {
      const data = (await res.json()) as {
        geminiConfigured?: boolean;
        supportedLanguages?: SupportedLanguage[];
      };
      cachedServerCaps = {
        geminiConfigured: Boolean(data.geminiConfigured),
        supportedLanguages: data.supportedLanguages || ['en', 'am', 'om'],
        checked: true,
      };
      return cachedServerCaps;
    }
  } catch {
    // Offline or unit test environment without Express server
  }
  return cachedServerCaps;
}

export function getSpeechLangTag(language: SupportedLanguage): string {
  const found = LANGUAGE_REGISTRY.find((l) => l.code === language);
  return found ? found.speechLangTag : 'en-US';
}

export function detectLanguageFromText(text: string, fallback: SupportedLanguage = 'en'): SupportedLanguage {
  const trimmed = text.trim();
  if (!trimmed) return fallback;
  if (ETHIOPIC_REGEX.test(trimmed)) return 'am';
  if (OROMO_LEXICAL_REGEX.test(trimmed)) return 'om';
  return fallback;
}

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isBrowserSpeechRecognitionSupported(): boolean {
  return Boolean(getSpeechRecognitionConstructor());
}

export type MicrophonePermissionState = 'prompt' | 'granted' | 'denied' | 'unknown';

export async function queryMicrophonePermission(): Promise<{
  state: MicrophonePermissionState;
  statusObj: PermissionStatus | null;
}> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.permissions ||
    typeof navigator.permissions.query !== 'function'
  ) {
    return { state: 'unknown', statusObj: null };
  }
  try {
    const statusObj = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    });
    const state: MicrophonePermissionState =
      statusObj.state === 'granted' || statusObj.state === 'denied' || statusObj.state === 'prompt'
        ? statusObj.state
        : 'unknown';
    return { state, statusObj };
  } catch {
    return { state: 'unknown', statusObj: null };
  }
}

export function isMediaRecorderSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  );
}

/**
 * Strictly matches an authentic native browser voice for the exact requested language.
 * NEVER returns an English voice for Amharic or Afaan Oromo.
 */
export function findNativeBrowserVoice(language: SupportedLanguage): SpeechSynthesisVoice | null {
  if (
    typeof window === 'undefined' ||
    !window.speechSynthesis ||
    typeof window.speechSynthesis.getVoices !== 'function'
  ) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  const langTag = getSpeechLangTag(language).toLowerCase();
  const shortCode = language.toLowerCase();

  return (
    voices.find((v) => {
      const vl = v.lang.toLowerCase().replace('_', '-');
      return vl === langTag || vl.startsWith(`${shortCode}-`) || vl === shortCode;
    }) || null
  );
}

export function detectSpeechCapabilities(language: SupportedLanguage): SpeechCapabilities {
  const speechLangTag = getSpeechLangTag(language);
  const browserSttSupported = Boolean(getSpeechRecognitionConstructor());
  const serverSttAvailable = cachedServerCaps.geminiConfigured && isMediaRecorderSupported();
  const serverTtsAvailable = cachedServerCaps.geminiConfigured;

  const synthesisSupported =
    typeof window !== 'undefined' &&
    Boolean(window.speechSynthesis) &&
    typeof window.SpeechSynthesisUtterance !== 'undefined';

  const matchedVoice = synthesisSupported ? findNativeBrowserVoice(language) : null;
  const hasNativeBrowserVoice = Boolean(matchedVoice);

  // Browser Web Speech API generally cannot recognize Afaan Oromo (om-ET); require server STT for om
  const recognitionSupported =
    serverSttAvailable || (browserSttSupported && language !== 'om');

  const hasAnyAuthenticVoice = serverTtsAvailable || hasNativeBrowserVoice;

  return {
    recognitionSupported,
    serverSttAvailable,
    serverTtsAvailable,
    synthesisSupported,
    hasNativeBrowserVoice,
    hasAnyAuthenticVoice,
    matchedVoiceName: matchedVoice ? matchedVoice.name : null,
    speechLangTag,
  };
}

export function stopAllSpeechPlayback(): void {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      // Ignore audio cleanup errors
    }
    activeAudioElement = null;
  }
  if (activeAudioUrl && typeof URL !== 'undefined') {
    URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function splitBrowserSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?።])\s+/)
    .filter((s) => s.trim().length > 0);
}

function speakWithStrictNativeBrowserVoice(
  text: string,
  language: SupportedLanguage,
  voice: SpeechSynthesisVoice,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (reason: string) => void
): () => void {
  if (
    typeof window === 'undefined' ||
    !window.speechSynthesis ||
    typeof window.SpeechSynthesisUtterance === 'undefined'
  ) {
    onError?.('Speech synthesis is not supported in this browser.');
    return () => {};
  }

  window.speechSynthesis.cancel();
  const sentences = splitBrowserSentences(text);
  if (sentences.length === 0) {
    onEnd?.();
    return () => {};
  }

  let cancelled = false;
  let currentIndex = 0;

  const speakNext = () => {
    if (cancelled || currentIndex >= sentences.length) {
      if (!cancelled) onEnd?.();
      return;
    }
    const utterance = new window.SpeechSynthesisUtterance(sentences[currentIndex]);
    utterance.voice = voice;
    utterance.lang = voice.lang || getSpeechLangTag(language);
    utterance.rate = 0.95;

    if (currentIndex === 0) {
      utterance.onstart = () => onStart?.();
    }
    utterance.onend = () => {
      currentIndex += 1;
      speakNext();
    };
    utterance.onerror = (ev) => {
      if (!cancelled) {
        onError?.(ev.error || 'Read-aloud stopped.');
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  speakNext();

  return () => {
    cancelled = true;
    window.speechSynthesis.cancel();
    onEnd?.();
  };
}

function base64ToWavBlob(base64: string, mimeType = 'audio/wav'): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export async function speakText(
  text: string,
  language: SupportedLanguage,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (reason: string) => void,
  onLoading?: (loading: boolean) => void
): Promise<() => void> {
  stopAllSpeechPlayback();

  const resolvedLanguage = detectLanguageFromText(text, language);
  const serverCaps = await fetchServerSpeechCapabilities();

  let serverErrorReason: string | null = null;

  if (serverCaps.geminiConfigured && typeof fetch !== 'undefined') {
    const controller = new AbortController();
    activeAbortController = controller;
    onLoading?.(true);

    try {
      const response = await fetch('/api/speech/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: resolvedLanguage }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        onLoading?.(false);
        return () => stopAllSpeechPlayback();
      }

      if (response.ok) {
        const data = (await response.json()) as {
          audioBase64?: string;
          mimeType?: string;
        };
        if (data.audioBase64) {
          const blob = base64ToWavBlob(data.audioBase64, data.mimeType || 'audio/wav');
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          activeAudioElement = audio;
          activeAudioUrl = url;

          audio.onplay = () => {
            onLoading?.(false);
            onStart?.();
          };
          audio.onended = () => {
            stopAllSpeechPlayback();
            onEnd?.();
          };
          audio.onerror = () => {
            stopAllSpeechPlayback();
            onLoading?.(false);
            onError?.('Audio playback failed in this browser.');
          };

          try {
            await audio.play();
            return () => stopAllSpeechPlayback();
          } catch (playErr) {
            stopAllSpeechPlayback();
            onLoading?.(false);
            const errName = (playErr as Error)?.name || '';
            onError?.(
              errName === 'NotAllowedError'
                ? 'Browser blocked automatic audio playback. Select Read aloud / Speak again to play.'
                : 'Audio playback failed in this browser.'
            );
            return () => stopAllSpeechPlayback();
          }
        }
      } else {
        const errBody = (await response.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
        };
        if (errBody.code === 'TTS_QUOTA' && errBody.error) {
          serverErrorReason = errBody.error;
        }
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        onLoading?.(false);
        return () => stopAllSpeechPlayback();
      }
      // Fall through to strict native browser check below
    } finally {
      onLoading?.(false);
      activeAbortController = null;
    }
  }

  // Fallback ONLY if an exact matching native browser voice exists for this language.
  // NEVER pronounce Amharic or Afaan Oromo with an English voice!
  const nativeVoice = findNativeBrowserVoice(resolvedLanguage);
  if (!nativeVoice) {
    const langLabel =
      LANGUAGE_REGISTRY.find((l) => l.code === resolvedLanguage)?.nativeName || resolvedLanguage;
    onError?.(
      serverErrorReason ||
        `No authentic ${langLabel} voice is available on this device without the neural speech service. Text remains readable on screen rather than using an incorrect English voice.`
    );
    return () => {};
  }

  return speakWithStrictNativeBrowserVoice(
    text,
    resolvedLanguage,
    nativeVoice,
    onStart,
    onEnd,
    onError
  );
}

export async function transcribeAudioOnServer(
  audioBlob: Blob,
  targetLanguage: SpeechLanguageOption = 'auto'
): Promise<{ transcript: string; detectedLanguage: SupportedLanguage }> {
  const arrayBuf = await audioBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const audioBase64 = btoa(binary);

  const response = await fetch('/api/speech/stt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64,
      mimeType: audioBlob.type || 'audio/webm',
      targetLanguage,
    }),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
    const error = new Error(err.error || 'Could not transcribe speech.') as Error & { code?: string };
    error.code = err.code;
    throw error;
  }

  const data = (await response.json()) as {
    transcript: string;
    detectedLanguage: SupportedLanguage;
  };
  return {
    transcript: data.transcript || '',
    detectedLanguage: data.detectedLanguage || 'en',
  };
}
