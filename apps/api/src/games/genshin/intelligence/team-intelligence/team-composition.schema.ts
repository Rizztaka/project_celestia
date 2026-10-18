import { z } from 'zod';

export const characterKeysSchema = z
  .array(z.string().min(1).max(80))
  .max(4)
  .refine((keys) => new Set(keys).size === keys.length, 'Choose each character only once.');
export const evaluationSchema = z.object({ characterKeys: characterKeysSchema }).strict();
