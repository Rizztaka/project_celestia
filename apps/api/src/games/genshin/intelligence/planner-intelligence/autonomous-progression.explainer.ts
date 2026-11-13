import type {
  DiscoveredProgressionCandidate,
  DiscoveredProgressionResult,
} from './autonomous-progression.calculator.js';

// ---------------------------------------------------------------------------
// Pure Explainer Functions (Strict ADR-0011: Zero Arithmetic, Strings Only)
// ---------------------------------------------------------------------------

/**
 * Generates human rationales for a discovered autonomous progression candidate.
 */
export function explainAutonomousCandidate(candidate: DiscoveredProgressionCandidate): string[] {
  const explanations: string[] = [];

  // 1. Prioritization Rationale
  if (candidate.goalPriority === 1 || candidate.isCoreTeam) {
    explanations.push(
      `Core Lineup Autonomous Upgrade: ${candidate.characterKey} is active in your primary team composition and has been prioritized (Priority 1).`,
    );
  } else if (candidate.goalPriority === 2 || candidate.isBottleneck) {
    explanations.push(
      `Bottleneck Resolution: ${candidate.characterKey} addresses an endgame encounter readiness bottleneck (Priority 2).`,
    );
  } else {
    explanations.push(
      `Account Roster Progression: Upgrading ${candidate.characterKey} expands account flexibility and depth (Priority ${candidate.goalPriority}).`,
    );
  }

  // 2. Action & Upgrade Details
  if (candidate.actionType === 'domain_talent') {
    const talentName = candidate.talentType
      ? ({
          normal: 'Normal Attack',
          skill: 'Elemental Skill',
          burst: 'Elemental Burst',
        }[candidate.talentType] ?? candidate.talentType)
      : 'Talent';
    explanations.push(
      `Talent Progression: Ascend ${candidate.characterKey}'s ${talentName} from Lv.${candidate.currentLevel} to Lv.${candidate.targetLevel}.`,
    );
  } else if (candidate.actionType === 'domain_weapon') {
    explanations.push(
      `Weapon Progression: Ascend ${candidate.targetKey} from Lv.${candidate.currentLevel} to Lv.${candidate.targetLevel} for ${candidate.characterKey}.`,
    );
  } else if (candidate.actionType === 'world_boss') {
    explanations.push(
      `Character Ascension: Ascend ${candidate.characterKey} from Phase ${candidate.currentLevel} to Phase ${candidate.targetLevel} via ${candidate.domainName}.`,
    );
  } else {
    explanations.push(
      `Artifact Farming: Farm ${candidate.domainName} to acquire suitable artifact sets for ${candidate.characterKey}.`,
    );
  }

  // 3. Domain Sourcing & Cost
  const openDaysStr = candidate.openDays.join(', ');
  explanations.push(
    `Domain Sourcing: ${candidate.domainName} (${candidate.resinPerRun} Resin per claim; open on schedule days: [${openDaysStr}]).`,
  );

  // 4. Marginal ROI & Gap Impact
  const gapNote = candidate.closesGap ? ' (closes key encounter readiness gap)' : '';
  explanations.push(
    `Expected Marginal ROI: +${candidate.expectedScoreDelta} readiness score delta${gapNote} (efficiency score: ${candidate.marginalEfficiency}).`,
  );

  return explanations;
}

/**
 * Summarizes the autonomous progression discovery scan for logging and display.
 */
export function explainAutonomousProgressionSummary(result: DiscoveredProgressionResult): string {
  const { totalCharactersScanned, underInvestedCount, discoveredCandidateCount } = result.metadata;
  return `Discovered ${discoveredCandidateCount} progression candidate(s) across ${underInvestedCount} under-invested character(s) from a scan of ${totalCharactersScanned} roster unit(s).`;
}
