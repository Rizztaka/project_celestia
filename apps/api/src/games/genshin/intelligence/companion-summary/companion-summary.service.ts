import { createRequire } from 'node:module';

import type {
  AccountCharacterContext,
  AccountContext,
  AccountContextFreshness,
  CharacterReadinessRequestInput,
  CompanionSummaryResponse,
  MarginalInvestmentRequestInput,
  PullAdviceSnapshot,
  SupportedServerId,
  TeamSuggestionSnapshot,
} from '@celestia/api-contracts';

const require = createRequire(import.meta.url);
const CHARACTER_ELEMENTS: Record<string, string> = require('../../static/character-elements.json');

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
import { ImportedAccountService } from '../../importer/imported-account.service.js';
import { ShowcaseService } from '../../showcase/showcase.service.js';
import { EndgameIntelligenceService } from '../endgame-intelligence/endgame-intelligence.service.js';
import { MarginalInvestmentService } from '../marginal-investment/marginal-investment.service.js';
import { PullIntelligenceService } from '../pull-intelligence/pull-intelligence.service.js';
import {
  buildAuthenticatedReadinessInput,
  buildShowcaseReadinessInput,
  type ShowcaseCharacterRecord,
} from '../readiness-intelligence/readiness-input.adapter.js';
import { ReadinessIntelligenceService } from '../readiness-intelligence/readiness-intelligence.service.js';
import { TeamIntelligenceService } from '../team-intelligence/team-intelligence.service.js';
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

export class CompanionSummaryService {
  private readonly accountContextProvider: AccountContextProvider;
  private readonly readinessService: ReadinessIntelligenceService;
  private readonly marginalService: MarginalInvestmentService;
  private readonly endgameService: EndgameIntelligenceService;
  private readonly pullService: PullIntelligenceService;
  private readonly teamService: TeamIntelligenceService;

  constructor(
    providerOrReadinessService?: AccountContextProvider | ReadinessIntelligenceService,
    marginalService = new MarginalInvestmentService(),
    endgameService = new EndgameIntelligenceService(),
    pullService?: PullIntelligenceService,
    characterService = new GenshinCharacterService(),
    showcaseService = new ShowcaseService(),
    teamService = new TeamIntelligenceService(),
    explicitProvider?: AccountContextProvider,
  ) {
    if (providerOrReadinessService && 'getForUser' in providerOrReadinessService) {
      this.accountContextProvider = providerOrReadinessService;
      this.readinessService = new ReadinessIntelligenceService();
      this.marginalService = marginalService;
      this.endgameService = endgameService;
      this.pullService = pullService ?? new PullIntelligenceService(this.accountContextProvider);
      this.teamService = teamService;
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
      this.teamService = teamService;
    }
  }

  /**
   * Generates orchestrated companion summary for an authenticated user account
   * using the unified `AccountContextProvider` and canonical readiness input adapter.
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

    // Resolve Team Intelligence first so party members inform rotation_energy readiness
    let teamSuggestion: TeamSuggestionSnapshot | undefined;
    try {
      const teamRes = await this.teamService.getRecommendations(userId);
      if (teamRes.recommendations.length > 0) {
        const topTeam = teamRes.recommendations[0]!;
        const memberKeys = topTeam.roster
          .map((r) => r.characterKey)
          .filter((k): k is string => Boolean(k));
        teamSuggestion = {
          teamName: topTeam.templateName,
          members: memberKeys.length > 0 ? memberKeys : ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'],
          archetype: topTeam.archetype,
          comfortRating: topTeam.reaction,
          keyAdvantage: topTeam.explanations[0] ?? 'High meta synergy and reaction efficiency.',
          targetRoute: '/teams',
        };
      }
    } catch {
      // Graceful fallback if no team is buildable or roster < 4
    }

    const partyMembers =
      teamSuggestion?.members ??
      (rawRoster.length > 0 ? rawRoster.slice(0, 4).map((c) => c.characterKey) : undefined);

    const { readinessList, upgradesList, skippedUnverifiedCharacters, conflictedCharacters } =
      this.evaluateCharacters({
        rawRoster,
        artifacts,
        accountContext,
        openDropKeySet,
        isShowcase: false,
        teamMembers: partyMembers,
      });

    // Pull Intelligence
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

    const endgameStatus: EvaluatedEndgameStatus = {
      abyssScore: Math.min(
        100,
        Math.round((readinessList.filter((r) => r.status === 'ready_for_target').length / 8) * 100),
      ),
      abyssReady: readinessList.filter((r) => r.status === 'ready_for_target').length >= 8,
      onslaughtReady: readinessList.filter((r) => r.status === 'ready_for_target').length >= 12,
      theaterMaxActs: Math.min(10, Math.floor(readinessList.length / 2)),
    };

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
   * using the unified `AccountContextProvider` and canonical readiness input adapter.
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
    const partyMembers =
      showcaseChars.length > 0
        ? showcaseChars.slice(0, 4).map((c) => resolveCharacterKey(c.key, c.id, c.name))
        : rawRoster.length > 0
          ? rawRoster.slice(0, 4).map((c) => c.characterKey)
          : undefined;

    const { readinessList, upgradesList, skippedUnverifiedCharacters, conflictedCharacters } =
      this.evaluateCharacters({
        rawRoster,
        artifacts,
        accountContext,
        openDropKeySet,
        isShowcase: true,
        showcaseCharacters: showcaseChars,
        teamMembers: partyMembers,
      });

    // Pull Intelligence
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

    const endgameStatus: EvaluatedEndgameStatus = {
      abyssScore: Math.min(
        100,
        Math.round((readinessList.filter((r) => r.status === 'ready_for_target').length / 8) * 100),
      ),
      abyssReady: readinessList.filter((r) => r.status === 'ready_for_target').length >= 8,
      onslaughtReady: readinessList.filter((r) => r.status === 'ready_for_target').length >= 12,
      theaterMaxActs: Math.min(10, Math.floor(readinessList.length / 2)),
    };

    const isPartialAccount = accountContext.rosterScope === 'partial';

    const calcResult = calculateCompanionSummary({
      accountScope: 'public_showcase',
      isPartialAccount,
      readinessList,
      upgradesList,
      openDomainFamilies: domainFamilies,
      endgameStatus,
      pullAdvice,
      skippedUnverifiedCharacters,
      timestamp: now.toISOString(),
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
    };
  }
}

export const companionSummaryService = new CompanionSummaryService();
