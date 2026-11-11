import {
  type MarginalInvestmentRequest,
  type MarginalInvestmentRequestInput,
  marginalInvestmentRequestSchema,
  type ResourceCostItem,
  type UpgradeCandidate,
  type UpgradeCategory,
} from '@celestia/api-contracts';

import { progressionCatalog } from '../../companion/progression-catalog.js';
import {
  calculateReadiness,
  normalizeStatKey,
  type ReadinessCalculatorResult,
  resolveRoleBenchmark,
} from '../readiness-intelligence/readiness-intelligence.calculator.js';

// ---------------------------------------------------------------------------
// Internal Calculator Types (adhering strictly to ADR-0011: no UI/prose text)
// ---------------------------------------------------------------------------

export interface MarginalInvestmentCalculatorResult {
  currentReadiness: ReadinessCalculatorResult;
  rankedUpgrades: UpgradeCandidate[];
  recommendedNextAction: UpgradeCandidate | null;
  metadata: {
    characterKey: string;
    roleId: string;
    hasEnergyDeficit: boolean;
    missingSandsForEr?: boolean;
    totalCandidatesEvaluated: number;
    unsupportedProgressionTargets?: string[];
  };
}

// ---------------------------------------------------------------------------
// Catalog Lookups & Normalization Helpers
// ---------------------------------------------------------------------------

const CHARACTER_ALIASES: Record<string, string> = {
  'hu tao': 'HuTao',
  'yun jin': 'YunJin',
  kazuha: 'KaedeharaKazuha',
  ayaka: 'KamisatoAyaka',
  ayato: 'KamisatoAyato',
  kokomi: 'SangonomiyaKokomi',
  heizou: 'ShikanoinHeizou',
  itto: 'AratakiItto',
  sara: 'KujouSara',
  yae: 'YaeMiko',
  childe: 'Tartaglia',
  scaramouche: 'Wanderer',
  kukishinobu: 'KukiShinobu',
  traveler: 'Aether',
};

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function findCatalogCharacter(characterKey: string) {
  const normalized = characterKey.trim().toLowerCase();
  const alias = CHARACTER_ALIASES[normalized];
  if (alias && progressionCatalog.data.characters[alias]) {
    return progressionCatalog.data.characters[alias];
  }
  const direct = progressionCatalog.data.characters[characterKey];
  if (direct) return direct;

  const stripped = normalizeKey(characterKey);
  for (const [key, entry] of Object.entries(progressionCatalog.data.characters)) {
    if (normalizeKey(key) === stripped || normalizeKey(entry.name) === stripped) {
      return entry;
    }
  }
  return null;
}

export function findCatalogWeapon(weaponKey: string) {
  const direct = progressionCatalog.data.weapons[weaponKey];
  if (direct) return direct;

  const stripped = normalizeKey(weaponKey);
  for (const [key, entry] of Object.entries(progressionCatalog.data.weapons)) {
    if (normalizeKey(key) === stripped || normalizeKey(entry.name) === stripped) {
      return entry;
    }
  }
  // Plural / singular fallback (e.g. DragonBane -> DragonsBane)
  for (const [key, entry] of Object.entries(progressionCatalog.data.weapons)) {
    const k = normalizeKey(key);
    if (k.replace(/s/g, '') === stripped.replace(/s/g, '')) {
      return entry;
    }
  }
  return null;
}

