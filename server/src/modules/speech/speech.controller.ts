import type { Request, Response } from 'express';
import { SpeechService, SUPPORTED_SPEECH_LANGUAGES } from './speech.service.js';

export class SpeechController {
  /**
   * GET /api/speech/capabilities
   */
  public static getCapabilities(_req: Request, res: Response): void {
    const isConfigured = SpeechService.isConfigured();
    const data = {
      geminiConfigured: isConfigured,
      supportedLanguages: SUPPORTED_SPEECH_LANGUAGES,
      models: {
        tts: 'gemini-3.8-flash-lite-tts',
        stt: 'gemini-3.5-transcribe',
        assistant: 'gemini-4-hydrogen',
      },
    };

    res.status(200).json({
      ...data,
      success: true,
      data,
      meta: {},
    });
  }

  /**
   * POST /api/speech/detect-language
   */
  public static async detectLanguage(req: Request, res: Response): Promise<void> {
    const { text } = (req.body || {}) as { text?: string };
    if (!text || typeof text !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Text is required for language detection', details: [] },
        message: 'Text is required for language detection',
      });
      return;
    }

    try {
      const language = await SpeechService.detectLanguage(text);
      res.status(200).json({
        language,
        success: true,
        data: { language },
        meta: {},
      });
    } catch {
      const fallback = SpeechService.heuristicDetectLanguage(text);
      res.status(200).json({
        language: fallback,
        success: true,
        data: { language: fallback },
        meta: {},
      });
    }
  }

  /**
   * POST /api/speech/tts
   */
  public static async tts(req: Request, res: Response): Promise<void> {
    if (!SpeechService.isConfigured()) {
      res.status(503).json({
        success: false,
        code: 'TTS_UNAVAILABLE',
        error: {
          code: 'TTS_UNAVAILABLE',
          message: 'Neural speech synthesis service is not configured on the server.',
          details: [],
        },
        message: 'Neural speech synthesis service is not configured on the server.',
      });
      return;
    }

    const { text, language } = (req.body || {}) as { text?: string; language?: string };
    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Text is required for speech synthesis.', details: [] },
        message: 'Text is required for speech synthesis.',
      });
      return;
    }

    try {
      const result = await SpeechService.synthesizeSpeech(text, language);
      res.status(200).json({
        ...result,
        success: true,
        data: result,
        meta: {},
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'TTS generation failed.';
      res.status(502).json({
        success: false,
        code: 'TTS_GENERATION_FAILED',
        error: { code: 'TTS_GENERATION_FAILED', message, details: [] },
        message,
      });
    }
  }

  /**
   * POST /api/speech/stt
   */
  public static async stt(req: Request, res: Response): Promise<void> {
    if (!SpeechService.isConfigured()) {
      res.status(503).json({
        success: false,
        code: 'STT_UNAVAILABLE',
        error: {
          code: 'STT_UNAVAILABLE',
          message: 'Server speech recognition is not configured.',
          details: [],
        },
        message: 'Server speech recognition is not configured.',
      });
      return;
    }

    const { audioBase64, mimeType, targetLanguage } = (req.body || {}) as {
      audioBase64?: string;
      mimeType?: string;
      targetLanguage?: string;
    };

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Audio data is required.', details: [] },
        message: 'Audio data is required.',
      });
      return;
    }

    try {
      const result = await SpeechService.transcribeSpeech(audioBase64, mimeType, targetLanguage);
      res.status(200).json({
        ...result,
        success: true,
        data: result,
        meta: {},
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Speech transcription failed.';
      res.status(502).json({
        success: false,
        code: 'STT_FAILED',
        error: { code: 'STT_FAILED', message, details: [] },
        message,
      });
    }
  }

  /**
   * POST /api/speech/assistant
   */
  public static async assistant(req: Request, res: Response): Promise<void> {
    if (!SpeechService.isConfigured()) {
      res.status(503).json({
        success: false,
        code: 'ASSISTANT_UNAVAILABLE',
        error: {
          code: 'ASSISTANT_UNAVAILABLE',
          message: 'Speech assistant is not configured on the server.',
          details: [],
        },
        message: 'Speech assistant is not configured on the server.',
      });
      return;
    }

    const { message, language, context, history } = (req.body || {}) as {
      message?: string;
      language?: string;
      context?: { activeModule?: string; stepTitle?: string };
      history?: Array<{ role: 'user' | 'assistant'; text: string }>;
    };

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Message is required.', details: [] },
        message: 'Message is required.',
      });
      return;
    }

    try {
      const result = await SpeechService.assistantChat({
        message,
        language,
        context,
        history,
      });

      res.status(200).json({
        ...result,
        success: true,
        data: result,
        meta: {},
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Assistant generation failed.';
      res.status(502).json({
        success: false,
        code: 'ASSISTANT_FAILED',
        error: { code: 'ASSISTANT_FAILED', message: errMsg, details: [] },
        message: errMsg,
      });
    }
  }
}
