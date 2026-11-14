import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeechLanguageOption, SupportedLanguage } from '../types/gateway';
import {
  detectLanguageFromText,
  detectSpeechCapabilities,
  fetchServerSpeechCapabilities,
  getSpeechLangTag,
  getSpeechRecognitionConstructor,
  isMediaRecorderSupported,
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
  const [usingServerStt, setUsingServerStt] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const effectiveLang: SupportedLanguage = language === 'auto' ? 'en' : language;

  useEffect(() => {
    let active = true;
    const syncCaps = () => {
      if (!active) return;
      const caps = detectSpeechCapabilities(effectiveLang);
      const serverReady = caps.serverSttAvailable;
      setUsingServerStt(serverReady);
      // In auto-detect mode, browser SpeechRecognition can only be used if server STT is unavailable and browser supports STT
      const available =
        serverReady || (Boolean(getSpeechRecognitionConstructor()) && language !== 'om');
      setRecognitionAvailable(available);
      if (!available) {
        setStatus('unsupported');
      } else if (status === 'unsupported') {
        setStatus('idle');
      }
    };

    syncCaps();
    void fetchServerSpeechCapabilities().then(syncCaps);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, effectiveLang]);

  const stopMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors if already ended
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
  }, []);

  // Automatically stop listening and release microphone on unmount / step change
  useEffect(() => {
    return () => {
      stopListening();
      stopMediaTracks();
    };
  }, [stopListening, stopMediaTracks]);

  const startServerRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        stopMediaTracks();
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;

        if (blob.size < 256) {
          setStatus('error');
          setErrorDetail('No speech was captured. Please try speaking closer to the microphone.');
          return;
        }

        setStatus('transcribing');
        try {
          const result = await transcribeAudioOnServer(blob, language);
          setTranscript(result.transcript);
          setDetectedLanguage(result.detectedLanguage);
          onLanguageDetected?.(result.detectedLanguage);
          setStatus(result.transcript ? 'reviewing' : 'error');
          if (!result.transcript) {
            setErrorDetail('No speech was heard. Please try again or type your answer.');
          }
        } catch (err) {
          setStatus('error');
          setErrorDetail(
            err instanceof Error
              ? err.message
              : 'Could not transcribe audio. Please try again or type your answer.'
          );
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus('listening');
    } catch (err) {
      stopMediaTracks();
      const name = (err as Error)?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setStatus('permission_denied');
        setErrorDetail('Microphone permission was denied.');
      } else {
        setStatus('error');
        setErrorDetail('Could not access microphone on this device. Please type your answer.');
      }
    }
  }, [language, onLanguageDetected, stopMediaTracks]);

  const startBrowserRecognition = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      setStatus('unsupported');
      return;
    }
    if (language === 'om') {
      setStatus('unsupported');
      setErrorDetail(
        'Browser speech recognition does not support Afaan Oromo without the server speech service. Please type your answer below.'
      );
      return;
    }

    try {
      const recognition = new Ctor();
      recognition.lang = getSpeechLangTag(effectiveLang);
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      let latestDetected: SupportedLanguage | null = null;

      recognition.onstart = () => {
        setStatus('listening');
      };

      recognition.onresult = (event) => {
        let combined = '';
        for (let i = 0; i < event.results.length; i += 1) {
          combined += event.results[i][0].transcript;
        }
        const cleaned = combined.trim();
        setTranscript(cleaned);
        if (cleaned) {
          const det = detectLanguageFromText(cleaned, effectiveLang);
          latestDetected = det;
          setDetectedLanguage(det);
        }
      };

      recognition.onerror = (ev) => {
        recognitionRef.current = null;
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
          setStatus('permission_denied');
          setErrorDetail('Microphone permission was denied.');
        } else if (ev.error === 'language-not-supported') {
          setStatus('unsupported');
          setErrorDetail(
            `Speech recognition for ${getSpeechLangTag(effectiveLang)} is not supported on this device.`
          );
        } else if (ev.error === 'no-speech') {
          setStatus('error');
          setErrorDetail(
            'No speech was heard. Try speaking closer to the microphone or type your answer.'
          );
        } else {
          setStatus('error');
          setErrorDetail(`Voice input stopped (${ev.error}). You can try again or type your answer.`);
        }
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        if (latestDetected) {
          onLanguageDetected?.(latestDetected);
        }
        setStatus((prev) => {
          if (prev === 'listening') {
            return 'reviewing';
          }
          return prev;
        });
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setStatus('error');
      setErrorDetail('Could not start the microphone on this browser. Please type your answer.');
    }
  }, [effectiveLang, language, onLanguageDetected]);

  const startListening = useCallback(() => {
    stopListening();
    setErrorDetail(null);
    setTranscript('');
    setDetectedLanguage(null);

    if (usingServerStt && isMediaRecorderSupported()) {
      void startServerRecording();
    } else {
      startBrowserRecognition();
    }
  }, [startBrowserRecognition, startServerRecording, stopListening, usingServerStt]);

  const discardTranscript = useCallback(() => {
    stopListening();
    stopMediaTracks();
    setTranscript('');
    setDetectedLanguage(null);
    setErrorDetail(null);
    setStatus(recognitionAvailable ? 'idle' : 'unsupported');
  }, [recognitionAvailable, stopListening, stopMediaTracks]);

  return {
    status,
    transcript,
    setTranscript,
    detectedLanguage,
    errorDetail,
    recognitionAvailable,
    usingServerStt,
    startListening,
    stopListening,
    discardTranscript,
  };
}
