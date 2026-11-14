import { describe, it, expect } from 'vitest';
import {
  filterEligibleTheaterRoster,
  autoDraftTheaterSchedule,
  swapTheaterActMember,
  removeTheaterActMember,
  calculateVigorState,
} from './theater-solver';
import { THEATER_SEASONS } from '../data/theater-seasons';
import { CHARACTERS } from '../data/characters';

describe('Imaginarium Theater Engine', () => {
  const season1 = THEATER_SEASONS[0]; // Pyro, Hydro, Anemo

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

      // No character should be used more than 2 times
      Object.entries(usageCounts).forEach(([charId, count]) => {
        expect(count).toBeLessThanOrEqual(2);
        expect(vigorState[charId]).toBe(2 - count);
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
});
