import type { PlannerActionType, UpgradeCategory } from '@celestia/api-contracts';

import type { Artifact } from '../../account-data/account-context-provider.service.js';
import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { domainSchedule } from '../../companion/domain-schedule.js';
import {
  calculateMarginalInvestment,
  getArtifactDomainInfo,
} from '../marginal-investment/marginal-investment.calculator.js';
import { buildAuthenticatedReadinessInput } from '../readiness-intelligence/readiness-input.adapter.js';
import {
  type PlannerCandidateInput,
  WORLD_BOSS_RESIN,
} from './planner-optimization.calculator.js';

// ---------------------------------------------------------------------------
// Calculator Types (Strict ADR-0011: Zero Prose, Pure Math & Deterministic Types)
// ---------------------------------------------------------------------------

export interface ManualGoalTarget {
  id?: string;
  targetKey: string;
  goalType: string;
  talentType?: string | null;
  priority?: number;
}

export interface AutonomousProgressionParams {
  rawRoster: ReadonlyArray<CharacterWithWeapon>;
  artifacts?: ReadonlyArray<Artifact>;
  manualGoals?: ReadonlyArray<ManualGoalTarget>;
  teamMemberKeys?: ReadonlyArray<string> | Set<string>;
  bottleneckCharacterKeys?: ReadonlyArray<string> | Set<string>;
  yieldToManualGoals?: boolean;
  maxCandidates?: number;
}

export interface DiscoveredProgressionCandidate extends PlannerCandidateInput {
  goalId: null;
  characterKey: string;
  category: UpgradeCategory;
  upgradeId: string;
  currentLevel: number;
  targetLevel: number;
  isCoreTeam: boolean;
  isBottleneck: boolean;
  marginalEfficiency: number;
}

