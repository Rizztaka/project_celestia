import { describe, it, expect } from 'vitest';
import {
  scoreWeaponForCharacter,
  rankWeaponsForCharacter,
  assignOptimalTeamWeapons,
} from './weapon-solver';
import { CHARACTERS } from '../data/characters';
import { getWeaponByKey } from '../data/weapons';
import type { Character, OwnedWeapon } from '../types/genshin';

describe('Weapon Synergy Engine & Conflict Solver', () => {
  const huTao = CHARACTERS.find((c) => c.id === 'HuTao')!;
  const xiangling = CHARACTERS.find((c) => c.id === 'Xiangling')!;
  const raiden = CHARACTERS.find((c) => c.id === 'RaidenShogun')!;
  const furina = CHARACTERS.find((c) => c.id === 'Furina')!;
  const sucrose = CHARACTERS.find((c) => c.id === 'Sucrose')!;
  const nefer = CHARACTERS.find((c) => c.id === 'Nefer')!;

  describe('scoreWeaponForCharacter', () => {
    it('gives Staff of Homa the highest score for Hu Tao as BiS', () => {
      const homa = getWeaponByKey('StaffOfHoma')!;
      expect(homa).toBeDefined();

      const result = scoreWeaponForCharacter(huTao, homa);
      expect(result.score).toBeGreaterThanOrEqual(95);
      expect(result.relativePercentage).toBeGreaterThanOrEqual(95);
      expect(result.tier).toBe('BiS');
      expect(result.reason).toContain('Staff of Homa');
    });

    it('rejects weapons of the wrong weapon type with score 0 and Suboptimal tier', () => {
      const dullBlade = getWeaponByKey('FavoniusSword')!; // Sword vs Polearm
      const result = scoreWeaponForCharacter(huTao, dullBlade);
      expect(result.score).toBe(0);
      expect(result.relativePercentage).toBe(0);
      expect(result.tier).toBe('Suboptimal');
      expect(result.reason).toContain('Incompatible');
    });

    it('rewards higher refinement for weapons (R5 The Catch vs R1 The Catch)', () => {
      const catchR1: OwnedWeapon = {
        id: 'catch_r1',
        key: 'TheCatch',
        name: 'The Catch',
        level: 90,
        refinement: 1,
        location: '',
      };
      const catchR5: OwnedWeapon = {
        id: 'catch_r5',
        key: 'TheCatch',
        name: 'The Catch',
        level: 90,
        refinement: 5,
        location: '',
      };

      const scoreR1 = scoreWeaponForCharacter(xiangling, catchR1);
      const scoreR5 = scoreWeaponForCharacter(xiangling, catchR5);

      expect(scoreR5.score).toBeGreaterThan(scoreR1.score);
    });

    it('penalizes under-leveled weapons compared to Lv90', () => {
      const homa90: OwnedWeapon = {
        id: 'homa_90',
        key: 'StaffOfHoma',
        name: 'Staff of Homa',
        level: 90,
        refinement: 1,
      };
      const homa50: OwnedWeapon = {
        id: 'homa_50',
        key: 'StaffOfHoma',
        name: 'Staff of Homa',
        level: 50,
        refinement: 1,
      };

      const score90 = scoreWeaponForCharacter(huTao, homa90);
      const score50 = scoreWeaponForCharacter(huTao, homa50);

      expect(score90.score).toBeGreaterThan(score50.score);
    });

    it('applies team context bonus for Thrilling Tales on Catalyst support when paired with carry', () => {
      const ttds = getWeaponByKey('ThrillingTalesOfDragonSlayers')!;
      const soloScore = scoreWeaponForCharacter(sucrose, ttds, [sucrose]);
      const teamScore = scoreWeaponForCharacter(sucrose, ttds, [sucrose, huTao]);

      expect(teamScore.score).toBeGreaterThan(soloScore.score);
      expect(teamScore.reason).toMatch(/team|buff|carry/i);
    });

    it('scores high Elemental Mastery catalysts for Nefer Lunar-Bloom carry', () => {
      const dreams = getWeaponByKey('AThousandFloatingDreams')!;
      expect(dreams).toBeDefined();

      const result = scoreWeaponForCharacter(nefer, dreams);
      expect(result.score).toBeGreaterThan(60);
      expect(['Optimal', 'Great', 'BiS']).toContain(result.tier);
    });
  });

  describe('rankWeaponsForCharacter', () => {
    it('ranks owned weapons descending by effectiveness and tags equipped location', () => {
      const owned: OwnedWeapon[] = [
        {
          id: 'w1',
          key: 'FavoniusLance',
          name: 'Favonius Lance',
          level: 90,
          refinement: 3,
          location: 'Xiangling',
        },
        {
          id: 'w2',
          key: 'StaffOfHoma',
          name: 'Staff of Homa',
          level: 90,
          refinement: 1,
          location: 'Zhongli',
        },
        {
          id: 'w3',
          key: 'FavoniusSword',
          name: 'Favonius Sword',
          level: 90,
          refinement: 5,
          location: '',
        },
      ];

      const ranked = rankWeaponsForCharacter(huTao, owned);
      // FavoniusSword should be filtered out because Hu Tao uses Polearm
      expect(ranked.length).toBe(2);
      expect(ranked[0].weapon.name).toBe('Staff of Homa');
      expect(ranked[0].isEquipped).toBe(false);
      expect(ranked[0].equippedOn).toBe('Zhongli');

      // Xiangling has Favonius Lance equipped
      const xianglingRanked = rankWeaponsForCharacter(xiangling, owned);
      const favLanceResult = xianglingRanked.find((r) => r.weapon.name === 'Favonius Lance');
      expect(favLanceResult?.isEquipped).toBe(true);
      expect(favLanceResult?.equippedOn).toBe('Xiangling');
    });
  });

  describe('assignOptimalTeamWeapons', () => {
    it('solves weapon conflict when Xiangling and Raiden compete for 1 The Catch', () => {
      const team: Character[] = [huTao, xiangling, raiden, furina];
      const owned: OwnedWeapon[] = [
        {
          id: 'homa_inst',
          key: 'StaffOfHoma',
          name: 'Staff of Homa',
          level: 90,
          refinement: 1,
          location: 'HuTao',
        },
        {
          id: 'catch_inst',
          key: 'TheCatch',
          name: 'The Catch',
          level: 90,
          refinement: 5,
          location: 'Xiangling',
        },
        {
          id: 'fav_lance_inst',
          key: 'FavoniusLance',
          name: 'Favonius Lance',
          level: 90,
          refinement: 5,
          location: '',
        },
        {
          id: 'pipe_inst',
          key: 'FleuveCendreFerryman',
          name: 'Fleuve Cendre Ferryman',
          level: 90,
          refinement: 5,
          location: 'Furina',
        },
      ];

      const assignments = assignOptimalTeamWeapons(team, owned);

      expect(assignments.length).toBe(4);
      // Ensure no two characters receive the exact same weapon instance ID
      const assignedIds = assignments.map((a) => a.assignedWeapon.id);
      const uniqueIds = new Set(assignedIds);
      expect(uniqueIds.size).toBe(4);

      // Verify Hu Tao got Staff of Homa
      const huTaoAssign = assignments.find((a) => a.characterId === 'HuTao')!;
      expect(huTaoAssign.assignedWeapon.key).toBe('StaffOfHoma');
      expect(huTaoAssign.isBorrowed).toBe(false);

      // Verify one polearm user got The Catch and the other got Favonius Lance
      const xianglingAssign = assignments.find((a) => a.characterId === 'Xiangling')!;
      const raidenAssign = assignments.find((a) => a.characterId === 'RaidenShogun')!;

      const polearmKeys = [xianglingAssign.assignedWeapon.key, raidenAssign.assignedWeapon.key];
      expect(polearmKeys).toContain('TheCatch');
      expect(polearmKeys).toContain('FavoniusLance');
    });

    it('correctly flags borrowed weapons with source character', () => {
      const team: Character[] = [huTao, furina];
      const owned: OwnedWeapon[] = [
        {
          id: 'homa_borrowed',
          key: 'StaffOfHoma',
          name: 'Staff of Homa',
          level: 90,
          refinement: 1,
          location: 'Zhongli', // Equipped on Zhongli, who is NOT in this team
        },
        {
          id: 'furina_sword',
          key: 'SplendorOfTranquilWaters',
          name: 'Splendor of Tranquil Waters',
          level: 90,
          refinement: 1,
          location: 'Furina',
        },
      ];

      const assignments = assignOptimalTeamWeapons(team, owned);
      const huTaoAssign = assignments.find((a) => a.characterId === 'HuTao')!;
      expect(huTaoAssign.isBorrowed).toBe(true);
      expect(huTaoAssign.borrowedFrom).toBe('Zhongli');

      const furinaAssign = assignments.find((a) => a.characterId === 'Furina')!;
      expect(furinaAssign.isBorrowed).toBe(false);
    });

    it('allows assigning duplicate weapon models if they have different instance IDs', () => {
      const team: Character[] = [xiangling, raiden];
      const owned: OwnedWeapon[] = [
        {
          id: 'fav_lance_1',
          key: 'FavoniusLance',
          name: 'Favonius Lance',
          level: 90,
          refinement: 5,
          location: 'Xiangling',
        },
        {
          id: 'fav_lance_2',
          key: 'FavoniusLance',
          name: 'Favonius Lance',
          level: 80,
          refinement: 1,
          location: '',
        },
      ];

      const assignments = assignOptimalTeamWeapons(team, owned);
      expect(assignments.length).toBe(2);
      expect(assignments[0].assignedWeapon.id).not.toBe(assignments[1].assignedWeapon.id);
      expect(assignments[0].assignedWeapon.key).toBe('FavoniusLance');
      expect(assignments[1].assignedWeapon.key).toBe('FavoniusLance');
    });

    it('gracefully provides starter fallbacks when owned weapons list is empty', () => {
      const team: Character[] = [huTao, furina, sucrose, xiangling];
      const assignments = assignOptimalTeamWeapons(team, []);

      expect(assignments.length).toBe(4);
      for (const assign of assignments) {
        expect(assign.assignedWeapon).toBeDefined();
        expect(assign.assignedWeapon.name).toBeTruthy();
        expect(assign.scoreResult).toBeDefined();
      }
    });

    it('strictly prevents duplicate weapon assignments when team has more members of a type than owned weapons', () => {
      // 2 polearm users, but ONLY 1 polearm is owned
      const team: Character[] = [xiangling, raiden];
      const owned: OwnedWeapon[] = [
        {
          id: 'sole_catch_instance',
          key: 'TheCatch',
          name: 'The Catch',
          level: 90,
          refinement: 5,
          location: 'Xiangling',
        },
      ];

      const assignments = assignOptimalTeamWeapons(team, owned);
      expect(assignments.length).toBe(2);

      // Must NOT share the same ID or duplicate the single owned copy
      expect(assignments[0].assignedWeapon.id).not.toBe(assignments[1].assignedWeapon.id);

      const catchAssignee = assignments.find((a) => a.assignedWeapon.key === 'TheCatch');
      const otherAssignee = assignments.find((a) => a.assignedWeapon.key !== 'TheCatch');

      expect(catchAssignee).toBeDefined();
      expect(otherAssignee).toBeDefined();
      expect(otherAssignee!.assignedWeapon.id).toContain('fallback');
    });

    it('solves 4 characters of the same weapon type (4 Swords) with distinct weapons', () => {
      const kazuha = CHARACTERS.find((c) => c.id === 'KaedeharaKazuha')!;
      const bennett = CHARACTERS.find((c) => c.id === 'Bennett')!;
      const xingqiu = CHARACTERS.find((c) => c.id === 'Xingqiu')!;
      const team: Character[] = [furina, kazuha, bennett, xingqiu];

      // Provide only 2 owned swords
      const owned: OwnedWeapon[] = [
        {
          id: 'sw_1',
          key: 'FavoniusSword',
          name: 'Favonius Sword',
          level: 90,
          refinement: 5,
          location: 'Bennett',
        },
        {
          id: 'sw_2',
          key: 'SacrificialSword',
          name: 'Sacrificial Sword',
          level: 90,
          refinement: 5,
          location: 'Xingqiu',
        },
      ];

      const assignments = assignOptimalTeamWeapons(team, owned);
      expect(assignments.length).toBe(4);

      const assignedIds = new Set(assignments.map((a) => a.assignedWeapon.id));
      expect(assignedIds.size).toBe(4); // All 4 must have unique distinct weapon instances
    });

    it('evaluates DEF% scaling correctly for DEF-scaling characters like Albedo', () => {
      const albedo = CHARACTERS.find((c) => c.id === 'Albedo')!;
      expect(albedo).toBeDefined();

      const cinnabar = getWeaponByKey('CinnabarSpindle')!;
      expect(cinnabar).toBeDefined();

      const score = scoreWeaponForCharacter(albedo, cinnabar);
      expect(score.score).toBeGreaterThanOrEqual(90);
      expect(score.tier).toBe('BiS');
    });

    it('evaluates HP% scaling correctly for Kokomi and avoids crit stat bias', () => {
      const kokomi = CHARACTERS.find((c) => c.id === 'SangonomiyaKokomi')!;
      expect(kokomi).toBeDefined();

      const amber = getWeaponByKey('PrototypeAmber')!;
      const widsith = getWeaponByKey('TheWidsith')!; // Crit DMG catalyst
      expect(amber).toBeDefined();
      expect(widsith).toBeDefined();

      const amberScore = scoreWeaponForCharacter(kokomi, amber);
      const widsithScore = scoreWeaponForCharacter(kokomi, widsith);

      // Kokomi cannot crit, Prototype Amber with HP% is vastly superior
      expect(amberScore.score).toBeGreaterThan(widsithScore.score);
    });
  });
});
