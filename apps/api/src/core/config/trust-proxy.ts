import { z } from 'zod';

export const trustProxySchema = z
  .string()
  .optional()
  .transform((input, ctx) => {
    const value = input?.trim();
    if (!value || value === 'false') return false;
    if (value === 'true') return true;
    if (/^\d+$/.test(value)) {
      const hops = Number(value);
      if (Number.isSafeInteger(hops)) return hops;
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid proxy hop count.' });
      return z.NEVER;
    }
    return value
      .split(',')
      .map((entry) => entry.trim())
      .join(', ');
  });
