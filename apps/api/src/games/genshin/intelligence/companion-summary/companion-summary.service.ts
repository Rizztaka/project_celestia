import { createRequire } from 'node:module';

import type {
  AccountCharacterContext,
  AccountContext,
  AccountContextFreshness,
  CharacterReadinessRequestInput,
  CompanionSummaryResponse,
  MarginalInvestmentRequestInput,
  OptimizationPlanAction,
  OptimizationPlannerResponse,
  PullAdviceSnapshot,
  SupportedServerId,
  TeamSuggestionSnapshot,
} from '@celestia/api-contracts';
import { optimizationPlannerResponseSchema } from '@celestia/api-contracts';

const require = createRequire(import.meta.url);
const CHARACTER_ELEMENTS: Record<string, string> = require('../../static/character-elements.json');
const DEFAULT_ENCOUNTERS = require('../../static/endgame-encounters.json') as {
  cycleId?: string;
  theaterSeason?: { seasonId?: string } | null;
};

const DEFAULT_ABYSS_CYCLE_ID = DEFAULT_ENCOUNTERS.cycleId ?? '5.2-1';
const DEFAULT_THEATER_SEASON_ID = DEFAULT_ENCOUNTERS.theaterSeason?.seasonId ?? '2026-11-01';

import {
  AccountContextProvider,
  type Artifact,
  resolveAccountFreshness,
  resolveCharacterFormIdentity,
  resolveCharacterKey,
} from '../../account-data/account-context-provider.service.js';
import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { GenshinCharacterService } from '../../characters/character.service.js';
import { getOpenDomains } from '../../companion/domain-schedule.js';
import { getServerWeekday } from '../../companion/server-clock.js';
import { ImportedAccountService } from '../../importer/imported-account.service.js';
import { ShowcaseService } from '../../showcase/showcase.service.js';
import { EndgameIntelligenceService } from '../endgame-intelligence/endgame-intelligence.service.js';
import { MarginalInvestmentService } from '../marginal-investment/marginal-investment.service.js';
import { discoverAutonomousProgression } from '../planner-intelligence/autonomous-progression.calculator.js';
import { PlannerIntelligenceService } from '../planner-intelligence/planner-intelligence.service.js';
import { optimizePlannerSchedule } from '../planner-intelligence/planner-optimization.calculator.js';
import {
  explainOptimizationAlternative,
  explainOptimizationSummary,
  toOptimizationPlanAction,
} from '../planner-intelligence/planner-optimization.explainer.js';
import { PullIntelligenceService } from '../pull-intelligence/pull-intelligence.service.js';
import {
  buildAuthenticatedReadinessInput,
  buildShowcaseReadinessInput,
  type ShowcaseCharacterRecord,
} from '../readiness-intelligence/readiness-input.adapter.js';
import { ReadinessIntelligenceService } from '../readiness-intelligence/readiness-intelligence.service.js';
import {
  TeamIntelligenceService,
  type TeamRecommendation,
} from '../team-intelligence/team-intelligence.service.js';
import {
  calculateCompanionSummary,
  type EvaluatedCharacterReadiness,
  type EvaluatedEndgameStatus,
  type EvaluatedMarginalUpgrade,
} from './companion-summary.calculator.js';
import { explainCompanionSummary } from './companion-summary.explainer.js';

function serverFromUid(uid: string): SupportedServerId {
  if (uid.startsWith('6')) return 'america';
  if (uid.startsWith('7')) return 'europe';
  if (uid.startsWith('9')) return 'tw_hk_mo';
  return 'asia';
}

const TARGET_ENCOUNTER = {
  encounterId: 'abyss_12',
  name: 'Spiral Abyss Floor 12',
  difficulty: 'abyss_12' as const,
  minCharacterLevel: 80,
  minWeaponLevel: 80,
};

