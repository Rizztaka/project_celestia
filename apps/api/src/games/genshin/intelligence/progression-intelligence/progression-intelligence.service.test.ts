import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError } from '@/core/errors/app-error.js';
import { GenshinCharacterService } from '../../characters/character.service.js';
import { progressionIntelligenceService } from './progression-intelligence.service.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ELEMENT_MAP: Record<string, string> = require('../../static/character-elements.json');

vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    genshinAccount: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../characters/character.service.js', () => ({
  GenshinCharacterService: {
    getByUserId: vi.fn(),
  },
}));

describe('Progression Intelligence Service', () => {
  const MOCK_USER_ID = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.genshinAccount.findUnique as any).mockResolvedValue({ userId: MOCK_USER_ID });
  });

  it('should throw NotFoundError if account does not exist', async () => {
    (prisma.genshinAccount.findUnique as any).mockResolvedValue(null);

    await expect(progressionIntelligenceService.analyzeProgression(MOCK_USER_ID))
      .rejects
      .toThrow(NotFoundError);
  });

  it('should handle an empty roster safely (no divide by zero)', async () => {
    (GenshinCharacterService.getByUserId as any).mockResolvedValue([]);

    const result = await progressionIntelligenceService.analyzeProgression(MOCK_USER_ID);

    expect(result.rosterCompletion.owned).toBe(0);
    expect(result.rosterCompletion.percentage).toBe(0);
    expect(result.rosterCompletion.rank).toBe('Beginner');
    
    expect(result.ascensionMaturity.highlyAscended).toBe(0);
    expect(result.ascensionMaturity.percentage).toBe(0);
    
    expect(result.elementalSpread.length).toBe(0);
  });

  it('should calculate roster completion accurately based on static JSON size', async () => {
    const totalChars = Object.keys(ELEMENT_MAP).length;
    
    // Mock a roster that is exactly 50% of the total characters
    const mockRoster = Array.from({ length: Math.floor(totalChars / 2) }).map((_, i) => ({
      key: `Char${i}`,
      level: 1,
      ascension: 1,
      constellation: 0,
      element: 'Pyro'
    }));

    (GenshinCharacterService.getByUserId as any).mockResolvedValue(mockRoster);

    const result = await progressionIntelligenceService.analyzeProgression(MOCK_USER_ID);
    
    expect(result.rosterCompletion.owned).toBe(mockRoster.length);
    expect(result.rosterCompletion.total).toBe(totalChars);
    expect(result.rosterCompletion.percentage).toBeGreaterThanOrEqual(49);
    expect(result.rosterCompletion.percentage).toBeLessThanOrEqual(51);
    expect(result.rosterCompletion.rank).toBe('Established Traveler'); // 40-70% range
  });

  it('should correctly calculate ascension maturity (level 80+ / ascension 5+)', async () => {
    const mockRoster = [
      { key: 'Diluc', ascension: 6 },
      { key: 'Jean', ascension: 5 },
      { key: 'Amber', ascension: 4 },
      { key: 'Kaeya', ascension: 0 },
    ];
    (GenshinCharacterService.getByUserId as any).mockResolvedValue(mockRoster);

    const result = await progressionIntelligenceService.analyzeProgression(MOCK_USER_ID);
    
    expect(result.ascensionMaturity.highlyAscended).toBe(2);
    expect(result.ascensionMaturity.totalOwned).toBe(4);
    expect(result.ascensionMaturity.percentage).toBe(50);
    expect(result.ascensionMaturity.rank).toBe('Combat Veteran');
  });

  it('should correctly sort and calculate elemental spread', async () => {
    // 2 Pyro, 1 Anemo, 1 Unknown (if missing from static data)
    const mockRoster = [
      { key: 'Diluc' }, // Pyro
      { key: 'Amber' }, // Pyro
      { key: 'Jean' }, // Anemo
      { key: 'MissingNo' } // Unknown
    ];
    (GenshinCharacterService.getByUserId as any).mockResolvedValue(mockRoster);

    const result = await progressionIntelligenceService.analyzeProgression(MOCK_USER_ID);
    
    expect(result.elementalSpread).toHaveLength(3);
    
    // Should be sorted by count descending
    expect(result.elementalSpread[0].element).toBe('Pyro');
    expect(result.elementalSpread[0].count).toBe(2);
    expect(result.elementalSpread[0].percentage).toBe(50);
    
    // Anemo and Unknown have 1 each
    const otherElements = result.elementalSpread.slice(1).map(e => e.element);
    expect(otherElements).toContain('Anemo');
    expect(otherElements).toContain('Unknown');
  });
});
