import type { GenshinAccount } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError } from '@/core/errors/app-error.js';

import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { GenshinCharacterService } from '../../characters/character.service.js';
import { collectibleCharacterCount } from '../../companion/character-reference.js';
import { progressionIntelligenceService } from './progression-intelligence.service.js';

vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    genshinAccount: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../characters/character.service.js', () => {
  const GenshinCharacterService = vi.fn();
  GenshinCharacterService.prototype.getCharactersForUser = vi.fn();
  return { GenshinCharacterService };
});

const mockAccount = {
  id: 'account-1',
  userId: 'test-user-123',
  uid: null,
  nickname: null,
  adventureRank: null,
  worldLevel: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
} satisfies GenshinAccount;

function character(
  input: Pick<CharacterWithWeapon, 'characterKey'> & Partial<CharacterWithWeapon>,
): CharacterWithWeapon {
  return {
    id: input.characterKey,
    accountId: mockAccount.id,
    level: 1,
    ascension: 0,
    constellation: 0,
    talentNormal: 1,
    talentSkill: 1,
    talentBurst: 1,
    equippedWeaponId: null,
    equippedWeapon: null,
    createdAt: mockAccount.createdAt,
    updatedAt: mockAccount.updatedAt,
    ...input,
  };
}

describe('Progression Intelligence Service', () => {
  const MOCK_USER_ID = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue(mockAccount);
  });

  it('should throw NotFoundError if account does not exist', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue(null);

    await expect(progressionIntelligenceService.analyzeProgression(MOCK_USER_ID)).rejects.toThrow(
      NotFoundError,
    );
  });

  it('should handle an empty roster safely (no divide by zero)', async () => {
    vi.mocked(GenshinCharacterService.prototype.getCharactersForUser).mockResolvedValue([]);

    const result = await progressionIntelligenceService.analyzeProgression(MOCK_USER_ID);

    expect(result.rosterCompletion.owned).toBe(0);
    expect(result.rosterCompletion.percentage).toBe(0);
    expect(result.rosterCompletion.rank).toBe('Beginner');

    expect(result.ascensionMaturity.highlyAscended).toBe(0);
    expect(result.ascensionMaturity.percentage).toBe(0);

    expect(result.elementalSpread.length).toBe(0);
  });

  it('counts distinct source identities without aliases, comments or Traveler forms', async () => {
    const totalChars = collectibleCharacterCount;
    expect(totalChars).toBe(122);

    // Mock a roster that is exactly 50% of the total characters
    const mockRoster = Array.from({ length: Math.floor(totalChars / 2) }).map((_, i) => ({
      characterKey: `Char${i}`,
      level: 1,
      ascension: 1,
      constellation: 0,
      element: 'Pyro',
    }));

    vi.mocked(GenshinCharacterService.prototype.getCharactersForUser).mockResolvedValue(
      mockRoster.map(character),
    );

    const result = await progressionIntelligenceService.analyzeProgression(MOCK_USER_ID);

    expect(result.rosterCompletion.owned).toBe(mockRoster.length);
    expect(result.rosterCompletion.total).toBe(totalChars);
    expect(result.rosterCompletion.percentage).toBeGreaterThanOrEqual(49);
    expect(result.rosterCompletion.percentage).toBeLessThanOrEqual(51);
    expect(result.rosterCompletion.rank).toBe('Established Traveler'); // 40-70% range
  });

  it('should correctly calculate ascension maturity (level 80+ / ascension 5+)', async () => {
    const mockRoster = [
      { characterKey: 'Diluc', ascension: 6 },
      { characterKey: 'Jean', ascension: 5 },
      { characterKey: 'Amber', ascension: 4 },
      { characterKey: 'Kaeya', ascension: 0 },
    ];
    vi.mocked(GenshinCharacterService.prototype.getCharactersForUser).mockResolvedValue(
      mockRoster.map(character),
    );

    const result = await progressionIntelligenceService.analyzeProgression(MOCK_USER_ID);

    expect(result.ascensionMaturity.highlyAscended).toBe(2);
    expect(result.ascensionMaturity.totalOwned).toBe(4);
    expect(result.ascensionMaturity.percentage).toBe(50);
    expect(result.ascensionMaturity.rank).toBe('Combat Veteran');
  });

  it('should correctly sort and calculate elemental spread', async () => {
    // 2 Pyro, 1 Anemo, 1 Unknown (if missing from static data)
    const mockRoster = [
      { characterKey: 'Diluc' }, // Pyro
      { characterKey: 'Amber' }, // Pyro
      { characterKey: 'Jean' }, // Anemo
      { characterKey: 'MissingNo' }, // Unknown
    ];
    vi.mocked(GenshinCharacterService.prototype.getCharactersForUser).mockResolvedValue(
      mockRoster.map(character),
    );

    const result = await progressionIntelligenceService.analyzeProgression(MOCK_USER_ID);

    expect(result.elementalSpread).toHaveLength(3);

    // Should be sorted by count descending
    expect(result.elementalSpread[0].element).toBe('Pyro');
    expect(result.elementalSpread[0].count).toBe(2);
    expect(result.elementalSpread[0].percentage).toBe(50);

    // Anemo and Unknown have 1 each
    const otherElements = result.elementalSpread.slice(1).map((e) => e.element);
    expect(otherElements).toContain('Anemo');
    expect(otherElements).toContain('Unknown');
  });
});