function deriveContextCaveatsAndNotices(params: {
  accountContext: AccountContext & { freshness?: AccountContextFreshness };
  conflictedCharacters: string[];
}): {
  extraCaveats: string[];
  provenanceNotices: string[];
} {
  const { accountContext, conflictedCharacters } = params;
  const extraCaveats: string[] = [];
  const provenanceNotices: string[] = [];

  if (conflictedCharacters.length > 0) {
    extraCaveats.push(
      `Build conflict detected for character(s) [${conflictedCharacters.join(', ')}]; conflicted builds were excluded from readiness and marginal upgrade evaluations.`,
    );
  }

  for (const item of accountContext.missingData) {
    if (
      item.dimension === 'roster' &&
      accountContext.scope === 'public_uid' &&
      accountContext.rosterScope === 'partial'
    ) {
      extraCaveats.push(
        'Partial public showcase: only showcased characters are evaluated. Unobserved roster units are omitted rather than treated as unowned.',
      );
    } else if (item.dimension === 'equipment_exclusivity' && item.status === 'unknown') {
      extraCaveats.push(
        'Equipment exclusivity is unverified across snapshot characters; shared gear assignments cannot be ruled out.',
      );
    } else if (item.dimension === 'freshness' && item.status === 'stale') {
      const msg =
        'Account observation data is stale (exceeded freshness policy window); in-game build progression may have changed.';
      extraCaveats.push(msg);
      provenanceNotices.push(msg);
    }
  }

  const freshness = resolveAccountFreshness(accountContext);
  if (freshness === 'stale') {
    const staleMsg =
      'Account observation data is stale (exceeded freshness policy window); in-game build progression may have changed.';
    if (!extraCaveats.includes(staleMsg)) {
      extraCaveats.push(staleMsg);
    }
    if (!provenanceNotices.includes(staleMsg)) {
      provenanceNotices.push(staleMsg);
    }
  } else if (freshness === 'unknown') {
    provenanceNotices.push(
      'Observation timestamp is unknown; summary reflects stored account state rather than a live dated game observation.',
    );
  }

  return { extraCaveats, provenanceNotices };
}

function toTeamSuggestionSnapshot(rec: TeamRecommendation): TeamSuggestionSnapshot {
  const memberKeys = rec.roster.map((r) => r.characterKey).filter((k): k is string => Boolean(k));
  return {
    teamName: rec.templateName,
    members: memberKeys.length > 0 ? memberKeys : ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'],
    archetype: rec.archetype,
    comfortRating: rec.reaction,
    keyAdvantage: rec.explanations[0] ?? 'High meta synergy and reaction efficiency.',
    targetRoute: '/teams',
    ...(typeof rec.simulatedDps === 'number' ? { simulatedDps: rec.simulatedDps } : {}),
    ...(typeof rec.errorMargin === 'number' ? { errorMargin: rec.errorMargin } : {}),
    ...(rec.simulationStatus ? { simulationStatus: rec.simulationStatus } : {}),
  };
}

export class CompanionSummaryService {
  private readonly accountContextProvider: AccountContextProvider;
  private readonly readinessService: ReadinessIntelligenceService;
  private readonly marginalService: MarginalInvestmentService;
  private readonly endgameService: EndgameIntelligenceService;
  private readonly pullService: PullIntelligenceService;
  private readonly teamService: TeamIntelligenceService;
  private readonly plannerService: PlannerIntelligenceService;

