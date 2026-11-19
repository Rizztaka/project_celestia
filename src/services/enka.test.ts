import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ENKA_ID_MAP, parseEnkaPayload, fetchShowcaseFromEnka } from './enka';
import { CANONICAL_CHARACTER_IDS } from '../data/character-ids';

describe('Enka Showcase Integration Service', () => {
  describe('ENKA_ID_MAP SSOT Verification', () => {
    it('maps Aether (10000005) and Lumine (10000007) to Traveler', () => {
      expect(ENKA_ID_MAP[10000005]).toBe('Traveler');
      expect(ENKA_ID_MAP[10000007]).toBe('Traveler');
    });

    it('maps modern Version 7.2 characters correctly', () => {
      expect(ENKA_ID_MAP[10000136]).toBe('Mitya');
      expect(ENKA_ID_MAP[10000137]).toBe('Valeriy');
      expect(ENKA_ID_MAP[10000130]).toBe('Linnea');
      expect(ENKA_ID_MAP[10000126]).toBe('Zibai');
      expect(ENKA_ID_MAP[10000125]).toBe('Columbina');
      expect(ENKA_ID_MAP[10000106]).toBe('Mavuika');
      expect(ENKA_ID_MAP[10000103]).toBe('Xilonen');
    });

    it('verifies all mapped values are members of CANONICAL_CHARACTER_IDS', () => {
      for (const [enkaId, charId] of Object.entries(ENKA_ID_MAP)) {
        expect(
          CANONICAL_CHARACTER_IDS.has(charId),
          `Enka ID ${enkaId} maps to "${charId}" which is not in CANONICAL_CHARACTER_IDS`,
        ).toBe(true);
      }
    });
  });

  describe('parseEnkaPayload', () => {
    it('parses valid showcase data with known characters and player nickname', () => {
      const mockPayload = {
        playerInfo: {
          nickname: 'AetherMain',
          showAvatarInfoList: [
            { avatarId: 10000089 }, // Furina
            { avatarId: 10000136 }, // Mitya
            { avatarId: 10000005 }, // Traveler (Aether)
          ],
        },
      };

      const result = parseEnkaPayload(mockPayload);
      expect(result.success).toBe(true);
      expect(result.nickname).toBe('AetherMain');
      expect(result.avatarIds).toEqual(['Furina', 'Mitya', 'Traveler']);
      expect(result.unrecognizedIds).toEqual([]);
    });

    it('identifies and separates unrecognized avatar IDs', () => {
      const mockPayload = {
        playerInfo: {
          nickname: 'BetaTester',
          showAvatarInfoList: [
            { avatarId: 10000089 }, // Furina
            { avatarId: 99999999 }, // Unrecognized avatar ID
            { avatarId: 88888888 }, // Unrecognized avatar ID
          ],
        },
      };

      const result = parseEnkaPayload(mockPayload);
      expect(result.success).toBe(true);
      expect(result.avatarIds).toEqual(['Furina']);
      expect(result.unrecognizedIds).toEqual([99999999, 88888888]);
    });

    it('handles empty showcase gracefully', () => {
      const mockPayload = {
        playerInfo: {
          nickname: 'EmptyShowcasePlayer',
          showAvatarInfoList: [],
        },
      };

      const result = parseEnkaPayload(mockPayload);
      expect(result.success).toBe(true);
      expect(result.avatarIds).toEqual([]);
      expect(result.unrecognizedIds).toEqual([]);
    });

    it('handles null or missing playerInfo gracefully', () => {
      const result = parseEnkaPayload({});
      expect(result.success).toBe(true);
      expect(result.nickname).toBe('Traveler');
      expect(result.avatarIds).toEqual([]);
      expect(result.unrecognizedIds).toEqual([]);
    });

    it('deduplicates avatar IDs and unrecognized IDs cleanly', () => {
      const mockPayload = {
        playerInfo: {
          nickname: 'DupeTester',
          showAvatarInfoList: [
            { avatarId: 10000089 }, // Furina
            { avatarId: 10000089 }, // Duplicate Furina
            { avatarId: 10000005 }, // Aether (Traveler)
            { avatarId: 10000007 }, // Lumine (Traveler)
            { avatarId: 99999999 }, // Unknown
            { avatarId: 99999999 }, // Duplicate unknown
          ],
        },
      };

      const result = parseEnkaPayload(mockPayload);
      expect(result.success).toBe(true);
      expect(result.avatarIds).toEqual(['Furina', 'Traveler']);
      expect(result.unrecognizedIds).toEqual([99999999]);
    });

    it('falls back to avatarInfoList when showAvatarInfoList is empty or missing', () => {
      const detailedPayload = {
        playerInfo: {
          nickname: 'DetailedPlayer',
          showAvatarInfoList: [],
        },
        avatarInfoList: [
          { avatarId: 10000104 }, // Chasca
          { avatarId: 10000106 }, // Mavuika
        ],
      };

      const result = parseEnkaPayload(detailedPayload);
      expect(result.success).toBe(true);
      expect(result.avatarIds).toEqual(['Chasca', 'Mavuika']);
    });

    it('handles null, undefined, and non-object inputs safely without throwing', () => {
      expect(parseEnkaPayload(null).avatarIds).toEqual([]);
      expect(parseEnkaPayload(undefined).avatarIds).toEqual([]);
      expect(parseEnkaPayload('invalid json string').avatarIds).toEqual([]);
    });
  });

  describe('fetchShowcaseFromEnka UID validation & HTTP handling', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('rejects invalid UIDs before sending network requests', async () => {
      const shortRes = await fetchShowcaseFromEnka('12345');
      expect(shortRes.success).toBe(false);
      expect(shortRes.error).toContain('Genshin UIDs are 9 or 10 digits');

      const alphaRes = await fetchShowcaseFromEnka('80012345A');
      expect(alphaRes.success).toBe(false);
      expect(alphaRes.error).toContain('Genshin UIDs are 9 or 10 digits');

      const emptyRes = await fetchShowcaseFromEnka('');
      expect(emptyRes.success).toBe(false);
    });

    it('successfully fetches and parses showcase on HTTP 200', async () => {
      const mockResponse = {
        playerInfo: {
          nickname: 'CelestiaPlayer',
          showAvatarInfoList: [{ avatarId: 10000089 }, { avatarId: 10000106 }],
        },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchShowcaseFromEnka('700000001');
      expect(result.success).toBe(true);
      expect(result.nickname).toBe('CelestiaPlayer');
      expect(result.avatarIds).toEqual(['Furina', 'Mavuika']);
    });

    it('handles 404 player not found error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await fetchShowcaseFromEnka('999999999');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Player UID not found on Enka');
    });

    it('handles 429 rate limit response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 429,
      } as Response);

      const result = await fetchShowcaseFromEnka('700000001');
      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit');
    });

    it('handles network abort/timeout cleanly', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('The operation was aborted'));

      const result = await fetchShowcaseFromEnka('700000001');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timed out');
    });
  });
});
