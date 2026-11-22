import type {
  Character,
  Element,
  TeamRecommendation,
  AbyssDualTeamPlan,
  AbyssChamberCoverage,
  AbyssHalfExplanation,
  AbyssMissingCounterFallback,
  ChamberHalfMetrics,
  EncounterTargetProfile,
  EnemyMovementTrait,
  OwnedCharacterProfile,
} from '../types/genshin';
import { CHARACTERS } from '../data/characters';
import { generateBestTeams } from './team-generator';
import { synthesizeTeamRotation } from './rotation-synthesizer';
import {
  calculateEffectiveResMultiplier,
  calculateShieldBreakTime,
  calculateTeamResShred,
  isNightsoulCharacter,
  NATLAN_NIGHTSOUL_IDS,
  type ShieldType,
} from './combat-mechanics';
import {
  ABYSS_CYCLES,
  type AbyssCycleConfig,
  type AbyssChamberHalfConfig,
} from '../data/abyss-schedules';
import { getSavedCustomAbyss } from '../services/storage';
import { isSameCharacterOrTraveler } from './team-rules';

export { NATLAN_NIGHTSOUL_IDS };

const SHIELD_COUNTER_ELEMENTS: Record<ShieldType, Element[]> = {
  Anemo: ['Pyro', 'Hydro', 'Electro', 'Cryo'],
  Pyro: ['Hydro', 'Electro', 'Geo'],
  Hydro: ['Dendro', 'Cryo', 'Electro'],
  Cryo: ['Pyro', 'Electro', 'Geo'],
  Electro: ['Pyro', 'Cryo', 'Dendro'],
  Geo: ['Geo'],
  Dendro: ['Pyro', 'Electro'],
  Nightspirit: ['Pyro', 'Hydro', 'Cryo', 'Electro', 'Dendro', 'Geo', 'Anemo'],
  Phlogiston: ['Pyro', 'Hydro', 'Cryo', 'Electro', 'Dendro', 'Geo', 'Anemo'],
};

function inferTargetProfile(halfConfig: AbyssChamberHalfConfig): EncounterTargetProfile {
  if (halfConfig.mechanics.targetProfile) return halfConfig.mechanics.targetProfile;
  if (halfConfig.mechanics.favorsAoE) return 'AoE';
  const totalCount = halfConfig.enemies.reduce((acc, e) => acc + (e.count ?? 1), 0);
  if (totalCount > 1 || halfConfig.enemies.length > 1) return 'Mixed';
  return 'Single-Target';
}

function collectMovementTraits(halfConfig: AbyssChamberHalfConfig): EnemyMovementTrait[] {
  return Array.from(
    new Set([
      ...(halfConfig.mechanics.movementTraits ?? []),
      ...halfConfig.enemies.flatMap((e) => e.movementTraits ?? []),
    ]),
  );
}

function evaluateTargetProfileFit(
  team: TeamRecommendation,
  profile: EncounterTargetProfile,
): { fit: 'Optimal' | 'Good' | 'Suboptimal'; scoreDelta: number; note?: string } {
  const tags = new Set(team.members.flatMap((m) => m.tags.map((t) => t.toLowerCase())));
  const archLower = team.archetype.toLowerCase();
  const hasGrouper =
    team.members.some((m) => m.element === 'Anemo' && m.roles.includes('Buffer/Shred')) ||
    tags.has('crowd-control') ||
    tags.has('grouping') ||
    tags.has('vv');
  const hasAoECapability =
    hasGrouper ||
    tags.has('aoe') ||
    tags.has('bloom') ||
    tags.has('burgeon') ||
    tags.has('electro-charged') ||
    tags.has('lunar-charged') ||
    tags.has('lunar-bloom') ||
    tags.has('overload') ||
    archLower.includes('bloom') ||
    archLower.includes('taser') ||
    archLower.includes('electro-charged') ||
    archLower.includes('freeze') ||
    archLower.includes('national');
  const hasStrongSingleTarget =
    team.members.some((m) => m.roles.includes('On-Field DPS')) &&
    (tags.has('single-target') ||
      tags.has('vaporize') ||
      tags.has('melt') ||
      tags.has('hyperbloom') ||
      tags.has('quicken') ||
      tags.has('spread') ||
      tags.has('aggravate') ||
      team.synergyScore >= 85);

  if (profile === 'AoE') {
    if (hasAoECapability) {
      return { fit: 'Optimal', scoreDelta: 20, note: 'Strong AoE/grouping coverage for multi-target waves' };
    }
    if (team.synergyScore >= 85) {
      return { fit: 'Good', scoreDelta: 5 };
    }
    return { fit: 'Suboptimal', scoreDelta: -15, note: 'Limited AoE cleave against multi-target encounter' };
  }

  if (profile === 'Single-Target') {
    if (hasStrongSingleTarget) {
      return { fit: 'Optimal', scoreDelta: 15, note: 'Focused single-target DPS well suited to boss HP pool' };
    }
    return { fit: 'Good', scoreDelta: 0 };
  }

  // Mixed
  if (hasAoECapability && hasStrongSingleTarget) {
    return { fit: 'Optimal', scoreDelta: 15 };
  }
  return { fit: 'Good', scoreDelta: 5 };
}

function evaluateBuffAlignment(
  team: TeamRecommendation,
  halfConfig: AbyssChamberHalfConfig,
  cycle: AbyssCycleConfig,
): { score: number; note?: string } {
  let score = 0;
  const matchedSignals: string[] = [];
  const teamElements = new Set(team.members.map((m) => m.element));
  const teamTags = new Set(team.members.flatMap((m) => m.tags.map((t) => t.toLowerCase())));
  const archLower = team.archetype.toLowerCase();

  const checkCriteria = (
    criteria?: {
      favoredElements?: Element[];
      favoredTags?: string[];
      favoredArchetypes?: string[];
    },
    weight = 1,
  ) => {
    if (!criteria) return;
    if (criteria.favoredElements) {
      const hit = criteria.favoredElements.filter((el) => teamElements.has(el));
      if (hit.length > 0) {
        score += Math.min(20, hit.length * 8) * weight;
        matchedSignals.push(`${hit.join('/')} buff synergy`);
      }
    }
    if (criteria.favoredTags) {
      const hit = criteria.favoredTags.filter((t) => teamTags.has(t.toLowerCase()));
      if (hit.length > 0) {
        score += Math.min(24, hit.length * 12) * weight;
        matchedSignals.push(`${hit[0]} alignment`);
      }
    }
    if (criteria.favoredArchetypes) {
      const hit = criteria.favoredArchetypes.find((a) => archLower.includes(a.toLowerCase()));
      if (hit) {
        score += 18 * weight;
        matchedSignals.push(`${hit} archetype bonus`);
      }
    }
  };

  checkCriteria(cycle.leyLineBuff, 1);
  checkCriteria(halfConfig.mechanics.chamberBuff, 0.75);

  const clamped = Math.min(40, Math.round(score));
  return {
    score: clamped,
    note: matchedSignals.length > 0 ? Array.from(new Set(matchedSignals)).join(' · ') : undefined,
  };
}

