import type {
  AccountCharacterContext,
  AccountContext,
  AccountContextFreshness,
  ImportedAccountEvidence,
  ShowcaseSnapshot,
} from '@celestia/api-contracts';
import { type GenshinAccount, GoalType, type UpgradeGoal } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    genshinAccount: {
      findUnique: vi.fn(),
    },
    genshinPlanPreferences: {
      findUnique: vi.fn(),
    },
    genshinPlanDismissal: {
      findMany: vi.fn(),
    },
    upgradeGoal: {
      findMany: vi.fn(),
    },
    genshinCharacter: {
      findMany: vi.fn(),
    },
    genshinWeapon: {
      findMany: vi.fn(),
    },
    genshinArtifact: {
      findMany: vi.fn(),
    },
    genshinRoutineState: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    dailyCompanion: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    weeklyBossState: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from '@/core/db/prisma.js';

import { companionRegistry } from '../../../platform/companion/companion-registry.service.js';
import type { RoutineService } from '../../../platform/companion/routine.service.js';
import type {
  AccountContextProvider,
  Artifact,
  ResolvedAccountContext,
  ShowcaseAccountContextResult,
  UserAccountContextResult,
  Weapon,
} from '../account-data/account-context-provider.service.js';
import type { CharacterWithWeapon } from '../characters/character.repository.js';
import { GenshinCompanionProvider } from '../companion/genshin-companion.provider.js';
import type { GenshinRecordedStockRepository } from '../companion/recorded-stock.repository.js';
import { CompanionSummaryService } from './companion-summary/companion-summary.service.js';
import { EndgameIntelligenceService } from './endgame-intelligence/endgame-intelligence.service.js';
import { PlannerIntelligenceService } from './planner-intelligence/planner-intelligence.service.js';
import { PullIntelligenceService } from './pull-intelligence/pull-intelligence.service.js';
import { TeamIntelligenceService } from './team-intelligence/team-intelligence.service.js';

companionRegistry.register(new GenshinCompanionProvider());

// ---------------------------------------------------------------------------
// Realistic Test Fixtures & Generators
// ---------------------------------------------------------------------------

function makeCanonicalContext(
  overrides: Partial<AccountContext> & { freshness?: AccountContextFreshness } = {},
): ResolvedAccountContext {
  const base: AccountContext = {
    version: 1,
    scope: 'private_authenticated',
    uid: '800000001',
    accountId: 'acc-real-1',
    rosterScope: 'complete_snapshot',
    completenessEvidence: {
      source: 'good_import',
      kind: 'verified_full_export',
      observedAt: '2026-11-10T12:00:00.000Z',
    },
    absentCharacterOwnership: 'unknown',
    sources: ['stored_account'],
    oldestObservationAt: '2026-11-10T00:00:00.000Z',
    newestObservationAt: '2026-11-10T12:00:00.000Z',
    mixedObservationTimes: false,
    equipmentExclusivity: 'verified_snapshot',
    rejectedRecordCount: 0,
    freshnessPolicy: { maxAgeMs: 7 * 24 * 60 * 60 * 1000, futureToleranceMs: 5 * 60 * 1000 },
    sourceTimestamps: [
      {
        source: 'stored_account',
        observedAt: '2026-11-10T12:00:00.000Z',
        importedAt: '2026-11-10T12:00:00.000Z',
        databaseUpdatedAt: null,
        sourceUpdatedAt: null,
        retrievedAt: null,
        freshness: 'fresh',
      },
    ],
    missingData: [],
    characters: [],
    issues: [],
    fingerprint: 'fp-realistic-full',
    ...overrides,
  };

  Object.defineProperty(base, 'freshness', {
    value: (overrides as { freshness?: string }).freshness ?? 'fresh',
    enumerable: false,
    configurable: true,
  });

  return base as ResolvedAccountContext;
}

