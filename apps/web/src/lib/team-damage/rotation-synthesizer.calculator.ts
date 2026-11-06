import type { RotationStep } from './calculator';
import { getCharacterRotationKit, type RotationRole } from './rotation-kit';
import type { RotationCandidate } from './rotation-search.calculator';

export interface TeamMemberInput {
  characterKey: string;
  roleId?: string;
  element?: string;
}

export interface TeamRotationSynthesisInput {
  teamMembers: TeamMemberInput[];
  driverKey: string;
}

const ROLE_PRIORITY: Record<RotationRole, number> = {
  aura_setup: 1, // Long-duration marks/auras (e.g., Raiden E, Nahida E)
  buffer: 2, // Zone/team buffs (e.g., Bennett Q, Furina E+Q, Zhongli E)
  debuffer: 3, // Res shred / swirl (e.g., Kazuha, Sucrose)
  sub_dps: 4, // Off-field burst snapshotting (e.g., Xingqiu, Xiangling, Yelan)
  battery: 5, // Battery support
  driver: 6, // On-field carry
};

/**
 * Deterministically synthesizes an optimal, role-ordered 4-character team rotation.
 */
export function synthesizeTeamRotation(input: TeamRotationSynthesisInput): RotationStep[] {
  const { teamMembers, driverKey } = input;
  if (!teamMembers.some((m) => m.characterKey === driverKey)) return [];

  const kits = teamMembers.map((member, index) => {
    const kit = getCharacterRotationKit(member.characterKey, member.element);
    return {
      member,
      kit,
      originalIndex: index,
      isDriver: member.characterKey === driverKey,
    };
  });

  const driver = kits.find((k) => k.isDriver)!;
  const teammates = kits.filter((k) => !k.isDriver);

  // Sort teammates by their role priority. Break ties using their original index in the team.
  teammates.sort((a, b) => {
    const priorityA = ROLE_PRIORITY[a.kit.role] ?? 99;
    const priorityB = ROLE_PRIORITY[b.kit.role] ?? 99;
    return priorityA - priorityB || a.originalIndex - b.originalIndex;
  });

  const steps: RotationStep[] = [];

  // 1. If the driver has an aura setup step (e.g., Raiden Shogun E), cast it before buffs.
  if (driver.kit.setupSteps.length > 0 && driver.kit.role === 'battery') {
    steps.push(...driver.kit.setupSteps.map((s) => ({ ...s })));
  }

  // 2. Queue all teammates' setup / off-field steps in role order.
  for (const teammate of teammates) {
    steps.push(...teammate.kit.setupSteps.map((s) => ({ ...s })));
  }

  // 3. Driver enters the field for their primary field phase.
  steps.push(...driver.kit.fieldSteps.map((s) => ({ ...s })));

  return steps;
}

/**
 * Generates bounded candidate variations exploring attack counts and teammate swap orders.
 */
export function generateDefensibleRotationCandidates(
  baseRotation: RotationStep[],
  _driverKey: string,
  limit: 12 | 48 = 48,
): { candidates: RotationCandidate[]; issue: string | null } {
  if (!baseRotation.length) {
    return { candidates: [], issue: 'empty' };
  }

  // Group contiguous steps by character into blocks
  const blocks: RotationStep[][] = [];
  for (const step of baseRotation) {
    if (blocks.at(-1)?.[0].characterKey !== step.characterKey) blocks.push([]);
    blocks.at(-1)!.push({ ...step });
  }

  if (blocks.length > 8) {
    return { candidates: [], issue: 'turn_limit' };
  }

  const candidates: RotationCandidate[] = [];
  const seen = new Set<string>();

  function addCandidate(sequence: RotationStep[]) {
    // Enforce gcsim action & step limits
    if (sequence.length > 64) return;
    const totalActions = sequence.reduce((sum, s) => sum + s.repeat, 0);
    if (totalActions > 200) return;

    const key = JSON.stringify(sequence);
    if (seen.has(key) || candidates.length >= limit) return;
    seen.add(key);
    candidates.push({
      id: String(candidates.length),
      steps: sequence.map((s) => ({ ...s })),
    });
  }

  // Baseline is always Candidate 0
  addCandidate(baseRotation);

  // 1. Attack count variations on the trailing driver attack step
  for (const repeat of [3, 6, 9]) {
    const variation = baseRotation.map((s) => ({ ...s }));
    const attackIdx = variation.findLastIndex((s) => s.action === 'attack');
    if (attackIdx >= 0) {
      variation[attackIdx].repeat = repeat;
      addCandidate(variation);
    }
  }

  // 2. Adjacent block swaps among non-driver support blocks
  const nonDriverBlockCount = Math.max(1, blocks.length - 1);
  for (let i = 0; i < nonDriverBlockCount - 1; i++) {
    const swapped = [...blocks];
    [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
    addCandidate(swapped.flat());

    // Also test attack count variants for swapped orders
    for (const repeat of [3, 6, 9]) {
      const variation = swapped.flat().map((s) => ({ ...s }));
      const attackIdx = variation.findLastIndex((s) => s.action === 'attack');
      if (attackIdx >= 0) {
        variation[attackIdx].repeat = repeat;
        addCandidate(variation);
      }
    }
  }

  return { candidates, issue: null };
}