interface HalfEvalResult {
  satisfied: boolean;
  status: string;
  scoreDelta: number;
  metrics: ChamberHalfMetrics;
  strengths: string[];
  risks: string[];
  missingRequirement?: string;
}

/**
 * Evaluates mechanic coverage, resistances, shield efficiency, targeting, movement,
 * and buff synergy for a single half.
 */
function evaluateHalf(
  team: TeamRecommendation,
  halfConfig: AbyssChamberHalfConfig,
  _chamberNum: number,
  _isFirstHalf: boolean,
  cycle: AbyssCycleConfig,
): HalfEvalResult {
  const primaryEnemy = halfConfig.enemies[0];
  const enemyName = primaryEnemy?.name || 'Enemies';
  const enemyShort = enemyName.replace(/:.*/, '');

  if (!team.members || team.members.length === 0) {
    return {
      satisfied: false,
      status: `Warning: Incomplete team for ${enemyName}`,
      scoreDelta: 0,
      metrics: {},
      strengths: [],
      risks: [`Incomplete team assigned to ${enemyName}.`],
    };
  }

  const { mechanics } = halfConfig;
  let satisfied = true;
  let scoreDelta = 0;
  const statusPhrases: string[] = [];
  const strengths: string[] = [];
  const risks: string[] = [];
  let missingRequirement: string | undefined;

  // Derive effective prohibited elements from both explicit mechanics and 100% enemy immunities
  const immuneElements = new Set<Element>(mechanics.prohibitedElements ?? []);
  for (const enemy of halfConfig.enemies) {
    (['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'] as Element[]).forEach((el) => {
      if ((enemy.baseRes[el] ?? 10) >= 100) {
        immuneElements.add(el);
      }
    });
  }
  const prohibitedList = Array.from(immuneElements);

  // 1. Prohibited elements (immunities)
  if (prohibitedList.length > 0) {
    const hasImmuneOnly = team.members.every((m) => immuneElements.has(m.element));
    const carry = team.members.find((m) => m.roles.includes('On-Field DPS'));
    const isCarryProhibited = carry && immuneElements.has(carry.element);
    const hasNonProhibitedDps = team.members.some(
      (m) =>
        (m.roles.includes('On-Field DPS') || m.roles.includes('Off-Field DPS')) &&
        !immuneElements.has(m.element),
    );

    if (hasImmuneOnly) {
      satisfied = false;
      scoreDelta -= 80;
      missingRequirement = `Non-${prohibitedList.join('/')} DPS`;
      const msg = `Caution: Heavy ${prohibitedList.join('/')} reliance against immune ${enemyName}`;
      statusPhrases.push(msg);
      risks.push(msg);
    } else if (isCarryProhibited && !hasNonProhibitedDps) {
      satisfied = false;
      scoreDelta -= 100;
      missingRequirement = `Non-${prohibitedList.join('/')} Carry`;
      const msg = `Critical: Carry ${carry.name} is immune to ${enemyName}`;
      statusPhrases.push(msg);
      risks.push(msg);
    } else if (hasNonProhibitedDps) {
      scoreDelta += 30;
      const msg = `Counters ${enemyShort} with non-${prohibitedList.join('/')} burst`;
      statusPhrases.push(msg);
      strengths.push(msg);
    } else {
      satisfied = false;
      scoreDelta -= 50;
      missingRequirement = `Non-${prohibitedList.join('/')} DPS`;
      const msg = `Caution: Missing effective non-${prohibitedList.join('/')} damage dealers`;
      statusPhrases.push(msg);
      risks.push(msg);
    }
  }

  // 2. Bow requirement
  if (mechanics.requiresBow) {
    const bowUser = team.members.find((m) => m.weapon === 'Bow');
    if (bowUser) {
      scoreDelta += 100;
      const msg = `Bow user equipped (${bowUser.name}) to disable flying ${enemyShort} thrusters`;
      statusPhrases.push(msg);
      strengths.push(msg);
    } else {
      satisfied = false;
      scoreDelta -= 300;
      missingRequirement = missingRequirement ?? 'Bow User';
      const msg = `Critical: No Bow user to ground flying ${enemyShort}`;
      statusPhrases.push(msg);
      risks.push(msg);
    }
  }

  // 3. Shield Break computation
  let metrics: ChamberHalfMetrics = {};
  if (mechanics.shieldType && mechanics.shieldUnits !== undefined) {
    const shieldResult = calculateShieldBreakTime(
      mechanics.shieldType,
      mechanics.shieldUnits,
      team.members,
    );

    metrics = {
      shieldBreakTime: shieldResult.seconds === Infinity ? 999 : shieldResult.seconds,
      shieldBreakRating: shieldResult.rating,
      shieldBreakBreakdown: shieldResult.breakdown,
    };

    const isPyroLector =
      enemyName.toLowerCase().includes('pyro lector') ||
      (enemyName.toLowerCase().includes('lector') && mechanics.shieldType === 'Pyro');
    const targetLabel = isPyroLector ? 'Pyro Lector' : enemyShort;

    if (shieldResult.rating === 'Fast') {
      scoreDelta += 60;
      const msg =
        mechanics.shieldType === 'Pyro'
          ? `Rapid Hydro shield-shredder active for ${targetLabel} (${shieldResult.seconds}s)`
          : `Fast ${mechanics.shieldType} shield-break (${shieldResult.seconds}s) for ${targetLabel}`;
      statusPhrases.push(msg);
      strengths.push(msg);
    } else if (shieldResult.rating === 'Medium') {
      scoreDelta += 30;
      const msg = `Medium ${mechanics.shieldType} shield-break (${shieldResult.seconds}s) for ${targetLabel}`;
      statusPhrases.push(msg);
      strengths.push(msg);
    } else {
      satisfied = false;
      scoreDelta -= 100;
      missingRequirement = missingRequirement ?? `${mechanics.shieldType} Shield-Breaker`;
      const msg =
        mechanics.shieldType === 'Pyro'
          ? `Warning: Missing Hydro shield-breaker for ${targetLabel}`
          : `Warning: Slow / Ineffective ${mechanics.shieldType} shield breaking (${shieldResult.seconds}s) for ${targetLabel}`;
      statusPhrases.push(msg);
      risks.push(msg);
    }
  }

  // 4. Rotating multi-element shield requirement (explicitly driven by encounter data)
  if (mechanics.rotatingShields && mechanics.rotatingShields.length >= 2) {
    const teamElements = new Set(team.members.map((m) => m.element));
    const coveredShields = mechanics.rotatingShields.filter((sType) => {
      const counters = SHIELD_COUNTER_ELEMENTS[sType] ?? [];
      return counters.some((el) => teamElements.has(el));
    });
    if (teamElements.size >= 3 && coveredShields.length >= 2) {
      scoreDelta += 40;
      const msg = `Multi-element coverage (${Array.from(teamElements).join(', ')}) counters rotating shields`;
      statusPhrases.push(msg);
      strengths.push(msg);
    } else {
      satisfied = false;
      scoreDelta -= 45;
      missingRequirement = missingRequirement ?? 'Multi-Element Shield Coverage (3+ elements)';
      const msg = `Caution: Limited elemental variety against rotating ${mechanics.rotatingShields.join('/')} shields`;
      statusPhrases.push(msg);
      risks.push(msg);
    }
  }

  // 5. Nightsoul / Natlan blessing
  if (mechanics.favorsNightsoul) {
    const hasNightsoul = team.members.some((m) => isNightsoulCharacter(m));
    if (hasNightsoul) {
      scoreDelta += 40;
      const msg = `Nightsoul blessing: 300% faster Nightspirit shield break for ${enemyShort}`;
      statusPhrases.push(msg);
      strengths.push(msg);
    } else {
      satisfied = false;
      missingRequirement = missingRequirement ?? 'Natlan Nightsoul Character';
      const msg = `Standard shield break (slower without Natlan units against ${enemyShort})`;
      statusPhrases.push(msg);
      risks.push(msg);
    }
  }

  // 6. Shield-punishing enemies (Shadowy Husks / Black Serpent Knights)
  if (mechanics.punishesShields) {
    const hasShielder = team.members.some((m) =>
      m.tags.some((t) => t.toLowerCase().includes('shield')),
    );
    const hasHealer = team.members.some(
      (m) => m.roles.includes('Sustain') && !m.tags.some((t) => t.toLowerCase() === 'shielder'),
    );
    if (hasShielder && !hasHealer) {
      scoreDelta -= 30;
      risks.push(`Caution: Shield-reliant sustain triggers ${enemyShort} anti-shield buffs.`);
    } else if (hasHealer) {
      scoreDelta += 20;
      strengths.push(`Pure healer sustain avoids ${enemyShort} anti-shield mechanics.`);
    }
  }

  // 7. Target Profile (Single-Target vs. AoE) & Sustain
  const targetProfile = inferTargetProfile(halfConfig);
  const movementTraits = collectMovementTraits(halfConfig);
  const waveCount =
    halfConfig.mechanics.waveCount ??
    Math.max(1, ...halfConfig.enemies.map((e) => e.wave ?? 1));

  const targetEval = evaluateTargetProfileFit(team, targetProfile);
  scoreDelta += targetEval.scoreDelta;
  if (targetEval.note) {
    if (targetEval.fit === 'Optimal') strengths.push(targetEval.note);
    else if (targetEval.fit === 'Suboptimal') risks.push(targetEval.note);
  }

  if (mechanics.favorsAoE) {
    const hasSustain = team.members.some((m) => m.roles.includes('Sustain'));
    if (hasSustain || team.synergyScore >= 90) {
      scoreDelta += 20;
      const msg = `High AoE burst & survivability ready for ${enemyShort}`;
      statusPhrases.push(msg);
      strengths.push(msg);
    } else {
      satisfied = false;
      const msg = `Caution: Risk of burst damage deaths against ${enemyShort}`;
      statusPhrases.push(msg);
      risks.push(msg);
    }
  }

  // Movement & targeting checks (Airborne / Burrowing / Aggressive)
  if (movementTraits.includes('Airborne') && !mechanics.requiresBow) {
    const hasRanged = team.members.some((m) => m.weapon === 'Bow' || m.weapon === 'Catalyst');
    if (hasRanged) {
      scoreDelta += 15;
      strengths.push(`Ranged attacker maintains uptime against airborne ${enemyShort}`);
    } else {
      scoreDelta -= 15;
      risks.push(`Melee-locked lineup loses uptime during ${enemyShort} airborne phases.`);
    }
  }

  if (movementTraits.includes('Aggressive') && !mechanics.favorsAoE) {
    const hasSustain = team.members.some((m) => m.roles.includes('Sustain'));
    if (hasSustain) {
      scoreDelta += 10;
    } else {
      scoreDelta -= 15;
      risks.push(`No dedicated Sustain against aggressive ${enemyShort} attacks.`);
    }
  }

  // 8. Team RES shred & resistance penalty evaluation
  const carry = team.members.find((m) => m.roles.includes('On-Field DPS'));
  const isCarryProhibited = carry && immuneElements.has(carry.element);
  const subDps = team.members.find(
    (m) => m.roles.includes('Off-Field DPS') && !immuneElements.has(m.element),
  );
  const effectiveDps =
    (!isCarryProhibited ? carry : undefined) ||
    subDps ||
    team.members.find((m) => !immuneElements.has(m.element)) ||
    team.members[0];
  const dominantElement = effectiveDps?.element || 'Pyro';
  const shred = calculateTeamResShred(team.members, dominantElement);

  const avgEnemyRes =
    halfConfig.enemies.reduce((acc, e) => acc + (e.baseRes[dominantElement] ?? 10), 0) /
    Math.max(1, halfConfig.enemies.length);
  const maxEnemyRes = Math.max(
    ...halfConfig.enemies.map((e) => e.baseRes[dominantElement] ?? 10),
  );
  const targetEnemyRes = Math.max(avgEnemyRes, maxEnemyRes >= 50 ? maxEnemyRes : avgEnemyRes);
  const dmgMultiplier = calculateEffectiveResMultiplier(targetEnemyRes, shred.totalShred);

  if (targetEnemyRes >= 40 && targetEnemyRes < 100) {
    if (dmgMultiplier >= 0.85) {
      scoreDelta += 25;
      strengths.push(
        `RES shred (${shred.totalShred}%) neutralizes ${enemyShort}'s ${Math.round(targetEnemyRes)}% ${dominantElement} RES`,
      );
    } else if (dmgMultiplier < 0.7) {
      scoreDelta -= 35;
      risks.push(
        `High ${dominantElement} RES (${Math.round(targetEnemyRes)}%) reduces ${effectiveDps?.name ?? dominantElement} output (${Math.round(dmgMultiplier * 100)}% mult)`,
      );
    }
  } else if (shred.totalShred >= 30) {
    scoreDelta += 10;
  }

  // 9. Cycle & chamber buff alignment
  const buffEval = evaluateBuffAlignment(team, halfConfig, cycle);
  scoreDelta += Math.round(buffEval.score * 0.5);

  metrics = {
    ...metrics,
    effectiveResShred: shred.totalShred,
    resShredSources: shred.sources,
    effectiveDmgMultiplier: Math.round(dmgMultiplier * 100) / 100,
    targetProfile,
    targetProfileFit: targetEval.fit,
    movementTraits,
    waveCount,
    buffAlignmentScore: buffEval.score,
    buffAlignmentNote: buffEval.note,
  };

  const status =
    statusPhrases.length > 0 ? statusPhrases.join(' · ') : 'Chamber mechanics fully handled.';

  return {
    satisfied,
    status,
    scoreDelta,
    metrics,
    strengths,
    risks,
    missingRequirement,
  };
}

