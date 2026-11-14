import { GoogleGenAI, Type } from '@google/genai';

export type ThreeLang = 'en' | 'am' | 'om';

export const SUPPORTED_SPEECH_LANGUAGES: ThreeLang[] = ['en', 'am', 'om'];

export const ETHIOPIC_REGEX = /[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF]/;
export const OROMO_LEXICAL_REGEX =
  /\b(akkam|nagaa|maaloo|galatoomi|galatoomaa|eeyyee|lakkii|maqaa|gargaarsa|deeggarsa|hojiin|hojii|hojjetaa|barataa|barnoota|galmee|keessan|keessa|irraa|argachuu|barbaada|barbaadu|afaan|oromoo|oromiffa|oromiffaa|ani|ati|nuti|isaan|maal|maaliif|eessa|yoom|akkamitti|fayyaa|mijataa|gaaffii|deebii|barbaachisa|bilbila|waraqaa|eenyummaa|dhaabbata|michuu|iccitii|itti|fufi|duubatti|sirreessi|maxxansi|hayyama|dubbisi|dubbachuu|sagalee|qajeelfama|ergaa|fudhadhu|dhaabi)\b/i;

export class SpeechService {
  private static aiClient: GoogleGenAI | null = null;
  private static clientInitialized = false;

  public static getAiClient(): GoogleGenAI | null {
    if (this.clientInitialized) {
      return this.aiClient;
    }

    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length === 0) {
      this.aiClient = null;
    } else {
      try {
        this.aiClient = new GoogleGenAI({
          apiKey: apiKey.trim(),
          httpOptions: {
            headers: {
              'User-Agent': 'savanna-career-gateway-backend',
            },
          },
        });
      } catch {
        this.aiClient = null;
      }
    }

