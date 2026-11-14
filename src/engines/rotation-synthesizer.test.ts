import { describe, it, expect } from 'vitest';
import {
  parseActionShorthand,
  getDefaultRotationProfile,
  synthesizeTeamRotation,
  resolveCharacterRotationProfile,
} from './rotation-synthesizer';
import { Character } from '../types/genshin';

describe('Rotation Synthesizer', () => {
  describe('parseActionShorthand', () => {
    it('parses simple Skill and Burst sequences', () => {
      const actions = parseActionShorthand('E > Q');
      expect(actions).toHaveLength(2);
      expect(actions[0]).toEqual({ type: 'skill', label: 'E' });
      expect(actions[1]).toEqual({ type: 'burst', label: 'Q' });

      const spaceActions = parseActionShorthand('E Q');
      expect(spaceActions).toHaveLength(2);
      expect(spaceActions[0].type).toBe('skill');
      expect(spaceActions[1].type).toBe('burst');
    });

    it('parses complex carry combos with charged attacks and cancels', () => {
      const actions = parseActionShorthand('E > 3CA > E > 3CA');
      expect(actions).toHaveLength(4);
      expect(actions[0].type).toBe('skill');
      expect(actions[1].type).toBe('charged');
      expect(actions[1].label).toBe('3CA');
      expect(actions[2].type).toBe('skill');
      expect(actions[3].type).toBe('charged');
      expect(actions[3].label).toBe('3CA');
    });

    it('identifies hold skills, normal strings, dashes, and plunges', () => {
      const actions = parseActionShorthand('hE > Plunge > Q > N3D');
      expect(actions[0].type).toBe('hold-skill');
      expect(actions[0].label).toBe('hE');
      expect(actions[1].type).toBe('plunge');
      expect(actions[2].type).toBe('burst');
      expect(actions[3].type).toBe('normal');
      expect(actions[3].label).toBe('N3D');
    });
  });

  describe('resolveCharacterRotationProfile', () => {
    it('retrieves curated profile for Nefer', () => {
      const neferChar: Character = {
        id: 'Nefer',
        name: 'Nefer',
        element: 'Dendro',
        weapon: 'Catalyst',
        rarity: 5,
        roles: ['On-Field DPS'],
        tags: [],
      };
      const profile = resolveCharacterRotationProfile(neferChar);
      expect(profile.stage).toBe('on-field-carry');
      expect(profile.primarySequence[0].type).toBe('skill');
      expect(profile.primarySequence[1].label).toBe('3CA');
      expect(profile.notes).toContain('Shadow Dance');
    });

    it('retrieves curated profile for Furina with alternate sequence', () => {
      const furinaChar: Character = {
        id: 'Furina',
        name: 'Furina',
        element: 'Hydro',
        weapon: 'Sword',
        rarity: 5,
        roles: ['Buffer/Shred', 'Off-Field DPS'],
        tags: [],
      };
      const profile = resolveCharacterRotationProfile(furinaChar);
      expect(profile.primarySequence[0].label).toBe('E');
      expect(profile.primarySequence[1].label).toBe('Q');
      expect(profile.alternateSequence).toBeDefined();
      expect(profile.alternateSequence![0].label).toBe('Q');
    });
  });

  describe('getDefaultRotationProfile', () => {
    it('creates appropriate default profile based on character roles', () => {
      const dummyCarry: Character = {
        id: 'generic-carry',
        name: 'Generic Carry',
        element: 'Pyro',
        weapon: 'Sword',
        rarity: 5,
        roles: ['On-Field DPS'],
        tags: [],
      };

      const profile = getDefaultRotationProfile(dummyCarry);
      expect(profile.stage).toBe('on-field-carry');
      expect(profile.estimatedFieldTime).toBeGreaterThanOrEqual(8);
      expect(profile.primarySequence.length).toBeGreaterThan(0);
    });

    it('creates appropriate default profile for support/buffer', () => {
      const dummyBuffer: Character = {
        id: 'generic-buffer',
        name: 'Generic Buffer',
        element: 'Anemo',
        weapon: 'Bow',
        rarity: 4,
        roles: ['Buffer/Shred'],
        tags: [],
      };

      const profile = getDefaultRotationProfile(dummyBuffer);
      expect(profile.stage).toBe('buffer-shred');
      expect(profile.estimatedFieldTime).toBeLessThanOrEqual(4);
    });
  });

  describe('synthesizeTeamRotation', () => {
    const baizhu: Character = {
      id: 'baizhu',
      name: 'Baizhu',
      element: 'Dendro',
      weapon: 'Catalyst',
      rarity: 5,
      roles: ['Sustain'],
      tags: ['Team-Healer', 'Shield'],
      rotationProfile: {
        primarySequence: parseActionShorthand('E > Q'),
        stage: 'sustain-setup',
        estimatedFieldTime: 2.0,
        notes: 'Cast E then Q to provide continuous healing, shields, and Dendro reaction buff.',
      },
    };

    const furina: Character = {
      id: 'furina',
      name: 'Furina',
      element: 'Hydro',
      weapon: 'Sword',
      rarity: 5,
      roles: ['Off-Field DPS', 'Buffer/Shred'],
      tags: ['Universal-Buffer', 'Hydro-App'],
      rotationProfile: {
        primarySequence: parseActionShorthand('E > Q'),
        alternateSequence: parseActionShorthand('Q > E'),
        stage: 'sustain-setup',
        estimatedFieldTime: 2.5,
        notes: 'Cast E then Q to begin Salon Solitaire HP drain prior to Fanfare stacks.',
      },
    };

    const kazuha: Character = {
      id: 'kazuha',
      name: 'Kaedehara Kazuha',
      element: 'Anemo',
      weapon: 'Sword',
      rarity: 5,
      roles: ['Buffer/Shred'],
      tags: ['VV', 'Universal-Buffer'],
      rotationProfile: {
        primarySequence: parseActionShorthand('hE > Plunge > Q'),
        stage: 'buffer-shred',
        estimatedFieldTime: 3.0,
        notes: 'Hold E into Plunge for crowd control and VV RES shred, then Q for elemental absorption.',
      },
    };

    const nefer: Character = {
      id: 'nefer',
      name: 'Nefer',
      element: 'Dendro',
      weapon: 'Catalyst',
      rarity: 5,
      roles: ['On-Field DPS'],
      tags: ['Nod-Krai'],
      rotationProfile: {
        primarySequence: parseActionShorthand('E > 3CA > E > 3CA'),
        stage: 'on-field-carry',
        estimatedFieldTime: 10.5,
        notes: 'Activate Shadow Dance stance (E), consume Seeds of Deceit with 3 charged attacks, recast E and repeat.',
      },
    };

    it('sequences 4 characters in theorycrafting stage order', () => {
      // Input in mixed/random order
      const team = [nefer, kazuha, baizhu, furina];
      const result = synthesizeTeamRotation(team);

      expect(result.steps).toHaveLength(4);
      // Baizhu & Furina (sustain/setup) should come first, then Kazuha (buffer), then Nefer (carry)
      expect(result.steps[result.steps.length - 1].characterId).toBe('nefer');
      expect(result.steps[result.steps.length - 2].characterId).toBe('kazuha');

      // Verify cycle time calculation includes field times plus swap transitions
      expect(result.totalCycleTime).toBeCloseTo(2.0 + 2.5 + 3.0 + 10.5 + 4 * 0.5, 1);
      expect(result.summaryString).toContain('Nefer');
    });

    it('honors special synergy: Bennett buff funneling into Xiangling', () => {
      const bennett: Character = {
        id: 'bennett',
        name: 'Bennett',
        element: 'Pyro',
        weapon: 'Sword',
        rarity: 4,
        roles: ['Buffer/Shred', 'Sustain'],
        tags: ['Huge-ATK-Buff', 'Healer'],
        rotationProfile: {
          primarySequence: parseActionShorthand('Q > E'),
          stage: 'buffer-shred',
          estimatedFieldTime: 2.0,
          notes: 'Burst for ATK buff circle, tap Skill to generate particles.',
        },
      };

      const xiangling: Character = {
        id: 'xiangling',
        name: 'Xiangling',
        element: 'Pyro',
        weapon: 'Polearm',
        rarity: 4,
        roles: ['Off-Field DPS'],
        tags: ['Pyro-Enabler', 'Off-Field-DPS'],
        rotationProfile: {
          primarySequence: parseActionShorthand('Q > E'),
          stage: 'sub-dps',
          estimatedFieldTime: 2.5,
          notes: 'Cast Pyronado inside Bennett circle to snapshot ATK buff and catch particles.',
        },
      };

      const zhongli: Character = {
        id: 'zhongli',
        name: 'Zhongli',
        element: 'Geo',
        weapon: 'Polearm',
        rarity: 5,
        roles: ['Sustain'],
        tags: ['Shield', 'RES-Shred'],
        rotationProfile: {
          primarySequence: parseActionShorthand('hE'),
          stage: 'sustain-setup',
          estimatedFieldTime: 2.0,
          notes: 'Hold Skill for unbreakable Jade Shield and 20% all-element RES shred.',
        },
      };

      const arlecchino: Character = {
        id: 'arlecchino',
        name: 'Arlecchino',
        element: 'Pyro',
        weapon: 'Polearm',
        rarity: 5,
        roles: ['On-Field DPS'],
        tags: ['Bond-Of-Life'],
        rotationProfile: {
          primarySequence: parseActionShorthand('CA > 5N3D'),
          stage: 'on-field-carry',
          estimatedFieldTime: 9.5,
          notes: 'Absorb Blood-Debt Due with Charged Attack, then execute normal attack string combos.',
        },
      };

      const result = synthesizeTeamRotation([xiangling, arlecchino, zhongli, bennett]);
      const bennettIndex = result.steps.findIndex(s => s.characterId === 'bennett');
      const xianglingIndex = result.steps.findIndex(s => s.characterId === 'xiangling');
      const arlecchinoIndex = result.steps.findIndex(s => s.characterId === 'arlecchino');

      // Bennett must immediately precede Xiangling so Xiangling snapshots ATK and catches particles
      expect(xianglingIndex).toBe(bennettIndex + 1);
      // Arlecchino carry should be last
      expect(arlecchinoIndex).toBe(result.steps.length - 1);
    });
  });
});
