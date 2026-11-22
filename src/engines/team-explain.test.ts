import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '../data/characters';
import { generateTeamExplanation } from './team-explain';
import type { Character, OwnedCharacterProfile } from '../types/genshin';
import type { ArchetypeTemplate } from './team-generator';

function getChar(id: string): Character {
  const found = CHARACTERS.find((c) => c.id === id);
  if (!found) throw new Error(`Character ${id} not found`);
  return found;
}

describe('Team Explanation & Swap Advisor Engine', () => {
  const huTao = getChar('HuTao');
  const xingqiu = getChar('Xingqiu');
  const zhongli = getChar('Zhongli');
  const kazuha = getChar('KaedeharaKazuha');
  const sucrose = getChar('Sucrose');
  const yelan = getChar('Yelan');
  const bennett = getChar('Bennett');
  const chevreuse = getChar('Chevreuse');
  const fischl = getChar('Fischl');
  const xiangling = getChar('Xiangling');
  const nilou = getChar('Nilou');
  const nahida = getChar('Nahida');
  const kokomi = getChar('SangonomiyaKokomi');
  const furina = getChar('Furina');

  const vapeTemplate: ArchetypeTemplate = {
    name: 'Vaporize Ascendance',
    archetype: 'Vaporize',
    leadTags: ['Vaporize'],
    requiredElements: ['Pyro', 'Hydro'],
    supportTags: ['Hydro-App', 'VV', 'Huge-ATK-Buff'],
    rotation: 'Hydro Enabler Burst/Skill → Buffer Skill/Burst → Bennett Q → Pyro Carry Combo',
    baseSynergy: 94,
  };

  const overloadTemplate: ArchetypeTemplate = {
    name: 'Chevreuse Overload Protocol',
    archetype: 'Overload',
    leadTags: ['Overload'],
    requiredElements: ['Pyro', 'Electro'],
    exclusiveElements: ['Pyro', 'Electro'],
    supportTags: ['ATK-Buffer', 'RES-Shred'],
    rotation: 'Electro Sub-DPS E → Chevreuse Hold E → Bennett Q → Pyro Carry DPS',
    baseSynergy: 92,
  };

  const nilouTemplate: ArchetypeTemplate = {
    name: 'Bountiful Bloom Symphony',
    archetype: 'Bountiful-Bloom',
    leadTags: ['Hydro'],
    requiredElements: ['Hydro', 'Dendro'],
    exclusiveElements: ['Hydro', 'Dendro'],
    supportTags: ['EM-Buffer', 'Healer'],
    rotation: 'Nilou EEE → Dendro Applier E Q → Hydro/Dendro Support → Continuous Bountiful Bloom detonate',
    baseSynergy: 93,
  };

  it('generates customized role rationale for every party member', () => {
    const team = [huTao, xingqiu, zhongli, kazuha];
    const pool = [huTao, xingqiu, zhongli, kazuha, sucrose, yelan];

    const explanation = generateTeamExplanation(team, vapeTemplate, pool);

    expect(explanation.roleRationale).toBeDefined();
    expect(explanation.roleRationale['HuTao']).toContain('Guide to Afterlife');
    expect(explanation.roleRationale['Xingqiu']).toContain('Hydro rainswords');
    expect(explanation.roleRationale['Zhongli']).toContain('Jade Shield');
    expect(explanation.roleRationale['KaedeharaKazuha']).toContain('Chihayaburu');
  });

  it('generates readable reaction workflows matching archetype specifications', () => {
    const team = [huTao, xingqiu, zhongli, kazuha];
    const explanation = generateTeamExplanation(team, vapeTemplate, [huTao, xingqiu]);

    expect(explanation.reactionWorkflow).toContain('Forward/Reverse Vaporize');
  });

  it('provides energy status assessment with explicit warnings when battery is missing', () => {
    // Xiangling (80 cost) and Xingqiu (80 cost) both without same-element battery or Favonius
    const team = [xiangling, xingqiu, kazuha, zhongli];
    const explanation = generateTeamExplanation(team, vapeTemplate, team);

    expect(explanation.energyAssessment.status).toBe('deficit');
    expect(explanation.energyAssessment.warnings.length).toBeGreaterThanOrEqual(2);
    expect(explanation.energyAssessment.warnings.some((w) => w.includes('Xiangling requires high Energy'))).toBe(true);

    // Single deficit: Hu Tao (60 cost) + Xiangling (80 cost)
    const singleDeficitTeam = [huTao, xiangling, kazuha, zhongli];
    const singleExpl = generateTeamExplanation(singleDeficitTeam, vapeTemplate, singleDeficitTeam);
    expect(singleExpl.energyAssessment.status).toBe('adequate');
  });

  it('generates swap alternatives with concrete pros and cons', () => {
    const team = [huTao, xingqiu, zhongli, kazuha];
    const pool = [huTao, xingqiu, zhongli, kazuha, sucrose, yelan];

    const explanation = generateTeamExplanation(team, vapeTemplate, pool);

    expect(explanation.alternatives.length).toBeGreaterThan(0);

    const kazuhaAlt = explanation.alternatives.find((a) => a.originalCharacterId === 'KaedeharaKazuha');
    expect(kazuhaAlt).toBeDefined();
    expect(kazuhaAlt?.alternativeCharacter.id).toBe('Sucrose');
    expect(kazuhaAlt?.tradeOffPros.length).toBeGreaterThan(0);
    expect(kazuhaAlt?.tradeOffCons.length).toBeGreaterThan(0);
  });

  it('strictly respects archetype exclusivity in swap alternatives (Chevreuse: Pyro/Electro only)', () => {
    const team = [getChar('Clorinde'), chevreuse, fischl, bennett];
    // Pool includes Kazuha, Zhongli, Sucrose, Furina
    const pool = [
      getChar('Clorinde'),
      chevreuse,
      fischl,
      bennett,
      kazuha,
      zhongli,
      sucrose,
      furina,
      xiangling,
      getChar('Keqing'),
    ];

    const explanation = generateTeamExplanation(team, overloadTemplate, pool);

    for (const alt of explanation.alternatives) {
      expect(
        ['Pyro', 'Electro'].includes(alt.alternativeCharacter.element),
        `Alternative ${alt.alternativeCharacter.name} (${alt.alternativeCharacter.element}) illegally violates Chevreuse exclusivity`,
      ).toBe(true);
    }
  });

  it('strictly respects archetype exclusivity in swap alternatives (Nilou: Hydro/Dendro only)', () => {
    const team = [nilou, nahida, kokomi, getChar('TravelerDendro')];
    const pool = [
      nilou,
      nahida,
      kokomi,
      getChar('TravelerDendro'),
      fischl,
      kazuha,
      bennett,
      yelan,
      getChar('Baizhu'),
    ];

    const explanation = generateTeamExplanation(team, nilouTemplate, pool);

    for (const alt of explanation.alternatives) {
      expect(
        ['Hydro', 'Dendro'].includes(alt.alternativeCharacter.element),
        `Alternative ${alt.alternativeCharacter.name} (${alt.alternativeCharacter.element}) illegally violates Nilou exclusivity`,
      ).toBe(true);
    }
  });

  it('flags Bennett C6 conflict in antiSynergyWarnings when present', () => {
    const team = [getChar('Eula'), bennett, fischl, zhongli];
    const c6Profiles: Record<string, OwnedCharacterProfile> = {
      Bennett: { id: 'Bennett', level: 90, constellation: 6 },
    };

    const explanation = generateTeamExplanation(team, vapeTemplate, team, c6Profiles);
    expect(explanation.antiSynergyWarnings).toBeDefined();
    expect(explanation.antiSynergyWarnings?.some((w) => w.includes('Bennett C6'))).toBe(true);
  });

  it('calculates dynamic compatibility impact delta when scoreTeamFn is provided', () => {
    const team = [huTao, xingqiu, zhongli, kazuha];
    const pool = [huTao, xingqiu, zhongli, kazuha, sucrose];

    // Score function that gives 95 to team with Kazuha and 91 to team with Sucrose
    const mockScoreFn = (members: Character[]) => {
      if (members.some((m) => m.id === 'KaedeharaKazuha')) return 95;
      if (members.some((m) => m.id === 'Sucrose')) return 91;
      return 85;
    };

    const explanation = generateTeamExplanation(
      team,
      vapeTemplate,
      pool,
      undefined,
      undefined,
      mockScoreFn,
    );

    const kazuhaAlt = explanation.alternatives.find(
      (a) => a.originalCharacterId === 'KaedeharaKazuha' && a.alternativeCharacter.id === 'Sucrose',
    );
    expect(kazuhaAlt).toBeDefined();
    expect(kazuhaAlt?.compatibilityImpact).toBe(-4);
  });

  it('populates whyLowerScore for swap alternatives explaining trade-offs', () => {
    const team = [huTao, xingqiu, zhongli, kazuha];
    const pool = [huTao, xingqiu, zhongli, kazuha, sucrose, yelan];

    const explanation = generateTeamExplanation(team, vapeTemplate, pool);
    for (const alt of explanation.alternatives) {
      expect(alt.whyLowerScore).toBeDefined();
      expect(alt.whyLowerScore!.length).toBeGreaterThan(10);
    }
  });

  it('identifies unowned ideal missing supports with role replacement and impact summary', () => {
    // Template with idealSupports
    const templateWithIdeals: ArchetypeTemplate = {
      ...vapeTemplate,
      idealSupports: ['Furina', 'Xilonen', 'KaedeharaKazuha', 'Bennett'],
    };

    // User only owns Hu Tao, Xingqiu, Xiangling, Barbara
    const xiangling = getChar('Xiangling');
    const barbara = getChar('Barbara');
    const team = [huTao, xingqiu, xiangling, barbara];
    const pool = [huTao, xingqiu, xiangling, barbara];

    const explanation = generateTeamExplanation(team, templateWithIdeals, pool);

    expect(explanation.idealMissingSupports).toBeDefined();
    expect(explanation.idealMissingSupports!.length).toBeGreaterThan(0);

    const furinaGap = explanation.idealMissingSupports?.find((g) => g.characterId === 'Furina');
    expect(furinaGap).toBeDefined();
    expect(furinaGap?.characterName).toBe('Furina');
    expect(furinaGap?.element).toBe('Hydro');
    expect(furinaGap?.impactSummary).toContain('Fanfare');
  });

  it('surfaces modern 7.x/5.x character rationales for Mavuika, Xilonen, and Skirk', () => {
    const mavuika = getChar('Mavuika');
    const xilonen = getChar('Xilonen');
    const skirk = getChar('Skirk');
    const team = [mavuika, xilonen, skirk, huTao];

    const explanation = generateTeamExplanation(team, vapeTemplate, team);
    expect(explanation.roleRationale['Mavuika']).toContain('Nightsoul');
    expect(explanation.roleRationale['Xilonen']).toContain('RES shred');
    expect(explanation.roleRationale['Skirk']).toContain('Void');
  });
});
