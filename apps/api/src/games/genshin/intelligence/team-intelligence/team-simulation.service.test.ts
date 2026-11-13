import { describe, expect, it } from 'vitest';

import type { CharacterInput } from './team-intelligence.calculator.js';
import { TeamIntelligenceService } from './team-intelligence.service.js';
import { TeamSimulationService } from './team-simulation.service.js';

describe('TeamSimulationService & GCSim Central Team Intelligence', () => {
  const simulationService = new TeamSimulationService();

  it('translates equipped weapons and artifact stats into deterministic GCSim configs', () => {
    const configResult = simulationService.generateConfig([
      {
        characterKey: 'HuTao',
        level: 90,
        constellation: 1,
        talentNormal: 10,
        talentSkill: 10,
        talentBurst: 8,
        equippedWeapon: {
          weaponKey: 'StaffOfHoma',
          level: 90,
          refinement: 1,
        },
        equippedArtifacts: [
          {
            setKey: 'CrimsonWitchOfFlames',
            slotKey: 'flower',
            mainStatKey: 'hp',
            level: 20,
            subStats: [
              { key: 'critRate_', value: 10.5 },
              { key: 'critDMG_', value: 21.0 },
            ],
          },
          {
            setKey: 'CrimsonWitchOfFlames',
            slotKey: 'plume',
            mainStatKey: 'atk',
            level: 20,
            subStats: [
              { key: 'eleMas', value: 42 },
              { key: 'critRate_', value: 7.0 },
            ],
          },
          {
            setKey: 'CrimsonWitchOfFlames',
            slotKey: 'sands',
            mainStatKey: 'hp_',
            level: 20,
            subStats: [{ key: 'critDMG_', value: 14.0 }],
          },
          {
            setKey: 'CrimsonWitchOfFlames',
            slotKey: 'goblet',
            mainStatKey: 'pyro_dmg_',
            level: 20,
            subStats: [{ key: 'critRate_', value: 3.9 }],
          },
        ],
      },
      'Xingqiu',
      'Yelan',
      'Zhongli',
    ]);

    expect(configResult.config).toContain('hutao add weapon="staffofhoma" refine=1 lvl=90/90;');
    expect(configResult.config).toContain('hutao add set="crimsonwitchofflames" count=4;');
    expect(configResult.config).toContain('hutao add stats');
    expect(configResult.config).toContain('cr=');
    expect(configResult.config).toContain('cd=');
  });

  it('executes GCSim simulation for a 4-member team and returns verified simulation metrics', async () => {
    const members = ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'];
    const result = await simulationService.simulateTeam(members, {
      duration: 20,
      enemyLevel: 100,
      resistance: 10,
      samples: 1,
    });

    expect(result.simulationStatus).toBe('VERIFIED_SIMULATION');
    expect(result.simulatedDps).toBeGreaterThan(0);
    expect(result.errorMargin).toBeGreaterThanOrEqual(0);
    expect(result.samples).toBe(1);
    expect(result.members).toHaveLength(4);

    const hutaoDiag = result.members.find((m) => m.key.toLowerCase().includes('hutao'));
    expect(hutaoDiag).toBeDefined();
    expect(hutaoDiag?.actions).toBeGreaterThan(0);
  }, 30000);

  it('degrades gracefully with HEURISTIC_FALLBACK if invalid characters or worker error occurs', async () => {
    const invalidMembers = ['UnknownNonExistent1', 'UnknownNonExistent2', 'Unknown3', 'Unknown4'];
    const result = await simulationService.simulateTeam(invalidMembers);

    expect(result.simulationStatus).toBe('HEURISTIC_FALLBACK');
    expect(result.simulatedDps).toBeGreaterThanOrEqual(0);
    expect(result.errorMargin).toBeGreaterThanOrEqual(0);
    expect(result.fallbackReason).toBeDefined();
  }, 30000);

  it('attaches verified simulatedDps to top recommendations in TeamIntelligenceService', async () => {
    const huTao: CharacterInput = {
      characterKey: 'HuTao',
      level: 90,
      ascension: 6,
      constellation: 1,
      talentNormal: 8,
      talentSkill: 10,
      talentBurst: 8,
      equippedWeapon: { weaponKey: 'StaffOfHoma', level: 90, refinement: 1 },
    };
    const xingqiu: CharacterInput = {
      characterKey: 'Xingqiu',
      level: 80,
      ascension: 6,
      constellation: 6,
      talentNormal: 6,
      talentSkill: 8,
      talentBurst: 10,
      equippedWeapon: null,
    };
    const yelan: CharacterInput = {
      characterKey: 'Yelan',
      level: 90,
      ascension: 6,
      constellation: 0,
      talentNormal: 1,
      talentSkill: 9,
      talentBurst: 9,
      equippedWeapon: null,
    };
    const zhongli: CharacterInput = {
      characterKey: 'Zhongli',
      level: 80,
      ascension: 6,
      constellation: 0,
      talentNormal: 1,
      talentSkill: 9,
      talentBurst: 8,
      equippedWeapon: null,
    };

    const roster = [huTao, xingqiu, yelan, zhongli];
    const teamService = new TeamIntelligenceService(undefined, undefined, simulationService);

    const simulatedRecs = await teamService.getSimulatedRecommendationsForRoster(roster, {
      limit: 1,
      simulateTopN: 1,
    });

    expect(simulatedRecs.length).toBeGreaterThan(0);
    const topRec = simulatedRecs[0]!;
    expect(topRec.simulatedDps).toBeDefined();
    expect(topRec.simulatedDps).toBeGreaterThan(0);
    expect(topRec.simulationStatus).toBe('VERIFIED_SIMULATION');

    // Also verify buildCandidateEndgameTeams reflects simulated baseDps
    const candidateTeams = teamService.buildCandidateEndgameTeams(simulatedRecs, roster);
    expect(candidateTeams.length).toBeGreaterThan(0);
    expect(candidateTeams[0]!.baseDps).toBe(Math.round(topRec.simulatedDps!));
  }, 35000);

  it('ranks multiple simulated candidates by simulated DPS descending', async () => {
    const mockSimulationService = {
      simulateTeam: async (members: Array<{ characterKey?: string } | string>) => {
        const firstKey = typeof members[0] === 'string' ? members[0] : members[0]?.characterKey;
        // Return 75,000 DPS for Bennett-led teams, 50,000 for others
        const dps = firstKey?.toLowerCase().includes('bennett') ? 75000 : 50000;
        return {
          simulatedDps: dps,
          errorMargin: 100,
          simulationStatus: 'VERIFIED_SIMULATION' as const,
          samples: 1,
          members: [],
        };
      },
    } as unknown as TeamSimulationService;

    const teamService = new TeamIntelligenceService(undefined, undefined, mockSimulationService);
    const roster: CharacterInput[] = [
      { characterKey: 'HuTao', level: 90, ascension: 6, constellation: 0, talentNormal: 8, talentSkill: 8, talentBurst: 8, equippedWeapon: null },
      { characterKey: 'Xingqiu', level: 90, ascension: 6, constellation: 6, talentNormal: 6, talentSkill: 8, talentBurst: 10, equippedWeapon: null },
      { characterKey: 'Yelan', level: 90, ascension: 6, constellation: 0, talentNormal: 1, talentSkill: 9, talentBurst: 9, equippedWeapon: null },
      { characterKey: 'Zhongli', level: 90, ascension: 6, constellation: 0, talentNormal: 1, talentSkill: 9, talentBurst: 8, equippedWeapon: null },
      { characterKey: 'Bennett', level: 90, ascension: 6, constellation: 5, talentNormal: 1, talentSkill: 8, talentBurst: 10, equippedWeapon: null },
      { characterKey: 'Xiangling', level: 90, ascension: 6, constellation: 4, talentNormal: 1, talentSkill: 8, talentBurst: 10, equippedWeapon: null },
      { characterKey: 'RaidenShogun', level: 90, ascension: 6, constellation: 0, talentNormal: 1, talentSkill: 9, talentBurst: 10, equippedWeapon: null },
    ];

    const results = await teamService.getSimulatedRecommendationsForRoster(roster, {
      limit: 3,
      simulateTopN: 3,
    });

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0]!.simulatedDps).toBeGreaterThanOrEqual(results[1]!.simulatedDps!);
    expect(results[0]!.rank).toBe(1);
    expect(results[1]!.rank).toBe(2);
  });
});
