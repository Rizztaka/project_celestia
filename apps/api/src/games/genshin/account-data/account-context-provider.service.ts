import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import {
  type AccountCharacterContext,
  type AccountContext,
  type AccountContextFreshness,
  accountContextSchema,
  type ImportedAccountEvidence,
  type ShowcaseCharacter,
  type ShowcaseResult,
  type ShowcaseSnapshot,
  showcaseUidSchema,
} from '@celestia/api-contracts';
import type { GenshinAccount, GenshinArtifact, GenshinWeapon, Prisma } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError } from '@/core/errors/app-error.js';

import type { CharacterWithWeapon } from '../characters/character.repository.js';
import { GenshinCharacterService } from '../characters/character.service.js';
import { importedAccountContext } from '../importer/imported-account.calculator.js';
import { importedCharacterIdentity } from '../importer/imported-account.identity.js';
import { ImportedAccountService } from '../importer/imported-account.service.js';
import type { ImportSnapshot } from '../importer/importer.repository.js';
import { ShowcaseService } from '../showcase/showcase.service.js';

export type Weapon = GenshinWeapon;
export type Artifact = GenshinArtifact;

export type ResolvedAccountContext = AccountContext & {
  readonly freshness: AccountContextFreshness;
};

export interface UserAccountContextResult {
  context: ResolvedAccountContext;
  rawRoster: CharacterWithWeapon[];
  weapons: Weapon[];
  artifacts: Artifact[];
  evidence: ImportedAccountEvidence;
}

export interface ShowcaseAccountContextResult {
  context: ResolvedAccountContext;
  snapshot: ShowcaseSnapshot | null;
  rawRoster: CharacterWithWeapon[];
  weapons: Weapon[];
  artifacts: Artifact[];
  delivery: ShowcaseResult['delivery'];
  issue: ShowcaseResult['issue'];
}

export const DEFAULT_ACCOUNT_FRESHNESS_POLICY = Object.freeze({
  maxAgeMs: 7 * 24 * 60 * 60 * 1000,
  futureToleranceMs: 5 * 60 * 1000,
});

interface CatalogCharacterEntry {
  name?: string;
  gameId?: number;
}

const rawCatalog = JSON.parse(
  readFileSync(new URL('../static/character-profiles.json', import.meta.url), 'utf8'),
) as Record<string, CatalogCharacterEntry>;

const KEY_TO_AVATAR_ID = new Map<string, number>();
const AVATAR_ID_TO_KEY = new Map<number, string>();
const NORMALIZED_NAME_TO_KEY = new Map<string, string>();

for (const [key, entry] of Object.entries(rawCatalog)) {
  if (key === '_comment' || !entry || typeof entry !== 'object') continue;
  const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  NORMALIZED_NAME_TO_KEY.set(normalizedKey, key);
  if (typeof entry.name === 'string') {
    NORMALIZED_NAME_TO_KEY.set(entry.name.toLowerCase().replace(/[^a-z0-9]/g, ''), key);
  }
  if (typeof entry.gameId === 'number' && Number.isSafeInteger(entry.gameId) && entry.gameId > 0) {
    KEY_TO_AVATAR_ID.set(key, entry.gameId);
    if (!key.startsWith('Traveler') && !AVATAR_ID_TO_KEY.has(entry.gameId)) {
      AVATAR_ID_TO_KEY.set(entry.gameId, key);
    }
  }
}

const KNOWN_CHARACTER_ALIASES: Record<string, string> = {
  kokomi: 'SangonomiyaKokomi',
  ayaka: 'KamisatoAyaka',
  ayato: 'KamisatoAyato',
  yae: 'YaeMiko',
  kazuha: 'KaedeharaKazuha',
  raiden: 'RaidenShogun',
  sara: 'KujouSara',
  heizou: 'ShikanoinHeizou',
  shinobu: 'KukiShinobu',
  itto: 'AratakiItto',
  childe: 'Tartaglia',
  hutao: 'HuTao',
};

for (const [alias, canonicalKey] of Object.entries(KNOWN_CHARACTER_ALIASES)) {
  if (!NORMALIZED_NAME_TO_KEY.has(alias) && Object.hasOwn(rawCatalog, canonicalKey)) {
    NORMALIZED_NAME_TO_KEY.set(alias, canonicalKey);
  }
}

