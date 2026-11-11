import type {
  AccountContext,
  AccountContextFreshness,
  PullBudgetInput,
  PullCompareRequest,
  PullCompareResponse,
  PullConfidence,
  PullIntelligenceResponse,
  PullRecommendation,
  PullTargetMode,
  PullUserWeights,
} from '@celestia/api-contracts';
import { createRequire } from 'module';

import { prisma } from '@/core/db/prisma.js';

import {
  AccountContextProvider,
  resolveAccountFreshness,
  resolveCharacterFormIdentity,
} from '../../account-data/account-context-provider.service.js';
import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { GenshinCharacterService } from '../../characters/character.service.js';
import { ImportedAccountService } from '../../importer/imported-account.service.js';
import { ShowcaseService } from '../../showcase/showcase.service.js';
import type { CharacterInput } from '../character-intelligence/character-intelligence.calculator.js';
import { CharacterIntelligenceService } from '../character-intelligence/character-intelligence.service.js';
import type { TeamTemplate } from '../team-intelligence/team-intelligence.calculator.js';
import { scoreAllTemplates } from '../team-intelligence/team-intelligence.calculator.js';
import {
  type ActiveBanner,
  type ConstellationBenchmarksMap,
  evaluateCounterfactualAddition,
} from './pull-intelligence.calculator.js';
import { explainPullValue } from './pull-intelligence.explainer.js';

// -------------------------------------------------------
// Static data — loaded once at module init
// -------------------------------------------------------

const require = createRequire(import.meta.url);

const rawBannersData = require('../../static/active-banners.json') as {
  banners: (ActiveBanner & {
    historical?: boolean;
    startDate?: string;
    sourceUrl?: string;
    simulation?: boolean;
  })[];
  rulesSource?: string;
};

const ALL_BANNERS = rawBannersData.banners;
const RULES_SOURCE = rawBannersData.rulesSource;

