import { describe, it, expect } from 'vitest';
import type { TheaterActPlan } from '../types/genshin';
import {
  filterEligibleTheaterRoster,
  autoDraftTheaterSchedule,
  swapTheaterActMember,
  removeTheaterActMember,
  calculateVigorState,
  evaluateBossActMatchup,
  recommendSupportCastBorrow,
  analyzeTheaterSeasonPlan,
} from './theater-solver';
import { dispatchAutoDraftTheater } from '../services/solver-dispatcher';
import { THEATER_SEASONS, validateTheaterSeasonConfig } from '../data/theater-seasons';
import { CHARACTERS } from '../data/characters';

describe('Imaginarium Theater Engine', () => {
  const season1 = THEATER_SEASONS.find((s) => s.id === 'season-natlan-pyro-hydro-anemo') || THEATER_SEASONS[0]; // Pyro, Hydro, Anemo

  describe('filterEligibleTheaterRoster', () => {
    it('filters characters belonging to season elements plus special guest cast', () => {
      // Pick a sample pool: Pyro (Mavuika, Bennett), Hydro (Furina, Xingqiu), Anemo (KaedeharaKazuha),
      // Guest (Nahida - Dendro, Zhongli - Geo), and Ineligible (RaidenShogun - Electro, Ayaka - Cryo)
      const ownedIds = [
        'Mavuika',
        'Bennett',
        'Furina',
        'Xingqiu',
        'KaedeharaKazuha',
        'Nahida', // Guest
        'Zhongli', // Guest
        'RaidenShogun', // Ineligible (Electro)
        'KamisatoAyaka', // Ineligible (Cryo)
      ];

      const result = filterEligibleTheaterRoster(ownedIds, season1);
      const eligibleIds = result.eligible.map((c) => c.id);

      expect(eligibleIds).toContain('Mavuika');
      expect(eligibleIds).toContain('Furina');
      expect(eligibleIds).toContain('KaedeharaKazuha');
      expect(eligibleIds).toContain('Nahida');
      expect(eligibleIds).toContain('Zhongli');
      expect(eligibleIds).not.toContain('RaidenShogun');
      expect(eligibleIds).not.toContain('KamisatoAyaka');

      expect(result.guestCast.map((c) => c.id)).toContain('Nahida');
      expect(result.guestCast.map((c) => c.id)).toContain('Zhongli');
    });

    it('Trial Cast Inclusion: grants 6 season Opening Cast members as available Level 80 trial units even if ownedIds is empty', () => {
      const result = filterEligibleTheaterRoster([], season1);
      expect(result.openingCast).toHaveLength(6);
      expect(result.eligible).toHaveLength(6);

      result.openingCast.forEach((c) => {
        expect(season1.openingCastIds).toContain(c.id);
        expect(c.isTrial).toBe(true);
        expect(c.level).toBe(80);
      });
    });

    it('Level 70 Gate: excludes owned alternate cast character at Level 60 from Visionary mode', () => {
      // Season 1 has Pyro, Hydro, Anemo
      const ownedIds = ['Bennett', 'Diluc'];
      const profiles = {
        Bennett: { id: 'Bennett', level: 90, constellation: 5 },
        Diluc: { id: 'Diluc', level: 60, constellation: 0 }, // Under Lv. 70
      };

      const result = filterEligibleTheaterRoster(ownedIds, season1, profiles, 'Visionary');
      const eligibleIds = result.eligible.map((c) => c.id);

      expect(eligibleIds).toContain('Bennett');
      // Diluc is Lv 60, so he must be gated out of Visionary mode
      expect(eligibleIds).not.toContain('Diluc');
    });

    it('Traveler Vigor Unification: drafting Traveler in an act deducts vigor from all Traveler elements', () => {
      const allEligible = ['TravelerAnemo', 'TravelerHydro', 'TravelerGeo', 'Bennett', 'Furina'];
      const acts: any = [
        {
          actNumber: 1,
          type: 'Normal',
          team: [
            { id: 'TravelerAnemo', name: 'Traveler (Anemo)', element: 'Anemo' },
            { id: 'Bennett', name: 'Bennett', element: 'Pyro' },
          ],
        },
      ];

      const vigor = calculateVigorState(acts, allEligible);
      // Both TravelerAnemo and TravelerHydro and TravelerGeo should have 1 vigor remaining
      expect(vigor['TravelerAnemo']).toBe(1);
      expect(vigor['TravelerHydro']).toBe(1);
      expect(vigor['TravelerGeo']).toBe(1);
      expect(vigor['Bennett']).toBe(1);
      expect(vigor['Furina']).toBe(2);
    });
  });

  describe('autoDraftTheaterSchedule', () => {
    // Collect all characters that match Season 1 elements or guests from CHARACTERS
    const allSeason1Chars = CHARACTERS.filter(
      (c) =>
        season1.elements.includes(c.element) ||
        season1.specialGuestIds.includes(c.id) ||
        season1.openingCastIds.includes(c.id),
    );

    it('generates 10 acts for Visionary mode with 4 characters per act', () => {
      const { acts, validationErrors } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Visionary',
        season1,
      );

      expect(validationErrors).toHaveLength(0);
      expect(acts).toHaveLength(10);

      acts.forEach((act) => {
        expect(act.team).toHaveLength(4);
        // Ensure no duplicate characters within the same act
        const ids = act.team.map((c) => c.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(4);
      });
    });

    it('strictly enforces 2-Vigor maximum across all acts', () => {
      const { acts, vigorState } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Visionary',
        season1,
      );

      const usageCounts: Record<string, number> = {};
      acts.forEach((act) => {
        act.team.forEach((c) => {
          usageCounts[c.id] = (usageCounts[c.id] || 0) + 1;
        });
      });

      const totalTravelerCount = Object.entries(usageCounts)
        .filter(([id]) => id.startsWith('Traveler'))
        .reduce((sum, [, count]) => sum + count, 0);

      // No character should be used more than 2 times
      Object.entries(usageCounts).forEach(([charId, count]) => {
        expect(count).toBeLessThanOrEqual(2);
        if (charId.startsWith('Traveler')) {
          expect(vigorState[charId]).toBe(2 - totalTravelerCount);
        } else {
          expect(vigorState[charId]).toBe(2 - count);
        }
        expect(vigorState[charId]).toBeGreaterThanOrEqual(0);
      });
    });

    it('marks Boss Acts appropriately with boss name and priority', () => {
      const { acts } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Visionary',
        season1,
      );

      const visionaryBossActs = [3, 6, 8, 10];
      acts.forEach((act) => {
        if (visionaryBossActs.includes(act.actNumber)) {
          expect(act.type).toBe('Boss');
          expect(act.bossName).toBeDefined();
          // Boss acts should include at least one 5-star character or strong carry
          const hasCarryOrFiveStar = act.team.some(
            (c) => c.rarity === 5 || c.roles.includes('On-Field DPS'),
          );
          expect(hasCarryOrFiveStar).toBe(true);
        } else {
          expect(act.type).not.toBe('Boss');
        }
      });
    });

    it('returns shortfall error if roster does not meet difficulty minimum', () => {
      // Visionary requires 22 characters. Provide only 12 characters.
      const deficientRoster = allSeason1Chars.slice(0, 12);
      const { validationErrors } = autoDraftTheaterSchedule(
        deficientRoster,
        'Visionary',
        season1,
      );

      expect(validationErrors.length).toBeGreaterThan(0);
      expect(validationErrors[0]).toMatch(/shortfall|minimum|required/i);
      expect(validationErrors[0]).toContain('22');
    });

    it('avoids identical 4-character team clones across acts when sufficient roster is available', () => {
      const { acts } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Visionary',
        season1,
      );

      // No two acts should have the identical 4 characters
      for (let i = 0; i < acts.length; i++) {
        for (let j = i + 1; j < acts.length; j++) {
          const teamA = new Set(acts[i].team.map((c) => c.id));
          const teamB = new Set(acts[j].team.map((c) => c.id));
          const isIdentical = teamA.size === 4 && teamB.size === 4 && Array.from(teamA).every((id) => teamB.has(id));
          expect(
            isIdentical,
            `Act ${acts[i].actNumber} and Act ${acts[j].actNumber} have identical 4-character teams!`,
          ).toBe(false);
        }
      }
    });

    it('tailors carries and buffers to boss-specific weaknesses and does not clone boss act teams', () => {
      const { acts } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Visionary',
        season1,
      );

      const act10 = acts.find((a) => a.actNumber === 10)!;
      const act8 = acts.find((a) => a.actNumber === 8)!;
      const act6 = acts.find((a) => a.actNumber === 6)!;
      const act3 = acts.find((a) => a.actNumber === 3)!;

      const act10Ids = new Set(act10.team.map((c) => c.id));
      const act8Ids = new Set(act8.team.map((c) => c.id));
      const isAct10And8Cloned = Array.from(act10Ids).every((id) => act8Ids.has(id));
      expect(isAct10And8Cloned, 'Act 10 and Act 8 have identical teams!').toBe(false);

      const act6Ids = new Set(act6.team.map((c) => c.id));
      const act3Ids = new Set(act3.team.map((c) => c.id));
      const isAct6And3Cloned = Array.from(act6Ids).every((id) => act3Ids.has(id));
      expect(isAct6And3Cloned, 'Act 6 and Act 3 have identical teams!').toBe(false);

      // Act 10 (Centaur Automaton) has Nightsoul/Phlogiston vulnerability
      const act10HasNightsoulOrOverload = act10.team.some(
        (c) => c.tags.includes('Nightsoul') || c.tags.includes('Overload') || c.element === 'Pyro',
      );
      expect(act10HasNightsoulOrOverload).toBe(true);
    });

    it('provides specific shortfallSuggestions when owned roster is below difficulty minimum', () => {
      const deficientRoster = allSeason1Chars.slice(0, 10);
      const res = autoDraftTheaterSchedule(
        deficientRoster,
        'Visionary',
        season1,
      );

      expect(res.validationErrors.length).toBeGreaterThan(0);
      expect(res.shortfallSuggestions).toBeDefined();
      expect(res.shortfallSuggestions!.length).toBeGreaterThan(0);
      // Ensure suggestions are NOT already in the owned/eligible roster
      const deficientIds = new Set(deficientRoster.map((c) => c.id));
      res.shortfallSuggestions!.forEach((suggested) => {
        expect(deficientIds.has(suggested.id)).toBe(false);
      });
    });

    it('respects user locked characters for specific acts', () => {
      // Lock Mavuika in Act 10
      const userLocks: Record<number, string[]> = {
        10: ['Mavuika'],
      };

      const { acts } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Visionary',
        season1,
        userLocks,
      );

      const act10 = acts.find((a) => a.actNumber === 10);
      expect(act10).toBeDefined();
      expect(act10?.team.some((c) => c.id === 'Mavuika')).toBe(true);
    });

    it('strictly caps user locks at maximum 4 characters per act', () => {
      // User attempts to lock 6 characters into Act 1
      const userLocks: Record<number, string[]> = {
        1: ['Mavuika', 'Bennett', 'Furina', 'Xingqiu', 'KaedeharaKazuha', 'Chasca'],
      };

      const { acts } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Normal',
        season1,
        userLocks,
      );

      const act1 = acts.find((a) => a.actNumber === 1)!;
      expect(act1.team).toHaveLength(4);
    });

    it('never mutates a user-locked act during anti-cloning pass', () => {
      // Explicitly lock Act 1 and Act 2 with the same 4 characters
      const userLocks: Record<number, string[]> = {
        1: ['Mavuika', 'Bennett', 'Furina', 'Xingqiu'],
        2: ['Mavuika', 'Bennett', 'Furina', 'Xingqiu'],
      };

      const { acts } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Normal',
        season1,
        userLocks,
      );

      const act1 = acts.find((a) => a.actNumber === 1)!;
      const act2 = acts.find((a) => a.actNumber === 2)!;

      // Since both are explicitly user-locked, their compositions must be preserved
      expect(act1.team.map((m) => m.id)).toEqual(['Mavuika', 'Bennett', 'Furina', 'Xingqiu']);
      expect(act2.team.map((m) => m.id)).toEqual(['Mavuika', 'Bennett', 'Furina', 'Xingqiu']);
    });

    it('prioritizes higher numbered regular acts in scheduling', () => {
      const rosterProfiles = {
        Bennett: { id: 'Bennett', level: 90, constellation: 5 },
      };
      const { acts } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Visionary',
        season1,
        undefined,
        rosterProfiles,
      );

      const act9 = acts.find((a) => a.actNumber === 9)!;
      const act1 = acts.find((a) => a.actNumber === 1)!;
      expect(act9.team).toHaveLength(4);
      expect(act1.team).toHaveLength(4);
    });
  });

  describe('swapTheaterActMember', () => {
    it('successfully swaps a member and updates vigor counts', () => {
      const allSeason1Chars = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id),
      );

      const { acts, vigorState } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Normal',
        season1,
      );

      const act1 = acts[0];
      const oldChar = act1.team[0];

      // Find an eligible character not in Act 1 with > 0 vigor
      const act1CharIds = act1.team.map((c) => c.id);
      const replacementChar = allSeason1Chars.find(
        (c) => !act1CharIds.includes(c.id) && (vigorState[c.id] ?? 2) > 0,
      );

      expect(replacementChar).toBeDefined();

      const initialOldVigor = vigorState[oldChar.id] ?? 0;
      const initialNewVigor = vigorState[replacementChar!.id] ?? 2;

      const result = swapTheaterActMember(
        acts,
        1,
        oldChar.id,
        replacementChar!.id,
        vigorState,
      );

      expect(result.error).toBeUndefined();
      const updatedAct1 = result.acts.find((a) => a.actNumber === 1)!;
      expect(updatedAct1.team.some((c) => c.id === replacementChar!.id)).toBe(true);
      expect(updatedAct1.team.some((c) => c.id === oldChar.id)).toBe(false);

      expect(result.vigorState[oldChar.id]).toBe(initialOldVigor + 1);
      expect(result.vigorState[replacementChar!.id]).toBe(initialNewVigor - 1);
    });

    it('rejects swap if replacement character has 0 vigor remaining', () => {
      const allSeason1Chars = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id),
      );

      const { acts, vigorState } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Normal',
        season1,
      );

      const act1 = acts[0];
      const oldChar = act1.team[0];

      // Artificially set a character's vigor to 0
      const exhaustedChar = allSeason1Chars.find(
        (c) => !act1.team.some((m) => m.id === c.id),
      )!;
      const exhaustedVigorState = { ...vigorState, [exhaustedChar.id]: 0 };

      const result = swapTheaterActMember(
        acts,
        1,
        oldChar.id,
        exhaustedChar.id,
        exhaustedVigorState,
      );

      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/vigor/i);
    });

    it('rejects swap if replacement character is already in the act', () => {
      const allSeason1Chars = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id),
      );

      const { acts, vigorState } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Normal',
        season1,
      );

      const act1 = acts[0];
      const char0 = act1.team[0];
      const char1 = act1.team[1];

      const result = swapTheaterActMember(
        acts,
        1,
        char0.id,
        char1.id,
        vigorState,
      );

      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/already/i);
    });

    it('returns an error if the act number does not exist', () => {
      const allSeason1Chars = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id),
      );

      const { acts, vigorState } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Normal',
        season1,
      );

      const result = swapTheaterActMember(
        acts,
        99,
        allSeason1Chars[0].id,
        allSeason1Chars[1].id,
        vigorState,
      );

      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/not found/i);
    });

    it('returns an error if the old character is not in the specified act', () => {
      const allSeason1Chars = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id),
      );

      const { acts, vigorState } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Normal',
        season1,
      );

      const act1CharIds = new Set(acts[0].team.map((m) => m.id));
      const notInAct1 = allSeason1Chars.find((c) => !act1CharIds.has(c.id))!;
      const anotherChar = allSeason1Chars.find(
        (c) => !act1CharIds.has(c.id) && c.id !== notInAct1.id,
      )!;

      const result = swapTheaterActMember(
        acts,
        1,
        notInAct1.id,
        anotherChar.id,
        vigorState,
      );

      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/not in Act 1/i);
    });

    it('allows adding a character to an incomplete act using swapTheaterActMember with empty oldCharId', () => {
      const allSeason1Chars = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id),
      );

      const { acts, vigorState } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Normal',
        season1,
      );

      // Create an act with only 3 members
      const incompleteActs = acts.map((a) =>
        a.actNumber === 1 ? { ...a, team: a.team.slice(0, 3) } : a,
      );
      const act1MemberIds = new Set(incompleteActs[0].team.map((m) => m.id));
      const availableChar = allSeason1Chars.find(
        (c) => !act1MemberIds.has(c.id) && (vigorState[c.id] ?? 2) > 0,
      )!;

      const initialVigor = vigorState[availableChar.id] ?? 2;
      const result = swapTheaterActMember(
        incompleteActs,
        1,
        '',
        availableChar.id,
        vigorState,
      );

      expect(result.error).toBeUndefined();
      const updatedAct1 = result.acts.find((a) => a.actNumber === 1)!;
      expect(updatedAct1.team).toHaveLength(4);
      expect(updatedAct1.team.some((m) => m.id === availableChar.id)).toBe(true);
      expect(result.vigorState[availableChar.id]).toBe(initialVigor - 1);
    });

    it('defaults remaining vigor to 2 if character is omitted from vigorState during swap', () => {
      const allSeason1Chars = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id),
      );

      const { acts } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Normal',
        season1,
      );

      const act1 = acts[0];
      const oldChar = act1.team[0];
      const newChar = allSeason1Chars.find(
        (c) => !act1.team.some((m) => m.id === c.id),
      )!;

      // Pass an empty vigorState where newChar is omitted
      const result = swapTheaterActMember(
        acts,
        1,
        oldChar.id,
        newChar.id,
        {},
      );

      expect(result.error).toBeUndefined();
      // Should default to 2 - 1 = 1
      expect(result.vigorState[newChar.id]).toBe(1);
    });
  });

  describe('removeTheaterActMember', () => {
    it('removes a character from an act and restores vigor count', () => {
      const allSeason1Chars = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id),
      );

      const { acts, vigorState } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Normal',
        season1,
      );

      const act1 = acts[0];
      const charToRemove = act1.team[0];
      const initialVigor = vigorState[charToRemove.id] ?? 0;

      const result = removeTheaterActMember(acts, 1, charToRemove.id, vigorState);

      expect(result.error).toBeUndefined();
      const updatedAct1 = result.acts.find((a) => a.actNumber === 1)!;
      expect(updatedAct1.team.some((m) => m.id === charToRemove.id)).toBe(false);
      expect(result.vigorState[charToRemove.id]).toBe(initialVigor + 1);
    });
  });

  describe('Hard difficulty drafting', () => {
    it('generates 8 acts with boss acts at 3, 6, 8', () => {
      const allSeason1Chars = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id),
      );

      const { acts, validationErrors } = autoDraftTheaterSchedule(
        allSeason1Chars,
        'Hard',
        season1,
      );

      expect(validationErrors).toHaveLength(0);
      expect(acts).toHaveLength(8);

      const bossActs = acts.filter((a) => a.type === 'Boss').map((a) => a.actNumber);
      expect(bossActs).toEqual([3, 6, 8]);
    });
  });

  describe('calculateVigorState', () => {
    it('computes correct remaining vigor for all eligible characters', () => {
      const char1 = CHARACTERS[0];
      const char2 = CHARACTERS[1];
      const char3 = CHARACTERS[2];

      const acts = [
        {
          actNumber: 1,
          type: 'Normal' as const,
          recommendedArchetypes: [],
          team: [char1, char2],
        },
        {
          actNumber: 2,
          type: 'Normal' as const,
          recommendedArchetypes: [],
          team: [char1, char3],
        },
      ];

      const vigor = calculateVigorState(acts, [char1.id, char2.id, char3.id, 'Other']);

      expect(vigor[char1.id]).toBe(0); // used in 2 acts -> 2 - 2 = 0
      expect(vigor[char2.id]).toBe(1); // used in 1 act -> 2 - 1 = 1
      expect(vigor[char3.id]).toBe(1); // used in 1 act -> 2 - 1 = 1
      expect(vigor['Other']).toBe(2);  // used in 0 acts -> 2 - 0 = 2
    });

    it('correctly tracks vigor for characters in acts who were omitted from allEligibleIds', () => {
      const char1 = CHARACTERS[0];
      const char2 = CHARACTERS[1];

      const acts = [
        {
          actNumber: 1,
          type: 'Normal' as const,
          recommendedArchetypes: [],
          team: [char1, char2],
        },
        {
          actNumber: 2,
          type: 'Normal' as const,
          recommendedArchetypes: [],
          team: [char1],
        },
      ];

      // Omit char1 and char2 from eligible IDs list
      const vigor = calculateVigorState(acts, []);

      // char1 used twice -> starts at 2, becomes 0
      expect(vigor[char1.id]).toBe(0);
      // char2 used once -> starts at 2, becomes 1
      expect(vigor[char2.id]).toBe(1);
    });

    it('does not bleed out-of-pool user-locked characters into unlocked act candidate drafts', () => {
      const season1 = THEATER_SEASONS[0];
      // Pick 20 eligible characters
      const eligible = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id),
      ).slice(0, 20);

      // Find a character that is strictly NOT eligible in season 1 (e.g. an unlisted element/guest)
      const outOfPoolChar = CHARACTERS.find(
        (c) =>
          !season1.elements.includes(c.element) &&
          !season1.specialGuestIds.includes(c.id),
      )!;

      // Lock outOfPoolChar into Act 1
      const userLocks: Record<number, string[]> = {
        1: [outOfPoolChar.id],
      };

      const result = autoDraftTheaterSchedule(eligible, 'Hard', season1, userLocks);

      // Act 1 must contain the locked out-of-pool character
      expect(result.acts[0].team.some((m) => m.id === outOfPoolChar.id)).toBe(true);

      // All OTHER unlocked acts (Acts 2 through 8) MUST NOT contain outOfPoolChar
      for (let i = 1; i < result.acts.length; i++) {
        const containsOutOfPool = result.acts[i].team.some((m) => m.id === outOfPoolChar.id);
        expect(containsOutOfPool).toBe(false);
      }
    });
  });

  describe('Endgame Guidance 2.0 Boss Ratings & Support Borrow Advisor', () => {
    const mavuika = CHARACTERS.find((c) => c.id === 'Mavuika')!;
    const furina = CHARACTERS.find((c) => c.id === 'Furina')!;
    const bennett = CHARACTERS.find((c) => c.id === 'Bennett')!;
    const xilonen = CHARACTERS.find((c) => c.id === 'Xilonen')!;
    const fischl = CHARACTERS.find((c) => c.id === 'Fischl')!;
    const baizhu = CHARACTERS.find((c) => c.id === 'Baizhu')!;

    it('rates Centaur Automaton matchup as S rating when Natlan Nightsoul and top synergy present', () => {
      const team = [mavuika, furina, bennett, xilonen];
      const res = evaluateBossActMatchup(team, 'Centaur Automaton');

      expect(res.rating).toBe('S');
      expect(res.score).toBeGreaterThanOrEqual(85);
      expect(res.counterHighlights.some((h) => h.includes('Nightsoul'))).toBe(true);
    });

    it('rates Jadeplume Terrorshroom higher when Electro stunner is present', () => {
      const electroTeam = [mavuika, fischl, bennett, furina];
      const noElectroTeam = [mavuika, furina, bennett, baizhu];

      const electroRes = evaluateBossActMatchup(electroTeam, 'Jadeplume Terrorshroom');
      const noElectroRes = evaluateBossActMatchup(noElectroTeam, 'Jadeplume Terrorshroom');

      expect(electroRes.score).toBeGreaterThan(noElectroRes.score);
      expect(electroRes.counterHighlights.some((h) => h.includes('Electro'))).toBe(true);
    });

    it('returns C rating for empty team', () => {
      const res = evaluateBossActMatchup([], 'Maguu Kenki');
      expect(res.rating).toBe('C');
      expect(res.score).toBe(0);
    });

    it('recommends top 3 support cast characters not currently owned by the user', () => {
      // User only owns 4 characters
      const smallOwnedIds = ['Bennett', 'Xiangling', 'Xingqiu', 'Sucrose'];
      const eligible = CHARACTERS.filter((c) => smallOwnedIds.includes(c.id));

      const borrows = recommendSupportCastBorrow(eligible, season1, smallOwnedIds);

      expect(borrows).toHaveLength(3);
      // Strict feasibility: borrowed characters MUST NOT be owned
      borrows.forEach((borrow) => {
        expect(smallOwnedIds).not.toContain(borrow.id);
        // And MUST match season elements, guests, or opening cast
        const isSeasonElem = season1.elements.includes(borrow.element);
        const isGuest = season1.specialGuestIds.includes(borrow.id);
        const isOpening = season1.openingCastIds.includes(borrow.id);
        expect(isSeasonElem || isGuest || isOpening).toBe(true);
      });
    });

    it('automatically attaches bossMatchup to autoDrafted boss acts', () => {
      const allSeason1Chars = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id),
      );

      const result = autoDraftTheaterSchedule(allSeason1Chars, 'Visionary', season1);
      // Acts 3, 6, 8, 10 are boss acts in Visionary
      const bossActs = result.acts.filter((a) => a.type === 'Boss');
      expect(bossActs.length).toBe(4);
      bossActs.forEach((act) => {
        expect(act.bossMatchup).toBeDefined();
        expect(['S', 'A', 'B', 'C']).toContain(act.bossMatchup?.rating);
      });
    });

    it('penalizes Hydro carry against 100% immune Hydro Tulpa and assigns C rating', () => {
      const neuvillette = CHARACTERS.find((c) => c.id === 'Neuvillette')!;
      const sigewinne = CHARACTERS.find((c) => c.id === 'Sigewinne')!;
      const kazuha = CHARACTERS.find((c) => c.id === 'KaedeharaKazuha')!;
      const furina = CHARACTERS.find((c) => c.id === 'Furina')!;

      const res = evaluateBossActMatchup([neuvillette, furina, sigewinne, kazuha], 'Hydro Tulpa');
      expect(res.rating).toBe('C');
      expect(res.score).toBeLessThanOrEqual(45);
      expect(res.counterHighlights.some((h) => h.includes('0 DMG to Immune Tulpa'))).toBe(true);
    });

    it('penalizes team lacking Electro stunner against ASIMON stealth camouflage', () => {
      const teamNoElectro = [
        CHARACTERS.find((c) => c.id === 'Mavuika')!,
        CHARACTERS.find((c) => c.id === 'Furina')!,
        CHARACTERS.find((c) => c.id === 'Bennett')!,
        CHARACTERS.find((c) => c.id === 'KaedeharaKazuha')!,
      ];
      const teamWithElectro = [
        CHARACTERS.find((c) => c.id === 'Mavuika')!,
        CHARACTERS.find((c) => c.id === 'Fischl')!,
        CHARACTERS.find((c) => c.id === 'Bennett')!,
        CHARACTERS.find((c) => c.id === 'KaedeharaKazuha')!,
      ];

      const resNoElectro = evaluateBossActMatchup(teamNoElectro, 'Algorithm of Semi-Intransient Matrix');
      const resWithElectro = evaluateBossActMatchup(teamWithElectro, 'Algorithm of Semi-Intransient Matrix');

      expect(resWithElectro.score).toBeGreaterThan(resNoElectro.score);
      expect(resWithElectro.counterHighlights.some((h) => h.includes('Stealth Breaker'))).toBe(true);
    });

    it('Worker Offloading: dispatchAutoDraftTheater resolves with a valid 10-act schedule', async () => {
      const allSeason1Chars = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id) ||
          season1.openingCastIds.includes(c.id),
      );
      const res = await dispatchAutoDraftTheater(allSeason1Chars, 'Visionary', season1);
      expect(res.acts).toHaveLength(10);
      expect(res.validationErrors).toHaveLength(0);
      expect(Object.keys(res.vigorState).length).toBeGreaterThan(0);
    });

    it('Roster Shortfall: drafts 6 trial characters exclusively into early playable acts 1-3', () => {
      // 0 owned matching characters -> exactly 6 opening cast trial units
      const filtered = filterEligibleTheaterRoster([], season1, undefined, 'Visionary');
      expect(filtered.eligible).toHaveLength(6);

      const res = autoDraftTheaterSchedule(filtered.eligible, 'Visionary', season1);
      expect(res.validationErrors.length).toBeGreaterThan(0);
      expect(res.validationErrors[0]).toContain('Roster Shortfall');

      // Acts 1, 2, and 3 (the playable acts) should have 4 members each
      const act1 = res.acts.find((a) => a.actNumber === 1);
      const act2 = res.acts.find((a) => a.actNumber === 2);
      const act3 = res.acts.find((a) => a.actNumber === 3);

      expect(act1?.team).toHaveLength(4);
      expect(act2?.team).toHaveLength(4);
      expect(act3?.team).toHaveLength(4);

      // Act 1 must be drafted strictly from the Opening Cast (the authentic starting hand)
      act1?.team.forEach((member) => {
        expect(season1.openingCastIds).toContain(member.id);
      });

      // Acts 4 to 10 must be empty because vigor was spent on clearing playable acts 1-3
      for (let actNum = 4; actNum <= 10; actNum++) {
        const act = res.acts.find((a) => a.actNumber === actNum);
        expect(act?.team).toHaveLength(0);
      }
    });

    it('Full Roster: Act 1 is strictly drafted from Opening Cast members', () => {
      const allSeason1Chars = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id) ||
          season1.openingCastIds.includes(c.id),
      );
      const res = autoDraftTheaterSchedule(allSeason1Chars, 'Visionary', season1);
      const act1 = res.acts.find((a) => a.actNumber === 1);
      expect(act1?.team).toHaveLength(4);
      act1?.team.forEach((member) => {
        expect(season1.openingCastIds).toContain(member.id);
      });
    });

    it('swapTheaterActMember: allows swapping Traveler element without triggering duplicate lockout', () => {
      const acts: TheaterActPlan[] = [
        {
          actNumber: 1,
          type: 'Normal',
          recommendedArchetypes: [],
          team: [
            CHARACTERS.find((c) => c.id === 'TravelerGeo')!,
            CHARACTERS.find((c) => c.id === 'Bennett')!,
            CHARACTERS.find((c) => c.id === 'Xiangling')!,
            CHARACTERS.find((c) => c.id === 'Xingqiu')!,
          ],
          isLocked: false,
        },
      ];
      const vigorState = {
        TravelerGeo: 1,
        TravelerHydro: 1,
        Bennett: 1,
        Xiangling: 1,
        Xingqiu: 1,
      };

      // Replace TravelerGeo with TravelerHydro in Act 1
      const res = swapTheaterActMember(acts, 1, 'TravelerGeo', 'TravelerHydro', vigorState);
      expect(res.error).toBeUndefined();
      const updatedAct1 = res.acts[0];
      expect(updatedAct1.team.map((m) => m.id)).toContain('TravelerHydro');
      expect(updatedAct1.team.map((m) => m.id)).not.toContain('TravelerGeo');
    });

    it('filterEligibleTheaterRoster: picks highest-invested Traveler element matching season', () => {
      const owned = ['TravelerGeo', 'TravelerHydro'];
      const profiles = {
        TravelerGeo: { id: 'TravelerGeo', level: 20, constellation: 0 },
        TravelerHydro: { id: 'TravelerHydro', level: 90, constellation: 6 },
      };
      const res = filterEligibleTheaterRoster(owned, season1, profiles, 'Normal');
      const travelers = res.eligible.filter((c) => c.id.startsWith('Traveler'));
      expect(travelers).toHaveLength(1);
      expect(travelers[0].id).toBe('TravelerHydro');
      expect(travelers[0].level).toBe(90);
    });
  });

  describe('M6 — Endgame Intelligence Regression Suite', () => {
    it('validateTheaterSeasonConfig passes cleanly for all built-in seasons', () => {
      const validIds = new Set(CHARACTERS.map((c) => c.id));
      for (const season of THEATER_SEASONS) {
        expect(
          validateTheaterSeasonConfig(season, validIds),
          `Season ${season.id} failed validation`,
        ).toEqual([]);
      }
    });

    it('validateTheaterSeasonConfig catches duplicate elements, overlapping guests, and unknown bosses', () => {
      const broken = {
        ...THEATER_SEASONS[0],
        elements: ['Hydro', 'Hydro', 'Geo'] as ('Hydro' | 'Geo')[],
        specialGuestIds: [THEATER_SEASONS[0].openingCastIds[0]],
        bosses: { 3: 'Maguu Kenki', 6: 'Unknown Boss', 8: 'Iniquitous Baptist', 10: 'Hydro Tulpa' },
      };
      const errors = validateTheaterSeasonConfig(broken, new Set(CHARACTERS.map((c) => c.id)));
      expect(errors.some((e) => e.includes('3 distinct elements'))).toBe(true);
      expect(errors.some((e) => e.includes('both openingCastIds and specialGuestIds'))).toBe(true);
      expect(errors.some((e) => e.includes('no THEATER_BOSS_INFO entry'))).toBe(true);
    });

    it('surfaces excludedUnderleveled characters when owned alternate cast is below Level 70 in Visionary mode', () => {
      const ownedIds = ['Bennett', 'Diluc'];
      const profiles = {
        Bennett: { id: 'Bennett', level: 90, constellation: 5 },
        Diluc: { id: 'Diluc', level: 50, constellation: 0 },
      };
      const res = filterEligibleTheaterRoster(ownedIds, season1, profiles, 'Visionary');
      expect(res.excludedUnderleveled?.map((c) => c.id)).toContain('Diluc');
      expect(res.eligible.map((c) => c.id)).not.toContain('Diluc');
    });

    it('recommendSupportCastBorrow excludes free Opening Cast trial units and avoids Hydro carries for apex Hydro Tulpa', () => {
      const activeSeason = THEATER_SEASONS[0]; // Hydro / Electro / Geo with Act 10 Hydro Tulpa
      const owned = ['Bennett', 'Xiangling'];
      const filtered = filterEligibleTheaterRoster(owned, activeSeason);
      const borrows = recommendSupportCastBorrow(filtered.eligible, activeSeason, owned);

      expect(borrows).toHaveLength(3);
      for (const b of borrows) {
        expect(activeSeason.openingCastIds).not.toContain(b.id);
        expect(owned).not.toContain(b.id);
      }
      // Top borrow against Hydro Tulpa should not be a Hydro-immune carry
      expect(borrows[0].element).not.toBe('Hydro');
    });

    it('attaches seasonAnalysis with preservation plan, apex boss readiness, weaknesses, archetypes, and phased draft plan', () => {
      const allSeason1Chars = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id) ||
          season1.openingCastIds.includes(c.id),
      );
      const res = autoDraftTheaterSchedule(allSeason1Chars, 'Visionary', season1);

      expect(res.seasonAnalysis).toBeDefined();
      const analysis = res.seasonAnalysis!;
      expect(analysis.apexBossAct).toBe(10);
      expect(analysis.apexBossName).toBe(season1.bosses[10]);
      expect(['Ready', 'Needs Preparation', 'At Risk']).toContain(analysis.apexBossReadiness);
      expect(analysis.recommendedArchetypes.length).toBeGreaterThan(0);
      expect(analysis.preservationPlan.length).toBeGreaterThan(0);
      expect(analysis.preservationPlan.some((p) => p.reservedForActs.includes(10))).toBe(true);
      expect(analysis.draftPlan.map((d) => d.phase)).toEqual([
        'Opening',
        'Early Acts (1–3)',
        'Mid Acts (4–6)',
        'Late Acts (7–8)',
        'Climax (9–10)',
      ]);
    });

    it('flags roster weaknesses when eligible pool lacks sustain or non-immune apex carries', () => {
      const tulpaSeason = THEATER_SEASONS[0]; // Act 10 Hydro Tulpa
      const hydroOnlyPool = CHARACTERS.filter((c) => c.element === 'Hydro').slice(0, 8);
      const draft = autoDraftTheaterSchedule(hydroOnlyPool, 'Visionary', tulpaSeason);
      const analysis = analyzeTheaterSeasonPlan(draft.acts, hydroOnlyPool, 'Visionary', tulpaSeason);

      expect(analysis.rosterWeaknesses.some((w) => w.includes('Hydro Tulpa'))).toBe(true);
      expect(analysis.apexBossReadiness).toBe('At Risk');
    });

    it('recalculates bossMatchup immediately on swapTheaterActMember and removeTheaterActMember', () => {
      const allSeason1Chars = CHARACTERS.filter(
        (c) =>
          season1.elements.includes(c.element) ||
          season1.specialGuestIds.includes(c.id) ||
          season1.openingCastIds.includes(c.id),
      );
      const { acts, vigorState } = autoDraftTheaterSchedule(allSeason1Chars, 'Normal', season1);
      const act3 = acts.find((a) => a.actNumber === 3)!;
      expect(act3.bossName).toBeDefined();

      const removed = removeTheaterActMember(acts, 3, act3.team[0].id, vigorState);
      const updatedAct3 = removed.acts.find((a) => a.actNumber === 3)!;
      expect(updatedAct3.bossMatchup).toBeDefined();

      const readded = swapTheaterActMember(
        removed.acts,
        3,
        '',
        act3.team[0].id,
        removed.vigorState,
      );
      expect(readded.error).toBeUndefined();
      expect(readded.acts.find((a) => a.actNumber === 3)!.bossMatchup).toBeDefined();
    });
  });
});