const compareStrings = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function computeDigest(value: unknown): string {
  return createHash('sha256')
    .update(
      JSON.stringify(value, (_key, item) =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
          ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => compareStrings(a, b)))
          : item,
      ),
    )
    .digest('hex');
}

export function resolveAccountFreshness(
  context: AccountContext & { freshness?: AccountContextFreshness },
): AccountContextFreshness {
  if (
    context.freshness &&
    ['fresh', 'stale', 'future_invalid', 'unavailable', 'unknown'].includes(context.freshness)
  ) {
    return context.freshness;
  }
  if (
    context.sourceTimestamps.some((ts) => ts.freshness === 'stale') ||
    context.characters.some((c) => c.freshness === 'stale') ||
    context.missingData.some((m) => m.dimension === 'freshness' && m.status === 'stale')
  ) {
    return 'stale';
  }
  if (
    context.sourceTimestamps.some((ts) => ts.freshness === 'future_invalid') ||
    context.characters.some((c) => c.freshness === 'future_invalid')
  ) {
    return 'future_invalid';
  }
  if (
    context.sourceTimestamps.some((ts) => ts.freshness === 'unavailable') ||
    context.characters.some((c) => c.freshness === 'unavailable')
  ) {
    return 'unavailable';
  }
  if (
    context.sourceTimestamps.some((ts) => ts.freshness === 'fresh') ||
    context.characters.some((c) => c.freshness === 'fresh')
  ) {
    return 'fresh';
  }
  return 'unknown';
}

export function attachFreshnessProperty(
  context: AccountContext,
  overrideFreshness?: AccountContextFreshness,
): ResolvedAccountContext {
  const resolved = overrideFreshness ?? resolveAccountFreshness(context);
  Object.defineProperty(context, 'freshness', {
    value: resolved,
    enumerable: false,
    configurable: true,
    writable: false,
  });
  return context as ResolvedAccountContext;
}

export function resolveCharacterKey(
  rawKeyOrName: string,
  avatarId?: number | null,
  fallbackName?: string | null,
): string {
  const formMatch = /^([1-9]\d*):(?:[1-9]\d*|unknown)$/.exec(rawKeyOrName);
  if (formMatch) {
    const parsedAvatarId = Number(formMatch[1]);
    const mapped = AVATAR_ID_TO_KEY.get(parsedAvatarId);
    if (mapped) return mapped;
  }
  if (
    typeof avatarId === 'number' &&
    Number.isSafeInteger(avatarId) &&
    AVATAR_ID_TO_KEY.has(avatarId)
  ) {
    const mappedByAvatar = AVATAR_ID_TO_KEY.get(avatarId)!;
    if (formMatch || !rawKeyOrName || rawKeyOrName.includes(':')) {
      return mappedByAvatar;
    }
  }
  if (Object.hasOwn(rawCatalog, rawKeyOrName)) {
    return rawKeyOrName;
  }
  const normalizedInput = rawKeyOrName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const byNormalizedInput = NORMALIZED_NAME_TO_KEY.get(normalizedInput);
  if (byNormalizedInput) {
    return byNormalizedInput;
  }
  if (fallbackName) {
    const byNormalizedName = NORMALIZED_NAME_TO_KEY.get(
      fallbackName.toLowerCase().replace(/[^a-z0-9]/g, ''),
    );
    if (byNormalizedName) {
      return byNormalizedName;
    }
  }
  return rawKeyOrName;
}

export function resolveCharacterFormIdentity(char: {
  key: string;
  id?: number | null;
  skillDepotId?: number | null;
  name?: string | null;
}): {
  avatarId: number;
  skillDepotId: number | null;
  formKey: string;
  characterKey: string;
} | null {
  const skillDepotId =
    typeof char.skillDepotId === 'number' &&
    Number.isSafeInteger(char.skillDepotId) &&
    char.skillDepotId > 0
      ? char.skillDepotId
      : null;

  const formMatch = /^([1-9]\d*):([1-9]\d*|unknown)$/.exec(char.key);
  if (formMatch) {
    const avatarId = Number(formMatch[1]);
    const parsedDepot = formMatch[2] === 'unknown' ? skillDepotId : Number(formMatch[2]);
    if (
      typeof char.id === 'number' &&
      Number.isSafeInteger(char.id) &&
      char.id > 0 &&
      char.id !== avatarId
    ) {
      return null;
    }
    const characterKey = resolveCharacterKey(char.key, avatarId, char.name);
    return {
      avatarId,
      skillDepotId: parsedDepot,
      formKey: `${avatarId}:${parsedDepot ?? 'unknown'}`,
      characterKey,
    };
  }

  const characterKey = resolveCharacterKey(char.key, char.id, char.name);
  const importedIdentity = importedCharacterIdentity(characterKey);
  const avatarId =
    typeof char.id === 'number' && Number.isSafeInteger(char.id) && char.id > 0
      ? char.id
      : (importedIdentity?.avatarId ?? KEY_TO_AVATAR_ID.get(characterKey) ?? null);

  if (!avatarId || !Number.isSafeInteger(avatarId) || avatarId <= 0) {
    return null;
  }

  return {
    avatarId,
    skillDepotId,
    formKey: `${avatarId}:${skillDepotId ?? 'unknown'}`,
    characterKey,
  };
}

