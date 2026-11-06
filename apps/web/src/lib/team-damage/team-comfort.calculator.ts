export interface TeamComfortScore {
  score: number; // 0–100
  tier: 'comfort_first' | 'balanced' | 'high_execution';
  metrics: {
    hasSustainedHealing: boolean;
    hasShield: boolean;
    interruptionResistanceTier: 'none' | 'partial' | 'complete';
    executionFriction: 'low' | 'moderate' | 'strict';
  };
}

// Canonical avatar IDs providing sustained healing
const HEALERS = new Set([
  10000054, // Kokomi
  10000032, // Bennett
  10000082, // Baizhu
  10000065, // Kuki Shinobu
  10000003, // Jean
  10000014, // Barbara
  10000039, // Diona
  10000077, // Yaoyao
  10000088, // Charlotte
  10000093, // Xianyun
  10000045, // Sayu
  10000053, // Sayu / Qiqi (10000035)
  10000035, // Qiqi
]);

// Canonical avatar IDs providing shields
const SHIELDERS = new Set([
  10000030, // Zhongli
  10000039, // Diona
  10000058, // Thoma
  10000074, // Layla
  10000061, // Kirara
  10000082, // Baizhu
  10000115, // Dahlia
  10000024, // Beidou
  10000034, // Noelle
]);

// Complete interruption immunity
const COMPLETE_POISE = new Set([
  10000030, // Zhongli (shield)
  10000052, // Raiden Shogun (burst state)
  10000079, // Dehya (Gold-Forge Form)
]);

// Partial interruption resistance
const PARTIAL_POISE = new Set([
  10000025, // Xingqiu (rainswords)
  10000024, // Beidou
]);

function extractAvatarId(characterKey: string): number {
  const parts = characterKey.split(':');
  const idNum = Number(parts[0]);
  return Number.isFinite(idNum) ? idNum : 0;
}

/**
 * Calculates defensive comfort metrics and composite score (0-100).
 */
export function calculateTeamComfort(memberKeys: string[]): TeamComfortScore {
  const avatarIds = memberKeys.map(extractAvatarId);

  const hasShield = avatarIds.some((id) => SHIELDERS.has(id));
  const hasSustainedHealing = avatarIds.some((id) => HEALERS.has(id));

  let interruptionResistanceTier: 'none' | 'partial' | 'complete' = 'none';
  if (hasShield || avatarIds.some((id) => COMPLETE_POISE.has(id))) {
    interruptionResistanceTier = 'complete';
  } else if (avatarIds.some((id) => PARTIAL_POISE.has(id))) {
    interruptionResistanceTier = 'partial';
  }

  // Execution friction
  let executionFriction: 'low' | 'moderate' | 'strict' = 'moderate';
  if (hasShield && hasSustainedHealing) {
    executionFriction = 'low';
  } else if (!hasShield && !hasSustainedHealing) {
    executionFriction = 'strict';
  }

  // Calculate score (0-100)
  let score = 50;
  if (hasShield) score += 25;
  if (hasSustainedHealing) score += 25;
  if (interruptionResistanceTier === 'complete') score += 10;
  else if (interruptionResistanceTier === 'partial') score += 5;

  if (executionFriction === 'strict') score -= 25;

  const clampedScore = Math.max(0, Math.min(100, score));

  let tier: 'comfort_first' | 'balanced' | 'high_execution' = 'balanced';
  if (clampedScore >= 80) tier = 'comfort_first';
  else if (clampedScore < 55) tier = 'high_execution';

  return {
    score: clampedScore,
    tier,
    metrics: {
      hasSustainedHealing,
      hasShield,
      interruptionResistanceTier,
      executionFriction,
    },
  };
}

export interface MemberGearInput {
  character?: { key?: string };
  weapon?: { id?: string | null };
  artifacts?: Array<{ id?: string | null }>;
}

/**
 * Validates that no two characters on the team share the exact same gear piece.
 */
