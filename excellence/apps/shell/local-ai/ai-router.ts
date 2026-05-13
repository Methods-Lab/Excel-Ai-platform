import { randomUUID } from 'node:crypto';
import { API_BASE_URL } from '@codex-excel/shared-types';
import { requestConsent } from '../security/consent-gate';
import { LocalModelClient } from './LocalModelClient';

export interface AIResponse {
  text: string;
  source: 'local' | 'cloud';
}

const complexKeywords = [
  'remap',
  'normalize',
  'reconcile',
  'cross-field',
  'schema',
  'merge',
  'deduplicate',
];

const shouldUseCloud = (prompt: string): boolean => {
  const lowered = prompt.toLowerCase();
  if (prompt.length > 600) return true;
  return complexKeywords.some((keyword) => lowered.includes(keyword));
};

const callGemini = async (prompt: string, systemInstruction: string): Promise<string> => {
  const requestId = randomUUID();
  const response = await fetch(`${API_BASE_URL}/ai/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    },
    body: JSON.stringify({
      prompt,
      systemInstruction,
      requestId,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Gemini error: ${JSON.stringify(data)}`);
  }
  return data.result ?? '';
};

export class AIRouter {
  private localClient: LocalModelClient;

  constructor(localClient?: LocalModelClient) {
    this.localClient = localClient ?? new LocalModelClient();
  }

  async generate(prompt: string, systemInstruction = ''): Promise<AIResponse> {
    if (shouldUseCloud(prompt)) {
      await requestConsent(
        'cloud_ai',
        'This request needs cloud AI for complex reasoning.'
      );
      const text = await callGemini(prompt, systemInstruction);
      return { text, source: 'cloud' };
    }

    const text = await this.localClient.generate(prompt, {
      maxTokens: 512,
      temperature: 0.4,
    });
    return { text, source: 'local' };
  }
}
