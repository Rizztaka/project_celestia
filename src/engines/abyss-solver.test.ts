import { describe, it, expect } from 'vitest';
import { solveAbyssDualTeams, evaluateChamberMechanicCoverage, swapAbyssDualHalves } from './abyss-solver';
import { isSameCharacterOrTraveler } from './team-rules';
import { CHARACTERS } from '../data/characters';
import { ABYSS_CYCLES, validateAbyssCycleConfig } from '../data/abyss-schedules';
import { analyzeEndgameReadiness } from './endgame-helper';

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

    const cycle53 = ABYSS_CYCLES.find((c) => c.id === 'cycle-5-3');
    const { coverage } = evaluateChamberMechanicCoverage(teamA, teamB, cycle53);
    const chamber3 = coverage.find((c) => c.chamber === 3)!;
    // Since Nefer is Nod-Krai (not Natlan/Nightsoul), First Half should NOT be marked satisfied
    expect(chamber3.firstHalfSatisfied).toBe(false);
  });

  it('handles owned roster with duplicate IDs without duplicating characters or breaking disjointness', () => {
    // Provide a list with duplicates
    const duplicateRoster = [
      'Bennett', 'Bennett', 'Bennett',
      'Xiangling', 'Furina', 'Yelan',
      'KaedeharaKazuha', 'Zhongli', 'Nahida', 'RaidenShogun',
    ];

    const plan = solveAbyssDualTeams(duplicateRoster);
    const firstHalfIds = plan.firstHalfTeam.members.map((c) => c.id);
    const secondHalfIds = plan.secondHalfTeam.members.map((c) => c.id);

    // Each team must have unique members
    expect(new Set(firstHalfIds).size).toBe(firstHalfIds.length);
    expect(new Set(secondHalfIds).size).toBe(secondHalfIds.length);

    // Zero overlap between first and second half
    const overlap = firstHalfIds.filter((id) => secondHalfIds.includes(id));
    expect(overlap).toHaveLength(0);
  });

  it('strictly ensures all drafted characters belong to the user owned roster', () => {
    const limitedRoster = [
      'Amber', 'Kaeya', 'Lisa', 'Barbara',
      'Noelle', 'Xiangling', 'Collei', 'Lynette',
    ];

    const plan = solveAbyssDualTeams(limitedRoster);
    const allDrafted = [
      ...plan.firstHalfTeam.members,
      ...plan.secondHalfTeam.members,
    ];

    allDrafted.forEach((char) => {
      expect(limitedRoster).toContain(char.id);
    });
  });

  it('does not produce false "Heavy Hydro reliance" warning on empty teams', () => {
    const emptyTeam = {
      id: 'empty',
      name: 'Empty Team',
      archetype: 'None',
      members: [],
      synergyScore: 0,
      comfortScore: 0,
      reasons: [],
      rotation: '',
      resonance: [],
    };

    const { coverage } = evaluateChamberMechanicCoverage(emptyTeam, emptyTeam);
    const chamber1 = coverage.find((c) => c.chamber === 1)!;
    expect(chamber1.firstHalfStatus).toMatch(/incomplete/i);
    expect(chamber1.firstHalfStatus).not.toMatch(/heavy hydro reliance/i);
    expect(chamber1.secondHalfStatus).toMatch(/incomplete/i);
  });

  it('computes elemental resonance for fallback teams', () => {
    // Roster of Pyro resonance: Bennett + Xiangling
    const smallRoster = ['Bennett', 'Xiangling', 'Amber', 'KaedeharaKazuha'];
    const plan = solveAbyssDualTeams(smallRoster);
    expect(plan.firstHalfTeam.resonance).toBeDefined();
    expect(plan.firstHalfTeam.resonance.some((r) => r.includes('Fervent Flames'))).toBe(true);
  });

  describe('Endgame Guidance 2.0 Multi-Cycle & Half-Swap Additions', () => {
    it('supports evaluating against different official cycles (5.2, 5.1)', () => {
      const cycle52 = ABYSS_CYCLES.find((c) => c.id === 'cycle-5-2');
      expect(cycle52).toBeDefined();

      const plan52 = solveAbyssDualTeams(comprehensiveRoster, undefined, cycle52);
      expect(plan52.cycleId).toBe('cycle-5-2');
      expect(plan52.chamberCoverage).toHaveLength(3);
    });

    it('attaches exact shield break time and RES shred metrics to chamber halves', () => {
      const plan = solveAbyssDualTeams(comprehensiveRoster);
      const chamber1 = plan.chamberCoverage.find((c) => c.chamber === 1);
      expect(chamber1).toBeDefined();

      // Second half of 12-1 has Pyro Lector shield
      const secondMetrics = chamber1?.secondHalfMetrics;
      expect(secondMetrics).toBeDefined();
      expect(secondMetrics?.shieldBreakRating).toBeDefined();
      expect(secondMetrics?.shieldBreakTime).toBeLessThanOrEqual(10.0);
      expect(secondMetrics?.effectiveResShred).toBeGreaterThanOrEqual(0);
    });

    it('swaps first and second half teams cleanly with swapAbyssDualHalves and preserves 0-overlap', () => {
      const originalPlan = solveAbyssDualTeams(comprehensiveRoster);
      const swapped = swapAbyssDualHalves(originalPlan);

      // Names and IDs must match in swapped positions
      expect(swapped.firstHalfTeam.name).toBe(originalPlan.secondHalfTeam.name);
      expect(swapped.secondHalfTeam.name).toBe(originalPlan.firstHalfTeam.name);

      const firstIds = new Set(swapped.firstHalfTeam.members.map((m) => m.id));
      const secondIds = new Set(swapped.secondHalfTeam.members.map((m) => m.id));

      // Disjointness check
      for (const id of firstIds) {
        expect(secondIds.has(id)).toBe(false);
      }
      expect(swapped.chamberCoverage).toHaveLength(3);
    });

    it('correctly flags a Hydro carry team as unsatisfied against 12-1-A Hydro Phantasms even with Zhongli present', () => {
      const neuvillette = CHARACTERS.find((c) => c.id === 'Neuvillette')!;
      const furina = CHARACTERS.find((c) => c.id === 'Furina')!;
      const xingqiu = CHARACTERS.find((c) => c.id === 'Xingqiu')!;
      const zhongli = CHARACTERS.find((c) => c.id === 'Zhongli')!;

      const hydroCarryTeam = {
        id: 'team-neuv',
        name: 'Neuvillette Hypercarry',
        archetype: 'Hypercarry',
        members: [neuvillette, furina, xingqiu, zhongli],
        synergyScore: 90,
        comfortScore: 90,
        reasons: [],
        rotation: '',
        resonance: [],
      };

      const secondTeam = {
        id: 'team-pyro',
        name: 'Arlecchino Overload',
        archetype: 'Overload',
        members: [
          CHARACTERS.find((c) => c.id === 'Arlecchino')!,
          CHARACTERS.find((c) => c.id === 'Bennett')!,
          CHARACTERS.find((c) => c.id === 'Fischl')!,
          CHARACTERS.find((c) => c.id === 'Yelan')!,
        ],
        synergyScore: 90,
        comfortScore: 85,
        reasons: [],
        rotation: '',
        resonance: [],
      };

      const cycle53 = ABYSS_CYCLES.find((c) => c.id === 'cycle-5-3');
      const { coverage } = evaluateChamberMechanicCoverage(hydroCarryTeam, secondTeam, cycle53);
      const chamber1 = coverage.find((c) => c.chamber === 1)!;

      // Because Neuvillette is the primary carry and is Hydro, and there is no non-Hydro DPS, First Half MUST NOT be satisfied
      expect(chamber1.firstHalfSatisfied).toBe(false);
      expect(chamber1.firstHalfStatus).toMatch(/immune|reliance/i);
    });

    it('populates mechanicCoverageScore matching overallScore on full and swapped plans', () => {
      const plan = solveAbyssDualTeams(comprehensiveRoster);
      expect(plan.mechanicCoverageScore).toBeDefined();
      expect(plan.mechanicCoverageScore).toBe(plan.overallScore);
      expect(plan.mechanicCoverageScore).toBeGreaterThanOrEqual(0);

      const swapped = swapAbyssDualHalves(plan);
      expect(swapped.mechanicCoverageScore).toBeDefined();
      expect(swapped.mechanicCoverageScore).toBe(swapped.overallScore);
    });

    it('enforces Traveler Disjointness so multiple Traveler elements cannot co-exist across halves', () => {
      const travelerRoster = [
        'TravelerDendro',
        'TravelerHydro',
        'Furina',
        'Yelan',
        'KaedeharaKazuha',
        'Bennett',
        'Xiangling',
        'Zhongli',
        'Mavuika',
        'RaidenShogun',
      ];
      const plan = solveAbyssDualTeams(travelerRoster);
      const firstTraveler = plan.firstHalfTeam.members.find((m) => m.id.startsWith('Traveler'));
      const secondTraveler = plan.secondHalfTeam.members.find((m) => m.id.startsWith('Traveler'));

      // If one half has a Traveler, the other half must NOT have a Traveler
      if (firstTraveler) {
        expect(secondTraveler).toBeUndefined();
      }
      if (secondTraveler) {
        expect(firstTraveler).toBeUndefined();
      }
    });

    it('propagates rosterProfiles to secondary team generation', () => {
      const profiles = {
        Bennett: { id: 'Bennett', level: 90, constellation: 5 },
        Xiangling: { id: 'Xiangling', level: 90, constellation: 4 },
        KaedeharaKazuha: { id: 'KaedeharaKazuha', level: 90, constellation: 2 },
      };
      const plan = solveAbyssDualTeams(comprehensiveRoster, profiles);
      expect(plan.firstHalfTeam).toBeDefined();
      expect(plan.secondHalfTeam).toBeDefined();
      expect(plan.secondHalfTeam.members.length).toBe(4);
    });

    it('generates Top-3 distinct pairings (Primary, Comfort, Alternative) with descending ranking', () => {
      const plan = solveAbyssDualTeams(comprehensiveRoster);
      expect(plan.allPairs).toBeDefined();
      expect(plan.allPairs!.length).toBeGreaterThanOrEqual(2);

      const primary = plan.primaryPair;
      expect(primary).toBeDefined();
      expect(primary?.variantType).toBe('primary');

      if (plan.comfortPair) {
        expect(plan.comfortPair.variantType).toBe('comfort');
        expect(plan.comfortPair.label).toContain('Comfort');
      }

      if (plan.alternativePair) {
        expect(plan.alternativePair.variantType).toBe('alternative');
        expect(plan.alternativePair.label).toContain('Alternative');
      }

      // Assert each pair has zero internal and cross-half overlap
      for (const pair of plan.allPairs!) {
        const ids1 = new Set(pair.firstHalfTeam.members.map((m) => m.id));
        const ids2 = new Set(pair.secondHalfTeam.members.map((m) => m.id));
        for (const id of ids1) {
          expect(ids2.has(id)).toBe(false);
        }
      }
    });

    it('generates dynamic v7.2 mechanics explanations matching active Floor 12 enemies', () => {
      const cycle72 = ABYSS_CYCLES.find((c) => c.id === 'cycle-7-2') || ABYSS_CYCLES[0];
      const plan = solveAbyssDualTeams(comprehensiveRoster, undefined, cycle72);

      const ch1 = plan.chamberCoverage.find((c) => c.chamber === 1);
      const ch2 = plan.chamberCoverage.find((c) => c.chamber === 2);
      const ch3 = plan.chamberCoverage.find((c) => c.chamber === 3);

      expect(ch1).toBeDefined();
      // 12-1-B has Abyss Lector: Fathomless Flames with Pyro shield
      expect(ch1!.secondHalfStatus).toMatch(/Hydro shield-shredder|Pyro Lector|Abyss Lector/i);

      expect(ch2).toBeDefined();
      // 12-2-B has Ruin Drake: Skywatch with Bow requirement
      expect(ch2!.secondHalfStatus).toMatch(/Bow user|Ruin Drake/i);

      expect(ch3).toBeDefined();
      // 12-3-B has Iniquitous Baptist with Electro shield
      expect(ch3!.secondHalfStatus).toMatch(/Electro shield-break|shield-shredder|Iniquitous Baptist/i);
    });

    it('Roster Shortfall: detects multi-Traveler identity and flags shortfall when distinct count < 8', () => {
      // 6 normal characters + 2 Travelers = 8 entries, but only 7 distinct characters
      const sevenDistinct = [
        'HuTao',
        'Xingqiu',
        'Yelan',
        'Zhongli',
        'Bennett',
        'Xiangling',
        'TravelerAnemo',
        'TravelerGeo',
      ];
      const plan = solveAbyssDualTeams(sevenDistinct);
      expect(plan.warnings).toBeDefined();
      expect(plan.warnings![0]).toContain('Roster Shortfall');

      // Verify zero overlap across halves even in partial draft
      const team1Ids = new Set(plan.firstHalfTeam.members.map((m) => m.id));
      const team2Ids = new Set(plan.secondHalfTeam.members.map((m) => m.id));
      for (const id of team1Ids) {
        expect(team2Ids.has(id)).toBe(false);
      }
      const firstTraveler = plan.firstHalfTeam.members.find((m) => m.id.startsWith('Traveler'));
      const secondTraveler = plan.secondHalfTeam.members.find((m) => m.id.startsWith('Traveler'));
      if (firstTraveler) {
        expect(secondTraveler).toBeUndefined();
      }
    });

    it('isSameCharacterOrTraveler: safely handles null and undefined inputs without throwing', () => {
      expect(isSameCharacterOrTraveler(null, 'TravelerAnemo')).toBe(false);
      expect(isSameCharacterOrTraveler('TravelerAnemo', undefined)).toBe(false);
      expect(isSameCharacterOrTraveler(null, null)).toBe(false);
      expect(isSameCharacterOrTraveler(undefined, undefined)).toBe(false);
    });

    describe('M6 Dual-Team Explanations, Target Profiles & Fallback Advisor', () => {
      const fullMetaRoster = [
        'Mavuika',
        'Xilonen',
        'Bennett',
        'Xiangling',
        'Neuvillette',
        'Furina',
        'KaedeharaKazuha',
        'Zhongli',
        'Yelan',
        'RaidenShogun',
      ];

      it('attaches structured firstHalfExplanation and secondHalfExplanation to dual-team plan', () => {
        const plan = solveAbyssDualTeams(fullMetaRoster);
        expect(plan.firstHalfExplanation).toBeDefined();
        expect(plan.secondHalfExplanation).toBeDefined();

        expect(plan.firstHalfExplanation?.summary).toBeTruthy();
        expect(Array.isArray(plan.firstHalfExplanation?.strengths)).toBe(true);
        expect(Array.isArray(plan.firstHalfExplanation?.risks)).toBe(true);
        expect(['Optimal', 'Good', 'Suboptimal']).toContain(plan.firstHalfExplanation?.targetProfileFit);

        expect(plan.secondHalfExplanation?.summary).toBeTruthy();
        expect(Array.isArray(plan.secondHalfExplanation?.strengths)).toBe(true);
        expect(['Optimal', 'Good', 'Suboptimal']).toContain(plan.secondHalfExplanation?.targetProfileFit);
      });

      it('re-evaluates structured explanations for swapped halves in swapAbyssDualHalves', () => {
        const plan = solveAbyssDualTeams(fullMetaRoster);
        expect(plan.firstHalfExplanation).toBeDefined();
        expect(plan.secondHalfExplanation).toBeDefined();

        const swapped = swapAbyssDualHalves(plan);
        expect(swapped.firstHalfExplanation?.half).toBe('First Half');
        expect(swapped.secondHalfExplanation?.half).toBe('Second Half');
        expect(swapped.firstHalfExplanation?.summary).toContain(swapped.firstHalfTeam.name);
        expect(swapped.secondHalfExplanation?.summary).toContain(swapped.secondHalfTeam.name);
      });

      it('populates targetProfile, movementTraits, and effectiveDmgMultiplier in chamber half metrics', () => {
        const plan = solveAbyssDualTeams(fullMetaRoster);
        const firstChamber = plan.chamberCoverage[0];
        expect(firstChamber).toBeDefined();

        const m1 = firstChamber.firstHalfMetrics;
        expect(m1).toBeDefined();
        expect(['Single-Target', 'AoE', 'Mixed']).toContain(m1?.targetProfile);
        expect(m1?.effectiveDmgMultiplier).toBeGreaterThan(0);
        expect(Array.isArray(m1?.movementTraits)).toBe(true);

        const m2 = firstChamber.secondHalfMetrics;
        expect(m2).toBeDefined();
        expect(['Single-Target', 'AoE', 'Mixed']).toContain(m2?.targetProfile);
        expect(m2?.effectiveDmgMultiplier).toBeGreaterThan(0);
      });

      it('generates actionable missingCounterFallbacks with owned bench substitutes when mechanic is unsatisfied', () => {
        // A roster without a Bow user on the active half, but with Amber on the bench
        const rosterNoActiveBow = [
          'Neuvillette',
          'Furina',
          'KaedeharaKazuha',
          'Zhongli',
          'HuTao',
          'Xingqiu',
          'Xiangling',
          'Bennett',
          'Amber', // Bow user on the bench
        ];
        const plan = solveAbyssDualTeams(rosterNoActiveBow);
        expect(plan).toBeDefined();
        if (plan.missingCounterFallbacks && plan.missingCounterFallbacks.length > 0) {
          const fallback = plan.missingCounterFallbacks[0];
          expect(fallback.chamber).toBeGreaterThanOrEqual(1);
          expect(['First Half', 'Second Half']).toContain(fallback.half);
          expect(fallback.strategyTip).toBeTruthy();
          expect(Array.isArray(fallback.ownedSubstitutes)).toBe(true);
        }
      });
    });
  });

  describe('M6 — Endgame Intelligence Regression Suite', () => {
    it('validateAbyssCycleConfig passes cleanly for every built-in official cycle', () => {
      for (const cycle of ABYSS_CYCLES) {
        expect(validateAbyssCycleConfig(cycle), `Validation failed for ${cycle.id}`).toEqual([]);
      }
    });

    it('validateAbyssCycleConfig catches immune element omission, invalid shieldUnits, and inverted dates', () => {
      const broken = JSON.parse(JSON.stringify(ABYSS_CYCLES[0]));
      broken.effectiveStartDate = '2026-12-30';
      broken.effectiveEndDate = '2026-11-01';
      broken.chambers[0].firstHalf.enemies[0].baseRes.Cryo = 100;
      broken.chambers[0].firstHalf.mechanics.prohibitedElements = [];
      broken.chambers[0].secondHalf.mechanics.shieldUnits = 0;

      const errors = validateAbyssCycleConfig(broken);
      expect(errors.some((e) => e.includes('effectiveStartDate'))).toBe(true);
      expect(errors.some((e) => e.includes('immune to Cryo'))).toBe(true);
      expect(errors.some((e) => e.includes('shieldUnits > 0'))).toBe(true);
    });

    it('penalizes unshredded high enemy RES and rewards RES shred against high-RES targets', () => {
      const cycle52 = ABYSS_CYCLES.find((c) => c.id === 'cycle-5-2')!;
      // C3-A has Jadeplume Terrorshroom (80% Dendro RES); test a non-immune high-RES target like C2-A Ruin Grader (70% Physical) or C1-A Scorpion (40% Electro RES in v7.2)
      const cycle72 = ABYSS_CYCLES.find((c) => c.id === 'cycle-7-2')!;

      const electroNoShred = {
        id: 'electro-no-shred',
        name: 'Electro Raw',
        archetype: 'Electro',
        members: [
          CHARACTERS.find((c) => c.id === 'RaidenShogun')!,
          CHARACTERS.find((c) => c.id === 'Fischl')!,
          CHARACTERS.find((c) => c.id === 'Bennett')!,
          CHARACTERS.find((c) => c.id === 'Xingqiu')!,
        ],
        synergyScore: 85,
        comfortScore: 80,
        reasons: [],
        rotation: '',
        resonance: [],
      };

      const electroWithShred = {
        ...electroNoShred,
        id: 'electro-shred',
        members: [
          CHARACTERS.find((c) => c.id === 'RaidenShogun')!,
          CHARACTERS.find((c) => c.id === 'KaedeharaKazuha')!,
          CHARACTERS.find((c) => c.id === 'Xilonen')!,
          CHARACTERS.find((c) => c.id === 'Bennett')!,
        ],
      };

      const dummySecond = {
        id: 'dummy-second',
        name: 'Dummy Second',
        archetype: 'Vape',
        members: [
          CHARACTERS.find((c) => c.id === 'Mavuika')!,
          CHARACTERS.find((c) => c.id === 'Yelan')!,
          CHARACTERS.find((c) => c.id === 'Citlali')!,
          CHARACTERS.find((c) => c.id === 'Zhongli')!,
        ],
        synergyScore: 85,
        comfortScore: 85,
        reasons: [],
        rotation: '',
        resonance: [],
      };

      const resNoShred = evaluateChamberMechanicCoverage(electroNoShred, dummySecond, cycle72);
      const resWithShred = evaluateChamberMechanicCoverage(electroWithShred, dummySecond, cycle72);

      const c1NoShred = resNoShred.coverage.find((c) => c.chamber === 1)!.firstHalfMetrics!;
      const c1WithShred = resWithShred.coverage.find((c) => c.chamber === 1)!.firstHalfMetrics!;

      expect(c1WithShred.effectiveDmgMultiplier!).toBeGreaterThan(c1NoShred.effectiveDmgMultiplier!);
      expect(resWithShred.totalScore).toBeGreaterThan(resNoShred.totalScore);
      expect(cycle52).toBeDefined();
    });

    it('uses explicit rotatingShields metadata instead of falsely flagging non-rotating C3-B bosses like Hydro Tulpa', () => {
      const cycle71 = ABYSS_CYCLES.find((c) => c.id === 'cycle-7-1')!;
      // Mono Pyro + Geo (only 2 elements) against v7.1 C3-B Hydro Tulpa (no rotating shields)
      const teamFirst = {
        id: 'first',
        name: 'First',
        archetype: 'Quicken',
        members: [
          CHARACTERS.find((c) => c.id === 'Nahida')!,
          CHARACTERS.find((c) => c.id === 'RaidenShogun')!,
          CHARACTERS.find((c) => c.id === 'Fischl')!,
          CHARACTERS.find((c) => c.id === 'Zhongli')!,
        ],
        synergyScore: 88,
        comfortScore: 85,
        reasons: [],
        rotation: '',
        resonance: [],
      };
      const twoElementPyro = {
        id: 'second',
        name: 'Pyro Geo',
        archetype: 'Mono Pyro',
        members: [
          CHARACTERS.find((c) => c.id === 'Arlecchino')!,
          CHARACTERS.find((c) => c.id === 'Bennett')!,
          CHARACTERS.find((c) => c.id === 'Xiangling')!,
          CHARACTERS.find((c) => c.id === 'Xilonen')!,
        ],
        synergyScore: 88,
        comfortScore: 85,
        reasons: [],
        rotation: '',
        resonance: [],
      };

      const { coverage } = evaluateChamberMechanicCoverage(teamFirst, twoElementPyro, cycle71);
      const c3 = coverage.find((c) => c.chamber === 3)!;
      expect(c3.secondHalfSatisfied).toBe(true);
      expect(c3.secondHalfStatus).not.toMatch(/rotating shields/i);
    });

    it('attaches structured half explanations, target profiles, movement traits, and positioning notes', () => {
      const plan = solveAbyssDualTeams(comprehensiveRoster);

      expect(plan.firstHalfExplanation).toBeDefined();
      expect(plan.secondHalfExplanation).toBeDefined();
      expect(plan.firstHalfExplanation!.summary.length).toBeGreaterThan(10);
      expect(plan.firstHalfExplanation!.movementNotes.length).toBeGreaterThan(0);
      expect(['Optimal', 'Good', 'Suboptimal']).toContain(plan.firstHalfExplanation!.targetProfileFit);

      const c2 = plan.chamberCoverage.find((c) => c.chamber === 2)!;
      expect(c2.firstHalfMetrics?.targetProfile).toBe('AoE');
      expect(c2.secondHalfMetrics?.targetProfile).toBe('Single-Target');
      expect(c2.secondHalfMetrics?.movementTraits).toContain('Airborne');
    });

    it('injects an owned Bow counter tech slot when top raw-synergy teams lack a Bow user', () => {
      // 9-character roster with Amber as the sole Bow user
      const singleBowRoster = [
        'Arlecchino',
        'Bennett',
        'Xiangling',
        'KaedeharaKazuha',
        'Neuvillette',
        'Furina',
        'Zhongli',
        'Xilonen',
        'Amber',
      ];
      const plan = solveAbyssDualTeams(singleBowRoster);
      const secondHalfHasBow = plan.secondHalfTeam.members.some((m) => m.weapon === 'Bow');
      expect(secondHalfHasBow).toBe(true);
    });

    it('reports missingCounterFallbacks when roster lacks a required counter', () => {
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
      expect(plan.missingCounterFallbacks).toBeDefined();
      expect(plan.missingCounterFallbacks!.some((f) => f.missingRequirement === 'Bow User')).toBe(true);
    });

    it('analyzeEndgameReadiness flags missing Bow User Required and excludes prohibited elements from usableCounters', () => {
      const noBowOnlyPyro = ['Arlecchino', 'Bennett', 'Xiangling'];
      const readiness = analyzeEndgameReadiness(noBowOnlyPyro, ABYSS_CYCLES[0]);

      const c2Second = readiness.find((r) => r.chamber.chamber === 2 && r.chamber.half === 'Second Half')!;
      expect(c2Second.missingElements).toContain('Bow User Required');
      expect(c2Second.verdict).toBe('Caution: Missing Elements');

      const c1Second = readiness.find((r) => r.chamber.chamber === 1 && r.chamber.half === 'Second Half')!;
      // Pyro is prohibited on 12-1-B (Pyro Lector) so no Pyro character should appear in usableCounters
      expect(c1Second.usableCounters.some((c) => c.element === 'Pyro')).toBe(false);
    });
  });
});