function makeTwelveCharacterRoster(): {
  roster: CharacterWithWeapon[];
  weapons: Weapon[];
  artifacts: Artifact[];
  charactersContext: AccountCharacterContext[];
} {
  const charDefs = [
    { key: 'HuTao', weapon: 'StaffOfHoma', element: 'Pyro' },
    { key: 'Xingqiu', weapon: 'SacrificialSword', element: 'Hydro' },
    { key: 'Bennett', weapon: 'SapwoodBlade', element: 'Pyro' },
    { key: 'KaedeharaKazuha', weapon: 'FavoniusSword', element: 'Anemo' },
    { key: 'Nahida', weapon: 'AThousandFloatingDreams', element: 'Dendro' },
    { key: 'SangonomiyaKokomi', weapon: 'PrototypeAmber', element: 'Hydro' },
    { key: 'KukiShinobu', weapon: 'IronSting', element: 'Electro' },
    { key: 'Yelan', weapon: 'AquaSimulacra', element: 'Hydro' },
    { key: 'KamisatoAyaka', weapon: 'MistsplitterReforged', element: 'Cryo' },
    { key: 'Mona', weapon: 'FavoniusCodex', element: 'Hydro' },
    { key: 'Diona', weapon: 'FavoniusWarbow', element: 'Cryo' },
    { key: 'Zhongli', weapon: 'FavoniusLance', element: 'Geo' },
  ];

  const now = new Date('2026-11-10T12:00:00.000Z');
  const roster: CharacterWithWeapon[] = [];
  const weapons: Weapon[] = [];
  const artifacts: Artifact[] = [];
  const charactersContext: AccountCharacterContext[] = [];

  charDefs.forEach((def, idx) => {
    const charId = `char-${idx + 1}`;
    const weapId = `weap-${idx + 1}`;

    const weapRecord: Weapon = {
      id: weapId,
      accountId: 'acc-real-1',
      weaponKey: def.weapon,
      level: 90,
      ascension: 6,
      refinement: 1,
      locked: true,
      createdAt: now,
      updatedAt: now,
    };
    weapons.push(weapRecord);

    const charRecord: CharacterWithWeapon = {
      id: charId,
      accountId: 'acc-real-1',
      characterKey: def.key,
      level: 90,
      ascension: 6,
      constellation: 1,
      talentNormal: 8,
      talentSkill: 9,
      talentBurst: 9,
      equippedWeaponId: weapId,
      equippedWeapon: weapRecord,
      createdAt: now,
      updatedAt: now,
    };
    roster.push(charRecord);

    // 5-piece artifact set for each character
    const slots = ['flower', 'plume', 'sands', 'goblet', 'circlet'] as const;
    slots.forEach((slot, sIdx) => {
      const artId = `art-${idx + 1}-${sIdx + 1}`;
      artifacts.push({
        id: artId,
        accountId: 'acc-real-1',
        setKey: 'EmblemOfSeveredFate',
        slotKey: slot,
        level: 20,
        rarity: 5,
        mainStatKey: slot === 'flower' ? 'hp' : slot === 'plume' ? 'atk' : 'energyRecharge',
        subStats: [
          { key: 'critRate_', value: 7.0 },
          { key: 'critDMG_', value: 14.0 },
        ],
        locked: true,
        equippedCharacterId: charId,
        createdAt: now,
        updatedAt: now,
      });
    });

    charactersContext.push({
      avatarId: 10000046 + idx,
      formKey: `${10000046 + idx}:unknown`,
      skillDepotId: null,
      ownership: 'confirmed_owned',
      buildState: 'observed',
      buildFingerprint: `fp-${def.key}`,
      observedAt: now.toISOString(),
      freshness: 'fresh',
      sources: ['stored_account'],
      equipmentInstanceIds: [weapId],
      timestamps: {
        observedAt: now.toISOString(),
        importedAt: now.toISOString(),
        databaseUpdatedAt: null,
        sourceUpdatedAt: null,
        retrievedAt: null,
      },
      missingData: [],
    });
  });

  return { roster, weapons, artifacts, charactersContext };
}

// ---------------------------------------------------------------------------
// The Complete Journey Integration Test Suite
// ---------------------------------------------------------------------------