export function validateGearExclusivity(members: MemberGearInput[]): {
  valid: boolean;
  conflicts: { gearId: string; characterKeys: string[] }[];
} {
  const gearUsage = new Map<string, string[]>();

  for (const member of members) {
    const charKey = member.character?.key ?? 'unknown';
    if (member.weapon?.id) {
      const existing = gearUsage.get(member.weapon.id) ?? [];
      existing.push(charKey);
      gearUsage.set(member.weapon.id, existing);
    }
    if (Array.isArray(member.artifacts)) {
      for (const art of member.artifacts) {
        if (art.id) {
          const existing = gearUsage.get(art.id) ?? [];
          existing.push(charKey);
          gearUsage.set(art.id, existing);
        }
      }
    }
  }

  const conflicts: { gearId: string; characterKeys: string[] }[] = [];
  for (const [gearId, users] of gearUsage.entries()) {
    if (users.length > 1) {
      conflicts.push({ gearId, characterKeys: users });
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}

export interface CandidateWithDamage {
  id: string;
  result: {
    dps: number;
    min: number;
    max: number;
    stdDev?: number;
    errorMargin?: number;
  };
}

/**
 * Compares DPS distributions with 95% Confidence Intervals.
 * Flags overlapping candidates as statistical ties and applies player preference.
 */
export function resolveStatisticalRankings<T extends CandidateWithDamage>(
  candidates: T[],
  priority: 'damage' | 'favorites',
  favoriteCounts: Record<string, number> = {},
): { ranked: T[]; ties: Set<string> } {
  if (candidates.length <= 1) {
    return { ranked: [...candidates], ties: new Set() };
  }

  // Pre-calculate CI half-width for each candidate
  const withCI = candidates.map((c) => {
    const margin =
      c.result.errorMargin ??
      (c.result.stdDev ? c.result.stdDev * 1.0 : (c.result.max - c.result.min) / 4);
    return {
      candidate: c,
      dps: c.result.dps,
      lower: c.result.dps - margin,
      upper: c.result.dps + margin,
      favCount: favoriteCounts[c.id] ?? 0,
    };
  });

  // Sort primarily by DPS descending
  withCI.sort((a, b) => b.dps - a.dps);

  const ties = new Set<string>();

  // Detect overlapping confidence intervals
  for (let i = 0; i < withCI.length - 1; i++) {
    const current = withCI[i];
    const next = withCI[i + 1];

    // Overlap condition: current.lower <= next.upper && next.lower <= current.upper
    const overlaps = current.lower <= next.upper && next.lower <= current.upper;
    if (overlaps) {
      ties.add(current.candidate.id);
      ties.add(next.candidate.id);
    }
  }

  if (priority === 'favorites') {
    // If priority is favorites, group connected components of ties and sort each tied group by favorites
    const groups: (typeof withCI)[] = [];
    let currentGroup: typeof withCI = [];

    for (let i = 0; i < withCI.length; i++) {
      const item = withCI[i];
      if (currentGroup.length === 0) {
        currentGroup.push(item);
      } else {
        const lastInGroup = currentGroup[currentGroup.length - 1];
        const overlaps =
          ties.has(lastInGroup.candidate.id) &&
          ties.has(item.candidate.id) &&
          lastInGroup.lower <= item.upper &&
          item.lower <= lastInGroup.upper;

        if (overlaps) {
          currentGroup.push(item);
        } else {
          groups.push(currentGroup);
          currentGroup = [item];
        }
      }
    }
    if (currentGroup.length > 0) groups.push(currentGroup);

    // Sort tied groups by favoriteCount descending, breaking ties with DPS
    const reordered: typeof withCI = [];
    for (const group of groups) {
      if (group.length > 1) {
        group.sort((a, b) => b.favCount - a.favCount || b.dps - a.dps);
      }
      reordered.push(...group);
    }

    return {
      ranked: reordered.map((g) => g.candidate),
      ties,
    };
  }

  return {
    ranked: withCI.map((w) => w.candidate),
    ties,
  };
}
