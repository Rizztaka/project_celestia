import { z } from 'zod';

import { showcaseUidSchema } from './showcase.js';

export const teamCharacterIdentitySchema = z
  .string()
  .regex(/^(?:traveler|avatar:[1-9]\d{7})$/)
  .refine((id) => !['avatar:10000005', 'avatar:10000007'].includes(id));
const formKey = z.string().regex(/^[1-9]\d{7}:[1-9]\d{0,7}$/);
const unique = (values: string[]) => new Set(values).size === values.length;
const ownerId = z.string().trim().min(1).max(200);
/** Durable equipment preferences must carry an explicit, account-local namespace. */
const gearId = z
  .string()
  .trim()
  .regex(/^(?:weapon|artifact):[A-Za-z0-9][A-Za-z0-9._:-]{0,118}$/);
export const teamPreferenceContentSchema = z
  .object({
    mode: z.enum(['unknown', 'training', 'abyss', 'theater', 'onslaught']),
    difficulty: z.string().trim().min(1).max(80),
    target: z.string().trim().min(1).max(80),
  })
  .strict();
export function teamCharacterIdentity(avatarId: number) {
  return [10000005, 10000007].includes(avatarId) ? 'traveler' : `avatar:${avatarId}`;
}

export const teamSearchPreferencesSchema = z
  .object({
    version: z.literal(1),
    uid: showcaseUidSchema.nullable(),
    ownerId: ownerId.nullable().default(null),
    accountId: ownerId.nullable().default(null),
    favoriteCharacters: z.array(teamCharacterIdentitySchema).max(150).refine(unique),
    excludedCharacters: z.array(teamCharacterIdentitySchema).max(150).refine(unique),
    requiredForms: z.array(formKey).max(4).refine(unique),
    goodEnoughCharacters: z.array(teamCharacterIdentitySchema).max(150).refine(unique).default([]),
    priority: z.enum(['damage', 'favorites']),
    preferredDriverKey: formKey.nullable(),
    verificationSamples: z.union([z.literal(3), z.literal(5), z.literal(10), z.literal(20)]),
    equipmentPolicy: z.literal('recorded_builds_only'),
    protectedGear: z.array(gearId).max(200).refine(unique).default([]),
    comfort: z.enum(['unknown', 'execution_friendly', 'balanced', 'precision']).default('unknown'),
    timeBudgetMinutes: z.number().int().min(0).max(1440).nullable().default(null),
    content: teamPreferenceContentSchema.default({
      mode: 'unknown',
      difficulty: 'unknown',
      target: 'unknown',
    }),
  })
  .strict()
  .superRefine((preferences, context) => {
    const requiredIdentities = preferences.requiredForms.map((key) =>
      teamCharacterIdentity(Number(key.split(':')[0])),
    );
    if (!unique(requiredIdentities))
      context.addIssue({
        code: 'custom',
        message: 'Require only one form of each playable character.',
      });
    if (requiredIdentities.some((id) => preferences.excludedCharacters.includes(id)))
      context.addIssue({
        code: 'custom',
        message: 'A required character cannot also be excluded.',
      });
    if (!preferences.uid && !preferences.accountId)
      context.addIssue({
        code: 'custom',
        message: 'Preferences require a UID or account scope.',
      });
    if (preferences.accountId && !preferences.ownerId)
      context.addIssue({
        code: 'custom',
        message: 'An account preference requires an owner scope.',
      });
    if (preferences.protectedGear.length && !preferences.accountId)
      context.addIssue({
        code: 'custom',
        message: 'Protected gear requires an authenticated account scope.',
      });
  });
export type TeamSearchPreferences = z.infer<typeof teamSearchPreferencesSchema>;
export const teamPreferencesScopeSchema = z
  .object({
    uid: showcaseUidSchema.nullable().default(null),
    accountId: ownerId.nullable().default(null),
  })
  .strict()
  .refine((scope) => !!scope.uid || !!scope.accountId, {
    message: 'Preferences require a UID or account scope.',
  });
export const teamPreferencesWriteSchema = z
  .object({
    scope: teamPreferencesScopeSchema,
    expectedRevision: z.number().int().min(0),
    preferences: teamSearchPreferencesSchema,
  })
  .strict();
export const teamPreferencesResponseSchema = z
  .object({ preferences: teamSearchPreferencesSchema, revision: z.number().int().min(0) })
  .strict();
export type TeamPreferencesWrite = z.infer<typeof teamPreferencesWriteSchema>;
export type TeamPreferencesResponse = z.infer<typeof teamPreferencesResponseSchema>;
const DEFAULT_PREFERENCES_SCOPE: Pick<TeamSearchPreferences, 'ownerId' | 'accountId'> =
  Object.freeze({
    ownerId: null,
    accountId: null,
  });

export function defaultTeamSearchPreferences(
  uid: string | null,
  scope: Pick<TeamSearchPreferences, 'ownerId' | 'accountId'> = DEFAULT_PREFERENCES_SCOPE,
): TeamSearchPreferences {
  return teamSearchPreferencesSchema.parse({
    version: 1,
    uid,
    ownerId: scope.ownerId,
    accountId: scope.accountId,
    favoriteCharacters: [],
    excludedCharacters: [],
    requiredForms: [],
    goodEnoughCharacters: [],
    priority: 'damage',
    preferredDriverKey: null,
    verificationSamples: 5,
    equipmentPolicy: 'recorded_builds_only',
    protectedGear: [],
    comfort: 'unknown',
    timeBudgetMinutes: null,
    content: { mode: 'unknown', difficulty: 'unknown', target: 'unknown' },
  });
}
