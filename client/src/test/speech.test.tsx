import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import express from 'express';
import { AddressInfo } from 'net';
import App from '../App';
import { LANGUAGE_REGISTRY } from '../i18n/types';
import { normalizeSupportedLanguage } from '../i18n';
import {
  detectLanguageFromText,
  resetCachedSpeechCapabilitiesForTest,
  speakText,
} from '../services/speech/speechService';
import {
  createSpeechRouter,
  heuristicDetectLanguage,
  splitIntoSpeechChunks,
} from '../../server/speechRouter';

describe('Strictly Three-Language Enforcement (EN / AM / OM)', () => {
  it('exposes strictly English, Amharic, and Afaan Oromo with active status', () => {
    const codes = LANGUAGE_REGISTRY.map((l) => l.code);
    expect(codes).toEqual(['en', 'am', 'om']);
    expect(LANGUAGE_REGISTRY.every((l) => l.status === 'active')).toBe(true);
    expect(normalizeSupportedLanguage('ti')).toBe('en');
    expect(normalizeSupportedLanguage('so')).toBe('en');
    expect(normalizeSupportedLanguage('ar')).toBe('en');
    expect(normalizeSupportedLanguage('am-ET')).toBe('am');
    expect(normalizeSupportedLanguage('om-ET')).toBe('om');
  });

  it('switches the UI cleanly across English, Amharic, and Afaan Oromo with only 3 dropdown options', async () => {
    const user = userEvent.setup();
    render(<App />);

    const langSelect = screen.getByLabelText(/Language/i) as HTMLSelectElement;
    const optionValues = Array.from(langSelect.options).map((o) => o.value);
    expect(optionValues).toEqual(['en', 'am', 'om']);

    await user.selectOptions(langSelect, 'om');
    await waitFor(() => {
      expect(screen.getByText(/Galmee salphaa fi carraa hojii mijataa/i)).toBeInTheDocument();
    });

    await user.selectOptions(langSelect, 'am');
    await waitFor(() => {
      expect(screen.getByText(/ቀላል ምዝገባ እና ተደራሽ የስራ እድሎች/i)).toBeInTheDocument();
    });

    await user.selectOptions(langSelect, 'en');
    await waitFor(() => {
      expect(screen.getByText(/Simple registration and accessible work/i)).toBeInTheDocument();
    });
  });
});

describe('Language Detection & Long-Response Continuity', () => {
  it('identifies Amharic, Afaan Oromo, and English accurately without translating', () => {
    expect(detectLanguageFromText('ሰላም፣ የምዝገባውን ሂደት መጀመር እፈልጋለሁ።', 'en')).toBe('am');
    expect(detectLanguageFromText('Akkam jirtu? Galmee barataa fi hojii barbaada.', 'en')).toBe('om');
    expect(detectLanguageFromText('Hello, I want to apply for an accessible job.', 'en')).toBe('en');

    expect(heuristicDetectLanguage('አማርኛ ድጋፍ እፈልጋለሁ')).toBe('am');
    expect(heuristicDetectLanguage('Maaloo gargaarsa afaan oromoo naaf kenni')).toBe('om');
    expect(heuristicDetectLanguage('How do I register without a kebele ID?')).toBe('en');
  });

  it('splits long multi-sentence responses across Ethiopic and Latin punctuation without dropping words', () => {
    const longText = [
      'First sentence explains registration without a kebele ID.',
      'Second sentence explains partner referrals for learners.',
      'Third sentence explains workplace accommodations without medical proof!',
      'አራተኛው ዓረፍተ ነገር በአማርኛ ሙሉ ንባብ ያቀርባል።',
      'Fifth sentence confirms Afaan Oromo support works naturally too?',
    ].join(' ');

    const chunks = splitIntoSpeechChunks(longText, 120);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks.every((c) => c.length <= 120)).toBe(true);
    expect(chunks.join(' ')).toBe(longText);
  });
});

describe('Anti-Mismatch Voice Guard & Speech Synthesis Safeguards', () => {
  const originalSpeechSynthesis = window.speechSynthesis;
  const originalUtterance = window.SpeechSynthesisUtterance;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetCachedSpeechCapabilitiesForTest();
  });

  afterEach(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: originalSpeechSynthesis,
      configurable: true,
    });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: originalUtterance,
      configurable: true,
    });
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('NEVER uses an English browser voice to pronounce Amharic or Afaan Oromo', async () => {
    const speakSpy = vi.fn();
    const cancelSpy = vi.fn();
    const englishOnlyVoices = [
      { name: 'English US Default', lang: 'en-US', default: true, localService: true, voiceURI: 'en-US' },
    ];

    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => englishOnlyVoices,
        speak: speakSpy,
        cancel: cancelSpy,
        onvoiceschanged: null,
      },
      configurable: true,
    });

    class MockUtterance {
      text: string;
      lang = '';
      rate = 1;
      voice: SpeechSynthesisVoice | null = null;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((ev: { error: string }) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: MockUtterance,
      configurable: true,
    });

    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({ geminiConfigured: false, supportedLanguages: ['en', 'am', 'om'] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const amErrors: string[] = [];
    await speakText(
      'ሰላም፣ የምዝገባውን ሂደት ይጀምሩ።',
      'am',
      undefined,
      undefined,
      (err) => amErrors.push(err)
    );
    expect(speakSpy).not.toHaveBeenCalled();
    expect(amErrors[0]).toMatch(/No authentic/i);

    const omErrors: string[] = [];
    await speakText(
      'Akkam jirtu? Galmee barataa jalqabi.',
      'om',
      undefined,
      undefined,
      (err) => omErrors.push(err)
    );
    expect(speakSpy).not.toHaveBeenCalled();
    expect(omErrors[0]).toMatch(/No authentic/i);

    // English DOES work cleanly with the native English voice
    await speakText('Welcome to the Accessible Gateway.', 'en');
    expect(speakSpy).toHaveBeenCalledTimes(1);
    const spokenUtterance = speakSpy.mock.calls[0][0] as MockUtterance;
    expect(spokenUtterance.lang).toBe('en-US');
  });
});