function buildHalfExplanation(
  half: 'First Half' | 'Second Half',
  team: TeamRecommendation,
  evals: HalfEvalResult[],
  cycle: AbyssCycleConfig,
): AbyssHalfExplanation {
  const strengths = Array.from(new Set(evals.flatMap((e) => e.strengths))).slice(0, 5);
  const risks = Array.from(new Set(evals.flatMap((e) => e.risks))).slice(0, 4);
  const satisfiedCount = evals.filter((e) => e.satisfied).length;

  const fits = evals.map((e) => e.metrics.targetProfileFit ?? 'Good');
  const targetProfileFit: 'Optimal' | 'Good' | 'Suboptimal' = fits.includes('Suboptimal')
    ? 'Suboptimal'
    : fits.filter((f) => f === 'Optimal').length >= 2
      ? 'Optimal'
      : 'Good';

  const buffNotes = Array.from(
    new Set(evals.map((e) => e.metrics.buffAlignmentNote).filter(Boolean) as string[]),
  );

  const movementNotes = Array.from(
    new Set(
      cycle.chambers.flatMap((ch) => {
        const cfg = half === 'First Half' ? ch.firstHalf : ch.secondHalf;
        const notes: string[] = [];
        if (cfg.mechanics.positioningTip) {
          notes.push(`C${ch.chamber}: ${cfg.mechanics.positioningTip}`);
        }
        return notes;
      }),
    ),
  );

  const summary =
    satisfiedCount === evals.length
      ? `${team.name} clears all ${evals.length}/3 ${half} mechanical checks with ${targetProfileFit.toLowerCase()} target-profile fit.`
      : `${team.name} satisfies ${satisfiedCount}/${evals.length} ${half} checks; address flagged counters before attempting 36★.`;

  return {
    half,
    summary,
    strengths,
    risks,
    buffSynergy: buffNotes.length > 0 ? buffNotes.join(' · ') : undefined,
    targetProfileFit,
    movementNotes,
  };
}

