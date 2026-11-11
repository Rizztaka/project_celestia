import { z } from 'zod';

import { showcaseUidSchema } from './showcase.js';

const formKey = z.string().regex(/^[1-9]\d*:(?:[1-9]\d*|unknown)$/);
const timestamp = z.string().datetime().nullable();
export const accountContextFreshnessSchema = z.enum([
  'fresh',
  'stale',
  'future_invalid',
  'unavailable',
  'unknown',
]);
export const accountContextMissingDataStatusSchema = z.enum([
  'unknown',
  'unavailable',
  'omitted',
  'unsupported',
  'stale',
  'conflicted',
  'not_owned_confirmed',
  'not_modeled',
]);
export const accountContextMissingDataDimensionSchema = z.enum([
  'roster',
  'ownership',
  'observation',
  'freshness',
  'gear',
  'talents',
  'stats',
  'depots',
  'mechanics',
  'equipment_exclusivity',
  'content',
]);
export const accountContextTimestampSchema = z
  .object({
    observedAt: timestamp,
    importedAt: timestamp,
    databaseUpdatedAt: timestamp,
    sourceUpdatedAt: timestamp,
    retrievedAt: timestamp,
  })
  .strict();
export const accountContextMissingDataSchema = z
  .object({
    dimension: accountContextMissingDataDimensionSchema,
    status: accountContextMissingDataStatusSchema,
    reason: z.string().min(1).max(160),
  })
  .strict();
export const accountContextSourceTimestampSchema = accountContextTimestampSchema
  .extend({
    source: z.lazy(() => accountDataSourceSchema),
    freshness: accountContextFreshnessSchema.default('unknown'),
  })
  .strict();

/** Sources in one family may be compared, but families must never be merged. */
export const accountContextSourcePolicy = Object.freeze({
  mergeableSourceFamilies: [
    ['public_showcase'],
    ['good_import', 'stored_account', 'manual'],
    ['hypothetical'],
  ],
  precedence: ['manual', 'good_import', 'stored_account', 'public_showcase', 'hypothetical'],
  conflictRule: 'preserve_all_and_do_not_select_a_build',
} as const);
export const accountDataSourceSchema = z.enum([
  'public_showcase',
  'good_import',
  'manual',
  'hypothetical',
  // Persisted rows whose individual import/manual/hypothetical origin was not retained.
  'stored_account',
]);

/** Observed ownership is historical evidence, not proof that the reader owns a UID. */
export const accountCharacterContextSchema = z
  .object({
    formKey,
    avatarId: z.number().int().positive(),
    skillDepotId: z.number().int().positive().nullable(),
    ownership: z.enum([
      'observed_owned',
      'confirmed_owned',
      'confirmed_unowned',
      'hypothetical',
      'unknown',
    ]),
    buildState: z.enum(['observed', 'stored', 'missing', 'conflicted', 'hypothetical']),
    buildFingerprint: z.string().min(1).nullable(),
    observedAt: timestamp,
    freshness: accountContextFreshnessSchema,
    sources: z.array(accountDataSourceSchema).min(1),
    equipmentInstanceIds: z.array(z.string().min(1)).default([]),
    timestamps: accountContextTimestampSchema.default({
      observedAt: null,
      importedAt: null,
      databaseUpdatedAt: null,
      sourceUpdatedAt: null,
      retrievedAt: null,
    }),
    missingData: z.array(accountContextMissingDataSchema).default([]),
  })
  .strict()
  .superRefine((character, context) => {
    if (character.formKey !== `${character.avatarId}:${character.skillDepotId ?? 'unknown'}`)
      context.addIssue({ code: 'custom', message: 'Character form identity does not match.' });
    if (
      (character.buildState === 'observed' &&
        (!character.buildFingerprint || !character.observedAt)) ||
      (['missing', 'conflicted'].includes(character.buildState) && character.buildFingerprint)
    )
      context.addIssue({ code: 'custom', message: 'Build evidence is inconsistent.' });
    if (character.observedAt !== character.timestamps.observedAt)
      context.addIssue({ code: 'custom', message: 'Observation timestamps must agree.' });
    if (
      character.buildState === 'stored' &&
      (!character.buildFingerprint ||
        character.observedAt !== null ||
        character.freshness !== 'unknown' ||
        character.ownership !== 'unknown' ||
        character.sources.length !== 1 ||
        character.sources[0] !== 'stored_account')
    )
      context.addIssue({
        code: 'custom',
        message: 'Stored evidence cannot establish observation or ownership.',
      });
    if (
      character.sources.includes('stored_account') &&
      (character.sources.length !== 1 ||
        character.ownership !== 'unknown' ||
        character.observedAt !== null ||
        character.freshness !== 'unknown' ||
        !['stored', 'missing', 'conflicted'].includes(character.buildState))
    )
      context.addIssue({
        code: 'custom',
        message: 'Unknown stored provenance must stay separate.',
      });
    if (
      (character.sources.includes('hypothetical') ||
        character.ownership === 'hypothetical' ||
        character.buildState === 'hypothetical') &&
      (character.sources.length !== 1 ||
        character.sources[0] !== 'hypothetical' ||
        character.ownership !== 'hypothetical' ||
        character.buildState !== 'hypothetical')
    )
      context.addIssue({ code: 'custom', message: 'Hypothetical data must stay separate.' });
  });