export const ARTIFACT_DOMAINS: Record<string, { domainName: string; domainKey: string }> = {
  disenchantmentindeepshadow: {
    domainName: 'Shadowed Citadel',
    domainKey: 'DomainOfBlessingShadowedCitadel',
  },
  heartofthefurnace: {
    domainName: 'Den of Solitary Beasts',
    domainKey: 'DomainOfBlessingDenOfSolitaryBeasts',
  },
  adaycarvedfromrisingwinds: {
    domainName: 'Windswept Crag',
    domainKey: 'DomainOfBlessingWindsweptCrag',
  },
  emblemofseveredfate: {
    domainName: 'Momiji-Dyed Court',
    domainKey: 'MomijiDyedCourt',
  },
  shimenawasreminiscence: {
    domainName: 'Momiji-Dyed Court',
    domainKey: 'MomijiDyedCourt',
  },
  crimsonwitchofflames: {
    domainName: 'Hidden Palace of Zhou Formula',
    domainKey: 'HiddenPalaceOfZhouFormula',
  },
  tenacityofthemillelith: {
    domainName: 'Ridge Watch',
    domainKey: 'RidgeWatch',
  },
  viridescentvenerer: {
    domainName: 'Valley of Remembrance',
    domainKey: 'ValleyOfRemembrance',
  },
  noblesseoblige: {
    domainName: 'Clear Pool and Mountain Cavern',
    domainKey: 'ClearPoolAndMountainCavern',
  },
  goldentroupe: {
    domainName: 'Den of Solitary Spring',
    domainKey: 'DenOfSolitarySpring',
  },
  marechausseehunter: {
    domainName: 'Den of Solitary Spring',
    domainKey: 'DenOfSolitarySpring',
  },
  gildeddreams: {
    domainName: 'Spire of Solitary Enlightenment',
    domainKey: 'SpireOfSolitaryEnlightenment',
  },
  deepwoodmemories: {
    domainName: 'Spire of Solitary Enlightenment',
    domainKey: 'SpireOfSolitaryEnlightenment',
  },
  scrolloftheheroofcindercity: {
    domainName: 'Sanctum of Rainbow Spirits',
    domainKey: 'SanctumOfRainbowSpirits',
  },
  obsidiancodex: {
    domainName: 'Sanctum of Rainbow Spirits',
    domainKey: 'SanctumOfRainbowSpirits',
  },
  songofdayspast: {
    domainName: 'Waterfall Wen',
    domainKey: 'WaterfallWen',
  },
  flowerofparadiselost: {
    domainName: 'City of Gold',
    domainKey: 'CityOfGold',
  },
};

export function getArtifactDomainInfo(
  setKey: string,
): { domainName: string; domainKey: string } | null {
  const clean = setKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ARTIFACT_DOMAINS[clean] ?? null;
}

// ---------------------------------------------------------------------------
// Progression Cost Calculation (deterministic against progression-catalog.json)
// ---------------------------------------------------------------------------

export function calculateTalentUpgradeCosts(
  characterKey: string,
  fromLevel: number,
  toLevel: number,
): ResourceCostItem[] | null {
  const char = findCatalogCharacter(characterKey);
  if (!char || !char.talent || char.talent.length === 0) {
    return null;
  }
  const costsMap: Record<string, number> = {};

  for (let p = fromLevel + 1; p <= toLevel; p++) {
    const row = char.talent.find((r) => r.phase === p);
    if (row) {
      for (const [matKey, count] of Object.entries(row.costs)) {
        costsMap[matKey] = (costsMap[matKey] ?? 0) + count;
      }
    }
  }

  return Object.entries(costsMap).map(([materialKey, count]) => ({
    materialKey,
    name: progressionCatalog.data.materials[materialKey]?.name ?? materialKey,
    count,
  }));
}

export function calculateCharacterAscensionCosts(
  characterKey: string,
  fromPhase: number,
  toPhase: number,
): ResourceCostItem[] | null {
  const char = findCatalogCharacter(characterKey);
  if (!char || !char.ascension || char.ascension.length === 0) {
    return null;
  }
  const costsMap: Record<string, number> = {};

  for (let p = fromPhase + 1; p <= toPhase; p++) {
    const row = char.ascension.find((r) => r.phase === p);
    if (row) {
      for (const [matKey, count] of Object.entries(row.costs)) {
        costsMap[matKey] = (costsMap[matKey] ?? 0) + count;
      }
    }
  }

  return Object.entries(costsMap).map(([materialKey, count]) => ({
    materialKey,
    name: progressionCatalog.data.materials[materialKey]?.name ?? materialKey,
    count,
  }));
}

