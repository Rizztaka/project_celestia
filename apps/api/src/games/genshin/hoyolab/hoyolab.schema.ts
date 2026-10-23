import { z } from 'zod';
export const hoyolabServerSchema = z.enum(['os_asia', 'os_usa', 'os_euro', 'os_cht']);
const value = z
  .string()
  .min(1)
  .max(2048)
  .regex(/^[\x21-\x3a\x3c-\x7e]+$/);
export const hoyolabCookiesSchema = z
  .object({
    ltuid_v2: value.optional(),
    ltoken_v2: value.optional(),
    account_mid_v2: value.optional(),
    ltuid: value.optional(),
    ltoken: value.optional(),
  })
  .strict()
  .refine(
    (c) => !!((c.ltuid_v2 && c.ltoken_v2 && c.account_mid_v2) || (c.ltuid && c.ltoken)),
    'A HoYoLAB session is required.',
  );
export type HoyolabCookies = z.infer<typeof hoyolabCookiesSchema>;
export const hoyolabConnectSchema = z
  .object({ cookies: hoyolabCookiesSchema, consent: z.literal(true) })
  .strict();
export const hoyolabSelectSchema = z
  .object({ uid: z.string().regex(/^\d{9,10}$/), server: hoyolabServerSchema })
  .strict();