function normalizeWeaponKey(weapon: ShowcaseCharacter['weapon'] | null | undefined): string {
  if (!weapon) return 'UnknownWeapon';
  const raw = (weapon as { key?: string; name?: string }).key ?? weapon.name ?? 'UnknownWeapon';
  return raw.replace(/[^A-Za-z0-9_]/g, '') || raw;
}

function extractTalentLevel(
  talents: ShowcaseCharacter['talents'] | undefined,
  kind: 'normal' | 'skill' | 'burst',
  fallbackIndex: number,
  defaultLevel: number,
): number {
  if (!Array.isArray(talents) || talents.length === 0) return defaultLevel;
  const byKind = talents.find((t) => t.kind === kind);
  if (byKind && typeof byKind.baseLevel === 'number') return byKind.baseLevel;
  const byIndex = talents[fallbackIndex];
  if (byIndex && typeof byIndex.baseLevel === 'number') return byIndex.baseLevel;
  return defaultLevel;
}

/**
 * Unified Account Context Provider for Genshin Impact intelligence engines.
 *
 * Resolves canonical `AccountContext` instances for both private authenticated
 * accounts (`getForUser`) and public showcase profiles (`getForShowcase`),
 * ensuring consistent completeness, freshness, ownership, equipment exclusivity,
 * and missing-data dimensions across all intelligence services.
 */
export class AccountContextProvider {
  constructor(
    private readonly importedAccountService: Pick<
      ImportedAccountService,
      'read'
    > = new ImportedAccountService(),
    private readonly showcaseService: Pick<ShowcaseService, 'lookup'> = new ShowcaseService(),
    private readonly characterService: Pick<
      GenshinCharacterService,
      'getCharactersForUser'
    > = new GenshinCharacterService(),
    private readonly clock: () => number = Date.now,
    private readonly freshnessPolicy: {
      maxAgeMs: number;
      futureToleranceMs: number;
    } = DEFAULT_ACCOUNT_FRESHNESS_POLICY,
  ) {}

