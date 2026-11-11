import type {
  CompanionSummaryPrimaryAction,
  EndgameStatusSnapshot,
  PullAdviceSnapshot,
  ReadyBuildSummaryItem,
  TeamSuggestionSnapshot,
  TopMarginalUpgradeSummary,
} from '@celestia/api-contracts';

export interface EvaluatedCharacterReadiness {
  characterKey: string;
  role: string;
  score: number;
  status: 'ready_for_target' | 'conditional' | 'needs_investment' | 'insufficient_data';
}

export interface EvaluatedMarginalUpgrade {
  characterKey: string;
  actionType: 'TALENT_UPGRADE' | 'WEAPON_ASCENSION' | 'ENERGY_THRESHOLD';
  actionDetail: string;
  efficiencyScore: number;
  domainFamily?: string;
}

export interface EvaluatedEndgameStatus {
  abyssScore: number;
  abyssReady: boolean;
  onslaughtReady: boolean;
  theaterMaxActs: number;
  suggestedAction?: string;
}

export interface CompanionSummaryCalculationInput {
  accountScope: 'authenticated' | 'public_showcase';
  isPartialAccount: boolean;
  readinessList: EvaluatedCharacterReadiness[];
  upgradesList: EvaluatedMarginalUpgrade[];
  openDomainFamilies: string[];
  endgameStatus: EvaluatedEndgameStatus;
  teamSuggestion?: TeamSuggestionSnapshot;
  pullAdvice?: PullAdviceSnapshot;
  skippedUnverifiedCharacters?: string[];
  timestamp?: string;
}

export interface CompanionSummaryCalculationResult {
  contractVersion: 1;
  timestamp: string;
  accountScope: 'authenticated' | 'public_showcase';
  isPartialAccount: boolean;
  missingDataCaveats: string[];
  skippedUnverifiedCharacters?: string[];
  primaryAction: CompanionSummaryPrimaryAction;
  readyBuildsSummary: {
    readyCount: number;
    totalAssessed: number;
    targetEncounter: string;
    topReadyCharacters: ReadyBuildSummaryItem[];
  };
  topMarginalInvestments: TopMarginalUpgradeSummary[];
  teamSuggestion?: TeamSuggestionSnapshot;
  endgameSnapshot: EndgameStatusSnapshot;
  pullAdviceSnapshot?: PullAdviceSnapshot;
}

/**
 * Pure calculator: synthesizes readiness, marginal investment, endgame, and pull intelligence
 * into an orchestrated priority ranking without side effects.
 */
