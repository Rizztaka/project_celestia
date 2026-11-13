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