/** Shared evidence contract for readiness, team search and future pull comparisons. */
export const accountContextSchema = z
  .object({
    version: z.literal(1),
    scope: z.enum(['public_uid', 'private_authenticated', 'hypothetical', 'unknown']),
    uid: showcaseUidSchema.nullable(),
    // GOOD has no UID. Only the authenticated adapter supplies this private account key.
    accountId: z.string().min(1).nullable().optional(),
    rosterScope: z.enum(['partial', 'complete_snapshot', 'unknown']),
    completenessEvidence: z
      .object({
        source: z.enum(['good_import', 'manual']),
        kind: z.enum(['verified_full_export', 'explicit_user_declaration']),
        observedAt: z.string().datetime(),
      })
      .strict()
      .nullable(),
    // An absent record is never an automatic claim that a character is unowned now.
    absentCharacterOwnership: z.literal('unknown'),
    sources: z.array(accountDataSourceSchema),
    oldestObservationAt: timestamp,
    newestObservationAt: timestamp,
    mixedObservationTimes: z.boolean(),
    equipmentExclusivity: z.enum(['verified_snapshot', 'unverified']),
    rejectedRecordCount: z.number().int().min(0),
    freshnessPolicy: z
      .object({ maxAgeMs: z.number().int().positive(), futureToleranceMs: z.number().int().min(0) })
      .strict(),
    sourceTimestamps: z.array(accountContextSourceTimestampSchema).default([]),
    missingData: z.array(accountContextMissingDataSchema).default([]),
    characters: z.array(accountCharacterContextSchema),
    issues: z.array(
      z
        .object({
          code: z.enum([
            'invalid_identity',
            'future_observation',
            'undated_observation',
            'conflicting_builds',
          ]),
          formKey,
        })
        .strict(),
    ),
    fingerprint: z.string().min(1),
  })
  .strict()
  .superRefine((account, context) => {
    const families = account.sources.map((source) =>
      accountContextSourcePolicy.mergeableSourceFamilies.find((family) =>
        (family as readonly string[]).includes(source),
      ),
    );
    if (families.some((family) => !family || family !== families[0]))
      context.addIssue({
        code: 'custom',
        message: 'Account evidence source families cannot be merged.',
      });
    if (
      account.scope === 'unknown' &&
      (account.uid !== null || account.accountId !== undefined || account.sources.length)
    )
      context.addIssue({
        code: 'custom',
        message: 'Unknown account scope cannot identify a source account.',
      });
    if (
      account.sourceTimestamps.some(
        (timestamp) => !account.sources.includes(timestamp.source as AccountDataSource),
      )
    )
      context.addIssue({
        code: 'custom',
        message: 'Source timestamps must name declared sources.',
      });
    if (
      account.scope === 'public_uid' &&
      (account.uid === null ||
        account.accountId !== undefined ||
        account.sources.length !== 1 ||
        account.sources[0] !== 'public_showcase')
    )
      context.addIssue({
        code: 'custom',
        message: 'Public account contexts require a UID and public provenance.',
      });
    if (
      account.scope === 'private_authenticated' &&
      (account.accountId === undefined ||
        account.sources.some(
          (source) => !['stored_account', 'good_import', 'manual'].includes(source),
        ))
    )
      context.addIssue({
        code: 'custom',
        message: 'Private account contexts require authenticated private provenance.',
      });
    if (
      account.scope === 'hypothetical' &&
      (account.uid !== null ||
        account.accountId !== undefined ||
        account.sources.length !== 1 ||
        account.sources[0] !== 'hypothetical')
    )
      context.addIssue({
        code: 'custom',
        message: 'Hypothetical contexts must not identify a real account.',
      });
    if (
      account.rosterScope === 'complete_snapshot' &&
      (!account.completenessEvidence ||
        account.sources.length === 0 ||
        account.sources.some((source) =>
          ['public_showcase', 'hypothetical', 'stored_account'].includes(source),
        ))
    )
      context.addIssue({
        code: 'custom',
        message: 'This source cannot certify a complete roster.',
      });
    if (
      account.completenessEvidence &&
      !account.sources.includes(account.completenessEvidence.source)
    )
      context.addIssue({
        code: 'custom',
        message: 'Completeness evidence source must be declared.',
      });
    if (
      account.characters.some((character) =>
        character.sources.some((source) => !account.sources.includes(source)),
      )
    )
      context.addIssue({
        code: 'custom',
        message: 'Character sources must be declared by the account context.',
      });
    if (
      account.sources.includes('hypothetical') &&
      (account.sources.length !== 1 ||
        account.characters.some((character) => character.ownership !== 'hypothetical'))
    )
      context.addIssue({
        code: 'custom',
        message: 'Hypothetical account scenarios must stay separate.',
      });
    if (
      new Set(account.characters.map((character) => character.formKey)).size !==
      account.characters.length
    )
      context.addIssue({ code: 'custom', message: 'Duplicate character form context.' });
  });