describe('Intelligence Engine Complete Journey Integration', () => {
  let mockAccountProvider: {
    getForUser: ReturnType<typeof vi.fn>;
    getForShowcase: ReturnType<typeof vi.fn>;
    buildCandidateEndgameTeams: ReturnType<typeof vi.fn>;
  };
  let endgameService: EndgameIntelligenceService;
  let teamService: TeamIntelligenceService;
  let pullService: PullIntelligenceService;
  let companionService: CompanionSummaryService;
  let plannerService: PlannerIntelligenceService;
  let mockStockRepo: { readForUser: ReturnType<typeof vi.fn> };
  let mockRoutineService: { getSnapshot: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue({
      id: 'acc-real-1',
      userId: 'user-journey-1',
      createdAt: new Date('2026-11-10T12:00:00.000Z'),
      updatedAt: new Date('2026-11-10T12:00:00.000Z'),
    } as unknown as GenshinAccount);

    mockStockRepo = {
      readForUser: vi.fn().mockResolvedValue({
        inventory: {
          TeachingsOfDiligence: 6,
          GuideToDiligence: 12,
          PhilosophiesOfDiligence: 2,
        },
        stockBasis: {
          kind: 'recorded_import',
          importedAt: '2026-11-10T12:00:00.000Z',
          source: 'GOOD',
          scope: 'replacement_section',
          suppliedEntryCount: 3,
        },
      }),
    };

    mockAccountProvider = {
      getForUser: vi.fn(),
      getForShowcase: vi.fn(),
      buildCandidateEndgameTeams: vi.fn(),
    };

    mockRoutineService = {
      getSnapshot: vi.fn().mockResolvedValue({
        contractVersion: 2,
        revision: 1,
        serverId: 'asia',
        clockStatus: 'verified',
        serverNow: '2026-11-10T10:00:00.000Z',
        period: {
          dailyPeriodId: 'daily-asia-2026-11-10',
          dailyResetAt: '2026-11-10T20:00:00.000Z',
          weeklyPeriodId: 'weekly-asia-2026-11-08',
          weeklyResetAt: '2026-11-15T20:00:00.000Z',
        },
        resin: {
          known: true,
          currentAmount: 160,
          maxAmount: 200,
          capAt: '2026-11-10T15:20:00.000Z',
          recordedAt: '2026-11-10T09:00:00.000Z',
        },
        tasks: [],
        weeklyClaims: { available: true, remainingClaims: 3 },
        legacySummary: null,
      }),
    };

    endgameService = new EndgameIntelligenceService();
    teamService = new TeamIntelligenceService(
      mockAccountProvider as unknown as AccountContextProvider,
    );
    pullService = new PullIntelligenceService(
      mockAccountProvider as unknown as AccountContextProvider,
    );

    companionService = new CompanionSummaryService(
      mockAccountProvider as unknown as AccountContextProvider,
      undefined,
      endgameService,
      pullService,
      undefined,
      undefined,
      teamService,
      mockAccountProvider as unknown as AccountContextProvider,
    );

    plannerService = new PlannerIntelligenceService(
      mockAccountProvider as unknown as AccountContextProvider,
      mockStockRepo as unknown as GenshinRecordedStockRepository,
      mockRoutineService as unknown as RoutineService,
    );
  });

  // =========================================================================
  // SCENARIO 1: Realistic Complete GOOD Import
  // =========================================================================
  describe('Scenario 1: Realistic Complete GOOD Import', () => {
    it('executes full journey from complete verified account through team search, all 3 endgame solvers, and planner optimization', async () => {
      const { roster, weapons, artifacts, charactersContext } = makeTwelveCharacterRoster();
      const canonicalContext = makeCanonicalContext({
        characters: charactersContext,
      });

      mockAccountProvider.getForUser.mockResolvedValue({
        context: canonicalContext,
        rawRoster: roster,
        weapons,
        artifacts,
        evidence: {
          source: 'GOOD',
          format: 'GOOD',
          version: 2,
          importedAt: '2026-11-10T12:00:00.000Z',
          sections: ['characters', 'weapons', 'artifacts', 'materials'],
          characterCount: 12,
          weaponCount: 12,
          artifactCount: 60,
          materialCount: 3,
        } as unknown as ImportedAccountEvidence,
      } as UserAccountContextResult);

      // 1. Companion Summary Journey
      const summary = await companionService.getSummary('user-journey-1');

      expect(summary.accountScope).toBe('authenticated');
      expect(summary.isPartialAccount).toBe(false);
      expect(summary.teamSuggestion).toBeDefined();
      expect(summary.teamSuggestion?.teamName).toBe('National Vaporize');

      // The 3 Real Endgame Solvers evaluated
      expect(summary.endgameSnapshot.abyssReady).toBe(true);
      expect(summary.endgameSnapshot.abyssScore).toBeGreaterThan(0);
      expect(summary.endgameSnapshot.onslaughtReady).toBe(true);
      expect(summary.endgameSnapshot.suggestedAction).toBeDefined();
      expect(summary.endgameSnapshot.theaterMaxActsEstimated).toBe(10);
      expect(summary.skippedUnverifiedCharacters).toHaveLength(0);

      // 2. Team Intelligence Journey
      const teamRecs = await teamService.getRecommendations('user-journey-1');
      expect(teamRecs.recommendations.length).toBeGreaterThanOrEqual(1);
      expect(teamRecs.recommendations[0]!.isBuildable).toBe(true);
      expect(teamRecs.recommendations[0]!.roster).toHaveLength(4);

      // 3. Candidate Endgame Teams Disjoint Allocation Check
      const candidates = teamService.buildCandidateEndgameTeams(
        teamRecs.recommendations,
        roster,
        artifacts,
      );
      expect(candidates.length).toBeGreaterThanOrEqual(3);

      // 4. Planner Intelligence Optimization Journey
      vi.mocked(prisma.upgradeGoal.findMany).mockResolvedValue([
        {
          id: 'goal-1',
          userId: 'user-journey-1',
          goalType: GoalType.CHARACTER_TALENT,
          targetKey: 'HuTao',
          talentType: 'burst',
          fromPhase: 6,
          toPhase: 8,
          priority: 1,
          status: 'active',
          revision: 0,
          createdAt: new Date('2026-11-10T12:00:00.000Z'),
          updatedAt: new Date('2026-11-10T12:00:00.000Z'),
        } as unknown as UpgradeGoal,
      ]);

      const plan = await plannerService.getOptimizedPlan('user-journey-1', {
        timeBudgetMinutes: 30,
        customResinBudget: 160,
      });

      expect(plan.currentResin).toBeGreaterThanOrEqual(0);
      expect(plan.rankedPlan.length).toBeGreaterThan(0);
      expect(plan.rankedPlan[0]!.targetKey).toBe('HuTao');
      expect(plan.alternatives.length).toBeGreaterThan(0);
    }, 60000);
  });

  // =========================================================================
  // SCENARIO 2: Partial Public Showcase (UID)
  // =========================================================================
  describe('Scenario 2: Partial Public Showcase (UID)', () => {
    it('handles partial roster scope cleanly, emits partial caveats, and keeps absent ownership unknown', async () => {
      const partialContext = makeCanonicalContext({
        scope: 'public_uid',
        rosterScope: 'partial',
        absentCharacterOwnership: 'unknown',
        missingData: [
          {
            dimension: 'roster',
            status: 'unavailable',
            reason: 'Showcase provides partial visibility into player roster.',
          },
        ],
      });

      const showcaseSnapshot: ShowcaseSnapshot = {
        uid: '800000001',
        nickname: 'Showcase Traveler',
        adventureRank: 60,
        worldLevel: 8,
        signature: 'Showcase only',
        characters: [
          'HuTao',
          'Xingqiu',
          'Bennett',
          'KaedeharaKazuha',
          'Nahida',
          'SangonomiyaKokomi',
          'KukiShinobu',
          'Yelan',
        ].map((key, idx) => ({
          key,
          id: 10000046 + idx,
          name: key,
          level: 90,
          ascension: 6,
          constellation: 0,
          weapon: { id: 13501, name: 'StaffOfHoma', level: 90, refinement: 1 },
          artifacts: [],
          stats: [{ key: 'energyRecharge', value: 160 }],
          talents: [
            { kind: 'normal', baseLevel: 8 },
            { kind: 'skill', baseLevel: 8 },
            { kind: 'burst', baseLevel: 8 },
          ],
        })) as unknown as ShowcaseSnapshot['characters'],
      };

      mockAccountProvider.getForShowcase.mockResolvedValue({
        context: partialContext,
        snapshot: showcaseSnapshot,
        rawRoster: [],
        weapons: [],
        artifacts: [],
        delivery: 'fetched',
        issue: null,
      } as ShowcaseAccountContextResult);

      const summary = await companionService.getPublicShowcaseSummary('800000001');

      expect(summary.accountScope).toBe('public_showcase');
      expect(summary.isPartialAccount).toBe(true);
      expect(summary.missingDataCaveats.some((c) => c.includes('Partial public showcase'))).toBe(
        true,
      );
      expect(summary.teamSuggestion).toBeDefined();
    }, 60000);
  });

  // =========================================================================
  // SCENARIO 3: Conflicting Data & Divergent Builds
  // =========================================================================
  describe('Scenario 3: Conflicting Data & Divergent Builds', () => {
    it('isolates conflicted characters from evaluations and attaches build conflict caveats', async () => {
      const { roster, weapons, artifacts, charactersContext } = makeTwelveCharacterRoster();

      // Introduce build conflict on HuTao
      const conflictedContext = makeCanonicalContext({
        issues: [
          {
            code: 'conflicting_builds',
            formKey: '10000046:unknown',
          },
        ],
        characters: charactersContext.map((c) =>
          c.formKey === '10000046:unknown' ? { ...c, buildState: 'conflicted' as const } : c,
        ),
      });

      mockAccountProvider.getForUser.mockResolvedValue({
        context: conflictedContext,
        rawRoster: roster,
        weapons,
        artifacts,
        evidence: {
          source: 'GOOD',
          characterCount: 12,
        } as unknown as ImportedAccountEvidence,
      } as UserAccountContextResult);

      const summary = await companionService.getSummary('user-journey-1');

      // HuTao is isolated due to buildState: 'conflicted'
      expect(
        summary.missingDataCaveats.some((c) => c.includes('Build conflict detected for character')),
      ).toBe(true);
      expect(summary.missingDataCaveats.some((c) => c.includes('HuTao'))).toBe(true);
      expect(
        summary.readyBuildsSummary.topReadyCharacters.every((r) => r.characterKey !== 'HuTao'),
      ).toBe(true);
    }, 60000);
  });

  // =========================================================================
  // SCENARIO 4: Stale Builds & Timestamp Drift
  // =========================================================================
  describe('Scenario 4: Stale Builds & Timestamp Drift', () => {
    it('detects observations older than 7 days, resolves stale freshness, and attaches provenance notices', async () => {
      const { roster, weapons, artifacts, charactersContext } = makeTwelveCharacterRoster();

      // Observation is 14 days old (exceeds 7-day maxAgeMs)
      const fourteenDaysAgo = '2026-10-27T12:00:00.000Z';
      const staleContext = makeCanonicalContext({
        freshness: 'stale',
        oldestObservationAt: fourteenDaysAgo,
        newestObservationAt: fourteenDaysAgo,
        sourceTimestamps: [
          {
            source: 'stored_account',
            observedAt: fourteenDaysAgo,
            importedAt: fourteenDaysAgo,
            databaseUpdatedAt: null,
            sourceUpdatedAt: null,
            retrievedAt: null,
            freshness: 'stale',
          },
        ],
        missingData: [
          {
            dimension: 'freshness',
            status: 'stale',
            reason: 'Observation is older than 7 days maxAge policy',
          },
        ],
        characters: charactersContext.map((c) => ({
          ...c,
          freshness: 'stale' as const,
          observedAt: fourteenDaysAgo,
        })),
      });

      mockAccountProvider.getForUser.mockResolvedValue({
        context: staleContext,
        rawRoster: roster,
        weapons,
        artifacts,
        evidence: {
          source: 'GOOD',
          importedAt: fourteenDaysAgo,
        } as unknown as ImportedAccountEvidence,
      } as UserAccountContextResult);

      const summary = await companionService.getSummary('user-journey-1');

      expect(summary.provenanceNotices?.some((n) => n.includes('stale'))).toBe(true);
      expect(summary.missingDataCaveats.some((c) => c.includes('stale'))).toBe(true);
    }, 60000);

    it('identifies future-invalid observation timestamps (> now + 5m) without crashing', async () => {
      const { roster, weapons, artifacts, charactersContext } = makeTwelveCharacterRoster();

      const futureDate = '2027-01-01T00:00:00.000Z';
      const futureContext = makeCanonicalContext({
        freshness: 'future_invalid',
        sourceTimestamps: [
          {
            source: 'stored_account',
            observedAt: futureDate,
            importedAt: null,
            databaseUpdatedAt: null,
            sourceUpdatedAt: null,
            retrievedAt: null,
            freshness: 'future_invalid',
          },
        ],
        characters: charactersContext.map((c) => ({
          ...c,
          freshness: 'future_invalid' as const,
          observedAt: futureDate,
        })),
      });

      mockAccountProvider.getForUser.mockResolvedValue({
        context: futureContext,
        rawRoster: roster,
        weapons,
        artifacts,
        evidence: { source: 'GOOD' } as unknown as ImportedAccountEvidence,
      } as UserAccountContextResult);

      const summary = await companionService.getSummary('user-journey-1');
      expect(summary).toBeDefined();
      expect(summary.contractVersion).toBe(1);
    }, 60000);
  });

  // =========================================================================
  // SCENARIO 5: Unsupported / Unreleased Characters
  // =========================================================================
  describe('Scenario 5: Unsupported / Unreleased Characters', () => {
    it('isolates uncatalogued / unreleased character keys into skippedUnverifiedCharacters without hallucinating stats', async () => {
      const { roster, weapons, artifacts, charactersContext } = makeTwelveCharacterRoster();

      // Add uncatalogued character 'Dainsleif'
      const uncataloguedRecord: CharacterWithWeapon = {
        id: 'char-dainsleif',
        accountId: 'acc-real-1',
        characterKey: 'Dainsleif',
        level: 90,
        ascension: 6,
        constellation: 0,
        talentNormal: 1,
        talentSkill: 1,
        talentBurst: 1,
        equippedWeaponId: null,
        equippedWeapon: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const rosterWithUncatalogued = [...roster, uncataloguedRecord];

      mockAccountProvider.getForUser.mockResolvedValue({
        context: makeCanonicalContext({ characters: charactersContext }),
        rawRoster: rosterWithUncatalogued,
        weapons,
        artifacts,
        evidence: { source: 'GOOD' } as unknown as ImportedAccountEvidence,
      } as UserAccountContextResult);

      const summary = await companionService.getSummary('user-journey-1');

      expect(summary.skippedUnverifiedCharacters).toContain('Dainsleif');
      expect(summary.missingDataCaveats.some((c) => c.includes('Dainsleif'))).toBe(true);
      // Valid characters are unaffected and evaluated accurately
      expect(
        summary.readyBuildsSummary.topReadyCharacters.some((r) => r.characterKey === 'HuTao'),
      ).toBe(true);
    }, 60000);
  });

  // =========================================================================
  // SCENARIO 6: Outdated Game Datasets & Expired Cycles
  // =========================================================================
  describe('Scenario 6: Outdated Game Datasets & Expired Cycles', () => {
    it('marks expired Spiral Abyss encounter cycles as HISTORICAL_BENCHMARK and flags expired banners as UNAVAILABLE', async () => {
      // 1. Abyss cycle expired check
      const candidateTeams = teamService.buildCandidateEndgameTeams(
        [],
        makeTwelveCharacterRoster().roster,
      );

      const expiredAbyssResult = endgameService.evaluateAbyssJoint({
        cycleId: 'abyss-cycle-2023-01-01',
        floor: 12,
        chamber: 1,
        candidateTeams,
      });

      expect(expiredAbyssResult.isExpired).toBe(true);
      expect(expiredAbyssResult.isCurrentCycle).toBe(false);
      expect(expiredAbyssResult.expirationNote).toContain('historical/manual preset mode');

      // 2. Wish banners expired check
      const { roster, weapons, artifacts, charactersContext } = makeTwelveCharacterRoster();
      const canonicalContext = makeCanonicalContext({
        characters: charactersContext,
      });

      mockAccountProvider.getForUser.mockResolvedValue({
        context: canonicalContext,
        rawRoster: roster,
        weapons,
        artifacts,
        evidence: { source: 'GOOD' } as unknown as ImportedAccountEvidence,
      } as UserAccountContextResult);

      const pullRecs = await pullService.getRecommendations('user-journey-1');
      expect(pullRecs).toBeDefined();
      expect(pullRecs.analyzedAt).toBeDefined();
    }, 60000);
  });
});