export function calculateCompanionSummary(
  input: CompanionSummaryCalculationInput,
): CompanionSummaryCalculationResult {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const openDomainSet = new Set(input.openDomainFamilies.map((f) => f.toLowerCase()));

  // 1. Process readiness summary
  const readyCharacters = input.readinessList.filter((r) => r.status === 'ready_for_target');
  const sortedReady = [...input.readinessList]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r) => ({
      characterKey: r.characterKey,
      role: r.role,
      readinessScore: r.score,
      status: r.status,
    }));

  const readyBuildsSummary = {
    readyCount: readyCharacters.length,
    totalAssessed: input.readinessList.length,
    targetEncounter: 'abyss_12',
    topReadyCharacters: sortedReady,
  };

  // 2. Process top marginal upgrades with domain schedule correlation
  const mappedUpgrades: TopMarginalUpgradeSummary[] = input.upgradesList.map((u) => {
    const isDomainToday = u.domainFamily ? openDomainSet.has(u.domainFamily.toLowerCase()) : false;
    return {
      characterKey: u.characterKey,
      actionType: u.actionType,
      actionDetail: u.actionDetail,
      efficiencyScore: u.efficiencyScore,
      todayDomainAvailable: isDomainToday,
      domainFamily: u.domainFamily,
    };
  });

  // Sort by open today first, then efficiency score descending
  const topMarginalInvestments = [...mappedUpgrades]
    .sort((a, b) => {
      if (a.todayDomainAvailable && !b.todayDomainAvailable) return -1;
      if (!a.todayDomainAvailable && b.todayDomainAvailable) return 1;
      return b.efficiencyScore - a.efficiencyScore;
    })
    .slice(0, 3);

  // 3. Process team suggestion (Milestone 3 synthesis)
  let teamSuggestion = input.teamSuggestion;
  if (!teamSuggestion && readyCharacters.length >= 4) {
    const coreMembers = sortedReady.slice(0, 4).map((r) => r.characterKey);
    teamSuggestion = {
      teamName: `${coreMembers[0]} Core`,
      members: coreMembers,
      archetype: 'Defensible Synergy',
      comfortRating: 'high',
      keyAdvantage:
        'High encounter readiness and balanced support uptime across verified roster units.',
      targetRoute: '/teams',
    };
  }

  // 4. Process endgame snapshot
  const endgameSnapshot: EndgameStatusSnapshot = {
    abyssReady: input.endgameStatus.abyssReady,
    abyssScore: input.endgameStatus.abyssScore,
    onslaughtReady: input.endgameStatus.onslaughtReady,
    theaterMaxActsEstimated: input.endgameStatus.theaterMaxActs,
    suggestedAction:
      input.endgameStatus.suggestedAction ??
      (!input.endgameStatus.abyssReady
        ? 'Reinforce second-half team ER & shielding for Spiral Abyss.'
        : 'Roster is endgame-capable for current Abyss cycle.'),
  };

  // 4. Determine Primary Action
  let primaryAction: CompanionSummaryPrimaryAction;

  const todayUpgrade = topMarginalInvestments.find((u) => u.todayDomainAvailable);

  if (todayUpgrade) {
    primaryAction = {
      category: 'FARMING_AVAILABLE',
      priority: 'HIGH',
      headline: `Today's Domain: Upgrade ${todayUpgrade.characterKey}'s ${todayUpgrade.actionDetail}`,
      subtext: `Materials for ${todayUpgrade.domainFamily ?? 'upgrade'} are active today. Yields high marginal ROI (+${todayUpgrade.efficiencyScore.toFixed(0)} score).`,
      targetRoute: '/planner?tab=farming',
    };
  } else if (topMarginalInvestments.length > 0 && topMarginalInvestments[0].efficiencyScore >= 40) {
    const top = topMarginalInvestments[0];
    primaryAction = {
      category: 'BUILD_INVESTMENT',
      priority: 'HIGH',
      headline: `Priority Upgrade: ${top.characterKey} (${top.actionDetail})`,
      subtext: `High-impact resin investment for target encounter readiness (+${top.efficiencyScore.toFixed(0)} score).`,
      targetRoute: `/roster/${top.characterKey}`,
    };
  } else if (!endgameSnapshot.abyssReady) {
    primaryAction = {
      category: 'ENDGAME_READINESS',
      priority: 'MEDIUM',
      headline: 'Strengthen Roster for Spiral Abyss Floor 12',
      subtext: `Current joint team clearance score: ${endgameSnapshot.abyssScore.toFixed(0)}/100. Review disjoint team allocations.`,
      targetRoute: '/endgame',
    };
  } else if (input.pullAdvice && input.pullAdvice.recommendation === 'HIGH_ACCOUNT_VALUE') {
    primaryAction = {
      category: 'PULL_STRATEGY',
      priority: 'MEDIUM',
      headline: `High Value Pull: ${input.pullAdvice.targetCharacterKey}`,
      subtext: `${input.pullAdvice.keyReason}`,
      targetRoute: '/intelligence',
    };
  } else {
    primaryAction = {
      category: 'BUILD_INVESTMENT',
      priority: 'INFO',
      headline: 'Roster in Balanced Standing',
      subtext: 'Core characters meet current target encounter benchmarks.',
      targetRoute: '/roster',
    };
  }

  // 5. Build missing data caveats
  const missingDataCaveats: string[] = [];
  if (input.isPartialAccount) {
    missingDataCaveats.push(
      'Partial public showcase: only showcased characters are evaluated. Unobserved roster units are omitted rather than treated as unowned.',
    );
  }
  const unrecordedTalents = input.readinessList.filter((r) => r.status === 'insufficient_data');
  if (unrecordedTalents.length > 0) {
    missingDataCaveats.push(
      `${unrecordedTalents.length} character build(s) have unrecorded weapon or talent levels; marginal investment calculations were safely constrained.`,
    );
  }
  if (input.skippedUnverifiedCharacters && input.skippedUnverifiedCharacters.length > 0) {
    missingDataCaveats.push(
      `Unverified character(s) [${input.skippedUnverifiedCharacters.join(', ')}] omitted from readiness assessment due to missing reference metadata.`,
    );
  }

  return {
    contractVersion: 1,
    timestamp,
    accountScope: input.accountScope,
    isPartialAccount: input.isPartialAccount,
    missingDataCaveats,
    skippedUnverifiedCharacters: input.skippedUnverifiedCharacters,
    primaryAction,
    readyBuildsSummary,
    topMarginalInvestments,
    teamSuggestion,
    endgameSnapshot,
    pullAdviceSnapshot: input.pullAdvice,
  };
}