function buildMissingCounterFallbacks(
  teamA: TeamRecommendation,
  teamB: TeamRecommendation,
  firstEvals: HalfEvalResult[],
  secondEvals: HalfEvalResult[],
  ownedChars: Character[],
  cycle: AbyssCycleConfig,
): AbyssMissingCounterFallback[] {
  const fallbacks: AbyssMissingCounterFallback[] = [];
  const usedIds = new Set([...teamA.members, ...teamB.members].map((m) => m.id));
  const benchChars = ownedChars.filter((c) => !usedIds.has(c.id));

  const inspectHalf = (
    half: 'First Half' | 'Second Half',
    evals: HalfEvalResult[],
  ) => {
    evals.forEach((ev, idx) => {
      if (ev.satisfied || !ev.missingRequirement) return;
      const ch = cycle.chambers[idx];
      if (!ch) return;
      const cfg = half === 'First Half' ? ch.firstHalf : ch.secondHalf;
      const req = ev.missingRequirement;

      let matches: Character[];
      let reasonLabel = '';
      let strategyTip: string;

      if (req === 'Bow User') {
        matches = benchChars.filter((c) => c.weapon === 'Bow');
        reasonLabel = 'Bow user to shoot airborne weakpoints';
        strategyTip = 'Slot any Bow user (even low-investment) purely to ground the boss during takeoff.';
      } else if (req === 'Natlan Nightsoul Character') {
        matches = benchChars.filter((c) => isNightsoulCharacter(c));
        reasonLabel = 'Nightsoul hits shred ward 300% faster';
        strategyTip = 'Without Natlan units, use rapid multi-hit elemental reactions (Burning, Electro-Charged, Hyperbloom) to force the bar.';
      } else if (req.includes('Shield-Breaker') && cfg.mechanics.shieldType) {
        const counterEls = SHIELD_COUNTER_ELEMENTS[cfg.mechanics.shieldType] ?? [];
        matches = benchChars.filter(
          (c) =>
            counterEls.includes(c.element) ||
            (cfg.mechanics.shieldType === 'Geo' && c.weapon === 'Claymore'),
        );
        reasonLabel = `Counters ${cfg.mechanics.shieldType} shield`;
        strategyTip = `Bring off-field ${counterEls.slice(0, 2).join('/')} application to break the ${cfg.mechanics.shieldType} ward without stalling rotation time.`;
      } else if (req.includes('Non-')) {
        const prohibited = new Set(cfg.mechanics.prohibitedElements ?? []);
        matches = benchChars.filter(
          (c) =>
            !prohibited.has(c.element) &&
            (c.roles.includes('On-Field DPS') || c.roles.includes('Off-Field DPS')),
        );
        reasonLabel = 'Deals full damage against immune enemies';
        strategyTip = 'Swap halves or pivot your carry element away from the immune aura.';
      } else {
        matches = benchChars.filter(
          (c) => c.roles.includes('Off-Field DPS') || c.roles.includes('Buffer/Shred'),
        );
        reasonLabel = 'Adds extra elemental variety for rotating shields';
        strategyTip = 'Include at least 3 distinct elements so rotating barriers never wall your team.';
      }

      fallbacks.push({
        half,
        chamber: ch.chamber,
        missingRequirement: req,
        ownedSubstitutes: matches.slice(0, 3).map((c) => ({
          characterId: c.id,
          characterName: c.name,
          element: c.element,
          reason: reasonLabel,
        })),
        strategyTip,
      });
    });
  };

  inspectHalf('First Half', firstEvals);
  inspectHalf('Second Half', secondEvals);
  return fallbacks;
}

