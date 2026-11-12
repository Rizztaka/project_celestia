import { describe, expect, it } from 'vitest';

import type { CharacterInput } from './team-intelligence.calculator.js';
import { TeamIntelligenceService } from './team-intelligence.service.js';
import { TeamSimulationService } from './team-simulation.service.js';

describe('TeamSimulationService & GCSim Central Team Intelligence', () => {
  const simulationService = new TeamSimulationService();

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
});