export type AccountDataSource = z.infer<typeof accountDataSourceSchema>;
export type AccountCharacterContext = z.infer<typeof accountCharacterContextSchema>;
export type AccountContext = z.infer<typeof accountContextSchema>;
export type AccountContextFreshness = z.infer<typeof accountContextFreshnessSchema>;
export type AccountContextMissingData = z.infer<typeof accountContextMissingDataSchema>;

const storedId = z.string().min(1);
const storedNumber = z.number().finite().nullable();
const storedDates = { createdAt: timestamp, updatedAt: timestamp };

/** Stored fragments, NOT a reconstructed whole build or a new observation. */
export const importedAccountEvidenceSchema = z
  .object({
    identitySource: z
      .object({ kind: z.literal('local_catalog'), sha256: z.string().regex(/^[a-f0-9]{64}$/) })
      .strict(),
    characters: z.array(
      z
        .object({
          id: storedId,
          characterKey: z.string(),
          formKey: formKey.nullable(),
          level: storedNumber,
          ascension: storedNumber,
          constellation: storedNumber,
          talentNormal: storedNumber,
          talentSkill: storedNumber,
          talentBurst: storedNumber,
          talentBasis: z.literal('stored_convention_unknown'),
          equippedWeaponId: storedId.nullable(),
          ...storedDates,
        })
        .strict(),
    ),
    weapons: z.array(
      z
        .object({
          id: storedId,
          weaponKey: z.string(),
          level: storedNumber,
          ascension: storedNumber,
          refinement: storedNumber,
          locked: z.boolean().nullable(),
          ...storedDates,
        })
        .strict(),
    ),
    artifacts: z.array(
      z
        .object({
          id: storedId,
          setKey: z.string(),
          slotKey: z.string(),
          level: storedNumber,
          rarity: storedNumber,
          mainStatKey: z.string(),
          mainStatValue: z.null(),
          subStats: z
            .array(z.object({ key: z.string(), value: z.number().finite() }).strict())
            .nullable(),
          locked: z.boolean().nullable(),
          equippedCharacterId: storedId.nullable(),
          ...storedDates,
        })
        .strict(),
    ),
    receipts: z.array(
      z
        .object({
          section: z.enum(['characters', 'weapons', 'artifacts']),
          source: z.string().nullable(),
          importedAt: timestamp,
          entryCount: z.number().int().min(0),
          scope: z.enum(['merged_entries', 'replacement_section']),
        })
        .strict(),
    ),
    issues: z.array(
      z
        .object({
          code: z.enum([
            'unresolved_identity',
            'conflicting_builds',
            'invalid_substats',
            'inconsistent_assignment',
          ]),
          recordId: storedId,
        })
        .strict(),
    ),
  })
  .strict();

export const importedAccountContextSchema = z
  .object({
    context: accountContextSchema,
    evidence: importedAccountEvidenceSchema,
  })
  .strict()
  .superRefine(({ context }, validation) => {
    if (
      context.scope !== 'private_authenticated' ||
      context.accountId === undefined ||
      context.sources.some((source) => source !== 'stored_account' && source !== 'good_import') ||
      context.characters.some((character) => character.ownership !== 'unknown')
    )
      validation.addIssue({
        code: 'custom',
        message: 'Imported storage cannot establish individual origin or ownership.',
      });
  });

export type ImportedAccountEvidence = z.infer<typeof importedAccountEvidenceSchema>;
export type ImportedAccountContext = z.infer<typeof importedAccountContextSchema>;