describe('Integrated Voice Assistant Panel (Manual + Auto-Detect + Error Handling)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetCachedSpeechCapabilitiesForTest();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('opens from the utility bar, switches languages via auto-detect, and handles API failures gracefully', async () => {
    const user = userEvent.setup();

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/speech/capabilities')) {
        return new Response(
          JSON.stringify({ geminiConfigured: false, supportedLanguages: ['en', 'am', 'om'] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('/api/speech/assistant')) {
        const body = JSON.parse(String(init?.body || '{}')) as { message: string };
        if (body.message.includes('TRIGGER_ERROR')) {
          return new Response(JSON.stringify({ error: 'Assistant service temporarily unavailable.' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (body.message.includes('Akkam')) {
          return new Response(
            JSON.stringify({
              replyText: 'Nagaa! Galmee barataa salphaatti jalqabuu dandeessu.',
              language: 'om',
              provider: 'mock-test',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({
            replyText: 'ሰላም! ያለ ቀበሌ መታወቂያ መመዝገብ ይችላሉ።',
            language: 'am',
            provider: 'mock-test',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    render(<App />);

    await user.click(screen.getByRole('button', { name: /Voice Assistant/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Verify manual selector inside assistant has strictly 3 options
    const vaLangSelect = screen.getByLabelText(/Language:/i) as HTMLSelectElement;
    expect(Array.from(vaLangSelect.options).map((o) => o.value)).toEqual(['en', 'am', 'om']);

    // Send Afaan Oromo message -> auto-detect switches conversation & UI to Afaan Oromoo
    const input = screen.getByPlaceholderText(/Type or use the microphone/i);
    await user.type(input, 'Akkam jirtu? Galmee barbaada');
    await user.click(screen.getByRole('button', { name: /Send/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Nagaa! Galmee barataa salphaatti jalqabuu dandeessu/i)
      ).toBeInTheDocument();
      expect(vaLangSelect.value).toBe('om');
    });

    // Send Amharic message -> switches to Amharic
    const omInput = screen.getByRole('textbox');
    await user.type(omInput, 'ሰላም መመዝገብ እፈልጋለሁ');
    await user.click(screen.getByRole('button', { name: /Ergi|ላክ|Send/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/ሰላም! ያለ ቀበሌ መታወቂያ መመዝገብ ይችላሉ።/i)
      ).toBeInTheDocument();
      expect(vaLangSelect.value).toBe('am');
    });

    // Simulate API failure -> shows clean inline error without crashing
    const amInput = screen.getByRole('textbox');
    await user.type(amInput, 'TRIGGER_ERROR');
    await user.click(screen.getByRole('button', { name: /ላክ|Send/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Assistant service temporarily unavailable/i);
    });
  });
});

describe('Server Speech Router Endpoints', () => {
  it('serves /capabilities, /detect-language, and /assistant cleanly across all 3 languages', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/speech', createSpeechRouter());

    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });

    try {
      const port = (server.address() as AddressInfo).port;
      const base = `http://127.0.0.1:${port}/api/speech`;

      const capsRes = await fetch(`${base}/capabilities`);
      expect(capsRes.status).toBe(200);
      const caps = (await capsRes.json()) as { supportedLanguages: string[] };
      expect(caps.supportedLanguages).toEqual(['en', 'am', 'om']);

      const detAm = await fetch(`${base}/detect-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'እንደምን አደሩ' }),
      });
      expect(((await detAm.json()) as { language: string }).language).toBe('am');

      const detOm = await fetch(`${base}/detect-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Akkam bultan? Galatoomaa.' }),
      });
      expect(((await detOm.json()) as { language: string }).language).toBe('om');

      const detEn = await fetch(`${base}/detect-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Good morning, how do I register?' }),
      });
      expect(((await detEn.json()) as { language: string }).language).toBe('en');

      const astOm = await fetch(`${base}/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Maaloo gargaarsa hojii barbaada', autoDetect: true }),
      });
      expect(astOm.status).toBe(200);
      const astData = (await astOm.json()) as { language: string; replyText: string };
      expect(astData.language).toBe('om');
      expect(astData.replyText.length).toBeGreaterThan(10);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