  constructor(
    providerOrReadinessService?: AccountContextProvider | ReadinessIntelligenceService,
    marginalService = new MarginalInvestmentService(),
    endgameService = new EndgameIntelligenceService(),
    pullService?: PullIntelligenceService,
    characterService = new GenshinCharacterService(),
    showcaseService = new ShowcaseService(),
    teamService?: TeamIntelligenceService,
    explicitProvider?: AccountContextProvider,
    plannerService?: PlannerIntelligenceService,
  ) {
    if (providerOrReadinessService && 'getForUser' in providerOrReadinessService) {
      this.accountContextProvider = providerOrReadinessService;
      this.readinessService = new ReadinessIntelligenceService();
      this.marginalService = marginalService;
      this.endgameService = endgameService;
      this.pullService = pullService ?? new PullIntelligenceService(this.accountContextProvider);
      this.teamService =
        teamService ?? new TeamIntelligenceService(this.accountContextProvider, characterService);
      this.plannerService =
        plannerService ?? new PlannerIntelligenceService(this.accountContextProvider);
    } else {
      this.readinessService = providerOrReadinessService ?? new ReadinessIntelligenceService();
      this.marginalService = marginalService;
      this.endgameService = endgameService;
      this.accountContextProvider =
        explicitProvider ??
        new AccountContextProvider(new ImportedAccountService(), showcaseService, characterService);
      this.pullService =
        pullService ??
        new PullIntelligenceService(
          undefined,
          characterService,
          showcaseService,
          this.accountContextProvider,
        );
      this.teamService =
        teamService ?? new TeamIntelligenceService(this.accountContextProvider, characterService);
      this.plannerService =
        plannerService ?? new PlannerIntelligenceService(this.accountContextProvider);
    }
  }

  /**
   * Generates orchestrated companion summary for an authenticated user account
   * using the unified `AccountContextProvider`, real team search, and the three endgame solvers.
   */
  async getSummary(userId: string): Promise<CompanionSummaryResponse> {
    const resolved = await this.accountContextProvider.getForUser(userId);
    const { context: accountContext, rawRoster } = resolved;
    const artifacts: Artifact[] = resolved.artifacts ?? [];

    const server: SupportedServerId = serverFromUid(accountContext.uid ?? '');
    const now = new Date();
    const openDomains = getOpenDomains(now, server);
    const openDropKeySet = new Set(openDomains.flatMap((d) => d.dropKeys));
    const domainFamilies = openDomains.map((d) => d.drops[0] ?? d.name);

    // 1. Evaluate team recommendations for the roster
    let teamRecommendations: TeamRecommendation[] = [];
    let teamSuggestion: TeamSuggestionSnapshot | undefined;

    if (typeof this.teamService.getSimulatedRecommendationsForRoster === 'function') {
      try {
        teamRecommendations = await this.teamService.getSimulatedRecommendationsForRoster(
          rawRoster,
          { limit: 8, simulateTopN: 1 },
        );
        if (teamRecommendations.length > 0) {
          teamSuggestion = toTeamSuggestionSnapshot(teamRecommendations[0]!);
        }
      } catch {
        // Fallback below
      }
    }

    if (!teamSuggestion && typeof this.teamService.getRecommendationsForRoster === 'function') {
      try {
        teamRecommendations = this.teamService.getRecommendationsForRoster(rawRoster, {
          limit: 8,
        });
        if (teamRecommendations.length > 0) {
          teamSuggestion = toTeamSuggestionSnapshot(teamRecommendations[0]!);
        }
      } catch {
        // Fallback below
      }
    }

    if (!teamSuggestion && typeof this.teamService.getRecommendations === 'function') {
      try {
        const teamRes = await this.teamService.getRecommendations(userId);
        if (teamRes.recommendations.length > 0) {
          teamRecommendations = teamRes.recommendations;
          teamSuggestion = toTeamSuggestionSnapshot(teamRes.recommendations[0]!);
        }
      } catch {
        // Graceful fallback if no team is buildable or roster < 4
      }
    }

    const partyMembers =
      teamSuggestion?.members ??
      (rawRoster.length > 0 ? rawRoster.slice(0, 4).map((c) => c.characterKey) : undefined);

    // 2. Evaluate character readiness and marginal upgrades with real observed inputs
    const {
      readinessList,
      upgradesList,
      skippedUnverifiedCharacters,
      conflictedCharacters,
      verifiedRoster,
    } = this.evaluateCharacters({
      rawRoster,
      artifacts,
      accountContext,
      openDropKeySet,
      isShowcase: false,
      teamMembers: partyMembers,
    });

    // 3. Pull Intelligence
    let pullAdvice: PullAdviceSnapshot | undefined;
    try {
      const pullsResponse = await this.pullService.getRecommendations(userId);
      if (pullsResponse.recommendations.length > 0) {
        const top = pullsResponse.recommendations[0]!;
        pullAdvice = {
          recommendation: top.strategicRecommendation,
          targetBannerName: top.bannerName,
          targetCharacterKey: top.targetKey,
          keyReason: top.explanations[0] ?? 'Account value evaluation.',
        };
      }
    } catch {
      // Graceful fallback if pull engine cannot evaluate
    }

    // 4. Evaluate Endgame Status via the 3 real endgame solvers
    const endgameStatus = this.evaluateEndgameStatus({
      teamRecommendations,
      rawRoster: verifiedRoster,
      artifacts,
    });

    // 5. Optimization Planner Schedule (Milestone 7 Unified Pipeline)
    let optimizedPlan:
      | (OptimizationPlannerResponse & { allocatedPlan?: OptimizationPlanAction[] })
      | undefined;
    try {
      if (this.plannerService && typeof this.plannerService.getOptimizedPlan === 'function') {
        optimizedPlan = await this.plannerService.getOptimizedPlan(userId);
      }
    } catch {
      // Graceful fallback if planner encounters missing routine snapshot, unknown resin, or edge cases
    }

    const isPartialAccount =
      accountContext.scope === 'public_uid' && accountContext.rosterScope === 'partial';

    const calcResult = calculateCompanionSummary({
      accountScope: 'authenticated',
      isPartialAccount,
      readinessList,
      upgradesList,
      openDomainFamilies: domainFamilies,
      endgameStatus,
      pullAdvice,
      teamSuggestion,
      skippedUnverifiedCharacters,
      timestamp: now.toISOString(),
      optimizedPlan,
    });

    const { extraCaveats, provenanceNotices } = deriveContextCaveatsAndNotices({
      accountContext,
      conflictedCharacters,
    });

    for (const caveat of extraCaveats) {
      if (!calcResult.missingDataCaveats.includes(caveat)) {
        calcResult.missingDataCaveats.push(caveat);
      }
    }

    const narrativeOverview = explainCompanionSummary(calcResult);

    return {
      ...calcResult,
      ...(provenanceNotices.length > 0 ? { provenanceNotices } : {}),
      narrativeOverview,
    };
  }