/**
 * Evaluates Floor 12 chamber mechanic coverage for a First Half and Second Half team pair.
 */
export function evaluateChamberMechanicCoverage(
  teamA: TeamRecommendation,
  teamB: TeamRecommendation,
  cycle?: AbyssCycleConfig,
): {
  coverage: AbyssChamberCoverage[];
  totalScore: number;
  firstHalfExplanation: AbyssHalfExplanation;
  secondHalfExplanation: AbyssHalfExplanation;
  firstEvals: HalfEvalResult[];
  secondEvals: HalfEvalResult[];
} {
  const activeCycle = cycle || ABYSS_CYCLES[0];
  let score = teamA.synergyScore + teamB.synergyScore;
  const coverage: AbyssChamberCoverage[] = [];
  const firstEvals: HalfEvalResult[] = [];
  const secondEvals: HalfEvalResult[] = [];

  for (const chamberConfig of activeCycle.chambers) {
    const chamberNum = chamberConfig.chamber;

    const resFirst = evaluateHalf(
      teamA,
      chamberConfig.firstHalf,
      chamberNum,
      true,
      activeCycle,
    );
    const resSecond = evaluateHalf(
      teamB,
      chamberConfig.secondHalf,
      chamberNum,
      false,
      activeCycle,
    );

    firstEvals.push(resFirst);
    secondEvals.push(resSecond);
    score += resFirst.scoreDelta + resSecond.scoreDelta;

    coverage.push({
      chamber: chamberNum,
      firstHalfStatus: resFirst.status,
      secondHalfStatus: resSecond.status,
      firstHalfSatisfied: resFirst.satisfied,
      secondHalfSatisfied: resSecond.satisfied,
      firstHalfMetrics: resFirst.metrics,
      secondHalfMetrics: resSecond.metrics,
    });
  }

  return {
    coverage,
    totalScore: score,
    firstHalfExplanation: buildHalfExplanation('First Half', teamA, firstEvals, activeCycle),
    secondHalfExplanation: buildHalfExplanation('Second Half', teamB, secondEvals, activeCycle),
    firstEvals,
    secondEvals,
  };
}

function calculateResonance(members: Character[]): string[] {
  const counts: Record<string, number> = {};
  for (const m of members) {
    counts[m.element] = (counts[m.element] || 0) + 1;
  }
  const resonances: string[] = [];
  if ((counts['Pyro'] ?? 0) >= 2) resonances.push('Fervent Flames: +25% ATK');
  if ((counts['Hydro'] ?? 0) >= 2) resonances.push('Soothing Water: +25% Max HP');
  if ((counts['Dendro'] ?? 0) >= 2) resonances.push('Sprawling Greenery: +50 to +100 EM');
  if ((counts['Cryo'] ?? 0) >= 2) resonances.push('Shattering Ice: +15% CRIT Rate against Frozen/Cryo');
  if ((counts['Geo'] ?? 0) >= 2) resonances.push('Enduring Rock: +15% Shield Strength & +15% DMG dealt');
  if ((counts['Anemo'] ?? 0) >= 2) resonances.push('Impetuous Winds: -15% Stamina & +10% Movement Speed');
  if ((counts['Electro'] ?? 0) >= 2) resonances.push('High Voltage: Electro reactions generate Energy particles');
  return resonances;
}

/**
 * Builds a fallback team of 4 characters from available pool when standard archetypes do not match.
 */
function buildFallbackTeam(pool: Character[], teamId: string, teamName: string): TeamRecommendation {
  const chosen: Character[] = [];

  const carry = pool.find((c) => c.roles.includes('On-Field DPS')) || pool[0];
  if (carry) chosen.push(carry);

  const buffer = pool.find(
    (c) => !chosen.some((x) => isSameCharacterOrTraveler(x, c)) && c.roles.includes('Buffer/Shred'),
  );
  if (buffer) chosen.push(buffer);

  const subDps = pool.find(
    (c) => !chosen.some((x) => isSameCharacterOrTraveler(x, c)) && c.roles.includes('Off-Field DPS'),
  );
  if (subDps) chosen.push(subDps);

  const sustain = pool.find(
    (c) => !chosen.some((x) => isSameCharacterOrTraveler(x, c)) && c.roles.includes('Sustain'),
  );
  if (sustain) chosen.push(sustain);

  for (const c of pool) {
    if (chosen.length >= 4) break;
    if (!chosen.some((x) => isSameCharacterOrTraveler(x, c))) chosen.push(c);
  }

  const stepped = synthesizeTeamRotation(chosen);

  return {
    id: teamId,
    name: teamName,
    archetype: 'Custom Flex',
    members: chosen,
    synergyScore: 78,
    comfortScore: chosen.some((m) => m.roles.includes('Sustain')) ? 85 : 65,
    reasons: ['Balanced combat composition constructed from remaining roster.'],
    rotation: stepped.summaryString || 'Execute support skills followed by carry combo.',
    steppedRotation: stepped,
    resonance: calculateResonance(chosen),
  };
}

/**
 * Synthesizes encounter-adapted team variants when a player owns a required counter
 * (e.g., Bow user, shield-breaker, Nightsoul unit) that wasn't picked in top raw-synergy teams.
 */