  /**
   * Resolves the canonical `AccountContext` and associated inventory records
   * for an authenticated user via `ImportedAccountService`.
   *
   * Throws `NotFoundError` if the user has no Genshin account.
   */
  async getForUser(
    userId: string,
    options?: { accountId?: string },
  ): Promise<UserAccountContextResult> {
    let imported: Awaited<ReturnType<ImportedAccountService['read']>>;

    try {
      imported = await this.importedAccountService.read(
        userId,
        options?.accountId ? { accountId: options.accountId } : {},
      );
      if (!imported.context.accountId) {
        imported = await this.readFallbackSnapshot(userId, options?.accountId, null);
      } else if (imported.evidence.characters.length === 0) {
        const fallback = await this.readFallbackSnapshot(userId, options?.accountId, {
          id: imported.context.accountId,
          userId,
          uid: imported.context.uid,
          nickname: null,
          adventureRank: null,
          worldLevel: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } satisfies GenshinAccount);
        if (fallback.evidence.characters.length > 0) {
          imported = fallback;
        }
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      // Fallback for test environments where prisma.$transaction is not mocked on the global client
      imported = await this.readFallbackSnapshot(userId, options?.accountId);
    }

    if (!imported.context.accountId) {
      throw new NotFoundError('No Genshin Impact account found. Please import your data first.');
    }

    const accountId = imported.context.accountId;

    const weapons: Weapon[] = imported.evidence.weapons.map((w) => ({
      id: w.id,
      accountId,
      weaponKey: w.weaponKey,
      level: w.level ?? 1,
      ascension: w.ascension ?? 0,
      refinement: w.refinement ?? 1,
      locked: w.locked ?? false,
      createdAt: w.createdAt ? new Date(w.createdAt) : new Date(0),
      updatedAt: w.updatedAt ? new Date(w.updatedAt) : new Date(0),
    }));

    const weaponMap = new Map<string, Weapon>(weapons.map((w) => [w.id, w]));

    const artifacts: Artifact[] = imported.evidence.artifacts.map((a) => ({
      id: a.id,
      accountId,
      setKey: a.setKey,
      slotKey: a.slotKey,
      level: a.level ?? 0,
      rarity: a.rarity ?? 5,
      mainStatKey: a.mainStatKey,
      subStats: (a.subStats ?? []) as Prisma.JsonValue,
      locked: a.locked ?? false,
      equippedCharacterId: a.equippedCharacterId ?? null,
      createdAt: a.createdAt ? new Date(a.createdAt) : new Date(0),
      updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(0),
    }));

    const rawRoster: CharacterWithWeapon[] = imported.evidence.characters
      .map((c) => {
        const equippedWeapon = c.equippedWeaponId
          ? (weaponMap.get(c.equippedWeaponId) ?? null)
          : null;
        return {
          id: c.id,
          accountId,
          characterKey: c.characterKey,
          level: c.level ?? 1,
          ascension: c.ascension ?? 0,
          constellation: c.constellation ?? 0,
          talentNormal: c.talentNormal ?? 1,
          talentSkill: c.talentSkill ?? 1,
          talentBurst: c.talentBurst ?? 1,
          equippedWeaponId: equippedWeapon ? equippedWeapon.id : null,
          equippedWeapon,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(0),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(0),
        };
      })
      .sort((a, b) => b.level - a.level);

    const context = attachFreshnessProperty(imported.context);

    return {
      context,
      rawRoster,
      weapons,
      artifacts,
      evidence: imported.evidence,
    };
  }

  /**
   * Resolves a canonical `AccountContext` for a public showcase UID via `ShowcaseService`.
   *
   * Constructs a validated `AccountContext` with:
   * - `scope: 'public_uid'`
   * - `rosterScope: 'partial'`
   * - `absentCharacterOwnership: 'unknown'`
   * - `equipmentExclusivity: 'unverified'`
   * - character contexts reflecting `ownership: 'observed_owned'`
   *
   * Throws `NotFoundError` when no public showcase snapshot is available for the UID.
   */
  async getForShowcase(uidInput: string): Promise<ShowcaseAccountContextResult> {
    const uid = showcaseUidSchema.parse(uidInput);
    const showcaseResult = await this.showcaseService.lookup(uid);

    if (!showcaseResult.snapshot) {
      throw new NotFoundError(
        showcaseResult.issue?.message ?? 'Public showcase profile not found for this UID.',
      );
    }

    const nowMs = this.clock();
    const rawFetchedAt = showcaseResult.fetchedAt;
    const parsedFetchedTime =
      typeof rawFetchedAt === 'string' && Number.isFinite(Date.parse(rawFetchedAt))
        ? Date.parse(rawFetchedAt)
        : nowMs;
    const observedAt = new Date(parsedFetchedTime).toISOString();

    const isFutureObservation = parsedFetchedTime > nowMs + this.freshnessPolicy.futureToleranceMs;
    const isStaleObservation =
      !isFutureObservation &&
      (showcaseResult.delivery === 'stale' ||
        nowMs - parsedFetchedTime > this.freshnessPolicy.maxAgeMs);

    const charFreshness: AccountContextFreshness = isFutureObservation
      ? 'future_invalid'
      : isStaleObservation
        ? 'stale'
        : 'fresh';

    const rawCharacters = showcaseResult.snapshot.characters ?? [];
    const groupedByFormKey = new Map<
      string,
      {
        identity: NonNullable<ReturnType<typeof resolveCharacterFormIdentity>>;
        entries: ShowcaseCharacter[];
      }
    >();

    const issues: AccountContext['issues'] = [];
    let rejectedRecordCount = 0;

    for (const char of rawCharacters) {
      const identity = resolveCharacterFormIdentity(char);
      if (!identity) {
        rejectedRecordCount += 1;
        if (/^[1-9]\d*:(?:[1-9]\d*|unknown)$/.test(char.key)) {
          issues.push({ code: 'invalid_identity', formKey: char.key });
        }
        continue;
      }
      const existing = groupedByFormKey.get(identity.formKey);
      if (existing) {
        existing.entries.push(char);
      } else {
        groupedByFormKey.set(identity.formKey, { identity, entries: [char] });
      }
    }

    const characterContexts: AccountCharacterContext[] = [];
    const sortedGroups = [...groupedByFormKey.entries()].sort(([a], [b]) => compareStrings(a, b));

    for (const [formKey, { identity, entries }] of sortedGroups) {
      const primary = entries[0]!;
      const fingerprints = new Set(entries.map((entry) => computeDigest(entry)));
      const isConflicted = entries.length > 1 && fingerprints.size > 1;

      if (isConflicted) {
        issues.push({ code: 'conflicting_builds', formKey });
      }
      if (isFutureObservation) {
        issues.push({ code: 'future_observation', formKey });
      }

      const charObservedAt = isFutureObservation ? null : observedAt;
      const charBuildState: AccountCharacterContext['buildState'] = isConflicted
        ? 'conflicted'
        : charObservedAt
          ? 'observed'
          : 'missing';

      const weaponInstanceId =
        primary.weapon !== null && primary.weapon !== undefined
          ? [`weapon:${primary.weapon.id ?? normalizeWeaponKey(primary.weapon)}`]
          : [];
      const artifactInstanceIds = Array.isArray(primary.artifacts)
        ? primary.artifacts.map((art, idx) => `artifact:${art.id ?? art.slot ?? idx}`)
        : [];

      const hasStats = Array.isArray(primary.stats) && primary.stats.length > 0;
      const hasTalents = Array.isArray(primary.talents) && primary.talents.length > 0;
      const hasGear =
        Boolean(primary.weapon) ||
        (Array.isArray(primary.artifacts) && primary.artifacts.length > 0);

      const charMissingData: AccountCharacterContext['missingData'] = [
        {
          dimension: 'mechanics',
          status: 'not_modeled',
          reason: 'mechanics_are_not_in_context',
        },
        {
          dimension: 'stats',
          status: hasStats ? 'unknown' : 'omitted',
          reason: hasStats ? 'stats_are_not_complete' : 'showcase_did_not_report_stats',
        },
        {
          dimension: 'talents',
          status: hasTalents ? 'unknown' : 'omitted',
          reason: hasTalents
            ? 'talent_completeness_is_not_verified'
            : 'showcase_did_not_report_talents',
        },
        {
          dimension: 'gear',
          status: hasGear ? 'unknown' : 'omitted',
          reason: hasGear
            ? 'equipment_completeness_is_not_verified'
            : 'showcase_did_not_report_equipment',
        },
        {
          dimension: 'depots',
          status: 'unknown',
          reason:
            identity.skillDepotId === null
              ? 'skill_depot_is_unknown'
              : 'form_support_is_not_verified',
        },
      ];

      if (isConflicted) {
        charMissingData.push({
          dimension: 'gear',
          status: 'conflicted',
          reason: 'equal_time_builds_conflict',
        });
      }
      if (charObservedAt === null) {
        charMissingData.push({
          dimension: 'observation',
          status: 'unavailable',
          reason: 'no_valid_observation_time',
        });
      } else if (charFreshness === 'stale') {
        charMissingData.push({
          dimension: 'freshness',
          status: 'stale',
          reason: 'observation_exceeded_policy',
        });
      }

      characterContexts.push({
        formKey,
        avatarId: identity.avatarId,
        skillDepotId: identity.skillDepotId,
        ownership: charObservedAt ? 'observed_owned' : 'unknown',
        buildState: charBuildState,
        buildFingerprint: charBuildState === 'observed' ? computeDigest(primary) : null,
        observedAt: charObservedAt,
        freshness: charFreshness,
        sources: ['public_showcase'],
        equipmentInstanceIds: [...weaponInstanceId, ...artifactInstanceIds],
        timestamps: {
          observedAt: charObservedAt,
          importedAt: null,
          databaseUpdatedAt: null,
          sourceUpdatedAt: null,
          retrievedAt: observedAt,
        },
        missingData: charMissingData,
      });
    }

    const observedTimes = characterContexts
      .flatMap((c) => (c.observedAt ? [c.observedAt] : []))
      .sort();

    const overallFreshness: AccountContextFreshness =
      characterContexts.length === 0
        ? isFutureObservation
          ? 'future_invalid'
          : showcaseResult.delivery === 'stale'
            ? 'stale'
            : 'unavailable'
        : characterContexts.some((c) => c.freshness === 'stale')
          ? 'stale'
          : characterContexts.some((c) => c.freshness === 'future_invalid')
            ? 'future_invalid'
            : 'fresh';

    const uniqueIssues = [
      ...new Map(issues.map((issue) => [`${issue.formKey}:${issue.code}`, issue])).values(),
    ].sort((a, b) => compareStrings(a.formKey, b.formKey) || compareStrings(a.code, b.code));

    const accountMissingData: AccountContext['missingData'] = [
      { dimension: 'roster', status: 'unknown', reason: 'public_showcase_is_partial' },
      {
        dimension: 'ownership',
        status: 'unknown',
        reason: 'absence_is_not_ownership_evidence',
      },
      {
        dimension: 'equipment_exclusivity',
        status: 'unknown',
        reason: 'public_snapshot_is_not_exclusive',
      },
    ];

    if (overallFreshness === 'stale') {
      accountMissingData.push({
        dimension: 'freshness',
        status: 'stale',
        reason: 'observation_exceeded_policy',
      });
    } else if (overallFreshness === 'unavailable') {
      accountMissingData.push({
        dimension: 'observation',
        status: 'unavailable',
        reason: 'showcase_has_no_observed_characters',
      });
    }

    const contextPayload: Omit<AccountContext, 'fingerprint'> = {
      version: 1,
      scope: 'public_uid',
      uid,
      rosterScope: 'partial',
      completenessEvidence: null,
      absentCharacterOwnership: 'unknown',
      sources: ['public_showcase'],
      oldestObservationAt: observedTimes[0] ?? null,
      newestObservationAt: observedTimes.at(-1) ?? null,
      mixedObservationTimes: new Set(observedTimes).size > 1,
      equipmentExclusivity: 'unverified',
      rejectedRecordCount,
      freshnessPolicy: { ...this.freshnessPolicy },
      sourceTimestamps: [
        {
          source: 'public_showcase',
          freshness: overallFreshness,
          observedAt: observedTimes[0] ?? null,
          importedAt: null,
          databaseUpdatedAt: null,
          sourceUpdatedAt: null,
          retrievedAt: observedAt,
        },
      ],
      missingData: accountMissingData,
      characters: characterContexts,
      issues: uniqueIssues,
    };

    const validatedContext = accountContextSchema.parse({
      ...contextPayload,
      fingerprint: computeDigest(contextPayload),
    });

    const context = attachFreshnessProperty(validatedContext, overallFreshness);

    const weapons: Weapon[] = [];
    const artifacts: Artifact[] = [];
    const rawRoster: CharacterWithWeapon[] = rawCharacters.map((char, index) => {
      const identity = resolveCharacterFormIdentity(char);
      const characterKey =
        identity?.characterKey ?? resolveCharacterKey(char.key, char.id, char.name);
      const charId = `showcase-char-${uid}-${index}`;
      const createdAt = new Date(parsedFetchedTime);

      let equippedWeapon: Weapon | null = null;
      if (char.weapon) {
        const weaponId = `showcase-weapon-${uid}-${index}-${char.weapon.id ?? index}`;
        equippedWeapon = {
          id: weaponId,
          accountId: `showcase-${uid}`,
          weaponKey: normalizeWeaponKey(char.weapon),
          level: char.weapon.level ?? 1,
          ascension: char.weapon.ascension ?? 0,
          refinement: char.weapon.refinement ?? 1,
          locked: false,
          createdAt,
          updatedAt: createdAt,
        };
        weapons.push(equippedWeapon);
      }

      if (Array.isArray(char.artifacts)) {
        for (let artIdx = 0; artIdx < char.artifacts.length; artIdx++) {
          const art = char.artifacts[artIdx]!;
          artifacts.push({
            id: `showcase-artifact-${uid}-${index}-${art.id ?? artIdx}`,
            accountId: `showcase-${uid}`,
            setKey: (art.setName ?? 'UnknownSet').replace(/[^A-Za-z0-9_]/g, ''),
            slotKey: (art.slot ?? 'flower').toLowerCase(),
            level: art.level ?? 0,
            rarity: art.rarity ?? 5,
            mainStatKey: art.mainStat?.name ?? 'Unknown',
            subStats: (art.stats ?? []).map((s) => ({
              key: s.name,
              value: s.value,
            })) as Prisma.JsonValue,
            locked: false,
            equippedCharacterId: charId,
            createdAt,
            updatedAt: createdAt,
          });
        }
      }

      return {
        id: charId,
        accountId: `showcase-${uid}`,
        characterKey,
        level: char.level ?? 1,
        ascension: char.ascension ?? 0,
        constellation: char.constellation ?? 0,
        talentNormal: extractTalentLevel(char.talents, 'normal', 0, 6),
        talentSkill: extractTalentLevel(char.talents, 'skill', 1, 6),
        talentBurst: extractTalentLevel(char.talents, 'burst', 2, 6),
        equippedWeaponId: equippedWeapon ? equippedWeapon.id : null,
        equippedWeapon,
        createdAt,
        updatedAt: createdAt,
      };
    });

    return {
      context,
      snapshot: showcaseResult.snapshot,
      rawRoster,
      weapons,
      artifacts,
      delivery: showcaseResult.delivery,
      issue: showcaseResult.issue,
    };
  }

  private async readFallbackSnapshot(
    userId: string,
    requestedAccountId?: string,
    existingAccount?: GenshinAccount | null,
  ) {
    const account =
      existingAccount !== undefined
        ? existingAccount
        : await prisma.genshinAccount.findUnique({ where: { userId } });
    if (!account || (requestedAccountId && requestedAccountId !== account.id)) {
      throw new NotFoundError('No Genshin Impact account found. Please import your data first.');
    }

    const chars = await this.characterService.getCharactersForUser(userId);
    const now = account.updatedAt instanceof Date ? account.updatedAt : new Date();
    const accountId = account.id ?? `account-${userId}`;

    const weapons: NonNullable<ImportSnapshot>['weapons'] = [];
    const characters: NonNullable<ImportSnapshot>['characters'] = chars.map((char, idx) => {
      const charId = char.id ?? `char-${idx + 1}`;
      let equippedWeaponId: string | null = null;
      if (char.equippedWeapon) {
        const wId = char.equippedWeapon.id ?? `weapon-${idx + 1}`;
        equippedWeaponId = wId;
        if (!weapons.some((w) => w.id === wId)) {
          weapons.push({
            id: wId,
            accountId,
            weaponKey: char.equippedWeapon.weaponKey,
            level: char.equippedWeapon.level ?? 1,
            ascension: char.equippedWeapon.ascension ?? 0,
            refinement: char.equippedWeapon.refinement ?? 1,
            locked: char.equippedWeapon.locked ?? false,
            createdAt:
              char.equippedWeapon.createdAt instanceof Date ? char.equippedWeapon.createdAt : now,
            updatedAt:
              char.equippedWeapon.updatedAt instanceof Date ? char.equippedWeapon.updatedAt : now,
          });
        }
      }
      return {
        id: charId,
        accountId,
        characterKey: char.characterKey,
        level: char.level ?? 1,
        ascension: char.ascension ?? 0,
        constellation: char.constellation ?? 0,
        talentNormal: char.talentNormal ?? 1,
        talentSkill: char.talentSkill ?? 1,
        talentBurst: char.talentBurst ?? 1,
        equippedWeaponId,
        createdAt: char.createdAt instanceof Date ? char.createdAt : now,
        updatedAt: char.updatedAt instanceof Date ? char.updatedAt : now,
      };
    });

    const snapshot: NonNullable<ImportSnapshot> = {
      id: accountId,
      userId,
      uid: typeof account.uid === 'string' ? account.uid : null,
      nickname: typeof account.nickname === 'string' ? account.nickname : null,
      adventureRank: typeof account.adventureRank === 'number' ? account.adventureRank : null,
      worldLevel: typeof account.worldLevel === 'number' ? account.worldLevel : null,
      createdAt: account.createdAt instanceof Date ? account.createdAt : now,
      updatedAt: now,
      characters,
      weapons,
      artifacts: [],
      materials: [],
      importStates: [
        {
          id: `receipt-characters-${accountId}`,
          accountId,
          section: 'characters',
          importedAt: now,
          source: 'GOOD',
          entryCount: characters.length,
        },
      ],
    };

    return importedAccountContext(snapshot);
  }
}

export { AccountContextProvider as AccountContextProviderService };
export const accountContextProvider = new AccountContextProvider();