  /**
   * Generates orchestrated companion summary for a public showcase UID
   * using the unified `AccountContextProvider`, real team search, and the three endgame solvers.
   */
  async getPublicShowcaseSummary(uid: string): Promise<CompanionSummaryResponse> {
    const resolved = await this.accountContextProvider.getForShowcase(uid);
    const { context: accountContext, snapshot, rawRoster } = resolved;
    const artifacts: Artifact[] = resolved.artifacts ?? [];

    const server = serverFromUid(accountContext.uid ?? uid);
    const now = new Date();
    const openDomains = getOpenDomains(now, server);
    const openDropKeySet = new Set(openDomains.flatMap((d) => d.dropKeys));
    const domainFamilies = openDomains.map((d) => d.drops[0] ?? d.name);

    const showcaseChars = snapshot?.characters ?? [];

    // 1. Evaluate team recommendations for the showcase roster
    let teamRecommendations: TeamRecommendation[] = [];
    let teamSuggestion: TeamSuggestionSnapshot | undefined;

    const teamServiceInstance =
      typeof this.teamService.getRecommendationsForRoster === 'function'
        ? this.teamService
        : new TeamIntelligenceService(this.accountContextProvider);

    try {
      const rosterForTeams = showcaseChars.length > 0 ? showcaseChars : rawRoster;
      if (typeof teamServiceInstance.getSimulatedRecommendationsForRoster === 'function') {
        teamRecommendations = await teamServiceInstance.getSimulatedRecommendationsForRoster(
          rosterForTeams,
          { limit: 8, simulateTopN: 1 },
        );
      } else {
        teamRecommendations = teamServiceInstance.getRecommendationsForRoster(rosterForTeams, {
          limit: 8,
        });
      }
      if (teamRecommendations.length > 0) {
        teamSuggestion = toTeamSuggestionSnapshot(teamRecommendations[0]!);
      }
    } catch {
      // Graceful fallback if showcase has < 4 characters or no buildable template
    }

    const partyMembers =
      teamSuggestion?.members ??
      (showcaseChars.length > 0
        ? showcaseChars.slice(0, 4).map((c) => resolveCharacterKey(c.key, c.id, c.name))
        : rawRoster.length > 0
          ? rawRoster.slice(0, 4).map((c) => c.characterKey)
          : undefined);

    // 2. Evaluate character readiness and marginal upgrades
    const {
      readinessList,
      upgradesList,
      skippedUnverifiedCharacters,
      conflictedCharacters,
      verifiedRoster,
    } = this.evaluateCharacters({
      rawRoster,
      artifacts,
      accountContext,
      openDropKeySet,
      isShowcase: true,
      showcaseCharacters: showcaseChars,
      teamMembers: partyMembers,
    });

    // 3. Pull Intelligence
    let pullAdvice: PullAdviceSnapshot | undefined;
    try {
      const pullsResponse = await this.pullService.getPublicShowcaseRecommendations(uid);
      if (pullsResponse.recommendations.length > 0) {
        const top = pullsResponse.recommendations[0]!;
        pullAdvice = {
          recommendation: top.strategicRecommendation,
          targetBannerName: top.bannerName,
          targetCharacterKey: top.targetKey,
          keyReason: top.explanations[0] ?? 'Account value evaluation.',
        };
      }
    } catch {
      // Fallback
    }

    // 4. Evaluate Endgame Status via the 3 real endgame solvers
    const endgameStatus = this.evaluateEndgameStatus({
      teamRecommendations,
      rawRoster: verifiedRoster,
      artifacts,
    });

    // 5. Autonomous Progression Optimization for Showcase (Milestone 7 Unified Pipeline)
    let showcaseOptimizedPlan:
      | (OptimizationPlannerResponse & { allocatedPlan?: OptimizationPlanAction[] })
      | undefined;
    try {
      const autoDiscovery = discoverAutonomousProgression({
        rawRoster: verifiedRoster,
        artifacts,
        teamMemberKeys: partyMembers,
      });

      if (autoDiscovery.candidates.length > 0) {
        const dayOfWeek = getServerWeekday(now, server);
        const calcResult = optimizePlannerSchedule({
          candidates: autoDiscovery.candidates,
          recordedInventory: {},
          currentResin: 160,
          dailyResinBudget: 160,
          timeBudgetMinutes: 30,
          dayOfWeek: dayOfWeek ?? 0,
        });

        const rankedPlan = calcResult.rankedPlan.map(toOptimizationPlanAction);
        const alternatives = calcResult.alternatives.map(explainOptimizationAlternative);
        const summaryText = explainOptimizationSummary(calcResult);

        const optimization: OptimizationPlannerResponse = optimizationPlannerResponseSchema.parse({
          summary: summaryText,
          currentResin: calcResult.currentResin,
          effectiveResinBudget: calcResult.effectiveResinBudget,
          timeBudgetMinutes: calcResult.timeBudgetMinutes,
          timeUntilCapped: 'Capped',
          rankedPlan,
          alternatives,
          unallocatedResin: calcResult.unallocatedResin,
          totalEstimatedMinutes: calcResult.totalEstimatedMinutes,
          analysedAt: now.toISOString(),
        });

        showcaseOptimizedPlan = Object.assign(optimization, { allocatedPlan: rankedPlan });
      }
    } catch {
      // Graceful fallback for showcase optimization
    }

    const isPartialAccount = accountContext.rosterScope === 'partial';

    const calcResult = calculateCompanionSummary({
      accountScope: 'public_showcase',
      isPartialAccount,
      readinessList,
      upgradesList,
      openDomainFamilies: domainFamilies,
      endgameStatus,
      pullAdvice,
      teamSuggestion,
      skippedUnverifiedCharacters,
      timestamp: now.toISOString(),
      optimizedPlan: showcaseOptimizedPlan,
    });

    const { extraCaveats, provenanceNotices } = deriveContextCaveatsAndNotices({
      accountContext,
      conflictedCharacters,
    });

    for (const caveat of extraCaveats) {
      if (!calcResult.missingDataCaveats.includes(caveat)) {
        calcResult.missingDataCaveats.push(caveat);
      }
    }

    const narrativeOverview = explainCompanionSummary(calcResult);

    return {
      ...calcResult,
      ...(provenanceNotices.length > 0 ? { provenanceNotices } : {}),
      narrativeOverview,
    };
  }

