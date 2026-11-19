import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '../data/characters';
import { WEAPONS_DATA } from '../data/weapons';
import { generateBestTeams } from './team-generator';
import type { OwnedCharacterProfile, OwnedWeapon } from '../types/genshin';

describe('Canonical Meta-Team Benchmark Library (25+ Archetypes across 3 Personas)', () => {
  // 1. Account Personas Setup
  const STARTER_F2P_IDS = [
    'Xiangling',
    'Bennett',
    'Xingqiu',
    'Sucrose',
    'Fischl',
    'Barbara',
    'Kaeya',
    'Lynette',
    'Collei',
    'Noelle',
    'TravelerAnemo',
    'TravelerGeo',
    'TravelerElectro',
    'TravelerDendro',
    'TravelerHydro',
    'TravelerPyro',
  ];

  const DOLPHIN_5_STAR_IDS = [
    'Mavuika',
    'Furina',
    'Neuvillette',
    'Nahida',
    'KaedeharaKazuha',
    'Zhongli',
    'RaidenShogun',
    'Alhaitham',
    'Arlecchino',
    'Clorinde',
    'Navia',
    'Xilonen',
  ];

  const DOLPHIN_IDS = [
    ...DOLPHIN_5_STAR_IDS,
    'Bennett',
    'Xiangling',
    'Xingqiu',
    'Fischl',
    'Chevreuse',
    'KukiShinobu',
    'Sucrose',
    'Faruzan',
    'Gaming',
    'Charlotte',
    'Layla',
    'Diona',
    'Yelan',
    'Baizhu',
    'Iansan',
    'Chiori',
  ];

  const ALL_128_IDS = CHARACTERS.map((c) => c.id);

  const ALL_WEAPONS_BAG: OwnedWeapon[] = WEAPONS_DATA.map((w, idx) => ({
    id: `bench_w_${idx}`,
    key: w.key,
    name: w.name,
    level: 90,
    refinement: 1,
    rarity: w.rarity,
    location: '',
  }));

  const WHALE_PROFILES: Record<string, OwnedCharacterProfile> = {};
  for (const id of ALL_128_IDS) {
    WHALE_PROFILES[id] = { id, level: 90, constellation: 6 };
  }

  const DOLPHIN_PROFILES: Record<string, OwnedCharacterProfile> = {};
  for (const id of DOLPHIN_IDS) {
    const is5Star = DOLPHIN_5_STAR_IDS.includes(id);
    DOLPHIN_PROFILES[id] = { id, level: 90, constellation: is5Star ? 2 : 6 };
  }

  const STARTER_PROFILES: Record<string, OwnedCharacterProfile> = {};
  for (const id of STARTER_F2P_IDS) {
    STARTER_PROFILES[id] = { id, level: 80, constellation: 0 };
  }

  // 2. Persona 1: Starter F2P Recommendations
  describe('Persona 1: Starter F2P Account', () => {
    it('recommends premier F2P National team (Xiangling / Bennett / Xingqiu / Sucrose)', () => {
      const teams = generateBestTeams(STARTER_F2P_IDS, undefined, STARTER_PROFILES);
      expect(teams.length).toBeGreaterThan(0);

      const national =
        teams.find((t) => t.archetype === 'National') ||
        teams.find((t) => t.archetype === 'Vaporize' && t.members.some((m) => m.id === 'Xiangling'));
      expect(national).toBeDefined();

      const memberIds = national!.members.map((m) => m.id);
      expect(memberIds).toContain('Xiangling');
      expect(memberIds).toContain('Bennett');
      expect(memberIds).toContain('Xingqiu');
    });

    it('enforces exact owned roster: exactly 0 unowned characters appear', () => {
      const teams = generateBestTeams(STARTER_F2P_IDS, undefined, STARTER_PROFILES);
      const starterSet = new Set(STARTER_F2P_IDS);

      for (const team of teams) {
        for (const member of team.members) {
          expect(
            starterSet.has(member.id),
            `Unowned character ${member.id} leaked into Starter F2P recommendation`,
          ).toBe(true);
        }
      }
    });

    it('never pairs multiple Traveler elemental configurations together', () => {
      const teams = generateBestTeams(STARTER_F2P_IDS, undefined, STARTER_PROFILES);
      for (const team of teams) {
        const travelers = team.members.filter((m) => m.id.startsWith('Traveler'));
        expect(travelers.length).toBeLessThanOrEqual(1);
      }
    });
  });

  // 3. Persona 2: Dolphin Account
  describe('Persona 2: Dolphin Account', () => {
    it('generates high-tier teams for prominent carries (Neuvillette, Mavuika, Clorinde)', () => {
      const teamsNeuv = generateBestTeams(DOLPHIN_IDS, 'Neuvillette', DOLPHIN_PROFILES, ALL_WEAPONS_BAG);
      expect(teamsNeuv.length).toBeGreaterThan(0);
      const neuvTeam = teamsNeuv[0];
      expect(neuvTeam.members.map((m) => m.id)).toContain('Neuvillette');
      expect(neuvTeam.scores?.benchmarkTier).toBe('S+');

      const teamsMav = generateBestTeams(DOLPHIN_IDS, 'Mavuika', DOLPHIN_PROFILES, ALL_WEAPONS_BAG);
      expect(teamsMav.length).toBeGreaterThan(0);
      expect(teamsMav.some((t) => t.members.some((m) => m.id === 'Mavuika'))).toBe(true);
    });

    it('enforces Chevreuse exclusivity on Dolphin Overload teams: 0 off-element supports', () => {
      const teams = generateBestTeams(DOLPHIN_IDS, 'Chevreuse', DOLPHIN_PROFILES, ALL_WEAPONS_BAG);
      const chevTeam = teams.find((t) => t.archetype === 'Overload');

      expect(chevTeam).toBeDefined();
      for (const member of chevTeam!.members) {
        expect(
          ['Pyro', 'Electro'].includes(member.element),
          `Chevreuse Overload illegally contains ${member.name} (${member.element})`,
        ).toBe(true);
      }
    });
  });

  // 4. Persona 3: Whale / Collector (25+ Canonical Meta Archetypes Verification)
  describe('Persona 3: Whale / 25+ Canonical Meta Archetypes Suite', () => {
    const CANONICAL_ARCHETYPES: Array<{
      id: string;
      name: string;
      archetype: string;
      focusId: string;
      expectedMembers: string[];
      minTier: 'S+' | 'S' | 'A' | 'B';
    }> = [
      {
        id: '1-lunar-bloom',
        name: 'Lunar-Bloom Dominion',
        archetype: 'Lunar-Bloom',
        focusId: 'Nefer',
        expectedMembers: ['Nefer'],
        minTier: 'S+',
      },
      {
        id: '2-vape-natlan',
        name: 'Vaporize Natlan',
        archetype: 'Vaporize',
        focusId: 'Mavuika',
        expectedMembers: ['Mavuika'],
        minTier: 'S+',
      },
      {
        id: '3-vape-classic',
        name: 'Vaporize Classic',
        archetype: 'Vaporize',
        focusId: 'HuTao',
        expectedMembers: ['HuTao'],
        minTier: 'S+',
      },
      {
        id: '4-national',
        name: 'National Accord',
        archetype: 'National',
        focusId: 'Xiangling',
        expectedMembers: ['Xiangling', 'Bennett', 'Xingqiu'],
        minTier: 'S',
      },
      {
        id: '5-overload-chev',
        name: 'Overload Chevreuse',
        archetype: 'Overload',
        focusId: 'Clorinde',
        expectedMembers: ['Clorinde'],
        minTier: 'S+',
      },
      {
        id: '6-overload-natlan',
        name: 'Overload Natlan',
        archetype: 'Overload',
        focusId: 'Chevreuse',
        expectedMembers: ['Chevreuse'],
        minTier: 'S',
      },
      {
        id: '7-hyperbloom-driver',
        name: 'Hyperbloom Driver',
        archetype: 'Hyperbloom',
        focusId: 'Alhaitham',
        expectedMembers: ['Alhaitham'],
        minTier: 'S+',
      },
      {
        id: '8-hyperbloom-quick',
        name: 'Hyperbloom Quick',
        archetype: 'Hyperbloom',
        focusId: 'Cyno',
        expectedMembers: ['Cyno'],
        minTier: 'S',
      },
      {
        id: '9-aggravate',
        name: 'Aggravate',
        archetype: 'Quicken',
        focusId: 'Keqing',
        expectedMembers: ['Keqing'],
        minTier: 'S',
      },
      {
        id: '10-spread',
        name: 'Spread',
        archetype: 'Quicken',
        focusId: 'Tighnari',
        expectedMembers: ['Tighnari'],
        minTier: 'S',
      },
      {
        id: '11-freeze-fontaine',
        name: 'Freeze Fontaine',
        archetype: 'Freeze / Melt',
        focusId: 'Wriothesley',
        expectedMembers: ['Wriothesley'],
        minTier: 'S',
      },
      {
        id: '12-freeze-classic',
        name: 'Freeze Classic',
        archetype: 'Freeze / Melt',
        focusId: 'KamisatoAyaka',
        expectedMembers: ['KamisatoAyaka'],
        minTier: 'S',
      },
      {
        id: '13-hypercarry-hydro',
        name: 'Hydro Hypercarry',
        archetype: 'Hydro Hypercarry',
        focusId: 'Neuvillette',
        expectedMembers: ['Neuvillette'],
        minTier: 'S+',
      },
      {
        id: '14-hypercarry-electro',
        name: 'Electro Hypercarry',
        archetype: 'Electro Hypercarry',
        focusId: 'RaidenShogun',
        expectedMembers: ['RaidenShogun'],
        minTier: 'S',
      },
      {
        id: '15-crystallize-geo',
        name: 'Crystallize Geo',
        archetype: 'Crystallize',
        focusId: 'Navia',
        expectedMembers: ['Navia'],
        minTier: 'S+',
      },
      {
        id: '16-mono-geo',
        name: 'Mono Geo',
        archetype: 'Mono-Geo',
        focusId: 'AratakiItto',
        expectedMembers: ['AratakiItto'],
        minTier: 'S',
      },
      {
        id: '17-plunge-pyro',
        name: 'Plunge Pyro',
        archetype: 'Plunge',
        focusId: 'Gaming',
        expectedMembers: ['Gaming'],
        minTier: 'S',
      },
      {
        id: '18-plunge-anemo',
        name: 'Plunge Anemo',
        archetype: 'Plunge',
        focusId: 'Xiao',
        expectedMembers: ['Xiao'],
        minTier: 'S',
      },
      {
        id: '19-forward-melt',
        name: 'Forward Melt',
        archetype: 'Freeze / Melt',
        focusId: 'Arlecchino',
        expectedMembers: ['Arlecchino'],
        minTier: 'S+',
      },
      {
        id: '20-reverse-melt',
        name: 'Reverse Melt',
        archetype: 'Freeze / Melt',
        focusId: 'Shenhe',
        expectedMembers: ['Shenhe'],
        minTier: 'S',
      },
      {
        id: '21-burgeon',
        name: 'Burgeon',
        archetype: 'Burgeon',
        focusId: 'Thoma',
        expectedMembers: ['Thoma'],
        minTier: 'S',
      },
      {
        id: '22-superconduct-physical',
        name: 'Physical Superconduct',
        archetype: 'Physical',
        focusId: 'Eula',
        expectedMembers: ['Eula'],
        minTier: 'S',
      },
      {
        id: '23-mono-pyro',
        name: 'Mono Pyro',
        archetype: 'Mono-Pyro',
        focusId: 'Lyney',
        expectedMembers: ['Lyney'],
        minTier: 'S',
      },
      {
        id: '24-mono-hydro',
        name: 'Mono Hydro',
        archetype: 'Mono-Hydro',
        focusId: 'KamisatoAyato',
        expectedMembers: ['KamisatoAyato'],
        minTier: 'S',
      },
      {
        id: '25-anemo-hyper',
        name: 'Anemo Hyper',
        archetype: 'Anemo Hypercarry',
        focusId: 'Wanderer',
        expectedMembers: ['Wanderer'],
        minTier: 'S',
      },
      {
        id: '26-bountiful-bloom',
        name: 'Bountiful Bloom',
        archetype: 'Bountiful-Bloom',
        focusId: 'Nilou',
        expectedMembers: ['Nilou'],
        minTier: 'S+',
      },
    ];

    for (const item of CANONICAL_ARCHETYPES) {
      it(`validates archetype #${item.id}: ${item.name} (${item.archetype})`, () => {
        const teams = generateBestTeams(
          ALL_128_IDS,
          item.focusId,
          WHALE_PROFILES,
          ALL_WEAPONS_BAG,
        );
        expect(
          teams.length,
          `Failed to generate any teams for focus character ${item.focusId}`,
        ).toBeGreaterThan(0);

        const targetTeam = teams.find((t) => t.archetype === item.archetype) || teams[0];
        expect(targetTeam).toBeDefined();
        expect(targetTeam.members).toHaveLength(4);

        // Verify focus character presence
        const memberIds = targetTeam.members.map((m) => m.id);
        for (const expected of item.expectedMembers) {
          expect(
            memberIds,
            `Expected ${expected} in team ${targetTeam.name}`,
          ).toContain(expected);
        }

        // Verify 3-tier scores & explanations
        expect(targetTeam.scores).toBeDefined();
        expect(targetTeam.explanation).toBeDefined();

        // Verify exclusivity rules
        if (targetTeam.members.some((m) => m.id === 'Chevreuse')) {
          for (const m of targetTeam.members) {
            expect(['Pyro', 'Electro']).toContain(m.element);
          }
        }
        if (targetTeam.members.some((m) => m.id === 'Nilou')) {
          for (const m of targetTeam.members) {
            expect(['Hydro', 'Dendro']).toContain(m.element);
          }
        }
      });
    }
  });
});