function injectEncounterCounterCandidates(
  baseTeams: TeamRecommendation[],
  availablePool: Character[],
  cycle: AbyssCycleConfig,
): TeamRecommendation[] {
  const injected: TeamRecommendation[] = [];
  const needsBow = cycle.chambers.some(
    (c) => c.firstHalf.mechanics.requiresBow || c.secondHalf.mechanics.requiresBow,
  );
  const needsHydroShieldBreak = cycle.chambers.some(
    (c) =>
      c.firstHalf.mechanics.shieldType === 'Pyro' ||
      c.secondHalf.mechanics.shieldType === 'Pyro',
  );
  const needsGeoShieldBreak = cycle.chambers.some(
    (c) =>
      c.firstHalf.mechanics.shieldType === 'Geo' ||
      c.secondHalf.mechanics.shieldType === 'Geo',
  );

  const tryInject = (
    predicate: (c: Character) => boolean,
    tag: string,
    reason: string,
  ) => {
    if (baseTeams.some((t) => t.members.some(predicate))) return;
    const specialist =
      availablePool.find((c) => predicate(c) && (c.roles.includes('Off-Field DPS') || c.roles.includes('Buffer/Shred'))) ||
      availablePool.find(predicate);
    if (!specialist || baseTeams.length === 0) return;

    for (const base of baseTeams.slice(0, 3)) {
      if (base.members.length < 4) continue;
      if (base.members.some((m) => isSameCharacterOrTraveler(m, specialist))) continue;
      const replaceIdx =
        base.members.findIndex((m) => !m.roles.includes('On-Field DPS') && !m.roles.includes('Sustain')) !== -1
          ? base.members.findIndex((m) => !m.roles.includes('On-Field DPS') && !m.roles.includes('Sustain'))
          : base.members.length - 1;
      const newMembers = [...base.members];
      newMembers[replaceIdx] = specialist;
      const stepped = synthesizeTeamRotation(newMembers);
      injected.push({
        ...base,
        id: `${base.id}-${tag}-${specialist.id}`,
        name: `${base.name} (${specialist.name} Tech)`,
        members: newMembers,
        synergyScore: Math.max(60, base.synergyScore - 6),
        reasons: [...base.reasons, reason],
        rotation: stepped.summaryString || base.rotation,
        steppedRotation: stepped,
        resonance: calculateResonance(newMembers),
      });
    }
  };

  if (needsBow) {
    tryInject((c) => c.weapon === 'Bow', 'bow', 'Tech slot: Bow user added to ground airborne Abyss boss.');
  }
  if (needsHydroShieldBreak) {
    tryInject((c) => c.element === 'Hydro', 'hydro', 'Tech slot: Hydro applicator added for Pyro shield break.');
  }
  if (needsGeoShieldBreak) {
    tryInject((c) => c.element === 'Geo' || c.weapon === 'Claymore', 'geo', 'Tech slot: Geo/Claymore added for Geo armor break.');
  }

  return injected;
}

/**
 * Solves the unified Spiral Abyss Floor 12 pairing:
 * Finds two completely disjoint teams (TeamA ∩ TeamB = ∅) prioritizing 100% chamber mechanics clearance,
 * then returns Top-3 distinct pairings (Primary Best-in-Slot, Comfort/High Sustain, Accessible/Alternative)
 * along with half explanations and missing-counter fallbacks.
 */