export function calculateWeaponAscensionCosts(
  weaponKey: string,
  fromPhase: number,
  toPhase: number,
): ResourceCostItem[] | null {
  const weapon = findCatalogWeapon(weaponKey);
  if (!weapon || !weapon.ascension || weapon.ascension.length === 0) {
    return null;
  }
  const costsMap: Record<string, number> = {};

  for (let p = fromPhase + 1; p <= toPhase; p++) {
    const row = weapon.ascension.find((r) => r.phase === p);
    if (row) {
      for (const [matKey, count] of Object.entries(row.costs)) {
        costsMap[matKey] = (costsMap[matKey] ?? 0) + count;
      }
    }
  }

  return Object.entries(costsMap).map(([materialKey, count]) => ({
    materialKey,
    name: progressionCatalog.data.materials[materialKey]?.name ?? materialKey,
    count,
  }));
}

// ---------------------------------------------------------------------------
// Cost Normalization & Efficiency Scoring
// ---------------------------------------------------------------------------

export function calculateNormalizedCost(costs: ResourceCostItem[]): number {
  let total = 0;
  for (const item of costs) {
    if (item.materialKey === 'Mora') {
      total += item.count / 1000;
      continue;
    }
    const mat = progressionCatalog.data.materials[item.materialKey];
    const category = mat?.category;
    if (item.materialKey === 'CrownOfInsight') {
      total += item.count * 1000;
    } else if (category === 'weekly_boss') {
      total += item.count * 300;
    } else if (category === 'world_boss') {
      total += item.count * 200;
    } else if (category === 'talent_book') {
      const key = item.materialKey.toLowerCase();
      if (key.startsWith('philosophies')) total += item.count * 90;
      else if (key.startsWith('guide')) total += item.count * 30;
      else total += item.count * 10;
    } else if (category === 'weapon_material') {
      total += item.count * 40;
    } else if (category === 'local_specialty') {
      total += item.count * 5;
    } else if (category === 'progression_support') {
      const key = item.materialKey.toLowerCase();
      if (key.includes('gemstone')) total += item.count * 270;
      else if (key.includes('chunk')) total += item.count * 90;
      else if (key.includes('fragment')) total += item.count * 30;
      else if (key.includes('sliver')) total += item.count * 10;
      else total += item.count * 15;
    } else {
      total += item.count * 20;
    }
  }
  return Math.max(1, Math.round(total));
}

// ---------------------------------------------------------------------------
// Candidate Generation Interface
// ---------------------------------------------------------------------------

interface RawCandidateStep {
  id: string;
  category: UpgradeCategory;
  target: string;
  currentLevel: number;
  targetLevel: number;
  costs: ResourceCostItem[];
  applyUpgrade: (char: MarginalInvestmentRequest['character']) => void;
}

// ---------------------------------------------------------------------------
// Pure Calculator: Marginal Investment Optimizer
// ---------------------------------------------------------------------------

