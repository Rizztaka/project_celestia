import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '../data/characters';
import {
  isAllowedTeammate,
  isSameCharacterOrTraveler,
  detectBennettC6Conflict,
  detectDualCarryContention,
  evaluateEnergyBattery,
} from './team-rules';
import type { Character, OwnedCharacterProfile, TeamWeaponAssignment } from '../types/genshin';

function getChar(id: string): Character {
  const found = CHARACTERS.find((c) => c.id === id);
  if (!found) throw new Error(`Character ${id} not found in SSOT`);
  return found;
}

describe('Team Rules Engine (Archetype Exclusivity & Anti-Synergies)', () => {
  const chevreuse = getChar('Chevreuse');
  const nilou = getChar('Nilou');
  const kazuha = getChar('KaedeharaKazuha');
  const zhongli = getChar('Zhongli');
  const bennett = getChar('Bennett');
  const xiangling = getChar('Xiangling');
  const fischl = getChar('Fischl');
  const nahida = getChar('Nahida');
  const kokomi = getChar('SangonomiyaKokomi');
  const furina = getChar('Furina');
  const eula = getChar('Eula');
  const razor = getChar('Razor');
  const ayaka = getChar('KamisatoAyaka');
  const keqing = getChar('Keqing');
  const huTao = getChar('HuTao');
  const neuvillette = getChar('Neuvillette');
  const raiden = getChar('RaidenShogun');
  const travelerDendro = getChar('TravelerDendro');
  const travelerHydro = getChar('TravelerHydro');

  describe('Strict Archetype Exclusivity', () => {
    it('Chevreuse: strictly allows only Pyro and Electro teammates', () => {
      const currentTeam: Character[] = [chevreuse, bennett];

      // Allowed: Pyro and Electro
      expect(isAllowedTeammate('Overload', xiangling, currentTeam)).toBe(true);
      expect(isAllowedTeammate('Overload', fischl, currentTeam)).toBe(true);

      // Strictly Disallowed: Anemo, Geo, Hydro, Dendro, Cryo
      expect(isAllowedTeammate('Overload', kazuha, currentTeam)).toBe(false);
      expect(isAllowedTeammate('Overload', zhongli, currentTeam)).toBe(false);
      expect(isAllowedTeammate('Overload', furina, currentTeam)).toBe(false);
      expect(isAllowedTeammate('Overload', nahida, currentTeam)).toBe(false);
      expect(isAllowedTeammate('Overload', ayaka, currentTeam)).toBe(false);
    });

    it('Chevreuse: candidate Chevreuse is rejected if team already has non-Pyro/Electro members', () => {
      const teamWithAnemo = [bennett, kazuha];
      expect(isAllowedTeammate('Overload', chevreuse, teamWithAnemo)).toBe(false);

      const teamWithGeo = [bennett, zhongli];
      expect(isAllowedTeammate('Overload', chevreuse, teamWithGeo)).toBe(false);

      const validOverloadTeam = [bennett, fischl];
      expect(isAllowedTeammate('Overload', chevreuse, validOverloadTeam)).toBe(true);
    });

    it('Nilou: strictly allows only Hydro and Dendro teammates', () => {
      const currentTeam: Character[] = [nilou, nahida];

      // Allowed: Hydro and Dendro
      expect(isAllowedTeammate('Bountiful-Bloom', kokomi, currentTeam)).toBe(true);
      expect(isAllowedTeammate('Bountiful-Bloom', travelerDendro, currentTeam)).toBe(true);

      // Strictly Disallowed: Electro, Pyro, Anemo, Cryo, Geo
      expect(isAllowedTeammate('Bountiful-Bloom', fischl, currentTeam)).toBe(false);
      expect(isAllowedTeammate('Bountiful-Bloom', xiangling, currentTeam)).toBe(false);
      expect(isAllowedTeammate('Bountiful-Bloom', kazuha, currentTeam)).toBe(false);
      expect(isAllowedTeammate('Bountiful-Bloom', zhongli, currentTeam)).toBe(false);
      expect(isAllowedTeammate('Bountiful-Bloom', ayaka, currentTeam)).toBe(false);
    });

    it('Nilou: candidate Nilou is rejected if team already contains non-Hydro/Dendro members', () => {
      const teamWithElectro = [nahida, fischl];
      expect(isAllowedTeammate('Bountiful-Bloom', nilou, teamWithElectro)).toBe(false);

      const teamWithPyro = [nahida, bennett];
      expect(isAllowedTeammate('Bountiful-Bloom', nilou, teamWithPyro)).toBe(false);

      const validBloomTeam = [nahida, kokomi];
      expect(isAllowedTeammate('Bountiful-Bloom', nilou, validBloomTeam)).toBe(true);
    });

    it('archetype exclusivity: rejects off-element candidates for Bountiful-Bloom even when Nilou is not yet in the team', () => {
      // Current team has Nahida (Dendro), Nilou is not yet in the team
      expect(isAllowedTeammate('Bountiful-Bloom', kazuha, [nahida])).toBe(false);
      expect(isAllowedTeammate('Bountiful-Bloom', zhongli, [nahida])).toBe(false);
      expect(isAllowedTeammate('Bountiful-Bloom', bennett, [nahida])).toBe(false);
    });

    it('archetype exclusivity: rejects off-element candidates for Overload even when Chevreuse is not yet in the team', () => {
      expect(isAllowedTeammate('Overload', furina, [xiangling])).toBe(false);
      expect(isAllowedTeammate('Overload', nahida, [xiangling])).toBe(false);
      expect(isAllowedTeammate('Overload', zhongli, [xiangling])).toBe(false);
    });
  });

  describe('Traveler Single-Identity Protection & Duplicate Prevention', () => {
    it('disallows adding the same character twice', () => {
      expect(isSameCharacterOrTraveler(bennett, bennett)).toBe(true);
      expect(isAllowedTeammate('Vaporize', bennett, [bennett])).toBe(false);
    });

    it('disallows combining different elemental configurations of the Traveler', () => {
      expect(isSameCharacterOrTraveler(travelerDendro, travelerHydro)).toBe(true);
      expect(isAllowedTeammate('Hyperbloom', travelerHydro, [travelerDendro])).toBe(false);
    });

    it('enforces Traveler identity protection across element-named configurations and aliases', () => {
      const aether = { ...travelerDendro, id: 'Aether', name: 'Traveler' };
      const lumine = { ...travelerHydro, id: 'Lumine', name: 'Traveler' };
      expect(isSameCharacterOrTraveler(aether, travelerHydro)).toBe(true);
      expect(isSameCharacterOrTraveler(lumine, travelerDendro)).toBe(true);
      expect(isSameCharacterOrTraveler(aether, lumine)).toBe(true);
    });
  });

  describe('Bennett C6 Anti-Synergy Infusion Override', () => {
    const c6Profiles: Record<string, OwnedCharacterProfile> = {
      Bennett: { id: 'Bennett', level: 90, constellation: 6 },
    };
    const c5Profiles: Record<string, OwnedCharacterProfile> = {
      Bennett: { id: 'Bennett', level: 90, constellation: 5 },
    };

    it('detects override conflict for Physical carries (Eula, Razor)', () => {
      const teamEula = [bennett, eula, fischl, zhongli];
      const resEula = detectBennettC6Conflict(teamEula, c6Profiles);
      expect(resEula.hasConflict).toBe(true);
      expect(resEula.penalty).toBe(15);
      expect(resEula.warning).toContain('Bennett C6 Pyro Infusion overrides Physical/Normal attack damage.');

      const teamRazor = [bennett, razor, fischl, zhongli];
      const resRazor = detectBennettC6Conflict(teamRazor, c6Profiles);
      expect(resRazor.hasConflict).toBe(true);
      expect(resRazor.penalty).toBe(15);
    });

    it('detects override conflict for overridable elemental infusion carries (Ayaka, Keqing)', () => {
      const teamAyaka = [bennett, ayaka, furina, kazuha];
      const resAyaka = detectBennettC6Conflict(teamAyaka, c6Profiles);
      expect(resAyaka.hasConflict).toBe(true);
      expect(resAyaka.penalty).toBe(15);

      const teamKeqing = [bennett, keqing, fischl, kazuha];
      const resKeqing = detectBennettC6Conflict(teamKeqing, c6Profiles);
      expect(resKeqing.hasConflict).toBe(true);
      expect(resKeqing.penalty).toBe(15);
    });

    it('does NOT trigger conflict when Bennett is C5 or lower', () => {
      const teamEula = [bennett, eula, fischl, zhongli];
      const res = detectBennettC6Conflict(teamEula, c5Profiles);
      expect(res.hasConflict).toBe(false);
      expect(res.penalty).toBe(0);
    });

    it('does NOT trigger conflict for Pyro carries or non-overridable/ranged carries', () => {
      const teamXiangling = [bennett, xiangling, furina, kazuha];
      const resXiangling = detectBennettC6Conflict(teamXiangling, c6Profiles);
      expect(resXiangling.hasConflict).toBe(false);

      const teamRaiden = [bennett, raiden, xiangling, kazuha];
      const resRaiden = detectBennettC6Conflict(teamRaiden, c6Profiles);
      expect(resRaiden.hasConflict).toBe(false);
    });
  });

  describe('Dual On-Field Carry Contention', () => {
    it('detects contention between multiple greedy on-field carries', () => {
      const teamWithDualCarry = [huTao, neuvillette, zhongli, kazuha];
      const res = detectDualCarryContention(teamWithDualCarry);
      expect(res.hasContention).toBe(true);
      expect(res.penalty).toBe(12);
      expect(res.warning).toContain('compete for rotation field time');
    });

    it('does not penalize single-carry compositions with off-field sub-DPS', () => {
      const teamClassicVape = [huTao, furina, bennett, zhongli];
      const res = detectDualCarryContention(teamClassicVape);
      expect(res.hasContention).toBe(false);
      expect(res.penalty).toBe(0);
    });

    it('does not penalize Raiden National (Raiden provides off-field utility & party battery)', () => {
      const teamRational = [raiden, xiangling, bennett, getChar('Xingqiu')];
      const res = detectDualCarryContention(teamRational);
      expect(res.hasContention).toBe(false);
      expect(res.penalty).toBe(0);
    });
  });

  describe('Energy Battery Evaluation', () => {
    it('warns when high-cost burst character lacks battery or Favonius', () => {
      // Xiangling (80 cost) alone without another Pyro or Favonius
      const team = [xiangling, furina, kazuha, zhongli];
      const res = evaluateEnergyBattery(team);
      expect(res.status).toBe('adequate');
      expect(res.warnings.length).toBeGreaterThan(0);
      expect(res.warnings[0]).toContain('Xiangling requires high Energy (80 Cost)');
    });

    it('reports optimal status when same-element battery is present', () => {
      // Xiangling with Bennett (Pyro battery)
      const team = [xiangling, bennett, furina, kazuha];
      const res = evaluateEnergyBattery(team);
      expect(res.status).toBe('optimal');
      expect(res.warnings).toHaveLength(0);
    });

    it('reports optimal status when Favonius weapon is held by a teammate', () => {
      const team = [xiangling, furina, kazuha, zhongli];
      const weaponAssignments: TeamWeaponAssignment[] = [
        {
          characterId: 'Zhongli',
          characterName: 'Zhongli',
          assignedWeapon: {
            id: 'w1',
            key: 'FavoniusLance',
            name: 'Favonius Lance',
            level: 90,
            refinement: 5,
          },
          scoreResult: {
            weapon: {} as any,
            score: 80,
            relativePercentage: 80,
            tier: 'Great',
            reason: '',
            isOwned: true,
            isEquipped: true,
          },
          isBorrowed: false,
        },
      ];
      const res = evaluateEnergyBattery(team, weaponAssignments);
      expect(res.status).toBe('optimal');
      expect(res.warnings).toHaveLength(0);
    });

    it('reports optimal status when universal battery (Raiden Shogun) is present', () => {
      const team = [xiangling, raiden, furina, kazuha];
      const res = evaluateEnergyBattery(team);
      expect(res.status).toBe('optimal');
      expect(res.warnings).toHaveLength(0);
    });

    it('reports optimal status when Kaedehara Kazuha batteries high-cost Anemo carry (Xiao)', () => {
      const xiao = getChar('Xiao');
      const team = [xiao, kazuha, furina, zhongli];
      const res = evaluateEnergyBattery(team);
      expect(res.status).toBe('optimal');
      expect(res.warnings).toHaveLength(0);
    });
  });
});