export function solveAbyssDualTeams(
  ownedIds: string[],
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
  cycle?: AbyssCycleConfig,
): AbyssDualTeamPlan {
  const activeCycle = cycle || ABYSS_CYCLES[0];
  const ownedSet = new Set(ownedIds);
  const rawOwnedChars = CHARACTERS.filter((c) => ownedSet.has(c.id));

  // Deduplicate Traveler forms, picking the highest-invested variant
  const travelerChars = rawOwnedChars.filter((c) => isSameCharacterOrTraveler(c, 'TravelerAnemo'));
  let chosenTraveler: Character | undefined;
  if (travelerChars.length > 0) {
    chosenTraveler = travelerChars.sort((a, b) => {
      const pA = rosterProfiles?.[a.id];
      const pB = rosterProfiles?.[b.id];
      const scoreA = (pA?.level ?? a.level ?? 90) * 10 + (pA?.constellation ?? a.constellation ?? 0);
      const scoreB = (pB?.level ?? b.level ?? 90) * 10 + (pB?.constellation ?? b.constellation ?? 0);
      return scoreB - scoreA;
    })[0];
  }

  const ownedChars = rawOwnedChars.filter((c) => {
    if (isSameCharacterOrTraveler(c, 'TravelerAnemo')) {
      return c.id === chosenTraveler?.id;
    }
    return true;
  });
  const uniqueOwnedIds = ownedChars.map((c) => c.id);

  // Graceful partial draft when fewer than 8 distinct characters are owned
  if (ownedChars.length < 8) {
    const team1 = buildFallbackTeam(ownedChars, 'abyss-half-1', 'Abyss First Half');
    const remainingForTeam2 = ownedChars.filter(
      (c) => !team1.members.some((m) => isSameCharacterOrTraveler(m, c)),
    );
    const team2 = buildFallbackTeam(remainingForTeam2, 'abyss-half-2', 'Abyss Second Half');
    const evalRes = evaluateChamberMechanicCoverage(team1, team2, activeCycle);
    const partialPlan: AbyssDualTeamPlan = {
      firstHalfTeam: team1,
      secondHalfTeam: team2,
      chamberCoverage: evalRes.coverage,
      overallScore: Math.max(0, evalRes.totalScore),
      mechanicCoverageScore: Math.max(0, evalRes.totalScore),
      cycleId: activeCycle.id,
      variantType: 'primary',
      label: 'Primary Best-in-Slot',
      description: 'Partial draft composition due to limited character roster.',
      firstHalfExplanation: evalRes.firstHalfExplanation,
      secondHalfExplanation: evalRes.secondHalfExplanation,
      missingCounterFallbacks: buildMissingCounterFallbacks(
        team1,
        team2,
        evalRes.firstEvals,
        evalRes.secondEvals,
        ownedChars,
        activeCycle,
      ),
      warnings: [
        `Roster Shortfall: Floor 12 requires at least 8 distinct characters (4 for First Half, 4 for Second Half). Your roster only has ${ownedChars.length} distinct characters. Showing partial draft.`,
      ],
    };
    partialPlan.allPairs = [partialPlan];
    partialPlan.primaryPair = partialPlan;
    return partialPlan;
  }

  // 1. Generate candidate primary teams + encounter-adapted tech variants
  const rawCandidateTeams = generateBestTeams(uniqueOwnedIds, undefined, rosterProfiles);
  const candidateTeams = [
    ...rawCandidateTeams,
    ...injectEncounterCounterCandidates(rawCandidateTeams, ownedChars, activeCycle),
  ];

  interface ScoredPair {
    firstHalfTeam: TeamRecommendation;
    secondHalfTeam: TeamRecommendation;
    coverage: AbyssChamberCoverage[];
    totalScore: number;
    satisfiedCount: number;
    comfortScore: number;
    synergyScore: number;
    firstHalfExplanation: AbyssHalfExplanation;
    secondHalfExplanation: AbyssHalfExplanation;
    firstEvals: HalfEvalResult[];
    secondEvals: HalfEvalResult[];
  }

  const evaluatedPairs: ScoredPair[] = [];
  const evaluatedPairKeys = new Set<string>();

  const considerPair = (teamA: TeamRecommendation, teamB: TeamRecommendation) => {
    if (
      teamA.members.some((m) => !ownedSet.has(m.id)) ||
      teamB.members.some((m) => !ownedSet.has(m.id))
    ) {
      return;
    }

    const hasOverlap = teamB.members.some((mB) =>
      teamA.members.some((mA) => isSameCharacterOrTraveler(mA, mB)),
    );
    if (hasOverlap) {
      return;
    }

    if (!teamA.steppedRotation) {
      teamA.steppedRotation = synthesizeTeamRotation(teamA.members);
    }
    if (!teamB.steppedRotation) {
      teamB.steppedRotation = synthesizeTeamRotation(teamB.members);
    }

    const testOrientation = (t1: TeamRecommendation, t2: TeamRecommendation) => {
      const key = `${t1.members.map((m) => m.id).sort().join(',')}|${t2.members.map((m) => m.id).sort().join(',')}`;
      if (evaluatedPairKeys.has(key)) return;
      evaluatedPairKeys.add(key);

      const res = evaluateChamberMechanicCoverage(t1, t2, activeCycle);
      const satisfiedCount = res.coverage.reduce(
        (acc, c) => acc + (c.firstHalfSatisfied ? 1 : 0) + (c.secondHalfSatisfied ? 1 : 0),
        0,
      );

      evaluatedPairs.push({
        firstHalfTeam: t1,
        secondHalfTeam: t2,
        coverage: res.coverage,
        totalScore: res.totalScore,
        satisfiedCount,
        comfortScore: t1.comfortScore + t2.comfortScore,
        synergyScore: t1.synergyScore + t2.synergyScore,
        firstHalfExplanation: res.firstHalfExplanation,
        secondHalfExplanation: res.secondHalfExplanation,
        firstEvals: res.firstEvals,
        secondEvals: res.secondEvals,
      });
    };

    testOrientation(teamA, teamB);
    testOrientation(teamB, teamA);
  };

  // 2. Pair top candidates against disjoint secondary candidates (including encounter tech variants)
  const primaryPool = candidateTeams.slice(0, 12);
  for (const team1 of primaryPool) {
    const remainingChars = ownedChars.filter(
      (c) => !team1.members.some((m) => isSameCharacterOrTraveler(m, c)),
    );

    if (remainingChars.length >= 4) {
      const remainingIds = remainingChars.map((c) => c.id);
      const rawSecondary = generateBestTeams(remainingIds, undefined, rosterProfiles);
      const secondaryTeams = [
        ...rawSecondary,
        ...injectEncounterCounterCandidates(rawSecondary, remainingChars, activeCycle),
      ];

      if (secondaryTeams.length > 0) {
        for (const team2 of secondaryTeams.slice(0, 8)) {
          considerPair(team1, team2);
        }
      } else {
        const fallbackTeam2 = buildFallbackTeam(
          remainingChars,
          `team-sub-${team1.id}`,
          'Secondary Composition',
        );
        considerPair(team1, fallbackTeam2);
      }
    }
  }

  // 3. Fallback if no pair was discovered
  if (evaluatedPairs.length === 0) {
    const team1 = buildFallbackTeam(ownedChars, 'abyss-fallback-1', 'First Half Vanguard');
    const remainingForHalf2 = ownedChars.filter(
      (c) => !team1.members.some((h) => isSameCharacterOrTraveler(h, c)),
    );
    const team2 = buildFallbackTeam(remainingForHalf2, 'abyss-fallback-2', 'Second Half Rearguard');
    considerPair(team1, team2);

    if (evaluatedPairs.length === 0) {
      const res = evaluateChamberMechanicCoverage(team1, team2, activeCycle);
      evaluatedPairs.push({
        firstHalfTeam: team1,
        secondHalfTeam: team2,
        coverage: res.coverage,
        totalScore: res.totalScore,
        satisfiedCount: 0,
        comfortScore: team1.comfortScore + team2.comfortScore,
        synergyScore: team1.synergyScore + team2.synergyScore,
        firstHalfExplanation: res.firstHalfExplanation,
        secondHalfExplanation: res.secondHalfExplanation,
        firstEvals: res.firstEvals,
        secondEvals: res.secondEvals,
      });
    }
  }

  const rankScore = (pair: ScoredPair) => pair.satisfiedCount * 1000 + pair.totalScore;
  evaluatedPairs.sort((a, b) => rankScore(b) - rankScore(a));

  const toPlan = (
    sp: ScoredPair,
    variantType: 'primary' | 'comfort' | 'alternative',
    label: string,
    description: string,
  ): AbyssDualTeamPlan => {
    const warnings: string[] = [];
    if (sp.firstHalfTeam.members.length < 4 || sp.secondHalfTeam.members.length < 4) {
      warnings.push('Incomplete Composition: One or both halves have fewer than 4 characters.');
    }
    const fallbacks = buildMissingCounterFallbacks(
      sp.firstHalfTeam,
      sp.secondHalfTeam,
      sp.firstEvals,
      sp.secondEvals,
      ownedChars,
      activeCycle,
    );
    return {
      firstHalfTeam: sp.firstHalfTeam,
      secondHalfTeam: sp.secondHalfTeam,
      chamberCoverage: sp.coverage,
      overallScore: Math.max(0, sp.totalScore),
      mechanicCoverageScore: Math.max(0, sp.totalScore),
      cycleId: activeCycle.id,
      variantType,
      label,
      description,
      firstHalfExplanation: sp.firstHalfExplanation,
      secondHalfExplanation: sp.secondHalfExplanation,
      ...(fallbacks.length > 0 ? { missingCounterFallbacks: fallbacks } : {}),
      ...(warnings.length > 0 ? { warnings } : {}),
    };
  };

  const bestScored = evaluatedPairs[0];
  const primaryPair = toPlan(
    bestScored,
    'primary',
    'Primary Best-in-Slot',
    'Optimal pairing maximizing elemental shield shredding, boss counter mechanics, and combat synergy.',
  );

  const areDifferentPairs = (p1: ScoredPair, p2: ScoredPair) => {
    const s1A = new Set(p1.firstHalfTeam.members.map((m) => m.id));
    const s1B = new Set(p1.secondHalfTeam.members.map((m) => m.id));
    const isSameOrient =
      s1A.size === p2.firstHalfTeam.members.length &&
      s1B.size === p2.secondHalfTeam.members.length &&
      p2.firstHalfTeam.members.every((m) => s1A.has(m.id)) &&
      p2.secondHalfTeam.members.every((m) => s1B.has(m.id));
    const isSwappedOrient =
      s1B.size === p2.firstHalfTeam.members.length &&
      s1A.size === p2.secondHalfTeam.members.length &&
      p2.firstHalfTeam.members.every((m) => s1B.has(m.id)) &&
      p2.secondHalfTeam.members.every((m) => s1A.has(m.id));
    return !isSameOrient && !isSwappedOrient;
  };

  let comfortScored = evaluatedPairs.slice(1).find((p) => {
    if (!areDifferentPairs(p, bestScored)) return false;
    const hasSustainA = p.firstHalfTeam.members.some((m) => m.roles.includes('Sustain'));
    const hasSustainB = p.secondHalfTeam.members.some((m) => m.roles.includes('Sustain'));
    return (hasSustainA && hasSustainB) || p.comfortScore >= 160;
  });
  if (!comfortScored) {
    comfortScored = evaluatedPairs
      .slice(1)
      .filter((p) => areDifferentPairs(p, bestScored))
      .sort((a, b) => b.comfortScore - a.comfortScore)[0];
  }

  const comfortPair = comfortScored
    ? toPlan(
        comfortScored,
        'comfort',
        'Comfort / High Sustain',
        'High-safety composition featuring dedicated shielders and healers for maximum error tolerance.',
      )
    : undefined;

  const getCarryIds = (p: ScoredPair) => {
    const cA = p.firstHalfTeam.members.find((m) => m.roles.includes('On-Field DPS'))?.id;
    const cB = p.secondHalfTeam.members.find((m) => m.roles.includes('On-Field DPS'))?.id;
    return new Set([cA, cB].filter(Boolean));
  };
  const primaryCarries = getCarryIds(bestScored);

  let alternativeScored = evaluatedPairs.slice(1).find((p) => {
    if (!areDifferentPairs(p, bestScored)) return false;
    if (comfortScored && !areDifferentPairs(p, comfortScored)) return false;
    const pCarries = getCarryIds(p);
    return Array.from(pCarries).some((cId) => !primaryCarries.has(cId));
  });

  if (!alternativeScored) {
    alternativeScored = evaluatedPairs.slice(1).find((p) => {
      if (!areDifferentPairs(p, bestScored)) return false;
      if (comfortScored && !areDifferentPairs(p, comfortScored)) return false;
      return true;
    });
  }

  const alternativePair = alternativeScored
    ? toPlan(
        alternativeScored,
        'alternative',
        'Accessible / Alternative Core',
        'Versatile alternative lineup leveraging adaptable core characters and accessible substitutions.',
      )
    : undefined;

  const allPairs: AbyssDualTeamPlan[] = [primaryPair];
  if (comfortPair) allPairs.push(comfortPair);
  if (alternativePair) allPairs.push(alternativePair);

  primaryPair.allPairs = allPairs;
  primaryPair.primaryPair = primaryPair;
  primaryPair.comfortPair = comfortPair;
  primaryPair.alternativePair = alternativePair;

  return primaryPair;
}