  /**
   * Evaluates Spiral Abyss (dual-half joint solver), Stygian Onslaught (3-boss disjoint solver),
   * and Imaginarium Theater (dynamic act & vigor planner) using candidate teams built from the
   * player's verified roster. Gracefully falls back when the roster is too small.
   */
  public evaluateEndgameStatus(params: {
    teamRecommendations: ReadonlyArray<TeamRecommendation>;
    rawRoster: ReadonlyArray<CharacterWithWeapon>;
    artifacts?: ReadonlyArray<Artifact>;
  }): EvaluatedEndgameStatus {
    const { teamRecommendations, rawRoster, artifacts } = params;

    const teamBuilder =
      typeof this.teamService.buildCandidateEndgameTeams === 'function'
        ? this.teamService
        : new TeamIntelligenceService(this.accountContextProvider);

    const candidateTeams = teamBuilder.buildCandidateEndgameTeams(
      teamRecommendations,
      rawRoster,
      artifacts,
    );

    let abyssScore = 0;
    let abyssReady = false;
    let onslaughtReady = false;
    let onslaughtScore = 0;
    let theaterMaxActs = 0;

    // 1. Spiral Abyss Dual-Half Joint Solver (requires >= 2 candidate teams with >= 8 distinct characters)
    if (candidateTeams.length >= 2) {
      try {
        const abyssJoint = this.endgameService.evaluateAbyssJoint({
          cycleId: DEFAULT_ABYSS_CYCLE_ID,
          floor: 12,
          chamber: 1,
          candidateTeams,
        });
        abyssScore = Math.min(100, Math.max(0, Math.round(abyssJoint.jointScore)));
        abyssReady =
          abyssJoint.isJointOptimal ||
          (abyssJoint.firstHalf.score >= 50 && abyssJoint.secondHalf.score >= 50);
      } catch {
        abyssScore = 0;
        abyssReady = false;
      }
    }

    // 2. Stygian Onslaught 3-Boss Allocation Solver (requires >= 3 candidate teams with >= 12 distinct characters)
    if (candidateTeams.length >= 3) {
      try {
        const onslaughtJoint = this.endgameService.evaluateOnslaughtJoint({
          cycleId: DEFAULT_ABYSS_CYCLE_ID,
          candidateTeams,
        });
        onslaughtReady = onslaughtJoint.allStagesCleared;
        onslaughtScore = Math.min(100, Math.max(0, Math.round(onslaughtJoint.jointScore)));
      } catch {
        onslaughtReady = false;
        onslaughtScore = 0;
      }
    }

    // 3. Imaginarium Theater Dynamic Act & Vigor Planner (requires >= 10 cast keys)
    const uniqueCastKeys: string[] = [];
    for (const char of rawRoster) {
      if (char.characterKey && !uniqueCastKeys.includes(char.characterKey)) {
        uniqueCastKeys.push(char.characterKey);
      }
    }

    if (uniqueCastKeys.length >= 10) {
      try {
        const remainingVigor: Record<string, number> = {};
        for (const key of uniqueCastKeys) {
          remainingVigor[key] = 2;
        }
        const theaterPlan = this.endgameService.evaluateTheaterActPlan({
          seasonId: DEFAULT_THEATER_SEASON_ID,
          difficulty: 'VISIONARY',
          castKeys: uniqueCastKeys,
          currentAct: 1,
          remainingVigor,
        });
        theaterMaxActs = Math.min(10, theaterPlan.projectedSchedule.length);
      } catch {
        theaterMaxActs = 0;
      }
    }

    // 4. Derive suggestedAction from the lowest-scoring endgame dimension
    const theaterNormalizedScore = Math.round((theaterMaxActs / 10) * 100);
    let suggestedAction: string;

    if (abyssReady && onslaughtReady && theaterMaxActs >= 8) {
      suggestedAction =
        'Roster is endgame-capable across Spiral Abyss Floor 12, Stygian Onslaught, and Imaginarium Theater.';
    } else {
      const dimensions: Array<{ name: 'abyss' | 'theater' | 'onslaught'; score: number }> = [
        { name: 'abyss', score: abyssReady ? Math.max(70, abyssScore) : abyssScore },
        { name: 'theater', score: theaterNormalizedScore },
        {
          name: 'onslaught',
          score: onslaughtReady ? Math.max(70, onslaughtScore) : onslaughtScore,
        },
      ];
      dimensions.sort((a, b) => a.score - b.score);
      const weakest = dimensions[0]!.name;

      if (weakest === 'abyss' || !abyssReady) {
        suggestedAction =
          'Reinforce second-half disjoint team ER & elemental shield counters for Spiral Abyss Floor 12.';
      } else if (weakest === 'theater') {
        suggestedAction =
          'Expand horizontal elemental cast depth (10+ combat-ready units) to sustain Imaginarium Theater vigor across all acts.';
      } else {
        suggestedAction =
          'Develop a third disjoint 4-character squad with sustain and boss mechanic counters for Stygian Onslaught.';
      }
    }

    return {
      abyssScore,
      abyssReady,
      onslaughtReady,
      theaterMaxActs,
      suggestedAction,
    };
  }