export function calculateMarginalInvestment(
  input: MarginalInvestmentRequestInput,
): MarginalInvestmentCalculatorResult {
  const request: MarginalInvestmentRequest = marginalInvestmentRequestSchema.parse(input);
  const currentReadiness = calculateReadiness(request);
  const benchmark = resolveRoleBenchmark(request.character.characterKey, request.roleProfile);

  const unsupportedProgressionTargets: string[] = [];
  if (findCatalogCharacter(request.character.characterKey) === null) {
    unsupportedProgressionTargets.push(request.character.characterKey);
  }
  if (request.character.weapon && findCatalogWeapon(request.character.weapon.weaponKey) === null) {
    unsupportedProgressionTargets.push(request.character.weapon.weaponKey);
  }

  if (!benchmark) {
    return {
      currentReadiness,
      rankedUpgrades: [],
      recommendedNextAction: null,
      metadata: {
        characterKey: request.character.characterKey,
        roleId: 'unspecified',
        hasEnergyDeficit: false,
        missingSandsForEr: false,
        totalCandidatesEvaluated: 0,
        unsupportedProgressionTargets,
      },
    };
  }

  const rawCandidates: RawCandidateStep[] = [];

  // 1. Talent Candidates
  // Order talent candidates strictly by role priority
  const orderedTalents: Array<'normal' | 'skill' | 'burst'> = [...benchmark.priorityTalents];
  for (const t of ['burst', 'skill', 'normal'] as const) {
    if (!orderedTalents.includes(t)) {
      orderedTalents.push(t);
    }
  }

  for (const t of orderedTalents) {
    const rawTalentLevel = request.character.talents?.[t];
    if (rawTalentLevel === null || rawTalentLevel === undefined) {
      // Never generate talent candidates for null/unrecorded talents
      continue;
    }
    const currentTalentLevel = rawTalentLevel;
    const isPriority = benchmark.priorityTalents.includes(t);
    // Non-priority talents should not be forced to 6 if the guide skips them
    if (!isPriority && currentTalentLevel < 9) {
      continue;
    }

    const minBenchmarkLevel = benchmark.minTalentLevels[t] ?? (isPriority ? 8 : 6);

    if (currentTalentLevel < minBenchmarkLevel) {
      const costs = calculateTalentUpgradeCosts(
        request.character.characterKey,
        currentTalentLevel,
        minBenchmarkLevel,
      );
      if (costs) {
        rawCandidates.push({
          id: `talent_${t}_${currentTalentLevel}_to_${minBenchmarkLevel}`,
          category: 'talent',
          target: t,
          currentLevel: currentTalentLevel,
          targetLevel: minBenchmarkLevel,
          costs,
          applyUpgrade: (char) => {
            if (char.talents) {
              char.talents = {
                ...char.talents,
                [t]: minBenchmarkLevel,
              };
            }
          },
        });
      }
    }

    if (currentTalentLevel >= minBenchmarkLevel && currentTalentLevel < 10) {
      const nextLevel = currentTalentLevel + 1;
      const costs = calculateTalentUpgradeCosts(
        request.character.characterKey,
        currentTalentLevel,
        nextLevel,
      );
      if (costs) {
        rawCandidates.push({
          id: `talent_${t}_${currentTalentLevel}_to_${nextLevel}`,
          category: 'talent',
          target: t,
          currentLevel: currentTalentLevel,
          targetLevel: nextLevel,
          costs,
          applyUpgrade: (char) => {
            if (char.talents) {
              char.talents = {
                ...char.talents,
                [t]: nextLevel,
              };
            }
          },
        });
      }
    }

    // Evaluate potential crown trap on non-priority normal attacks
    if (!isPriority && currentTalentLevel === 9) {
      const costs = calculateTalentUpgradeCosts(request.character.characterKey, 9, 10);
      if (costs) {
        rawCandidates.push({
          id: `talent_${t}_9_to_10`,
          category: 'talent',
          target: t,
          currentLevel: 9,
          targetLevel: 10,
          costs,
          applyUpgrade: (char) => {
            if (char.talents) {
              char.talents = {
                ...char.talents,
                [t]: 10,
              };
            }
          },
        });
      }
    }
  }

  // 2. Weapon Level & Ascension Candidates
  if (
    request.character.weapon &&
    request.character.weapon.level !== null &&
    request.character.weapon.level !== undefined
  ) {
    const weaponKey = request.character.weapon.weaponKey;
    const currentWeaponLevel = request.character.weapon.level;
    const minWeaponLevel = benchmark.minWeaponLevel ?? 80;

    if (currentWeaponLevel < minWeaponLevel) {
      const costs = calculateWeaponAscensionCosts(
        weaponKey,
        Math.min(5, Math.floor(currentWeaponLevel / 15)),
        5,
      );
      if (costs) {
        rawCandidates.push({
          id: `weapon_level_${currentWeaponLevel}_to_${minWeaponLevel}`,
          category: 'weapon_level',
          target: weaponKey,
          currentLevel: currentWeaponLevel,
          targetLevel: minWeaponLevel,
          costs,
          applyUpgrade: (char) => {
            if (char.weapon) {
              char.weapon = {
                ...char.weapon,
                level: minWeaponLevel,
              };
            }
          },
        });
      }
    } else if (currentWeaponLevel < 90) {
      const costs = calculateWeaponAscensionCosts(weaponKey, 5, 6);
      if (costs) {
        rawCandidates.push({
          id: `weapon_level_${currentWeaponLevel}_to_90`,
          category: 'weapon_level',
          target: weaponKey,
          currentLevel: currentWeaponLevel,
          targetLevel: 90,
          costs,
          applyUpgrade: (char) => {
            if (char.weapon) {
              char.weapon = {
                ...char.weapon,
                level: 90,
              };
            }
          },
        });
      }
    }
  }

  // 3. Character Ascension Candidates
  if (
    request.character.ascension !== null &&
    request.character.ascension !== undefined &&
    request.character.ascension < 6
  ) {
    const currentAscension = request.character.ascension;
    const nextAscension = currentAscension + 1;
    const costs = calculateCharacterAscensionCosts(
      request.character.characterKey,
      currentAscension,
      nextAscension,
    );
    if (costs) {
      rawCandidates.push({
        id: `character_ascension_${currentAscension}_to_${nextAscension}`,
        category: 'character_ascension',
        target: request.character.characterKey,
        currentLevel: currentAscension,
        targetLevel: nextAscension,
        costs,
        applyUpgrade: (char) => {
          char.ascension = nextAscension;
        },
      });
    }
  }

  // 4. Artifact Main Stat & Energy Recharge Fix Candidates
  const hasEnergyDeficit = currentReadiness.metadata.hasEnergyDeficit;
  const sandsArt = request.character.artifacts?.sands;
  let missingSandsForEr = false;

  const topSet = benchmark.recommendedSets[0]?.setKey ?? '';
  const domainInfo = topSet ? getArtifactDomainInfo(topSet) : null;
  const domainCost: ResourceCostItem[] = domainInfo
    ? [
        {
          materialKey: domainInfo.domainKey,
          name: `Domain: ${domainInfo.domainName} (${topSet})`,
          count: 1,
        },
      ]
    : [];

  if (hasEnergyDeficit) {
    if (sandsArt) {
      if (sandsArt.mainStatKey !== 'energyRecharge') {
        rawCandidates.push({
          id: 'artifact_main_stat_sands_energy_recharge',
          category: 'artifact_main_stat',
          target: 'sands',
          currentLevel: sandsArt.level ?? 0,
          targetLevel: 20,
          costs: domainCost,
          applyUpgrade: (char) => {
            if (char.artifacts?.sands) {
              char.artifacts = {
                ...char.artifacts,
                sands: {
                  ...char.artifacts.sands,
                  mainStatKey: 'energyRecharge',
                },
              };
              char.stats = {
                ...char.stats,
                energyRecharge: (char.stats?.energyRecharge ?? 100) + 51.8,
              };
            }
          },
        });
      }
    } else {
      missingSandsForEr = true;
    }
  }

  // Check wrong non-ER main stats only for slots that are actually equipped
  const slots = ['sands', 'goblet', 'circlet'] as const;
  for (const slot of slots) {
    const art = request.character.artifacts?.[slot];
    if (!art || !art.mainStatKey) continue;
    const recommended = benchmark.recommendedMainStats[slot] ?? [];
    if (
      recommended.length > 0 &&
      !recommended.some((r) => normalizeStatKey(r) === normalizeStatKey(art.mainStatKey!))
    ) {
      const topRec = recommended[0]!;
      rawCandidates.push({
        id: `artifact_main_stat_${slot}_fix`,
        category: 'artifact_main_stat',
        target: slot,
        currentLevel: art.level ?? 0,
        targetLevel: 20,
        costs: domainCost,
        applyUpgrade: (char) => {
          if (char.artifacts?.[slot]) {
            char.artifacts = {
              ...char.artifacts,
              [slot]: {
                ...char.artifacts[slot]!,
                mainStatKey: topRec,
              },
            };
          }
        },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Evaluate Score Delta and Marginal Efficiency for Each Candidate
  // -------------------------------------------------------------------------

  const evaluatedCandidates: UpgradeCandidate[] = [];

  for (const candidate of rawCandidates) {
    const hypotheticalChar = structuredClone(request.character);
    candidate.applyUpgrade(hypotheticalChar);

    const sim = calculateReadiness({
      ...request,
      character: hypotheticalChar,
    });

    const expectedScoreDelta = Math.max(0, sim.score - currentReadiness.score);

    // Determine closesGap
    let closesGap = false;
    if (currentReadiness.status !== 'ready_for_target') {
      if (currentReadiness.metadata.hasEnergyDeficit && !sim.metadata.hasEnergyDeficit) {
        closesGap = true;
      } else if (!currentReadiness.dimensions.talents.isReady && sim.dimensions.talents.isReady) {
        closesGap = true;
      } else if (!currentReadiness.dimensions.weapon.isReady && sim.dimensions.weapon.isReady) {
        closesGap = true;
      } else if (
        !currentReadiness.dimensions.main_stats.isReady &&
        sim.dimensions.main_stats.isReady
      ) {
        closesGap = true;
      } else if (sim.status === 'ready_for_target') {
        closesGap = true;
      }
    }

    const normalizedCost = calculateNormalizedCost(candidate.costs);
    const multiplier = closesGap ? 2.5 : 1.0;
    const rankIndex = benchmark.priorityTalents.indexOf(
      candidate.target as 'normal' | 'skill' | 'burst',
    );
    const priorityWeight =
      candidate.category === 'talent'
        ? rankIndex === 0
          ? 1.5
          : rankIndex === 1
            ? 1.2
            : rankIndex >= 2
              ? 1.0
              : 0.5
        : 1.0;
    const rawEfficiency = ((expectedScoreDelta * multiplier) / normalizedCost) * priorityWeight;
    const efficiencyScore = Number((rawEfficiency * 100).toFixed(4));

    evaluatedCandidates.push({
      id: candidate.id,
      category: candidate.category,
      target: candidate.target,
      currentLevel: candidate.currentLevel,
      targetLevel: candidate.targetLevel,
      costs: candidate.costs,
      expectedScoreDelta,
      closesGap,
      efficiencyScore,
    });
  }

  // Sort candidates by efficiencyScore descending
  evaluatedCandidates.sort((a, b) => {
    if (b.efficiencyScore !== a.efficiencyScore) {
      return b.efficiencyScore - a.efficiencyScore;
    }
    if (b.closesGap !== a.closesGap) {
      return b.closesGap ? 1 : -1;
    }
    if (b.expectedScoreDelta !== a.expectedScoreDelta) {
      return b.expectedScoreDelta - a.expectedScoreDelta;
    }
    return a.costs.length - b.costs.length;
  });

  const recommendedNextAction = evaluatedCandidates[0] ?? null;

  return {
    currentReadiness,
    rankedUpgrades: evaluatedCandidates,
    recommendedNextAction,
    metadata: {
      characterKey: request.character.characterKey,
      roleId: benchmark.roleId,
      hasEnergyDeficit: currentReadiness.metadata.hasEnergyDeficit,
      missingSandsForEr,
      totalCandidatesEvaluated: evaluatedCandidates.length,
      unsupportedProgressionTargets,
    },
  };
}
