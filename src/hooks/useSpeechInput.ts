import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeechLanguageOption, SupportedLanguage } from '../types/gateway';
import {
  detectLanguageFromText,
  detectSpeechCapabilities,
  fetchServerSpeechCapabilities,
  getSpeechLangTag,
  getSpeechRecognitionConstructor,
  isBrowserSpeechRecognitionSupported,
  isMediaRecorderSupported,
  MicrophonePermissionState,
  queryMicrophonePermission,
  SpeechRecognitionInstanceLike,
  transcribeAudioOnServer,
} from '../services/speech/speechService';

export type VoiceInputStatus =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'reviewing'
  | 'unsupported'
  | 'permission_denied'
  | 'error';

export function useSpeechInput(
  language: SpeechLanguageOption,
  onLanguageDetected?: (detected: SupportedLanguage) => void
) {
  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState<SupportedLanguage | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);
  const [browserSttAvailable, setBrowserSttAvailable] = useState(false);
  const [usingServerStt, setUsingServerStt] = useState(false);
  const [micPermission, setMicPermission] = useState<MicrophonePermissionState>('unknown');
  const [languageNotSupportedInBrowser, setLanguageNotSupportedInBrowser] = useState(false);
  const [canFallbackToBrowserEnglish, setCanFallbackToBrowserEnglish] = useState(false);

  const statusRef = useRef<VoiceInputStatus>('idle');
  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const latestTranscriptRef = useRef('');
  const manualStopRef = useRef(false);
  const micPermissionRef = useRef<MicrophonePermissionState>('unknown');
  const audioContextRef = useRef<AudioContext | null>(null);
  const monitorIntervalRef = useRef<number | null>(null);
  const recognitionSilenceTimerRef = useRef<number | null>(null);
  const recognitionStartWatchdogRef = useRef<number | null>(null);
  const activeSessionIdRef = useRef(0);
  const browserSttFailedRef = useRef(false);

  const effectiveLang: SupportedLanguage = language === 'auto' ? 'en' : language;

  const setStatusSafe = useCallback((next: VoiceInputStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  useEffect(() => {
    let active = true;
    let permStatusObj: PermissionStatus | null = null;
    let onChangeHandler: (() => void) | null = null;

    void queryMicrophonePermission().then(({ state, statusObj }) => {
      if (!active) return;
      micPermissionRef.current = state;
      setMicPermission(state);
      if (statusObj) {
        permStatusObj = statusObj;
        onChangeHandler = () => {
          if (!active) return;
          const nextState: MicrophonePermissionState =
            statusObj.state === 'granted' ||
            statusObj.state === 'denied' ||
            statusObj.state === 'prompt'
              ? statusObj.state
              : 'unknown';
          micPermissionRef.current = nextState;
          setMicPermission(nextState);
          if (nextState === 'granted') {
            if (statusRef.current === 'permission_denied') {
              setStatusSafe('idle');
            }
            setErrorDetail(null);
          }
        };
        statusObj.addEventListener?.('change', onChangeHandler);
      }
    });

    return () => {
      active = false;
      if (permStatusObj && onChangeHandler) {
        permStatusObj.removeEventListener?.('change', onChangeHandler);
      }
    };
  }, [setStatusSafe]);

  useEffect(() => {
    let active = true;
    const syncCaps = () => {
      if (!active) return;
      const caps = detectSpeechCapabilities(effectiveLang);
      const serverReady = caps.serverSttAvailable;
      const browserReady = isBrowserSpeechRecognitionSupported();
      setUsingServerStt(serverReady);
      setBrowserSttAvailable(browserReady);
      setLanguageNotSupportedInBrowser(!serverReady && browserReady && language === 'om');
      const available = serverReady || (browserReady && language !== 'om');
      setRecognitionAvailable(available);
      if (!available) {
        setStatusSafe('unsupported');
      } else if (statusRef.current === 'unsupported') {
        setStatusSafe('idle');
      }
    };

    syncCaps();
    void fetchServerSpeechCapabilities().then(syncCaps);
    return () => {
      active = false;
    };
  }, [language, effectiveLang, setStatusSafe]);

  const clearAudioMonitor = useCallback(() => {
    if (monitorIntervalRef.current !== null) {
      window.clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        void audioContextRef.current.close();
      } catch {
        // Ignore AudioContext cleanup errors
      }
      audioContextRef.current = null;
    }
  }, []);

  const stopMediaTracks = useCallback(() => {
    clearAudioMonitor();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, [clearAudioMonitor]);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    if (recognitionSilenceTimerRef.current !== null) {
      window.clearTimeout(recognitionSilenceTimerRef.current);
      recognitionSilenceTimerRef.current = null;
    }
    if (recognitionStartWatchdogRef.current !== null) {
      window.clearTimeout(recognitionStartWatchdogRef.current);
      recognitionStartWatchdogRef.current = null;
    }
    clearAudioMonitor();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors if already ended
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (
          mediaRecorderRef.current.state === 'recording' &&
          typeof mediaRecorderRef.current.requestData === 'function'
        ) {
          mediaRecorderRef.current.requestData();
        }
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
  }, [clearAudioMonitor]);

  // Automatically stop listening and release microphone on unmount
  useEffect(() => {
    return () => {
      activeSessionIdRef.current += 1;
      stopListening();
      stopMediaTracks();
    };
  }, [stopListening, stopMediaTracks]);

  const startServerRecording = useCallback(
    async (sessionId: number) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (activeSessionIdRef.current !== sessionId) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        micPermissionRef.current = 'granted';
        setMicPermission('granted');
        mediaStreamRef.current = stream;

        const sessionChunks: Blob[] = [];
        const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

        const recorder = preferredMime
          ? new MediaRecorder(stream, { mimeType: preferredMime })
          : new MediaRecorder(stream);

        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            sessionChunks.push(ev.data);
          }
        };

        recorder.onstop = async () => {
          if (mediaRecorderRef.current === recorder) {
            mediaRecorderRef.current = null;
          }
          stopMediaTracks();
          if (activeSessionIdRef.current !== sessionId) {
            return;
          }

          const blob = new Blob(sessionChunks, {
            type: recorder.mimeType || 'audio/webm',
          });

          if (blob.size < 128) {
            setStatusSafe('error');
            setCanFallbackToBrowserEnglish(isBrowserSpeechRecognitionSupported());
            setErrorDetail(
              'No speech was heard. Tap Start microphone to try again or type your answer.'
            );
            return;
          }

          setStatusSafe('transcribing');
          try {
            const result = await transcribeAudioOnServer(blob, language);
            if (activeSessionIdRef.current !== sessionId) {
              return;
            }
            latestTranscriptRef.current = result.transcript;
            setTranscript(result.transcript);
            setDetectedLanguage(result.detectedLanguage);
            if (result.transcript.trim()) {
              onLanguageDetected?.(result.detectedLanguage);
              setCanFallbackToBrowserEnglish(false);
              setStatusSafe('reviewing');
            } else {
              setStatusSafe('error');
              setCanFallbackToBrowserEnglish(isBrowserSpeechRecognitionSupported());
              setErrorDetail(
                'No speech was heard. Tap Start microphone to try again or type your answer.'
              );
            }
          } catch (err) {
            if (activeSessionIdRef.current !== sessionId) {
              return;
            }
            setStatusSafe('error');
            setCanFallbackToBrowserEnglish(isBrowserSpeechRecognitionSupported());
            setErrorDetail(
              err instanceof Error
                ? err.message
                : 'Could not transcribe audio. Please try again or type your answer.'
            );
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start(250);
        setStatusSafe('listening');

        // Auto-stop shortly after sustained speech ends, with a warm-up grace window so clicks do not trigger false stops
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          try {
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') {
              void ctx.resume().catch(() => {});
            }
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            source.connect(analyser);
            audioContextRef.current = ctx;

            const samples = new Uint8Array(analyser.fftSize);
            const startedAt = Date.now();
            let heardSpeech = false;
            let speechFrames = 0;
            let silentSinceMs: number | null = null;

            monitorIntervalRef.current = window.setInterval(() => {
              if (
                activeSessionIdRef.current !== sessionId ||
                mediaRecorderRef.current !== recorder ||
                recorder.state !== 'recording'
              ) {
                clearAudioMonitor();
                return;
              }
              const now = Date.now();
              if (now - startedAt < 900) {
                return;
              }
              analyser.getByteTimeDomainData(samples);
              let sumSquares = 0;
              for (let i = 0; i < samples.length; i += 1) {
                const norm = (samples[i] - 128) / 128;
                sumSquares += norm * norm;
              }
              const rms = Math.sqrt(sumSquares / samples.length);

              if (rms > 0.022) {
                speechFrames += 1;
                if (speechFrames >= 3) {
                  heardSpeech = true;
                }
                silentSinceMs = null;
              } else if (heardSpeech && rms < 0.015) {
                if (silentSinceMs === null) {
                  silentSinceMs = now;
                } else if (now - silentSinceMs >= 2200) {
                  stopListening();
                }
              }
            }, 100);
          } catch {
            // AudioContext optional; manual Stop microphone always remains available
          }
        }
      } catch (err) {
        stopMediaTracks();
        if (activeSessionIdRef.current !== sessionId) {
          return;
        }
        const name = (err as Error)?.name || '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          micPermissionRef.current = 'denied';
          setMicPermission('denied');
          setStatusSafe('permission_denied');
          setErrorDetail('Microphone permission was denied.');
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setStatusSafe('error');
          setErrorDetail(
            'No microphone was detected on this device. Connect a microphone or type your answer.'
          );
        } else {
          setStatusSafe('error');
          setErrorDetail('Could not access microphone on this device. Please type your answer.');
        }
      }
    },
    [clearAudioMonitor, language, onLanguageDetected, setStatusSafe, stopListening, stopMediaTracks]
  );

  const startBrowserRecognition = useCallback(
    (sessionId: number, overrideLang?: SupportedLanguage) => {
      const targetLang = overrideLang || effectiveLang;
      const Ctor = getSpeechRecognitionConstructor();
      if (!Ctor) {
        setStatusSafe('unsupported');
        return;
      }
      if (!overrideLang && language === 'om') {
        setLanguageNotSupportedInBrowser(true);
        setStatusSafe('unsupported');
        setErrorDetail(
          'Browser speech recognition does not support Afaan Oromo without the server speech service. You can speak in English or type your answer below.'
        );
        return;
      }

      try {
        const recognition = new Ctor();
        recognition.lang = getSpeechLangTag(targetLang);
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.maxAlternatives = 1;

        let latestDetected: SupportedLanguage | null = null;
        let started = false;

        recognition.onstart = () => {
          if (recognitionStartWatchdogRef.current !== null) {
            window.clearTimeout(recognitionStartWatchdogRef.current);
            recognitionStartWatchdogRef.current = null;
          }
          if (activeSessionIdRef.current !== sessionId) return;
          started = true;
          setStatusSafe('listening');
        };

        recognition.onresult = (event) => {
          if (recognitionStartWatchdogRef.current !== null) {
            window.clearTimeout(recognitionStartWatchdogRef.current);
            recognitionStartWatchdogRef.current = null;
          }
          if (activeSessionIdRef.current !== sessionId) return;
          started = true;
          const parts: string[] = [];
          for (let i = 0; i < event.results.length; i += 1) {
            const part = event.results[i]?.[0]?.transcript;
            if (part) {
              parts.push(part);
            }
          }
          const cleaned = parts.join(' ').replace(/\s+/g, ' ').trim();
          latestTranscriptRef.current = cleaned;
          setTranscript(cleaned);
          if (cleaned) {
            const det = detectLanguageFromText(cleaned, targetLang);
            latestDetected = det;
            setDetectedLanguage(det);

            // Auto-finalize shortly after speech pauses so users do not need to click Stop
            if (recognitionSilenceTimerRef.current !== null) {
              window.clearTimeout(recognitionSilenceTimerRef.current);
            }
            recognitionSilenceTimerRef.current = window.setTimeout(() => {
              if (
                activeSessionIdRef.current === sessionId &&
                recognitionRef.current === recognition
              ) {
                try {
                  recognition.stop();
                } catch {
                  // Ignore stop errors
                }
              }
            }, 2200);
          }
        };

        recognition.onerror = (ev) => {
          if (recognitionStartWatchdogRef.current !== null) {
            window.clearTimeout(recognitionStartWatchdogRef.current);
            recognitionStartWatchdogRef.current = null;
          }
          if (activeSessionIdRef.current !== sessionId) return;
          if (recognitionSilenceTimerRef.current !== null) {
            window.clearTimeout(recognitionSilenceTimerRef.current);
            recognitionSilenceTimerRef.current = null;
          }
          if (recognitionRef.current === recognition) {
            recognitionRef.current = null;
          }

          // If browser Web Speech service is unavailable in this environment (e.g. Chromium without Speech keys),
          // seamlessly hand over to MediaRecorder + server STT when available.
          if (
            (ev.error === 'network' ||
              ev.error === 'service-not-allowed' ||
              (ev.error === 'language-not-supported' && targetLang !== 'en')) &&
            usingServerStt &&
            isMediaRecorderSupported() &&
            !overrideLang
          ) {
            browserSttFailedRef.current = true;
            void startServerRecording(sessionId);
            return;
          }

          if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
            micPermissionRef.current = 'denied';
            setMicPermission('denied');
            setStatusSafe('permission_denied');
            setErrorDetail('Microphone permission was denied.');
          } else if (ev.error === 'language-not-supported') {
            setLanguageNotSupportedInBrowser(targetLang !== 'en');
            setStatusSafe(targetLang === 'en' ? 'unsupported' : 'error');
            setErrorDetail(
              `Speech recognition for ${getSpeechLangTag(targetLang)} is not supported on this browser. You can speak in English or type your answer.`
            );
          } else if (ev.error === 'audio-capture') {
            setStatusSafe('error');
            setErrorDetail(
              'No microphone was detected on this device. Connect a microphone or type your answer.'
            );
          } else if (ev.error === 'network') {
            setStatusSafe('error');
            setErrorDetail(
              'Speech recognition could not reach the browser speech service. Check your connection or type your answer.'
            );
          } else if (ev.error === 'no-speech') {
            if (latestTranscriptRef.current.trim().length > 0) {
              setStatusSafe('reviewing');
            } else {
              setStatusSafe('error');
              setErrorDetail(
                'No speech was heard. Tap Start microphone to try again or type your answer.'
              );
            }
          } else if (ev.error === 'aborted' && manualStopRef.current) {
            if (statusRef.current === 'listening') {
              setStatusSafe(latestTranscriptRef.current.trim() ? 'reviewing' : 'idle');
            }
          } else {
            setStatusSafe('error');
            setErrorDetail(
              `Voice input stopped (${ev.error}). You can try again or type your answer.`
            );
          }
        };

        recognition.onend = () => {
          if (recognitionStartWatchdogRef.current !== null) {
            window.clearTimeout(recognitionStartWatchdogRef.current);
            recognitionStartWatchdogRef.current = null;
          }
          if (activeSessionIdRef.current !== sessionId) return;
          if (recognitionSilenceTimerRef.current !== null) {
            window.clearTimeout(recognitionSilenceTimerRef.current);
            recognitionSilenceTimerRef.current = null;
          }
          if (recognitionRef.current === recognition) {
            recognitionRef.current = null;
          }
          const captured = latestTranscriptRef.current.trim();
          if (captured && latestDetected) {
            onLanguageDetected?.(latestDetected);
          }
          if (statusRef.current === 'listening') {
            if (captured.length > 0) {
              setStatusSafe('reviewing');
            } else {
              setErrorDetail(
                'No speech was heard. Tap Start microphone to try again or type your answer.'
              );
              setStatusSafe('error');
            }
          } else if (
            !started &&
            !manualStopRef.current &&
            usingServerStt &&
            isMediaRecorderSupported() &&
            !overrideLang
          ) {
            browserSttFailedRef.current = true;
            void startServerRecording(sessionId);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();

        // Watchdog: if mic permission is already granted (or in headless Chromium) and SpeechRecognition
        // silently hangs without firing onstart, hand over smoothly to MediaRecorder + server STT.
        if (usingServerStt && isMediaRecorderSupported() && !overrideLang) {
          const timeoutMs = micPermissionRef.current === 'granted' ? 800 : 6000;
          recognitionStartWatchdogRef.current = window.setTimeout(() => {
            recognitionStartWatchdogRef.current = null;
            if (
              activeSessionIdRef.current === sessionId &&
              recognitionRef.current === recognition &&
              !started
            ) {
              browserSttFailedRef.current = true;
              try {
                recognition.abort();
              } catch {
                // Ignore abort errors
              }
              recognitionRef.current = null;
              void startServerRecording(sessionId);
            }
          }, timeoutMs);
        }
      } catch {
        if (activeSessionIdRef.current !== sessionId) return;
        setStatusSafe('error');
        setErrorDetail('Could not start the microphone on this browser. Please type your answer.');
      }
    },
    [effectiveLang, language, onLanguageDetected, setStatusSafe, startServerRecording, usingServerStt]
  );

  const startListening = useCallback(
    (overrideLang?: SupportedLanguage) => {
      activeSessionIdRef.current += 1;
      const sessionId = activeSessionIdRef.current;

      stopListening();
      manualStopRef.current = false;
      latestTranscriptRef.current = '';
      setErrorDetail(null);
      setCanFallbackToBrowserEnglish(false);
      setTranscript('');
      setDetectedLanguage(null);

      // Explicit language override always runs browser recognition
      if (overrideLang) {
        startBrowserRecognition(sessionId, overrideLang);
        return;
      }

      // For English and Amharic in browsers with native Web Speech API, start live streaming recognition first
      // (zero latency, no server quota dependency) and auto-fallback to server STT if browser speech is unavailable.
      if (
        browserSttAvailable &&
        !browserSttFailedRef.current &&
        (language === 'en' || language === 'am')
      ) {
        startBrowserRecognition(sessionId);
        return;
      }

      if (usingServerStt && isMediaRecorderSupported()) {
        void startServerRecording(sessionId);
      } else {
        startBrowserRecognition(sessionId);
      }
    },
    [browserSttAvailable, language, startBrowserRecognition, startServerRecording, stopListening, usingServerStt]
  );

  const discardTranscript = useCallback(() => {
    activeSessionIdRef.current += 1;
    stopListening();
    stopMediaTracks();
    latestTranscriptRef.current = '';
    setTranscript('');
    setDetectedLanguage(null);
    setErrorDetail(null);
    setCanFallbackToBrowserEnglish(false);
    setStatusSafe(recognitionAvailable ? 'idle' : 'unsupported');
  }, [recognitionAvailable, setStatusSafe, stopListening, stopMediaTracks]);

  return {
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
    usingServerStt,
    startListening,
    stopListening,
    discardTranscript,
  };
}
