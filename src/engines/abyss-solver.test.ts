import { describe, it, expect } from 'vitest';
import { solveAbyssDualTeams, evaluateChamberMechanicCoverage } from './abyss-solver';
import { CHARACTERS } from '../data/characters';

describe('Spiral Abyss Floor 12 Dual-Team Solver', () => {
  // A comprehensive owned roster with various archetypes:
  // Nefer (Dendro Catalyst), Furina (Hydro Sword), Nahida (Dendro Catalyst), KukiShinobu (Electro Sword)
  // Mavuika (Pyro Claymore), Yelan (Hydro Bow), KaedeharaKazuha (Anemo Sword), Bennett (Pyro Sword)
  // Xilonen (Geo Sword), Citlali (Cryo Catalyst), Chasca (Anemo Bow), Arlecchino (Pyro Polearm)
  // RaidenShogun (Electro Polearm), Xingqiu (Hydro Sword), Zhongli (Geo Polearm)
  const comprehensiveRoster = [
    'Nefer',
    'Furina',
    'Nahida',
    'KukiShinobu',
    'Mavuika',
    'Yelan',
    'KaedeharaKazuha',
    'Bennett',
    'Xilonen',
    'Citlali',
    'Chasca',
    'Arlecchino',
    'RaidenShogun',
    'Xingqiu',
    'Zhongli',
  ];

  it('generates two completely disjoint teams with 0 duplicate characters', () => {
    const plan = solveAbyssDualTeams(comprehensiveRoster);

    expect(plan.firstHalfTeam).toBeDefined();
    expect(plan.secondHalfTeam).toBeDefined();
    expect(plan.firstHalfTeam.members).toHaveLength(4);
    expect(plan.secondHalfTeam.members).toHaveLength(4);

    const firstHalfIds = new Set(plan.firstHalfTeam.members.map((c) => c.id));
    const secondHalfIds = new Set(plan.secondHalfTeam.members.map((c) => c.id));

    // Intersection must be empty
    for (const id of firstHalfIds) {
      expect(secondHalfIds.has(id)).toBe(false);
    }
  });

  it('ensures Second Half includes a Bow user for the Aeonblight Drake mechanic', () => {
    const plan = solveAbyssDualTeams(comprehensiveRoster);

    const secondHalfHasBow = plan.secondHalfTeam.members.some(
      (m) => m.weapon === 'Bow',
    );
    expect(secondHalfHasBow).toBe(true);

    const chamber2 = plan.chamberCoverage.find((c) => c.chamber === 2);
    expect(chamber2).toBeDefined();
    expect(chamber2?.secondHalfSatisfied).toBe(true);
  });

  it('ensures Second Half includes Hydro application for the Pyro Lector in 12-1', () => {
    const plan = solveAbyssDualTeams(comprehensiveRoster);

    const secondHalfHasHydro = plan.secondHalfTeam.members.some(
      (m) => m.element === 'Hydro',
    );
    expect(secondHalfHasHydro).toBe(true);

    const chamber1 = plan.chamberCoverage.find((c) => c.chamber === 1);
    expect(chamber1).toBeDefined();
    expect(chamber1?.secondHalfSatisfied).toBe(true);
  });

  it('evaluates Nightsoul / Natlan advantage on First Half against Wayob in 12-3', () => {
    const plan = solveAbyssDualTeams(comprehensiveRoster);

    const chamber3 = plan.chamberCoverage.find((c) => c.chamber === 3);
    expect(chamber3).toBeDefined();
    // In our roster, Mavuika or Xilonen or Citlali or Chasca or Nefer can be present
    expect(chamber3?.firstHalfStatus).toBeDefined();
  });

  it('attaches synthesized stepped rotations to both teams', () => {
    const plan = solveAbyssDualTeams(comprehensiveRoster);

    expect(plan.firstHalfTeam.steppedRotation).toBeDefined();
    expect(plan.firstHalfTeam.steppedRotation?.steps.length).toBeGreaterThan(0);

    expect(plan.secondHalfTeam.steppedRotation).toBeDefined();
    expect(plan.secondHalfTeam.steppedRotation?.steps.length).toBeGreaterThan(0);
  });

  it('handles small rosters gracefully and reports unsatisfied mechanics', () => {
    // Only 8 characters, none of whom use a bow
    // e.g. Nefer (Catalyst), Furina (Sword), Bennett (Sword), Xiangling (Polearm),
    // Arlecchino (Polearm), Zhongli (Polearm), Kazuha (Sword), Kuki (Sword)
    const noBowRoster = [
      'Nefer',
      'Furina',
      'Bennett',
      'Xiangling',
      'Arlecchino',
      'Zhongli',
      'KaedeharaKazuha',
      'KukiShinobu',
    ];

    const plan = solveAbyssDualTeams(noBowRoster);
    expect(plan.firstHalfTeam.members).toHaveLength(4);
    expect(plan.secondHalfTeam.members).toHaveLength(4);

    const chamber2 = plan.chamberCoverage.find((c) => c.chamber === 2);
    // Drake mechanic should not be satisfied because no bow user exists in roster
    expect(chamber2?.secondHalfSatisfied).toBe(false);
  });

  it('evaluates chamber mechanic coverage directly and computes aggregate scores', () => {
    const plan = solveAbyssDualTeams(comprehensiveRoster);
    const { coverage, totalScore } = evaluateChamberMechanicCoverage(
      plan.firstHalfTeam,
      plan.secondHalfTeam,
    );
    expect(coverage).toHaveLength(3);
    expect(totalScore).toBeGreaterThan(0);
  });

  it('includes shortfall warnings and keeps non-negative overallScore when owned roster has fewer than 8 characters', () => {
    const emptyPlan = solveAbyssDualTeams([]);
    expect(emptyPlan.warnings).toBeDefined();
    expect(emptyPlan.warnings!.length).toBeGreaterThan(0);
    expect(emptyPlan.overallScore).toBeGreaterThanOrEqual(0);

    const smallPlan = solveAbyssDualTeams(['Bennett', 'Xiangling', 'Furina']);
    expect(smallPlan.warnings).toBeDefined();
    expect(smallPlan.warnings!.length).toBeGreaterThan(0);
    expect(smallPlan.overallScore).toBeGreaterThanOrEqual(0);
  });

  it('does not count Nefer as Natlan Nightsoul for Wayob shield drain in 12-3', () => {
    // Team A has Nefer, Furina, Baizhu, Xingqiu (no Natlan Nightsoul members)
    const teamA = {
      id: 'team-lunar',
      name: 'Lunar Bloom',
      archetype: 'Lunar-Bloom',
      members: [
        CHARACTERS.find((c) => c.id === 'Nefer')!,
        CHARACTERS.find((c) => c.id === 'Furina')!,
        CHARACTERS.find((c) => c.id === 'Baizhu')!,
        CHARACTERS.find((c) => c.id === 'Xingqiu')!,
      ],
      synergyScore: 90,
      comfortScore: 85,
      reasons: [],
      rotation: '',
      resonance: [],
    };

    const teamB = {
      id: 'team-pyro',
      name: 'Mono Pyro',
      archetype: 'Mono Pyro',
      members: [
        CHARACTERS.find((c) => c.id === 'Bennett')!,
        CHARACTERS.find((c) => c.id === 'Xiangling')!,
        CHARACTERS.find((c) => c.id === 'KaedeharaKazuha')!,
        CHARACTERS.find((c) => c.id === 'Amber')!, // Bow
      ],
      synergyScore: 90,
      comfortScore: 85,
      reasons: [],
      rotation: '',
      resonance: [],
    };

    const { coverage } = evaluateChamberMechanicCoverage(teamA, teamB);
    const chamber3 = coverage.find((c) => c.chamber === 3)!;
    // Since Nefer is Nod-Krai (not Natlan/Nightsoul), First Half should NOT be marked satisfied
    expect(chamber3.firstHalfSatisfied).toBe(false);
  });
});
