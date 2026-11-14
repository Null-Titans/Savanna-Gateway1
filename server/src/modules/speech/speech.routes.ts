import { Router } from 'express';
import { SpeechController } from './speech.controller.js';

export const speechRouter = Router();

// Capabilities
speechRouter.get('/capabilities', SpeechController.getCapabilities);

// Language Detection
speechRouter.post('/detect-language', SpeechController.detectLanguage);

// Text-to-Speech (TTS)
speechRouter.post('/tts', SpeechController.tts);

// Speech-to-Text (STT)
speechRouter.post('/stt', SpeechController.stt);

// Conversational Speech Assistant
speechRouter.post('/assistant', SpeechController.assistant);