export interface DiscoveredProgressionResult {
  candidates: DiscoveredProgressionCandidate[];
  metadata: {
    totalCharactersScanned: number;
    underInvestedCount: number;
    discoveredCandidateCount: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchesKey(
  setOrArray: ReadonlyArray<string> | Set<string> | undefined,
  key: string,
): boolean {
  if (!setOrArray) return false;
  const target = key.trim().toLowerCase();
  if (setOrArray instanceof Set) {
    for (const item of setOrArray) {
      if (item.trim().toLowerCase() === target) return true;
    }
    return false;
  }
  return setOrArray.some((item) => item.trim().toLowerCase() === target);
}

function resolveActionType(category: UpgradeCategory): PlannerActionType | null {
  if (category === 'talent') return 'domain_talent';
  if (category === 'weapon_ascension' || category === 'weapon_level') return 'domain_weapon';
  if (category === 'character_ascension' || category === 'character_level') return 'world_boss';
  if (category === 'artifact_main_stat' || category === 'artifact_level') return 'domain_artifact';
  return null;
}

function isManualGoalMatch(
  manualGoals: ReadonlyArray<ManualGoalTarget> | undefined,
  actionType: PlannerActionType,
  targetKey: string,
  talentType?: string | null,
): boolean {
  if (!manualGoals || manualGoals.length === 0) return false;

  const normTarget = targetKey.trim().toLowerCase();

  for (const m of manualGoals) {
    const mTarget = m.targetKey.trim().toLowerCase();
    if (mTarget !== normTarget) continue;

    if (actionType === 'domain_talent' && m.goalType === 'CHARACTER_TALENT') {
      if (!m.talentType || !talentType || m.talentType.toLowerCase() === talentType.toLowerCase()) {
        return true;
      }
    } else if (actionType === 'domain_weapon' && m.goalType === 'WEAPON_ASCENSION') {
      return true;
    } else if (actionType === 'world_boss' && m.goalType === 'CHARACTER_ASCENSION') {
      return true;
    } else if (actionType === 'domain_artifact' && m.goalType === 'ARTIFACT') {
      return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Pure Calculator: Autonomous Progression Discovery
// ---------------------------------------------------------------------------

/**
 * Discovers account-wide progression upgrade candidates for an account.
 * Scans under-invested characters, correlates material drops with domain-schedule,
 * assigns deterministic priority weights, and yields priority to manual goals.
 */
export function discoverAutonomousProgression(
  params: AutonomousProgressionParams,
): DiscoveredProgressionResult {
  const {
    rawRoster,
    artifacts = [],
    manualGoals = [],
    teamMemberKeys,
    bottleneckCharacterKeys,
    yieldToManualGoals = manualGoals.length > 0,
    maxCandidates,
  } = params;

  if (!rawRoster || rawRoster.length === 0) {
    return {
      candidates: [],
      metadata: {
        totalCharactersScanned: 0,
        underInvestedCount: 0,
        discoveredCandidateCount: 0,
      },
    };
  }

  const maxManualPriority =
    manualGoals.length > 0
      ? Math.max(...manualGoals.map((g) => (typeof g.priority === 'number' ? g.priority : 1)))
      : 0;

  const discoveredCandidates: DiscoveredProgressionCandidate[] = [];
  const seenCandidateIds = new Set<string>();
  let underInvestedCount = 0;

  for (const char of rawRoster) {
    if (!char.characterKey) continue;

    let margResult;
    try {
      const readinessInput = buildAuthenticatedReadinessInput(char, artifacts);
      margResult = calculateMarginalInvestment({
        character: readinessInput.character,
      });
    } catch {
      // Graceful fallback for non-modeled benchmark characters
      continue;
    }

    const isUnderInvested =
      margResult.currentReadiness.status !== 'ready_for_target' ||
      margResult.rankedUpgrades.length > 0;

    if (isUnderInvested) {
      underInvestedCount++;
    }

    const isCoreTeam =
      matchesKey(teamMemberKeys, char.characterKey) ||
      (char.equippedWeapon?.weaponKey
        ? matchesKey(teamMemberKeys, char.equippedWeapon.weaponKey)
        : false);

    const isBottleneck =
      !isCoreTeam &&
      (matchesKey(bottleneckCharacterKeys, char.characterKey) ||
        (char.equippedWeapon?.weaponKey
          ? matchesKey(bottleneckCharacterKeys, char.equippedWeapon.weaponKey)
          : false));

    let goalPriority: number;
    if (yieldToManualGoals && manualGoals.length > 0) {
      const offset = maxManualPriority;
      goalPriority = isCoreTeam ? offset + 1 : isBottleneck ? offset + 2 : offset + 3;
    } else {
      goalPriority = isCoreTeam ? 1 : isBottleneck ? 2 : 3;
    }

    for (const upgrade of margResult.rankedUpgrades) {
      if (upgrade.expectedScoreDelta < 0 || upgrade.costs.length === 0) {
        continue;
      }

      const actionType = resolveActionType(upgrade.category);
      if (!actionType) continue;

      let targetKey: string;
      let talentType: string | null = null;

      if (actionType === 'domain_talent') {
        targetKey = char.characterKey;
        talentType = upgrade.target;
      } else if (actionType === 'domain_weapon') {
        targetKey = char.equippedWeapon?.weaponKey ?? upgrade.target;
      } else {
        targetKey = char.characterKey;
      }

      // Check for duplication with active manual goals
      if (isManualGoalMatch(manualGoals, actionType, targetKey, talentType)) {
        continue;
      }

      const candidateId = `auto-${char.characterKey}-${upgrade.id}`;
      if (seenCandidateIds.has(candidateId)) {
        continue;
      }

      const costKeys = upgrade.costs.map((c) => c.materialKey);
      let domainKey: string | null = null;
      let domainName: string;
      let resourceName: string;
      let openDays: ReadonlyArray<number>;
      let resinPerRun: number;
      let domainDropKeys: ReadonlyArray<string> = [];

      if (actionType === 'domain_talent' || actionType === 'domain_weapon') {
        const matchedDomain = domainSchedule.find((d) =>
          d.dropKeys.some((dk) => costKeys.includes(dk)),
        );

        if (matchedDomain) {
          domainKey = matchedDomain.domainKey;
          domainName = matchedDomain.name;
          resourceName = matchedDomain.drops[0] ?? matchedDomain.name;
          openDays = matchedDomain.days;
          resinPerRun = matchedDomain.resinPerClaim;
          domainDropKeys = matchedDomain.dropKeys;
        } else {
          domainKey = null;
          domainName = actionType === 'domain_weapon' ? 'Weapon Domain' : 'Talent Domain';
          resourceName = actionType === 'domain_weapon' ? 'Weapon Materials' : 'Talent Materials';
          openDays = [0, 1, 2, 3, 4, 5, 6];
          resinPerRun = 20;
        }
      } else if (actionType === 'world_boss') {
        domainKey = 'WorldBoss';
        domainName = 'World Boss';
        resourceName = `${char.characterKey} Ascension Materials`;
        openDays = [0, 1, 2, 3, 4, 5, 6];
        resinPerRun = WORLD_BOSS_RESIN;
      } else {
        const artifactInfo = getArtifactDomainInfo(upgrade.target);
        domainKey = artifactInfo?.domainKey ?? 'ArtifactDomain';
        domainName = artifactInfo?.domainName ?? 'Artifact Domain';
        resourceName = `${domainName} Artifacts`;
        openDays = [0, 1, 2, 3, 4, 5, 6];
        resinPerRun = 20;
      }

      const requiredMaterials: Record<string, number> = {};
      for (const costItem of upgrade.costs) {
        requiredMaterials[costItem.materialKey] = costItem.count;
      }

      seenCandidateIds.add(candidateId);
      discoveredCandidates.push({
        candidateId,
        goalId: null,
        actionType,
        targetKey,
        talentType,
        domainKey,
        domainName,
        resourceName,
        openDays,
        resinPerRun,
        requiredMaterials,
        domainDropKeys,
        goalPriority,
        expectedScoreDelta: Math.max(0, upgrade.expectedScoreDelta),
        closesGap: upgrade.closesGap,
        characterKey: char.characterKey,
        category: upgrade.category,
        upgradeId: upgrade.id,
        currentLevel: upgrade.currentLevel,
        targetLevel: upgrade.targetLevel,
        isCoreTeam,
        isBottleneck,
        marginalEfficiency: upgrade.efficiencyScore,
      });
    }
  }

  // Deterministic sorting adhering to ADR-0011
  discoveredCandidates.sort(
    (a, b) =>
      a.goalPriority - b.goalPriority ||
      b.expectedScoreDelta - a.expectedScoreDelta ||
      b.marginalEfficiency - a.marginalEfficiency ||
      a.candidateId.localeCompare(b.candidateId),
  );

  const finalCandidates =
    typeof maxCandidates === 'number' && maxCandidates > 0
      ? discoveredCandidates.slice(0, maxCandidates)
      : discoveredCandidates;

  return {
    candidates: finalCandidates,
    metadata: {
      totalCharactersScanned: rawRoster.length,
      underInvestedCount,
      discoveredCandidateCount: finalCandidates.length,
    },
  };
}