  /**
   * Evaluates character readiness and marginal upgrades using `buildAuthenticatedReadinessInput`
   * and `buildShowcaseReadinessInput`, passing real observed artifacts, stats, talents,
   * weapon details, constellation, and team energy context.
   */
  public evaluateCharacters(params: {
    rawRoster: CharacterWithWeapon[];
    artifacts?: ReadonlyArray<Artifact>;
    accountContext: AccountContext;
    openDropKeySet: Set<string>;
    isShowcase: boolean;
    showcaseCharacters?: ReadonlyArray<ShowcaseCharacterRecord>;
    teamMembers?: ReadonlyArray<string>;
  }): {
    readinessList: EvaluatedCharacterReadiness[];
    upgradesList: EvaluatedMarginalUpgrade[];
    skippedUnverifiedCharacters: string[];
    conflictedCharacters: string[];
    verifiedRoster: CharacterWithWeapon[];
  } {
    const {
      rawRoster,
      artifacts = [],
      accountContext,
      openDropKeySet,
      isShowcase,
      showcaseCharacters,
      teamMembers,
    } = params;

    const charContextByFormKey = new Map<string, AccountCharacterContext>(
      accountContext.characters.map((c) => [c.formKey, c]),
    );
    const conflictedFormKeys = new Set<string>(
      accountContext.issues
        .filter((issue) => issue.code === 'conflicting_builds')
        .map((issue) => issue.formKey),
    );

    const readinessList: EvaluatedCharacterReadiness[] = [];
    const upgradesList: EvaluatedMarginalUpgrade[] = [];
    const skippedUnverifiedCharacters: string[] = [];
    const conflictedCharacters: string[] = [];
    const verifiedRoster: CharacterWithWeapon[] = [];

    const totalCount = isShowcase
      ? Math.max(rawRoster.length, showcaseCharacters?.length ?? 0)
      : rawRoster.length;

    for (let idx = 0; idx < totalCount; idx++) {
      const char = rawRoster[idx];
      const showcaseChar = showcaseCharacters?.[idx];
      const rawKey = showcaseChar?.key ?? char?.characterKey ?? '';
      const characterKey = resolveCharacterKey(
        char?.characterKey ?? rawKey,
        showcaseChar?.id,
        showcaseChar?.name,
      );

      if (
        !characterKey ||
        (!CHARACTER_ELEMENTS[characterKey] && !/^(Traveler|Aether|Lumine)/.test(characterKey))
      ) {
        if (characterKey) {
          skippedUnverifiedCharacters.push(characterKey);
        }
        continue;
      }

      const identity = resolveCharacterFormIdentity({
        key: showcaseChar?.key ?? characterKey,
        id: showcaseChar?.id,
        skillDepotId: showcaseChar?.skillDepotId,
        name: showcaseChar?.name,
      });
      const formKey = identity?.formKey;
      const charContext = formKey ? charContextByFormKey.get(formKey) : undefined;

      // Enforce ADR-0011 / AccountContext conflict rule: skip conflicted builds and flag caveat
      if (
        charContext?.buildState === 'conflicted' ||
        (formKey && conflictedFormKeys.has(formKey))
      ) {
        if (!conflictedCharacters.includes(characterKey)) {
          conflictedCharacters.push(characterKey);
        }
        continue;
      }

      if (charContext?.buildState === 'missing') {
        continue;
      }

      if (char) {
        verifiedRoster.push({ ...char, characterKey });
      }

      let buildInput: CharacterReadinessRequestInput;
      if (isShowcase && showcaseChar) {
        buildInput = buildShowcaseReadinessInput(showcaseChar, teamMembers, {
          targetEncounter: TARGET_ENCOUNTER,
          showcaseCharacters,
          roster: rawRoster,
        });
      } else if (char) {
        buildInput = buildAuthenticatedReadinessInput(char, artifacts, teamMembers, {
          targetEncounter: TARGET_ENCOUNTER,
          roster: rawRoster,
        });
      } else {
        continue;
      }

      try {
        const readResult = this.readinessService.evaluateReadiness(buildInput);
        readinessList.push({
          characterKey,
          role: readResult.status,
          score: readResult.score,
          status: readResult.status,
        });

        const margInput: MarginalInvestmentRequestInput = {
          character: buildInput.character,
          targetEncounter: TARGET_ENCOUNTER,
          ...(buildInput.teamEnergyContext !== undefined
            ? { teamEnergyContext: buildInput.teamEnergyContext }
            : {}),
        };
        const margResult = this.marginalService.evaluate(margInput);

        if (margResult.recommendedNextAction) {
          const next = margResult.recommendedNextAction;
          const matchingCost = next.costs.find((c) => openDropKeySet.has(c.materialKey));
          upgradesList.push({
            characterKey,
            actionType: next.category === 'talent' ? 'TALENT_UPGRADE' : 'WEAPON_ASCENSION',
            actionDetail: `${next.category}: ${next.target} (${next.currentLevel}→${next.targetLevel})`,
            efficiencyScore: next.efficiencyScore,
            domainFamily: matchingCost ? matchingCost.name : undefined,
          });
        }
      } catch {
        // Safe continuation on individual character calculation error
      }
    }

    return {
      readinessList,
      upgradesList,
      skippedUnverifiedCharacters,
      conflictedCharacters,
      verifiedRoster,
    };
  }
}

export const companionSummaryService = new CompanionSummaryService();