/**
 * 1-Click Swap Halves: Swaps First Half and Second Half teams and re-evaluates chamber coverage,
 * explanations, and fallback recommendations. Guaranteed 0-overlap preservation.
 */
export function swapAbyssDualHalves(
  plan: AbyssDualTeamPlan,
  cycle?: AbyssCycleConfig,
): AbyssDualTeamPlan {
  const swapSingle = (p: AbyssDualTeamPlan): AbyssDualTeamPlan => {
    const swappedFirst = { ...p.secondHalfTeam };
    const swappedSecond = { ...p.firstHalfTeam };
    const activeCycle =
      cycle ||
      (p.cycleId === 'custom-sandbox'
        ? getSavedCustomAbyss()
        : p.cycleId
          ? ABYSS_CYCLES.find((c) => c.id === p.cycleId)
          : undefined) ||
      ABYSS_CYCLES[0];

    const evalRes = evaluateChamberMechanicCoverage(
      swappedFirst,
      swappedSecond,
      activeCycle,
    );

    return {
      ...p,
      firstHalfTeam: swappedFirst,
      secondHalfTeam: swappedSecond,
      chamberCoverage: evalRes.coverage,
      overallScore: Math.max(0, evalRes.totalScore),
      mechanicCoverageScore: Math.max(0, evalRes.totalScore),
      firstHalfExplanation: evalRes.firstHalfExplanation,
      secondHalfExplanation: evalRes.secondHalfExplanation,
    };
  };

  const swappedPrimary = swapSingle(plan);
  if (plan.allPairs && plan.allPairs.length > 0) {
    const swappedAll = plan.allPairs.map((p) => swapSingle(p));
    swappedPrimary.allPairs = swappedAll;
    swappedPrimary.primaryPair = swappedAll[0];
    swappedPrimary.comfortPair = swappedAll.find((p) => p.variantType === 'comfort');
    swappedPrimary.alternativePair = swappedAll.find((p) => p.variantType === 'alternative');
  }
  return swappedPrimary;
}