    this.clientInitialized = true;
    return this.aiClient;
  }

  public static isConfigured(): boolean {
    return Boolean(this.getAiClient());
  }

  public static normalizeThreeLang(raw?: string | null): ThreeLang {
    const v = (raw || '').toLowerCase().trim();
    if (v === 'am' || v.startsWith('am-')) return 'am';
    if (v === 'om' || v.startsWith('om-')) return 'om';
    return 'en';
  }

  public static heuristicDetectLanguage(text: string): ThreeLang {
    const trimmed = text.trim();
    if (!trimmed) return 'en';
    if (ETHIOPIC_REGEX.test(trimmed)) return 'am';
    if (OROMO_LEXICAL_REGEX.test(trimmed)) return 'om';
    return 'en';
  }

  public static async detectLanguage(text: string): Promise<ThreeLang> {
    const trimmed = text.trim();
    if (!trimmed) return 'en';
    if (ETHIOPIC_REGEX.test(trimmed)) return 'am';
    if (OROMO_LEXICAL_REGEX.test(trimmed)) return 'om';

    const ai = this.getAiClient();
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
      if (parsed.language && SUPPORTED_SPEECH_LANGUAGES.includes(parsed.language as ThreeLang)) {
        return parsed.language as ThreeLang;
      }
    } catch {
      // Fall back to heuristic
    }

    return this.heuristicDetectLanguage(trimmed);
  }

  /**
   * Splits long text into sentence-aligned chunks so TTS never truncates mid-sentence.
   */
  public static splitIntoSpeechChunks(text: string, maxChars = 380): string[] {
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
   * Concatenates multiple 24kHz mono 16-bit WAV clips cleanly.
   */
  public static concatWavBuffers(wavClips: Buffer[]): Buffer {
    if (wavClips.length === 0) return Buffer.alloc(0);
    if (wavClips.length === 1) return wavClips[0] ?? Buffer.alloc(0);

    const first = wavClips[0]!;
    const header = Buffer.from(first.subarray(0, 44));
    const pcmParts = wavClips.map((buf) => (buf.length > 44 ? buf.subarray(44) : Buffer.alloc(0)));
    const combinedPcm = Buffer.concat(pcmParts);

    header.writeUInt32LE(36 + combinedPcm.length, 4);
    header.writeUInt32LE(combinedPcm.length, 40);

    return Buffer.concat([header, combinedPcm]);
  }

  public static getTtsVoiceConfig(language: ThreeLang): { voiceName: string; style: string } {
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

  /**
   * Synthesizes neural speech from text using Gemini TTS.
   */
  public static async synthesizeSpeech(
    text: string,
    requestedLanguage?: string
  ): Promise<{ audioBase64: string; mimeType: string; language: ThreeLang; provider: string }> {
    const ai = this.getAiClient();
    if (!ai) {
      throw new Error('TTS_UNAVAILABLE');
    }

    let resolvedLanguage = this.normalizeThreeLang(requestedLanguage);
    if (ETHIOPIC_REGEX.test(text) && resolvedLanguage !== 'am') {
      resolvedLanguage = 'am';
    } else if (!ETHIOPIC_REGEX.test(text) && OROMO_LEXICAL_REGEX.test(text) && resolvedLanguage === 'en') {
      resolvedLanguage = 'om';
    }

    const { voiceName, style } = this.getTtsVoiceConfig(resolvedLanguage);
    const chunks = this.splitIntoSpeechChunks(text, 380);
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
        throw new Error('Empty audio returned by TTS model');
      }
      wavBuffers.push(Buffer.from(base64Audio, 'base64'));
    }

    const finalWav = this.concatWavBuffers(wavBuffers);

    return {
      audioBase64: finalWav.toString('base64'),
      mimeType: 'audio/wav',
      language: resolvedLanguage,
      provider: 'gemini-tts',
    };
  }

  /**
   * Transcribes speech audio using Gemini STT.
   */
  public static async transcribeSpeech(
    audioBase64: string,
    mimeType = 'audio/webm',
    targetLanguage?: string
  ): Promise<{ transcript: string; detectedLanguage: ThreeLang; provider: string }> {
    const ai = this.getAiClient();
    if (!ai) {
      throw new Error('STT_UNAVAILABLE');
    }

    const safeMime = (mimeType || 'audio/webm').split(';')[0]?.trim() || 'audio/webm';
    const isAuto = !targetLanguage || targetLanguage === 'auto';
    const languageHint = isAuto
      ? 'The speaker is speaking one of ONLY three languages: Amharic (write in Ethiopic Fidel script), Afaan Oromo (write in Qubee Latin script), or English.'
      : targetLanguage === 'am'
      ? 'The speaker is speaking Amharic (write verbatim in Ethiopic Fidel script).'
      : targetLanguage === 'om'
      ? 'The speaker is speaking Afaan Oromo (write verbatim in Qubee Latin script).'
      : 'The speaker is speaking English.';

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
      ? await this.detectLanguage(transcript)
      : isAuto
      ? 'en'
      : this.normalizeThreeLang(targetLanguage);

    return {
      transcript,
      detectedLanguage,
      provider: 'gemini-stt',
    };
  }

  /**
   * Assistant conversation endpoint
   */
  public static async assistantChat(input: {
    message: string;
    language?: string;
    context?: { activeModule?: string; stepTitle?: string };
    history?: Array<{ role: 'user' | 'assistant'; text: string }>;
  }): Promise<{ reply: string; language: ThreeLang }> {
    const ai = this.getAiClient();
    if (!ai) {
      throw new Error('ASSISTANT_UNAVAILABLE');
    }

    const resolvedLang = input.language
      ? this.normalizeThreeLang(input.language)
      : await this.detectLanguage(input.message);

    const langDirective =
      resolvedLang === 'am'
        ? 'Reply in clear, warm Ethiopian Amharic (አማርኛ).'
        : resolvedLang === 'om'
        ? 'Reply in natural Ethiopian Afaan Oromo (Qubee).'
        : 'Reply in clear, helpful English.';

    const contextDirective = input.context
      ? `User is currently in module: ${input.context.activeModule || 'general'}, step: ${input.context.stepTitle || 'overview'}.`
      : '';

    const systemPrompt = `You are the Savanna Career Gateway Assistant for jobseekers and learners who may face disability or displacement barriers. Be encouraging, concise, and accessible. ${langDirective} ${contextDirective}`;

    const resp = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\nUser: ${input.message}` }],
        },
      ],
    });

    return {
      reply: (resp.text || '').trim(),
      language: resolvedLang,
    };
  }
}
