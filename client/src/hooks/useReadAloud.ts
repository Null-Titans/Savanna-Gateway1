import { useCallback, useEffect, useState } from 'react';
import { SupportedLanguage } from '../types/gateway';
import {
  detectSpeechCapabilities,
  fetchServerSpeechCapabilities,
  speakText,
  stopAllSpeechPlayback,
} from '../services/speech/speechService';

export function useReadAloud(language: SupportedLanguage) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [synthesisSupported, setSynthesisSupported] = useState(false);
  const [hasAuthenticVoice, setHasAuthenticVoice] = useState(false);
  const [usingNeuralVoice, setUsingNeuralVoice] = useState(false);
  const [voiceStatusNote, setVoiceStatusNote] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (!active) return;
      const caps = detectSpeechCapabilities(language);
      setSynthesisSupported(caps.serverTtsAvailable || caps.synthesisSupported);
      setHasAuthenticVoice(caps.hasAnyAuthenticVoice);
      setUsingNeuralVoice(caps.serverTtsAvailable);
    };

    refresh();
    void fetchServerSpeechCapabilities().then(() => {
      refresh();
    });

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = refresh;
    }

    return () => {
      active = false;
      stopAllSpeechPlayback();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [language]);

  const stop = useCallback(() => {
    stopAllSpeechPlayback();
    setIsLoadingAudio(false);
    setIsSpeaking(false);
  }, []);

  const read = useCallback(
    async (text: string, overrideLanguage?: SupportedLanguage) => {
      if (isSpeaking || isLoadingAudio) {
        stop();
        return;
      }
      setVoiceStatusNote(null);
      const targetLang = overrideLanguage || language;

      await speakText(
        text,
        targetLang,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        (reason) => {
          setIsSpeaking(false);
          setIsLoadingAudio(false);
          setVoiceStatusNote(reason);
        },
        (loading) => setIsLoadingAudio(loading)
      );
    },
    [isLoadingAudio, isSpeaking, language, stop]
  );

  return {
    isSpeaking,
    isLoadingAudio,
    synthesisSupported,
    hasAuthenticVoice,
    usingNeuralVoice,
    voiceStatusNote,
    read,
    stop,
  };
}
