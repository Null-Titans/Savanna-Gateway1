import express, { type Request, type Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

export type ThreeLang = 'en' | 'am' | 'om';

const SUPPORTED_LANGUAGES: ThreeLang[] = ['en', 'am', 'om'];

const ETHIOPIC_REGEX = /[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF]/;
const OROMO_LEXICAL_REGEX =
  /\b(akkam|nagaa|maaloo|galatoomi|galatoomaa|eeyyee|lakkii|maqaa|gargaarsa|deeggarsa|hojiin|hojii|hojjetaa|barataa|barnoota|galmee|keessan|keessa|irraa|argachuu|barbaada|barbaadu|afaan|oromoo|oromiffa|oromiffaa|ani|ati|nuti|isaan|maal|maaliif|eessa|yoom|akkamitti|fayyaa|mijataa|gaaffii|deebii|barbaachisa|bilbila|waraqaa|eenyummaa|dhaabbata|michuu|iccitii|itti|fufi|duubatti|sirreessi|maxxansi|hayyama|dubbisi|dubbachuu|sagalee|qajeelfama|ergaa|fudhadhu|dhaabi)\b/i;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function normalizeThreeLang(raw?: string | null): ThreeLang {
  const v = (raw || '').toLowerCase().trim();
  if (v === 'am' || v.startsWith('am-')) return 'am';
  if (v === 'om' || v.startsWith('om-')) return 'om';
  return 'en';
}

export function heuristicDetectLanguage(text: string): ThreeLang {
  const trimmed = text.trim();
  if (!trimmed) return 'en';
  if (ETHIOPIC_REGEX.test(trimmed)) return 'am';
  if (OROMO_LEXICAL_REGEX.test(trimmed)) return 'om';
  return 'en';
}

async function detectLanguageServer(ai: GoogleGenAI | null, text: string): Promise<ThreeLang> {
  const trimmed = text.trim();
  if (!trimmed) return 'en';
  if (ETHIOPIC_REGEX.test(trimmed)) return 'am';
  if (OROMO_LEXICAL_REGEX.test(trimmed)) return 'om';
  if (!ai) return 'en';

  try {
    const resp = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Classify the following text into strictly one of these three languages: "en" (English), "am" (Amharic), or "om" (Afaan Oromo / Oromiffa).\nText: """${trimmed.slice(0, 600)}"""`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            language: {
              type: Type.STRING,
              enum: ['en', 'am', 'om'],
            },
          },
          required: ['language'],
        },
      },
    });
    const parsed = JSON.parse((resp.text || '{}').trim()) as { language?: string };
    if (parsed.language && SUPPORTED_LANGUAGES.includes(parsed.language as ThreeLang)) {
      return parsed.language as ThreeLang;
    }
  } catch {
    // Fall back to heuristic on classification failure
  }
  return heuristicDetectLanguage(trimmed);
}

/**
 * Splits long text into sentence-aligned chunks so TTS never truncates or cuts off mid-sentence.
 */
export function splitIntoSpeechChunks(text: string, maxChars = 380): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];

  const rawSentences = normalized.split(/(?<=[.!?።])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of rawSentences) {
    if (!sentence.trim()) continue;
    if (sentence.length > maxChars) {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      // Split overly long clause on commas or spaces
      const words = sentence.split(' ');
      let part = '';
      for (const word of words) {
        if ((part + ' ' + word).trim().length > maxChars) {
          if (part) chunks.push(part.trim());
          part = word;
        } else {
          part = (part + ' ' + word).trim();
        }
      }
      if (part) chunks.push(part.trim());
    } else if ((current + ' ' + sentence).trim().length > maxChars) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current = (current + ' ' + sentence).trim();
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

/**
 * Concatenates multiple 24kHz mono 16-bit WAV clips cleanly by keeping the 44-byte RIFF header
 * from the first clip, stripping the 44-byte header from subsequent clips, and updating header sizes.
 */
function concatWavBuffers(wavClips: Buffer[]): Buffer {
  if (wavClips.length === 0) return Buffer.alloc(0);
  if (wavClips.length === 1) return wavClips[0];

  const header = Buffer.from(wavClips[0].subarray(0, 44));
  const pcmParts = wavClips.map((buf) => (buf.length > 44 ? buf.subarray(44) : Buffer.alloc(0)));
  const combinedPcm = Buffer.concat(pcmParts);

  // Update RIFF ChunkSize (offset 4) and data Subchunk2Size (offset 40)
  header.writeUInt32LE(36 + combinedPcm.length, 4);
  header.writeUInt32LE(combinedPcm.length, 40);

  return Buffer.concat([header, combinedPcm]);
}

function getTtsVoiceConfig(language: ThreeLang): { voiceName: string; style: string } {
  if (language === 'am') {
    return {
      voiceName: 'Kore',
      style:
        'Speak in clear, natural Ethiopian Amharic (አማርኛ) with authentic Ethiopian Amharic pronunciation, natural rhythm, and calm conversational warmth. Read every word strictly in Amharic; never switch to English pronunciation.',
    };
  }
  if (language === 'om') {
    return {
      voiceName: 'Kore',
      style:
        'Speak in clear, natural Ethiopian Afaan Oromo (Oromiffa) using authentic Oromo Qubee phonology: pronounce double vowels as long vowels, single vowels as short, geminated consonants cleanly, and apostrophe glottal stops (hudhaa) naturally. Never pronounce words using Amharic or English phonetics.',
    };
  }
  return {
    voiceName: 'Zephyr',
    style: 'Speak in clear, warm, natural English at an easy-to-follow conversational pace.',
  };
}

export function createSpeechRouter() {
  const router = express.Router();

  router.get('/capabilities', (_req: Request, res: Response) => {
    const ai = getAiClient();
    res.json({
      geminiConfigured: Boolean(ai),
      supportedLanguages: SUPPORTED_LANGUAGES,
      models: {
        tts: 'gemini-3.8-flash-lite-tts',
        stt: 'gemini-3.5-transcribe',
        assistant: 'gemini-4-hydrogen',
      },
    });
  });

  router.post('/detect-language', async (req: Request, res: Response) => {
    const { text } = (req.body || {}) as { text?: string };
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for language detection.' });
      return;
    }
    const ai = getAiClient();
    const language = await detectLanguageServer(ai, text);
    res.json({ language });
  });

  router.post('/tts', async (req: Request, res: Response) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Neural speech service is not configured on the server.',
        code: 'TTS_UNAVAILABLE',
      });
      return;
    }

    const { text, language } = (req.body || {}) as { text?: string; language?: string };
    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Text is required for speech synthesis.' });
      return;
    }

    // Never allow Ethiopic Amharic text to be pronounced with an English or Oromo voice
    let resolvedLanguage = normalizeThreeLang(language);
    if (ETHIOPIC_REGEX.test(text) && resolvedLanguage !== 'am') {
      resolvedLanguage = 'am';
    } else if (!ETHIOPIC_REGEX.test(text) && OROMO_LEXICAL_REGEX.test(text) && resolvedLanguage === 'en') {
      resolvedLanguage = 'om';
    }

    const { voiceName, style } = getTtsVoiceConfig(resolvedLanguage);
    const chunks = splitIntoSpeechChunks(text, 380);

    try {
      const wavBuffers: Buffer[] = [];
      for (const chunk of chunks) {
        const ttsResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: chunk,
                  speechMetadata: {
                    style,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });

        const base64Audio =
          ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
          throw new Error('Empty audio returned by TTS model.');
        }
        wavBuffers.push(Buffer.from(base64Audio, 'base64'));
      }

      const finalWav = concatWavBuffers(wavBuffers);
      res.json({
        audioBase64: finalWav.toString('base64'),
        mimeType: 'audio/wav',
        language: resolvedLanguage,
        provider: 'gemini-tts',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'TTS generation failed.';
      res.status(502).json({
        error: message,
        code: 'TTS_GENERATION_FAILED',
      });
    }
  });

  router.post('/stt', async (req: Request, res: Response) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Server speech recognition is not configured.',
        code: 'STT_UNAVAILABLE',
      });
      return;
    }

    const { audioBase64, mimeType, targetLanguage } = (req.body || {}) as {
      audioBase64?: string;
      mimeType?: string;
      targetLanguage?: string;
    };

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      res.status(400).json({ error: 'Audio data is required.' });
      return;
    }

    const safeMime = (mimeType || 'audio/webm').split(';')[0].trim();
    const isAuto = !targetLanguage || targetLanguage === 'auto';
    const languageHint = isAuto
      ? 'The speaker is speaking one of ONLY three languages: Amharic (write in Ethiopic Fidel script), Afaan Oromo (write in Qubee Latin script), or English.'
      : targetLanguage === 'am'
      ? 'The speaker is speaking Amharic (write verbatim in Ethiopic Fidel script).'
      : targetLanguage === 'om'
      ? 'The speaker is speaking Afaan Oromo (write verbatim in Qubee Latin script).'
      : 'The speaker is speaking English.';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: safeMime,
                data: audioBase64,
              },
            },
            {
              text: `Transcribe the spoken audio verbatim in its exact original language. ${languageHint} Never translate into English or another language. Return only the spoken words.`,
            },
          ],
        },
      });

      const transcript = (response.text || '').trim();
      const detectedLanguage = transcript
        ? await detectLanguageServer(ai, transcript)
        : isAuto
        ? 'en'
        : normalizeThreeLang(targetLanguage);

      res.json({
        transcript,
        detectedLanguage,
        provider: 'gemini-stt',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Speech transcription failed.';
      res.status(502).json({
        error: message,
        code: 'STT_FAILED',
      });
    }
  });

  router.post('/assistant', async (req: Request, res: Response) => {
    const ai = getAiClient();
    const {
      message,
      language,
      autoDetect = true,
      context,
      history = [],
    } = (req.body || {}) as {
      message?: string;
      language?: string;
      autoDetect?: boolean;
      context?: { activeModule?: string; stepTitle?: string };
      history?: Array<{ role: 'user' | 'assistant'; text: string }>;
    };

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message text is required.' });
      return;
    }

    const detectedLang: ThreeLang = autoDetect
      ? await detectLanguageServer(ai, message)
      : normalizeThreeLang(language);

    const languageDisplay =
      detectedLang === 'am'
        ? 'Amharic (አማርኛ in Ethiopic Fidel script)'
        : detectedLang === 'om'
        ? 'Afaan Oromo (Oromiffa in Qubee Latin script)'
        : 'English';

    if (!ai) {
      // Honest offline/unconfigured plain-language fallback in the exact detected language
      const offlineReply =
        detectedLang === 'am'
          ? 'የድምፅ ረዳት AI አገልግሎት አሁን ከሰርቨሩ ጋር አልተገናኘም። በዚህ ገጽ ላይ ያሉትን የምዝገባ ደረጃዎች እና ተደራሽ ስራዎችን በቀጥታ መጠቀም ይችላሉ፤ የቀበሌ መታወቂያ ወይም የህክምና ማስረጃ አያስፈልግም።'
          : detectedLang === 'om'
          ? 'Tajaajilli AI gargaaraa sagalee amma sarvara irratti hin qindaa\'in jira. Galmee fi hojiiwwan mijatoo fuula kana irra jiran kallattiin fayyadamuu dandeessu; waraqaan eenyummaa gandaa ykn ragaan yaalaa hin barbaachisu.'
          : 'The AI voice assistant service is not connected right now, but you can complete every registration step and browse accessible jobs directly on screen without a kebele ID or medical proof.';

      res.json({
        replyText: offlineReply,
        language: detectedLang,
        provider: 'offline-fallback',
      });
      return;
    }

    const recentHistory = history
      .slice(-6)
      .map((h) => `${h.role === 'user' ? 'Learner' : 'Assistant'}: ${h.text}`)
      .join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `${recentHistory ? `Recent conversation:\n${recentHistory}\n\n` : ''}Current learner message: ${message}`,
        config: {
          systemInstruction: [
            'You are the Accessible Onboarding & Career Gateway Voice Assistant.',
            'Strictly support ONLY three languages: English (en), Amharic (am), and Afaan Oromo (om).',
            `You MUST respond ONLY in ${languageDisplay}. Do NOT mix languages or translate into English.`,
            'Use calm, clear, short, grade-5 plain-language sentences suitable for being read aloud naturally.',
            'Never ask for a medical diagnosis, disability proof, or mandatory kebele ID or passport.',
            'Remind learners politely that alternative IDs, partner referrals, and private support requests are welcome.',
            context?.activeModule
              ? `Current screen context: module="${context.activeModule}"${context.stepTitle ? `, step="${context.stepTitle}"` : ''}.`
              : '',
          ]
            .filter(Boolean)
            .join(' '),
        },
      });

      const replyText = (response.text || '').trim();
      res.json({
        replyText,
        language: detectedLang,
        provider: 'gemini-assistant',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Assistant request failed.';
      res.status(502).json({
        error: msg,
        code: 'ASSISTANT_FAILED',
      });
    }
  });

  return router;
}