export function isValidUrl(val: unknown): boolean {
  if (typeof val !== 'string' || !val.trim()) return false;
  try {
    const url = new URL(val);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getVerifiedActiveBanners(
  banners: typeof ALL_BANNERS = ALL_BANNERS,
  rulesSource: string | null | undefined = RULES_SOURCE,
  now: Date = new Date(),
) {
  const isRulesVerified =
    rulesSource !== undefined ? isValidUrl(rulesSource) : isValidUrl(RULES_SOURCE);
  if (!isRulesVerified) return [];

  return banners.filter((b) => {
    if (b.historical || b.simulation) return false;
    if (!isValidUrl(b.sourceUrl)) return false;
    if (b.startDate) {
      const start = new Date(b.startDate);
      if (isNaN(start.getTime()) || start > now) return false;
    }
    const end = new Date(b.endDate);
    if (isNaN(end.getTime()) || end <= now) return false;
    return true;
  });
}

const { templates: META_TEMPLATES } = require('../../static/team-templates.json') as {
  templates: TeamTemplate[];
};

const { constellations: CONSTELLATION_BENCHMARKS } =
  require('../../static/constellation-benchmarks.json') as {
    constellations: ConstellationBenchmarksMap;
  };

const CHARACTER_ELEMENTS = require('../../static/character-elements.json') as Record<
  string,
  string
>;

// Re-export response types for convenience
export type { PullIntelligenceResponse, PullRecommendation };

const STALE_CONTEXT_PROVENANCE_NOTICE =
  'Account context observation is stale (exceeded freshness policy window); pull recommendations may not reflect live in-game progression.';

const PARTIAL_ROSTER_OWNERSHIP_NOTE =
  'Account roster is partial (absentCharacterOwnership: unknown); absent characters are not treated as confirmed unowned when calculating role deficits.';

function createEmptyPublicAccountContext(uid: string): AccountContext & {
  freshness: AccountContextFreshness;
} {
  return {
    version: 1,
    scope: 'public_uid',
    uid,
    rosterScope: 'partial',
    completenessEvidence: null,
    absentCharacterOwnership: 'unknown',
    sources: ['public_showcase'],
    oldestObservationAt: null,
    newestObservationAt: null,
    mixedObservationTimes: false,
    equipmentExclusivity: 'unverified',
    rejectedRecordCount: 0,
    freshnessPolicy: { maxAgeMs: 7 * 24 * 60 * 60 * 1000, futureToleranceMs: 5 * 60 * 1000 },
    sourceTimestamps: [
      {
        source: 'public_showcase',
        freshness: 'unavailable',
        observedAt: null,
        importedAt: null,
        databaseUpdatedAt: null,
        sourceUpdatedAt: null,
        retrievedAt: null,
      },
    ],
    missingData: [
      { dimension: 'roster', status: 'unknown', reason: 'public_showcase_is_partial' },
      { dimension: 'ownership', status: 'unknown', reason: 'absence_is_not_ownership_evidence' },
      {
        dimension: 'equipment_exclusivity',
        status: 'unknown',
        reason: 'public_snapshot_is_not_exclusive',
      },
      {
        dimension: 'observation',
        status: 'unavailable',
        reason: 'showcase_has_no_observed_characters',
      },
    ],
    characters: [],
    issues: [],
    fingerprint: `empty-showcase-${uid}`,
    freshness: 'unavailable',
  };
}

function createHypotheticalFallbackContext(): AccountContext & {
  freshness: AccountContextFreshness;
} {
  return {
    version: 1,
    scope: 'hypothetical',
    uid: null,
    rosterScope: 'partial',
    completenessEvidence: null,
    absentCharacterOwnership: 'unknown',
    sources: ['hypothetical'],
    oldestObservationAt: null,
    newestObservationAt: null,
    mixedObservationTimes: false,
    equipmentExclusivity: 'unverified',
    rejectedRecordCount: 0,
    freshnessPolicy: { maxAgeMs: 7 * 24 * 60 * 60 * 1000, futureToleranceMs: 5 * 60 * 1000 },
    sourceTimestamps: [],
    missingData: [
      { dimension: 'roster', status: 'unknown', reason: 'hypothetical_roster_is_partial' },
      { dimension: 'ownership', status: 'unknown', reason: 'absence_is_not_ownership_evidence' },
    ],
    characters: [],
    issues: [],
    fingerprint: 'hypothetical-empty-context',
    freshness: 'unknown',
  };
}

function mapVerifiedRosterFromContext(
  rawRoster: CharacterWithWeapon[],
  accountContext: AccountContext,
): {
  roster: CharacterInput[];
  conflictedCharacterKeys: string[];
} {
  const charContextByFormKey = new Map(accountContext.characters.map((c) => [c.formKey, c]));
  const conflictedFormKeys = new Set(
    accountContext.issues
      .filter((issue) => issue.code === 'conflicting_builds')
      .map((issue) => issue.formKey),
  );

  const roster: CharacterInput[] = [];
  const conflictedCharacterKeys: string[] = [];

  for (const char of rawRoster) {
    const identity = resolveCharacterFormIdentity({ key: char.characterKey });
    const formKey = identity?.formKey;
    const charContext = formKey ? charContextByFormKey.get(formKey) : undefined;

    if (charContext?.buildState === 'conflicted' || (formKey && conflictedFormKeys.has(formKey))) {
      if (!conflictedCharacterKeys.includes(char.characterKey)) {
        conflictedCharacterKeys.push(char.characterKey);
      }
      continue;
    }

    roster.push({
      characterKey: char.characterKey,
      level: char.level,
      ascension: char.ascension,
      constellation: char.constellation,
      talentNormal: char.talentNormal,
      talentSkill: char.talentSkill,
      talentBurst: char.talentBurst,
      equippedWeapon: char.equippedWeapon
        ? {
            weaponKey: char.equippedWeapon.weaponKey,
            level: char.equippedWeapon.level,
            refinement: char.equippedWeapon.refinement,
          }
        : null,
    });
  }

  return { roster, conflictedCharacterKeys };
}

// -------------------------------------------------------
// Service Implementation
// -------------------------------------------------------

export class PullIntelligenceService {
  private readonly accountContextProvider: AccountContextProvider;
  private readonly characterService: CharacterIntelligenceService;

  constructor(
    providerOrCharacterService:
      AccountContextProvider | CharacterIntelligenceService = new AccountContextProvider(),
    characterServiceOrGenshinCharService?: CharacterIntelligenceService | GenshinCharacterService,
    showcaseService?: ShowcaseService,
    explicitProvider?: AccountContextProvider,
  ) {
    if ('getForUser' in providerOrCharacterService) {
      this.accountContextProvider = providerOrCharacterService;
      this.characterService =
        characterServiceOrGenshinCharService instanceof CharacterIntelligenceService
          ? characterServiceOrGenshinCharService
          : new CharacterIntelligenceService();
    } else {
      this.characterService = providerOrCharacterService;
      const genshinCharService =
        characterServiceOrGenshinCharService instanceof GenshinCharacterService
          ? characterServiceOrGenshinCharService
          : new GenshinCharacterService();
      this.accountContextProvider =
        explicitProvider ??
        new AccountContextProvider(
          new ImportedAccountService(),
          showcaseService ?? new ShowcaseService(),
          genshinCharService,
        );
    }
  }

  /**
   * Returns Account-Value Pull recommendations for all currently active banners,
   * scored by how much each banner target improves the user's roster, team versatility,
   * endgame coverage, and execution comfort.
   */
  async getRecommendations(
    userId: string,
    options?: {
      weights?: PullUserWeights;
      budget?: PullBudgetInput;
    },
  ): Promise<PullIntelligenceResponse> {
    const {
      context: accountContext,
      rawRoster,
      weapons,
    } = await this.accountContextProvider.getForUser(userId);

    let favorites: string[] = [];
    try {
      const prefs = await prisma.genshinTeamPreferences?.findFirst?.({ where: { userId } });
      if (prefs?.payload && typeof prefs.payload === 'object') {
        const payloadObj = prefs.payload as Record<string, unknown>;
        if (Array.isArray(payloadObj.favorites)) {
          favorites = payloadObj.favorites as string[];
        }
      }
    } catch {
      // Non-fatal if table not migrated or absent
    }

    let characterRecs: Awaited<
      ReturnType<CharacterIntelligenceService['getRecommendations']>
    >['recommendations'] = [];
    try {
      const ciResponse = await this.characterService.getRecommendations(userId);
      characterRecs = ciResponse.recommendations;
    } catch {
      // Non-fatal
    }

    return this.evaluateBannersWithContext({
      accountContext,
      rawRoster,
      ownedWeaponKeys: weapons.map((w) => w.weaponKey),
      favorites,
      characterRecs,
      options,
    });
  }

  /**
   * Evaluates active banners for a public showcase account using the canonical AccountContext.
   * Explicitly enforces partial roster semantics so absent characters are never presumed unowned.
   */
  async getPublicShowcaseRecommendations(
    uid: string,
    options?: {
      weights?: PullUserWeights;
      budget?: PullBudgetInput;
    },
  ): Promise<PullIntelligenceResponse> {
    let accountContext: AccountContext & { freshness?: AccountContextFreshness };
    let rawRoster: CharacterWithWeapon[] = [];
    let ownedWeaponKeys: string[] = [];

    try {
      const resolved = await this.accountContextProvider.getForShowcase(uid);
      accountContext = resolved.context;
      rawRoster = resolved.rawRoster;
      ownedWeaponKeys = resolved.weapons.map((w) => w.weaponKey);
    } catch {
      accountContext = createEmptyPublicAccountContext(uid);
    }

    return this.evaluateBannersWithContext({
      accountContext,
      rawRoster,
      ownedWeaponKeys,
      favorites: [],
      characterRecs: [],
      options,
    });
  }

  /**
   * Compares a custom hypothetical character, constellation, or weapon addition
   * against the player's canonical AccountContext.
   */
  async compareCustomHypothetical(
    userIdOrUid: string,
    input: PullCompareRequest,
    isPublic = false,
  ): Promise<PullCompareResponse> {
    let accountContext: AccountContext & { freshness?: AccountContextFreshness };
    let rawRoster: CharacterWithWeapon[] = [];
    let ownedWeaponKeys: string[] = [];
    let favorites: string[] = [];

    if (!isPublic && userIdOrUid) {
      try {
        const resolved = await this.accountContextProvider.getForUser(userIdOrUid);
        accountContext = resolved.context;
        rawRoster = resolved.rawRoster;
        ownedWeaponKeys = resolved.weapons.map((w) => w.weaponKey);

        const prefs = await prisma.genshinTeamPreferences?.findFirst?.({
          where: { userId: userIdOrUid },
        });
        if (prefs?.payload && typeof prefs.payload === 'object') {
          const payloadObj = prefs.payload as Record<string, unknown>;
          if (Array.isArray(payloadObj.favorites)) {
            favorites = payloadObj.favorites as string[];
          }
        }
      } catch {
        accountContext = createHypotheticalFallbackContext();
      }
    } else if (isPublic && userIdOrUid) {
      try {
        const resolved = await this.accountContextProvider.getForShowcase(userIdOrUid);
        accountContext = resolved.context;
        rawRoster = resolved.rawRoster;
        ownedWeaponKeys = resolved.weapons.map((w) => w.weaponKey);
      } catch {
        accountContext = createEmptyPublicAccountContext(userIdOrUid);
      }
    } else {
      accountContext = createHypotheticalFallbackContext();
    }

    const { roster, conflictedCharacterKeys } = mapVerifiedRosterFromContext(
      rawRoster,
      accountContext,
    );
    const currentBreakdowns = scoreAllTemplates(META_TEMPLATES, roster);

    const banner: ActiveBanner = {
      bannerId: `custom_${input.targetKey.toLowerCase()}`,
      name: `Custom Analysis: ${input.targetKey}`,
      type: input.targetType === 'weapon' ? 'WEAPON' : 'CHARACTER',
      fiveStarKey: input.targetKey,
      fourStarKeys: [],
      endDate: '2099-01-01',
      simulation: true,
    };

    const target = {
      targetKey: input.targetKey,
      targetType: input.targetType,
      mode: input.mode,
      targetConstellation: input.targetConstellation,
    };

    const isPartialRoster = accountContext.rosterScope === 'partial';
    const isPublicPartial = accountContext.scope === 'public_uid' && isPartialRoster;

    const rec = evaluateCounterfactualAddition({
      target,
      banner,
      roster,
      accountContext: {
        ...accountContext,
        isPartialAccount: isPublicPartial,
        favorites,
        ownedWeaponKeys,
        characterElements: CHARACTER_ELEMENTS,
      },
      templates: META_TEMPLATES,
      currentBreakdowns,
      characterRecs: [],
      userWeights: input.weights,
      budget: input.budget,
      constellationBenchmarks: CONSTELLATION_BENCHMARKS,
      scoreAllTemplatesFn: scoreAllTemplates,
    });

    this.applyCanonicalContextMetadata(rec, accountContext, conflictedCharacterKeys);
    rec.explanations = explainPullValue(rec);

    return {
      comparison: rec,
      analyzedAt: new Date().toISOString(),
    };
  }

  private evaluateBannersWithContext(params: {
    accountContext: AccountContext & { freshness?: AccountContextFreshness };
    rawRoster: CharacterWithWeapon[];
    ownedWeaponKeys: string[];
    favorites: string[];
    characterRecs: Awaited<
      ReturnType<CharacterIntelligenceService['getRecommendations']>
    >['recommendations'];
    options?: {
      weights?: PullUserWeights;
      budget?: PullBudgetInput;
    };
  }): PullIntelligenceResponse {
    const { accountContext, rawRoster, ownedWeaponKeys, favorites, characterRecs, options } =
      params;

    const { roster, conflictedCharacterKeys } = mapVerifiedRosterFromContext(
      rawRoster,
      accountContext,
    );
    const currentBreakdowns = scoreAllTemplates(META_TEMPLATES, roster);

    const now = new Date();
    const activeBanners = getVerifiedActiveBanners(ALL_BANNERS, RULES_SOURCE, now);

    const userWeights: PullUserWeights = options?.weights ?? {
      weightEndgame: 0.35,
      weightFlexibility: 0.25,
      weightComfort: 0.2,
      weightFavorites: 0.2,
    };

    const budget: PullBudgetInput = options?.budget ?? {
      primogems: 0,
      fates: 0,
      pity: 0,
      guaranteed: false,
    };

    const isPartialRoster = accountContext.rosterScope === 'partial';
    const isPublicShowcase = accountContext.scope === 'public_uid';
    const responseIsPartial = isPublicShowcase ? isPartialRoster : false;

    if (activeBanners.length === 0) {
      return {
        available: false,
        reason: 'No verified active banners currently live.',
        status: 'UNAVAILABLE',
        confidence: 'STALE',
        recommendations: [],
        userWeights,
        isPartialAccount: responseIsPartial,
        analyzedAt: now.toISOString(),
      };
    }

    const freshness = resolveAccountFreshness(accountContext);
    const responseConfidence: PullConfidence = freshness === 'stale' ? 'STALE' : 'VERIFIED';

    const recommendations: PullRecommendation[] = activeBanners
      .map((banner) => {
        const target = {
          targetKey: banner.fiveStarKey,
          targetType: (banner.type === 'WEAPON' ? 'weapon' : 'character') as 'character' | 'weapon',
          mode: (banner.type === 'WEAPON' ? 'signature_weapon' : 'c0_unlock') as PullTargetMode,
        };

        const rec = evaluateCounterfactualAddition({
          target,
          banner,
          roster,
          accountContext: {
            ...accountContext,
            isPartialAccount: responseIsPartial,
            favorites,
            ownedWeaponKeys,
            characterElements: CHARACTER_ELEMENTS,
          },
          templates: META_TEMPLATES,
          currentBreakdowns,
          characterRecs,
          userWeights,
          budget,
          constellationBenchmarks: CONSTELLATION_BENCHMARKS,
          scoreAllTemplatesFn: scoreAllTemplates,
        });

        this.applyCanonicalContextMetadata(rec, accountContext, conflictedCharacterKeys);
        rec.explanations = explainPullValue(rec);
        return rec;
      })
      .sort((a, b) => b.accountValueScore - a.accountValueScore);

    return {
      available: true,
      status: 'AVAILABLE',
      confidence: responseConfidence,
      recommendations,
      userWeights,
      isPartialAccount: responseIsPartial,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Enforces canonical AccountContext invariants on a calculated PullRecommendation:
   * 1. Partial roster scope (`rosterScope === 'partial'`): absent characters are `ownership: 'unknown'`,
   *    never treated as confirmed unowned role deficits.
   * 2. Stale freshness (`freshness === 'stale'`): attaches provenance notice and downgrades live confidence.
   * 3. Conflicted builds (`buildState === 'conflicted'`): flags skipped conflicted character builds.
   */
  private applyCanonicalContextMetadata(
    rec: PullRecommendation,
    accountContext: AccountContext & { freshness?: AccountContextFreshness },
    conflictedCharacterKeys: string[],
  ): void {
    const freshness = resolveAccountFreshness(accountContext);
    const isPartialRoster = accountContext.rosterScope === 'partial';

    if (isPartialRoster && accountContext.absentCharacterOwnership === 'unknown') {
      if (!rec.missingDataNotes.includes(PARTIAL_ROSTER_OWNERSHIP_NOTE)) {
        rec.missingDataNotes.push(PARTIAL_ROSTER_OWNERSHIP_NOTE);
      }
      if (accountContext.scope === 'public_uid') {
        rec.isPartialAccount = true;
      }
    }

    if (conflictedCharacterKeys.length > 0) {
      const conflictNote = `Conflicted character build(s) [${conflictedCharacterKeys.join(', ')}] were excluded from team and role deficit calculations.`;
      if (!rec.missingDataNotes.includes(conflictNote)) {
        rec.missingDataNotes.push(conflictNote);
      }
    }

    if (freshness === 'stale') {
      rec.provenanceNotices = rec.provenanceNotices ?? [];
      if (!rec.provenanceNotices.includes(STALE_CONTEXT_PROVENANCE_NOTICE)) {
        rec.provenanceNotices.push(STALE_CONTEXT_PROVENANCE_NOTICE);
      }
      if (!rec.simulation && rec.confidence !== 'SIMULATED_SCENARIO') {
        rec.confidence = 'STALE';
      }
    }
  }
}
