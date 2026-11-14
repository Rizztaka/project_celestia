import { describe, it, expect } from 'vitest';
import { generateBestTeams } from './team-generator';
import { evaluatePullRecommendations } from './pull-advisor';
import { calculateArtifactStopPoint } from './artifact-stop';
import { analyzeEndgameReadiness } from './endgame-helper';

describe('Celestia v2 Core Engines', () => {
  describe('Team Generator (Speed + Accuracy)', () => {
    it('generates a premier Lunar-Bloom team when Nefer is owned', () => {
      const owned = ['Nefer', 'Furina', 'Nahida', 'KukiShinobu', 'Xingqiu'];
      const teams = generateBestTeams(owned, 'Nefer');

      expect(teams.length).toBeGreaterThan(0);
      const neferTeam = teams.find((t) => t.archetype === 'Lunar-Bloom');
      expect(neferTeam).toBeDefined();
      expect(neferTeam?.members.map((m) => m.id)).toContain('Nefer');
      // Must contain at least one Hydro partner to trigger blooms
      expect(neferTeam?.members.some((m) => m.element === 'Hydro')).toBe(true);
      expect(neferTeam?.synergyScore).toBeGreaterThanOrEqual(95);
    });

    it('calculates elemental resonance properly', () => {
      const owned = ['HuTao', 'Bennett', 'Xingqiu', 'Yelan'];
      const teams = generateBestTeams(owned);
      const vapeTeam = teams.find((t) => t.archetype === 'Vaporize');
      expect(vapeTeam).toBeDefined();
      expect(vapeTeam?.resonance.some((r) => r.includes('Fervent Flames') || r.includes('Soothing Water'))).toBe(true);
    });

    it('boosts synergy score and appends reasons when constellation milestones are met', () => {
      const owned = ['Xiangling', 'Bennett', 'Xingqiu', 'RaidenShogun'];
      const baseTeams = generateBestTeams(owned);
      const baseVape = baseTeams.find((t) => t.archetype === 'Vaporize') || baseTeams[0];

      const boostedProfiles = {
        Xiangling: { id: 'Xiangling', level: 90, constellation: 4 },
        Bennett: { id: 'Bennett', level: 90, constellation: 1 },
      };
      const boostedTeams = generateBestTeams(owned, undefined, boostedProfiles);
      const boostedVape = boostedTeams.find((t) => t.archetype === 'Vaporize') || boostedTeams[0];

      expect(boostedVape.synergyScore).toBeGreaterThanOrEqual(baseVape.synergyScore);
      expect(boostedVape.reasons.some((r) => r.includes('Xiangling C4'))).toBe(true);
      expect(boostedVape.reasons.some((r) => r.includes('Bennett C1'))).toBe(true);
    });

    it('handles Bennett C6 conditionally based on carry weapon and element', () => {
      // 1. Bennett C6 + Xiangling (Pyro Polearm) -> gets C6 Pyro DMG bonus
      const pyroMeleeOwned = ['Xiangling', 'Bennett', 'Xingqiu', 'Yelan'];
      const c6ProfilesXiangling = {
        Bennett: { id: 'Bennett', level: 90, constellation: 6 },
      };
      const teamsWithXiangling = generateBestTeams(pyroMeleeOwned, undefined, c6ProfilesXiangling);
      const xianglingTeam = teamsWithXiangling.find((t) => t.members.some((m) => m.id === 'Xiangling')) || teamsWithXiangling[0];
      expect(xianglingTeam.reasons.some((r) => r.includes('Bennett C6: +15% Pyro DMG Bonus for Sword, Claymore, and Polearm carries.'))).toBe(true);

      // 2. Bennett C6 + Yoimiya (Pyro Bow) without any Pyro Sword/Claymore/Polearm -> does NOT get C6 Pyro DMG bonus
      const bowOwned = ['Yoimiya', 'Bennett', 'Xingqiu', 'Yelan'];
      const c6ProfilesYoimiya = {
        Bennett: { id: 'Bennett', level: 90, constellation: 6 },
      };
      const teamsWithYoimiya = generateBestTeams(bowOwned, undefined, c6ProfilesYoimiya);
      const yoimiyaTeam = teamsWithYoimiya.find((t) => t.members.some((m) => m.id === 'Yoimiya')) || teamsWithYoimiya[0];
      expect(yoimiyaTeam.reasons.some((r) => r.includes('Bennett C6: +15% Pyro DMG Bonus'))).toBe(false);

      // 3. Bennett C6 + Eula (Physical Claymore) -> warns about override
      const physicalOwned = ['Eula', 'Bennett', 'RaidenShogun', 'Zhongli'];
      const c6ProfilesEula = {
        Bennett: { id: 'Bennett', level: 90, constellation: 6 },
      };
      const teamsWithEula = generateBestTeams(physicalOwned, undefined, c6ProfilesEula);
      const eulaTeam = teamsWithEula.find((t) => t.members.some((m) => m.id === 'Eula')) || teamsWithEula[0];
      expect(eulaTeam.reasons.some((r) => r.includes('Caution: Bennett C6 Pyro Infusion overrides'))).toBe(true);
    });
  });

  describe('Pull Advisor', () => {
    it('NEVER recommends pulling a character the player already owns', () => {
      const owned = ['Xilonen', 'Nefer', 'Furina', 'Bennett'];
      const advice = evaluatePullRecommendations(owned);

      const recommendedIds = advice.map((a) => a.character.id);
      expect(recommendedIds).not.toContain('Xilonen');
      expect(recommendedIds).not.toContain('Nefer');
      expect(recommendedIds).not.toContain('Furina');
    });

    it('prioritizes Lauma when Nefer is owned and Lauma is missing', () => {
      const owned = ['Nefer', 'Bennett', 'Xiangling'];
      const advice = evaluatePullRecommendations(owned);

      const lauma = advice.find((a) => a.character.id === 'Lauma');
      expect(lauma).toBeDefined();
      expect(lauma?.score).toBeGreaterThanOrEqual(95);
      expect(lauma?.accountBenefits.some((b) => b.includes('Nefer'))).toBe(true);
    });
  });

  describe('Artifact Stop-Point Calculator', () => {
    it('recommends stopping farming at high CV (220+) due to diminishing returns', () => {
      // 75% Crit Rate, 180% Crit DMG = 330 CV
      const result = calculateArtifactStopPoint('Hu Tao', 75, 180);
      expect(result.status).toBe('Ready / Stop Farming');
      expect(result.resinEfficiency).toBeLessThanOrEqual(20);
      expect(result.advice).toContain('STOP');
    });

    it('encourages farming at low CV (<170)', () => {
      // 50% Crit Rate, 60% Crit DMG = 160 CV
      const result = calculateArtifactStopPoint('Hu Tao', 50, 60);
      expect(result.status).toBe('High ROI');
      expect(result.resinEfficiency).toBeGreaterThanOrEqual(75);
    });

    it('handles EM/Reaction scalers like Nefer appropriately', () => {
      const result = calculateArtifactStopPoint('Nefer', 60, 100, true);
      expect(result.status).toBe('Ready / Stop Farming');
      expect(result.advice).toContain('EM/Reaction');
    });
  });

  describe('Endgame Shield Helper', () => {
    it('identifies Hydro counters for Pyro Lector in Floor 12 Chamber 1', () => {
      const owned = ['Furina', 'Neuvillette', 'Bennett', 'Fischl'];
      const analysis = analyzeEndgameReadiness(owned);

      const chamber1Part2 = analysis.find((a) => a.chamber.chamber === 1 && a.chamber.half === 'Second Half');
      expect(chamber1Part2).toBeDefined();
      expect(chamber1Part2?.verdict).toBe('Ready to Clear');
      expect(chamber1Part2?.usableCounters.some((c) => c.element === 'Hydro')).toBe(true);
    });
  });
});
