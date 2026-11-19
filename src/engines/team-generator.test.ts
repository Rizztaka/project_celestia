import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '../data/characters';
import {
  generateBestTeams,
  calculateCompatibilityScore,
  calculateInvestmentScore,
  determineBenchmarkTier,
  TEMPLATES,
} from './team-generator';
import type { OwnedCharacterProfile } from '../types/genshin';

describe('Team Generator Engine & Three-Tier Scoring', () => {
  it('generates teams with complete three-tier scoring breakdown', () => {
    const owned = ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli', 'Bennett', 'Xiangling', 'KaedeharaKazuha'];
    const teams = generateBestTeams(owned, 'HuTao');

    expect(teams.length).toBeGreaterThan(0);
    const vape = teams.find((t) => t.archetype === 'Vaporize') || teams[0];

    // Verify 3-tier scoring breakdown exists
    expect(vape.scores).toBeDefined();
    expect(vape.scores?.compatibilityScore).toBeGreaterThanOrEqual(0);
    expect(vape.scores?.compatibilityScore).toBeLessThanOrEqual(100);
    expect(vape.scores?.investmentScore).toBeGreaterThanOrEqual(0);
    expect(vape.scores?.investmentScore).toBeLessThanOrEqual(100);
    expect(['S+', 'S', 'A', 'B']).toContain(vape.scores?.benchmarkTier);

    // Verify backward compatibility
    expect(vape.synergyScore).toBe(vape.scores?.compatibilityScore);
    expect(vape.compositionCompatibilityScore).toBe(vape.scores?.compatibilityScore);

    // Verify natural-language explanation exists
    expect(vape.explanation).toBeDefined();
    expect(vape.explanation?.roleRationale).toBeDefined();
    expect(vape.explanation?.reactionWorkflow).toBeDefined();
    expect(vape.explanation?.energyAssessment).toBeDefined();
  });

  it('generates premier Lunar-Bloom team declaratively for Nefer without procedural hacks', () => {
    const owned = ['Nefer', 'Furina', 'Nahida', 'KukiShinobu', 'Xingqiu', 'Baizhu'];
    const teams = generateBestTeams(owned, 'Nefer');

    expect(teams.length).toBeGreaterThan(0);
    const neferTeam = teams.find((t) => t.archetype === 'Lunar-Bloom');
    expect(neferTeam).toBeDefined();
    expect(neferTeam?.members.map((m) => m.id)).toContain('Nefer');
    expect(neferTeam?.members.some((m) => m.element === 'Hydro')).toBe(true);
    expect(neferTeam?.scores?.benchmarkTier).toBe('S+');
    expect(neferTeam?.scores?.compatibilityScore).toBeGreaterThanOrEqual(95);
  });

  it('strictly respects Chevreuse Overload exclusivity: never includes off-element support', () => {
    // Pool includes premier supports: Kazuha (Anemo), Zhongli (Geo), Furina (Hydro), Nahida (Dendro)
    const owned = [
      'Clorinde',
      'Chevreuse',
      'Fischl',
      'Bennett',
      'KaedeharaKazuha',
      'Zhongli',
      'Furina',
      'Nahida',
    ];
    const teams = generateBestTeams(owned, 'Chevreuse');
    const overloadTeam = teams.find((t) => t.archetype === 'Overload');

    expect(overloadTeam).toBeDefined();
    for (const member of overloadTeam!.members) {
      expect(
        ['Pyro', 'Electro'].includes(member.element),
        `Chevreuse team contains off-element character: ${member.name} (${member.element})`,
      ).toBe(true);
    }
  });

  it('strictly respects Nilou Bountiful-Bloom exclusivity: never includes off-element support', () => {
    const owned = [
      'Nilou',
      'Nahida',
      'SangonomiyaKokomi',
      'TravelerDendro',
      'KaedeharaKazuha',
      'Zhongli',
      'RaidenShogun',
      'Bennett',
    ];
    const teams = generateBestTeams(owned, 'Nilou');
    const nilouTeam = teams.find((t) => t.archetype === 'Bountiful-Bloom');

    expect(nilouTeam).toBeDefined();
    for (const member of nilouTeam!.members) {
      expect(
        ['Hydro', 'Dendro'].includes(member.element),
        `Nilou team contains off-element character: ${member.name} (${member.element})`,
      ).toBe(true);
    }
  });

  it('penalizes dual on-field carry contention in compatibility score', () => {
    const template = TEMPLATES.find((t) => t.archetype === 'Vaporize')!;
    const charHuTao = CHARACTERS.find((c) => c.id === 'HuTao')!;
    const charNeuv = CHARACTERS.find((c) => c.id === 'Neuvillette')!;
    const charZhongli = CHARACTERS.find((c) => c.id === 'Zhongli')!;
    const charKazuha = CHARACTERS.find((c) => c.id === 'KaedeharaKazuha')!;
    const charXingqiu = CHARACTERS.find((c) => c.id === 'Xingqiu')!;

    const dualCarryTeam = [charHuTao, charNeuv, charZhongli, charKazuha];
    const singleCarryTeam = [charHuTao, charXingqiu, charZhongli, charKazuha];

    const scoreDual = calculateCompatibilityScore(dualCarryTeam, template);
    const scoreSingle = calculateCompatibilityScore(singleCarryTeam, template);

    expect(scoreDual).toBeLessThan(scoreSingle);
  });

  it('penalizes Bennett C6 override for affected carries', () => {
    const template = TEMPLATES.find((t) => t.archetype === 'Physical') || TEMPLATES[0];
    const charEula = CHARACTERS.find((c) => c.id === 'Eula')!;
    const charBennett = CHARACTERS.find((c) => c.id === 'Bennett')!;
    const charRaiden = CHARACTERS.find((c) => c.id === 'RaidenShogun')!;
    const charZhongli = CHARACTERS.find((c) => c.id === 'Zhongli')!;

    const team = [charEula, charBennett, charRaiden, charZhongli];
    const c1Profiles: Record<string, OwnedCharacterProfile> = {
      Bennett: { id: 'Bennett', level: 90, constellation: 1 },
    };
    const c6Profiles: Record<string, OwnedCharacterProfile> = {
      Bennett: { id: 'Bennett', level: 90, constellation: 6 },
    };

    const scoreC1 = calculateCompatibilityScore(team, template, c1Profiles);
    const scoreC6 = calculateCompatibilityScore(team, template, c6Profiles);

    expect(scoreC6).toBeLessThan(scoreC1);
    expect(scoreC1 - scoreC6).toBe(15);
  });

  it('evaluates account investment score based on levels and constellations', () => {
    const charHuTao = CHARACTERS.find((c) => c.id === 'HuTao')!;
    const charXingqiu = CHARACTERS.find((c) => c.id === 'Xingqiu')!;
    const charYelan = CHARACTERS.find((c) => c.id === 'Yelan')!;
    const charZhongli = CHARACTERS.find((c) => c.id === 'Zhongli')!;
    const team = [charHuTao, charXingqiu, charYelan, charZhongli];

    const lowProfiles: Record<string, OwnedCharacterProfile> = {
      HuTao: { id: 'HuTao', level: 50, constellation: 0 },
      Xingqiu: { id: 'Xingqiu', level: 60, constellation: 0 },
      Yelan: { id: 'Yelan', level: 60, constellation: 0 },
      Zhongli: { id: 'Zhongli', level: 50, constellation: 0 },
    };

    const maxProfiles: Record<string, OwnedCharacterProfile> = {
      HuTao: { id: 'HuTao', level: 90, constellation: 6 },
      Xingqiu: { id: 'Xingqiu', level: 90, constellation: 6 },
      Yelan: { id: 'Yelan', level: 90, constellation: 6 },
      Zhongli: { id: 'Zhongli', level: 90, constellation: 6 },
    };

    const lowInvestment = calculateInvestmentScore(team, lowProfiles);
    const maxInvestment = calculateInvestmentScore(team, maxProfiles);

    expect(maxInvestment).toBeGreaterThan(lowInvestment);
    expect(maxInvestment).toBeGreaterThanOrEqual(90);
  });

  it('factors talent milestones into investment score', () => {
    const charHuTao = CHARACTERS.find((c) => c.id === 'HuTao')!;
    const charXingqiu = CHARACTERS.find((c) => c.id === 'Xingqiu')!;
    const charYelan = CHARACTERS.find((c) => c.id === 'Yelan')!;
    const charZhongli = CHARACTERS.find((c) => c.id === 'Zhongli')!;
    const team = [charHuTao, charXingqiu, charYelan, charZhongli];

    const lowTalentProfiles: Record<string, OwnedCharacterProfile> = {
      HuTao: { id: 'HuTao', level: 90, constellation: 0, talents: { auto: 1, skill: 1, burst: 1 } },
      Xingqiu: { id: 'Xingqiu', level: 90, constellation: 0, talents: { auto: 1, skill: 1, burst: 1 } },
      Yelan: { id: 'Yelan', level: 90, constellation: 0, talents: { auto: 1, skill: 1, burst: 1 } },
      Zhongli: { id: 'Zhongli', level: 90, constellation: 0, talents: { auto: 1, skill: 1, burst: 1 } },
    };

    const maxTalentProfiles: Record<string, OwnedCharacterProfile> = {
      HuTao: { id: 'HuTao', level: 90, constellation: 0, talents: { auto: 10, skill: 10, burst: 10 } },
      Xingqiu: { id: 'Xingqiu', level: 90, constellation: 0, talents: { auto: 10, skill: 10, burst: 10 } },
      Yelan: { id: 'Yelan', level: 90, constellation: 0, talents: { auto: 10, skill: 10, burst: 10 } },
      Zhongli: { id: 'Zhongli', level: 90, constellation: 0, talents: { auto: 10, skill: 10, burst: 10 } },
    };

    const scoreLowTalent = calculateInvestmentScore(team, lowTalentProfiles);
    const scoreMaxTalent = calculateInvestmentScore(team, maxTalentProfiles);

    expect(scoreMaxTalent).toBeGreaterThan(scoreLowTalent);
  });

  it('never duplicates caution warnings in reasons when Bennett C6 has conflicts', () => {
    const owned = ['Eula', 'Bennett', 'RaidenShogun', 'Zhongli', 'Fischl', 'Mika'];
    const c6Profiles: Record<string, OwnedCharacterProfile> = {
      Bennett: { id: 'Bennett', level: 90, constellation: 6 },
    };
    const teams = generateBestTeams(owned, 'Eula', c6Profiles);
    expect(teams.length).toBeGreaterThan(0);

    for (const team of teams) {
      const cautionCount = team.reasons.filter((r) =>
        r.includes('Bennett C6 Pyro Infusion overrides'),
      ).length;
      expect(cautionCount).toBeLessThanOrEqual(1);

      // Verify overall reasons array has zero duplicate strings
      const uniqueReasons = new Set(team.reasons);
      expect(uniqueReasons.size).toBe(team.reasons.length);
    }
  });

  it('safely handles account owning multiple Traveler elements without duplicate party members', () => {
    const owned = [
      'TravelerAnemo',
      'TravelerGeo',
      'TravelerElectro',
      'TravelerDendro',
      'TravelerHydro',
      'TravelerPyro',
      'Xiangling',
      'Bennett',
      'Xingqiu',
      'Fischl',
    ];
    const teams = generateBestTeams(owned);
    expect(teams.length).toBeGreaterThan(0);

    for (const team of teams) {
      const travelers = team.members.filter((m) => m.id.startsWith('Traveler'));
      expect(travelers.length).toBeLessThanOrEqual(1);
    }
  });

  it('determines benchmark tier accurately based on synergy ceiling and anchor carries', () => {
    const charNefer = CHARACTERS.find((c) => c.id === 'Nefer')!;
    const charLauma = CHARACTERS.find((c) => c.id === 'Lauma')!;
    const charNahida = CHARACTERS.find((c) => c.id === 'Nahida')!;
    const charKuki = CHARACTERS.find((c) => c.id === 'KukiShinobu')!;
    const lunarTeam = [charNefer, charLauma, charNahida, charKuki];

    const tierSPlus = determineBenchmarkTier('Lunar-Bloom', 96, lunarTeam);
    expect(tierSPlus).toBe('S+');

    const tierS = determineBenchmarkTier('Mono-Pyro', 85, lunarTeam);
    expect(tierS).toBe('S');

    const tierA = determineBenchmarkTier('Mono-Pyro', 75, lunarTeam);
    expect(tierA).toBe('A');

    const tierB = determineBenchmarkTier('Vaporize', 60, lunarTeam);
    expect(tierB).toBe('B');
  });
});
