import OpenAI from 'openai';

import { env } from '../config/env.js';

/**
 * OpenRouter client instance configured via OpenAI SDK.
 * 
 * Usage:
 * ```ts
 * const response = await openRouterClient.chat.completions.create({
 *   model: 'anthropic/claude-3.5-sonnet',
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * ```
 */
export const openRouterClient = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000', // Update this to your production URL later
    'X-Title': 'Project Celestia',
  },
});
