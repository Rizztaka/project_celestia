import { describe, expect, it } from 'vitest';

import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { calculatePriorityWeight } from './planner-optimization.calculator.js';
import {
  type AutonomousProgressionParams,
  discoverAutonomousProgression,
} from './autonomous-progression.calculator.js';
import {
  explainAutonomousCandidate,
  explainAutonomousProgressionSummary,
} from './autonomous-progression.explainer.js';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

function makeRoster(): CharacterWithWeapon[] {
  return [
    {
      id: 'char-bennett',
      accountId: 'acc-1',
      characterKey: 'Bennett',
      level: 80,
      ascension: 5,
      constellation: 1,
      talentNormal: 1,
      talentSkill: 6,
      talentBurst: 8,
      equippedWeaponId: 'weap-favonius',
      equippedWeapon: {
        id: 'weap-favonius',
        accountId: 'acc-1',
        weaponKey: 'FavoniusSword',
        level: 80,
        ascension: 5,
        refinement: 3,
        locked: true,
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
      createdAt: new Date('2026-10-20T00:00:00.000Z'),
      updatedAt: new Date('2026-10-20T00:00:00.000Z'),
    },
    {
      id: 'char-xiangling',
      accountId: 'acc-1',
      characterKey: 'Xiangling',
      level: 80,
      ascension: 5,
      constellation: 4,
      talentNormal: 1,
      talentSkill: 6,
      talentBurst: 8,
      equippedWeaponId: 'weap-catch',
      equippedWeapon: {
        id: 'weap-catch',
        accountId: 'acc-1',
        weaponKey: 'TheCatch',
        level: 80,
        ascension: 5,
        refinement: 5,
        locked: true,
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
      createdAt: new Date('2026-10-20T00:00:00.000Z'),
      updatedAt: new Date('2026-10-20T00:00:00.000Z'),
    },
    {
      id: 'char-hutao',
      accountId: 'acc-1',
      characterKey: 'HuTao',
      level: 80,
      ascension: 5,
      constellation: 1,
      talentNormal: 8,
      talentSkill: 8,
      talentBurst: 6,
      equippedWeaponId: 'weap-dragons-bane',
      equippedWeapon: {
        id: 'weap-dragons-bane',
        accountId: 'acc-1',
        weaponKey: 'DragonsBane',
        level: 80,
        ascension: 5,
        refinement: 1,
        locked: true,
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
      createdAt: new Date('2026-10-20T00:00:00.000Z'),
      updatedAt: new Date('2026-10-20T00:00:00.000Z'),
    },
  ];
}

// ---------------------------------------------------------------------------
// Autonomous Progression Discovery Unit Tests
// ---------------------------------------------------------------------------

describe('discoverAutonomousProgression (Account-Wide Autonomous Discovery)', () => {
  it('discovers valid PlannerCandidateInput items with goalId: null across an under-invested roster with 0 manual goals', () => {
    const rawRoster = makeRoster();
    const result = discoverAutonomousProgression({
      rawRoster,
      artifacts: [],
    });

    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.metadata.totalCharactersScanned).toBe(3);

    for (const cand of result.candidates) {
      // Must be autonomous (no manual goal attached)
      expect(cand.goalId).toBeNull();
      expect(cand.candidateId).toMatch(/^auto-/);
      expect(cand.targetKey).toBeTruthy();
      expect(cand.domainName).toBeTruthy();
      expect(cand.openDays.length).toBeGreaterThan(0);
      expect(cand.resinPerRun).toBeGreaterThan(0);
      expect(Object.keys(cand.requiredMaterials).length).toBeGreaterThan(0);
      expect(cand.expectedScoreDelta).toBeGreaterThanOrEqual(0);
      expect(typeof cand.closesGap).toBe('boolean');
      expect([1, 2, 3]).toContain(cand.goalPriority);
    }

    // Specifically discovers Bennett's burst talent upgrade
    const bennettBurst = result.candidates.find(
      (c) => c.targetKey === 'Bennett' && c.talentType === 'burst',
    );
    expect(bennettBurst).toBeDefined();
    expect(bennettBurst?.actionType).toBe('domain_talent');
    expect(bennettBurst?.domainName).toContain('Forsaken Rift');

    // Specifically discovers weapon ascension upgrade (e.g. TheCatch or DragonsBane)
    const weaponCandidate = result.candidates.find((c) => c.actionType === 'domain_weapon');
    expect(weaponCandidate).toBeDefined();
  });

  it('weights core team members as priority 1, bottleneck units as priority 2, and general roster units as priority 3', () => {
    const rawRoster = makeRoster();
    const result = discoverAutonomousProgression({
      rawRoster,
      artifacts: [],
      teamMemberKeys: ['Bennett'], // Core team member
      bottleneckCharacterKeys: ['Xiangling'], // Bottleneck character
      // HuTao is neither -> general roster unit
    });

    const bennettCandidates = result.candidates.filter((c) => c.targetKey === 'Bennett');
    const xianglingCandidates = result.candidates.filter(
      (c) => c.targetKey === 'Xiangling' || c.targetKey === 'TheCatch',
    );
    const huTaoCandidates = result.candidates.filter(
      (c) => c.targetKey === 'HuTao' || c.targetKey === 'DragonsBane',
    );

    expect(bennettCandidates.length).toBeGreaterThan(0);
    expect(xianglingCandidates.length).toBeGreaterThan(0);
    expect(huTaoCandidates.length).toBeGreaterThan(0);

    // Bennett gets priority 1
    for (const c of bennettCandidates) {
      expect(c.goalPriority).toBe(1);
    }

    // Xiangling (bottleneck) gets priority 2
    for (const c of xianglingCandidates) {
      expect(c.goalPriority).toBe(2);
    }

    // Hu Tao (general roster) gets priority 3
    for (const c of huTaoCandidates) {
      expect(c.goalPriority).toBe(3);
    }

    // Priority weights strictly decrease: P(1) > P(2) > P(3)
    const w1 = calculatePriorityWeight(1);
    const w2 = calculatePriorityWeight(2);
    const w3 = calculatePriorityWeight(3);
    expect(w1).toBeGreaterThan(w2);
    expect(w2).toBeGreaterThan(w3);
  });

  it('does not duplicate active manual goals and preserves manual goal priorities', () => {
    const rawRoster = makeRoster();
    const manualGoals = [
      {
        id: 'goal-manual-bennett-burst',
        targetKey: 'Bennett',
        goalType: 'CHARACTER_TALENT',
        talentType: 'burst',
        priority: 1,
      },
      {
        id: 'goal-manual-catch',
        targetKey: 'TheCatch',
        goalType: 'WEAPON_ASCENSION',
        talentType: null,
        priority: 2,
      },
    ];

    const result = discoverAutonomousProgression({
      rawRoster,
      artifacts: [],
      manualGoals,
      yieldToManualGoals: true,
    });

    // Bennett burst was in manual goals -> must NOT appear in autonomous candidates
    const duplicateBennettBurst = result.candidates.find(
      (c) => c.targetKey === 'Bennett' && c.talentType === 'burst',
    );
    expect(duplicateBennettBurst).toBeUndefined();

    // TheCatch was in manual goals -> must NOT appear in autonomous candidates
    const duplicateCatch = result.candidates.find((c) => c.targetKey === 'TheCatch');
    expect(duplicateCatch).toBeUndefined();

    // Non-manual targets (e.g. HuTao or Bennett skill) remain discoverable
    expect(result.candidates.length).toBeGreaterThan(0);

    // Discovered candidates yield priority to manual goals (priority strictly > manual priority 1)
    for (const c of result.candidates) {
      expect(c.goalPriority).toBeGreaterThanOrEqual(3);
    }
  });

  it('adheres strictly to ADR-0011 (pure calculator produces deterministic numbers; explainer produces narrative rationale)', () => {
    const rawRoster = makeRoster();
    const calcResult = discoverAutonomousProgression({
      rawRoster,
      artifacts: [],
      teamMemberKeys: ['Bennett'],
    });

    // 1. Calculator output contains zero prose narrative fields
    for (const cand of calcResult.candidates) {
      expect(typeof cand.expectedScoreDelta).toBe('number');
      expect(typeof cand.goalPriority).toBe('number');
      expect(typeof cand.resinPerRun).toBe('number');
      // No prose fields on candidate
      expect((cand as unknown as { explanations?: unknown }).explanations).toBeUndefined();
    }

    // 2. Explainer generates concise human rationales
    const firstCandidate = calcResult.candidates[0]!;
    const explanations = explainAutonomousCandidate(firstCandidate);
    expect(explanations.length).toBeGreaterThan(0);
    expect(explanations.some((e) => e.includes('Autonomous Upgrade') || e.includes('Progression'))).toBe(true);

    const summary = explainAutonomousProgressionSummary(calcResult);
    expect(summary).toContain('Discovered');
    expect(summary).toContain('progression candidate');
  });
});
