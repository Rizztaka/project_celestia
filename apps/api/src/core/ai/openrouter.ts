import OpenAI from 'openai';

import { env } from '../config/env.js';

/** Optional synthesis must never prevent deterministic planning. */
export const getOpenRouterClient = (): OpenAI | null => {
  if (!env.OPENROUTER_API_KEY) return null;
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: env.OPENROUTER_API_KEY,
    timeout: 10_000,
    maxRetries: 0,
    defaultHeaders: {
      'HTTP-Referer': env.API_ORIGIN || 'https://celestia.app',
      'X-Title': 'Project Celestia',
    },
  });
};
