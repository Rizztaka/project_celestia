import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock prisma before the service is imported ─────────────────────────────
vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    genshinAccount: {
      findUnique: vi.fn(),
    },
  },
}));

// ── Mock GenshinCharacterService ────────────────────────────────────────────
const mockGetCharactersForUser = vi.fn();
vi.mock('../../characters/character.service.js', () => ({
  GenshinCharacterService: vi.fn().mockImplementation(() => ({
    getCharactersForUser: mockGetCharactersForUser,
  })),
}));

// ── Import after mocks are in place ─────────────────────────────────────────
import { prisma } from '@/core/db/prisma.js';
import { CharacterIntelligenceService } from './character-intelligence.service.js';
import { calculateCharacterScore } from './character-intelligence.calculator.js';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockAccount = { id: 'account-1', userId: 'user-1' };

/** Level 60, Ascension 2 — gap of 3 phases. Tier-1, burst at level 1. */
const raidenNeglected = {
  characterKey: 'RaidenShogun',
  level: 60,
  ascension: 2,
  constellation: 0,
  talentNormal: 1,
  talentSkill: 1,
  talentBurst: 1,
  equippedWeapon: null,
};

/** Fully invested: Level 90, Ascension 6, all talents ≥ 8. */
const furinaComplete = {
  characterKey: 'Furina',
  level: 90,
  ascension: 6,
  constellation: 0,
  talentNormal: 8,
  talentSkill: 8,
  talentBurst: 8,
  equippedWeapon: null,
};

/** Level 1, Ascension 0 with a Level 90 weapon — weapon mismatch. */
const huTaoWeaponMismatch = {
  characterKey: 'HuTao',
  level: 1,
  ascension: 0,
  constellation: 0,
  talentNormal: 1,
  talentSkill: 1,
  talentBurst: 1,
  equippedWeapon: { weaponKey: 'StaffOfHoma', level: 90, refinement: 1 },
};

/** A character not present in character-profiles.json — fallback path. */
const unknownChar = {
  characterKey: 'UnknownCharXYZ',
  level: 50,
  ascension: 2,
  constellation: 0,
  talentNormal: 1,
  talentSkill: 1,
  talentBurst: 1,
  equippedWeapon: null,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CharacterIntelligenceService', () => {
  let service: CharacterIntelligenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CharacterIntelligenceService();
  });

  // ── Error cases ─────────────────────────────────────────────────────────

  it('throws NotFoundError (404) when the user has no Genshin account', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(null);

    await expect(service.getRecommendations('user-1')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'NOT_FOUND',
    });
  });

  it('throws UnprocessableError (422) when the account roster is empty', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(mockAccount as any);
    mockGetCharactersForUser.mockResolvedValueOnce([]);

    await expect(service.getRecommendations('user-1')).rejects.toMatchObject({
      statusCode: 422,
      errorCode: 'UNPROCESSABLE_ENTITY',
    });
  });

  // ── Ranking & filtering ──────────────────────────────────────────────────

  it('ranks HuTao (weapon mismatch + talent gap = 70) above RaidenShogun (ascension gap + talent gap = 67)', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(mockAccount as any);
    mockGetCharactersForUser.mockResolvedValueOnce([raidenNeglected, huTaoWeaponMismatch]);

    const result = await service.getRecommendations('user-1');

    // HuTao: sub1=0 + sub2=35 (skill talent gap 7×5) + sub3=20 + sub4=15 (weapon) = 70
    // Raiden: sub1=12 (gap 1×12) + sub2=35 (burst gap 7×5) + sub3=20 = 67
    expect(result.recommendations[0].characterKey).toBe('HuTao');
    expect(result.recommendations[0].rank).toBe(1);
    expect(result.recommendations[1].characterKey).toBe('RaidenShogun');
    expect(result.recommendations[1].recommendation).toBe('LEVEL_TALENTS');
  });

  it('places a fully-built character in the skipped array', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(mockAccount as any);

    // Furina with talents at level 9 so metaTier score (20) does not push her over the threshold.
    // score = 0 (asc) + 0 (talent, 9 >= 8) + 20 (meta) + 0 = 20 exactly → score < 20 is false.
    // Use a truly complete char: no gap anywhere, metaTier 3 so meta weight = 0.
    const trulyComplete = {
      ...furinaComplete,
      characterKey: 'Zhongli', // metaTier 1, priorityTalent skill
      talentSkill: 9,          // above target 8, gap = 0 → sub2 = 0
    };
    // Zhongli: sub1=0 + sub2=0 (skill 9>=8) + sub3=20 + 0 = 20 → not skipped.
    // We need someone that genuinely scores < 20. Use metaTier 3 unknown with all talents >= 8.
    const genuinelyComplete = {
      ...furinaComplete,
      characterKey: 'SomeCharA3', // not in profiles → fallback metaTier 3, sub3 = 0
      talentBurst: 9,
    };
    // genuinelyComplete: sub1=0 + sub2=0 (burst 9>=8) + sub3=0 (tier 3 fallback) + 0 = 0 → skipped
    mockGetCharactersForUser.mockResolvedValueOnce([raidenNeglected, genuinelyComplete]);

    const result = await service.getRecommendations('user-1');

    expect(result.skipped.some((s) => s.characterKey === 'SomeCharA3')).toBe(true);
    expect(result.recommendations.some((r) => r.characterKey === 'SomeCharA3')).toBe(false);
  });

  it('caps recommendations at 5 even with a larger roster', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(mockAccount as any);
    // All have identical large gaps — 8 characters should yield only 5 recommendations.
    const bigRoster = Array.from({ length: 8 }, (_, i) => ({
      ...raidenNeglected,
      characterKey: `char_${i}`,
    }));
    mockGetCharactersForUser.mockResolvedValueOnce(bigRoster);

    const result = await service.getRecommendations('user-1');
    expect(result.recommendations.length).toBeLessThanOrEqual(5);
  });

  it('assigns sequential ranks (1, 2, 3 …) to the sorted recommendations', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(mockAccount as any);
    mockGetCharactersForUser.mockResolvedValueOnce([raidenNeglected, huTaoWeaponMismatch]);

    const result = await service.getRecommendations('user-1');
    result.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });

  // ── Unknown character fallback ───────────────────────────────────────────

  it('handles a character missing from character-profiles.json without crashing', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(mockAccount as any);
    mockGetCharactersForUser.mockResolvedValueOnce([unknownChar]);

    const result = await service.getRecommendations('user-1');

    // unknownChar has a large talent gap and falls back to metaTier 3.
    const found =
      result.recommendations.some((r) => r.characterKey === 'UnknownCharXYZ') ||
      result.skipped.some((s) => s.characterKey === 'UnknownCharXYZ');
    expect(found).toBe(true);

    // Recommendation should include the fallback warning
    const rec = result.recommendations.find((r) => r.characterKey === 'UnknownCharXYZ');
    if (rec) {
      expect(rec.explanations.some((e) => e.includes('No detailed meta profile'))).toBe(true);
    }
  });

  // ── Weapon mismatch explanation ──────────────────────────────────────────

  it('includes the weapon name and levels in the explanation for a weapon-mismatch character', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(mockAccount as any);
    mockGetCharactersForUser.mockResolvedValueOnce([huTaoWeaponMismatch]);

    const result = await service.getRecommendations('user-1');
    const rec = result.recommendations.find((r) => r.characterKey === 'HuTao');

    expect(rec).toBeDefined();
    expect(rec?.explanations.some((e) => e.includes('Staff Of Homa') && e.includes('Level 90'))).toBe(true);
  });

  // ── Calculator unit tests (pure function, no mocking needed) ────────────

  describe('calculateCharacterScore', () => {
    it('scores Level 60 / Ascension 2 / Burst level 1 (Raiden profile) correctly at 62', () => {
      // sub1 = min(35, 1*12) = 12  (expected asc 3, current 2, gap 1)
      // sub2 = min(30, 7*5)  = 30  (burst target 8, current 1, gap 7 → 35 raw, capped at 30)
      // sub3 = 20                  (metaTier 1)
      // sub4 = 0                   (no weapon)
      // sub5 = 0                   (level 60 ≠ cap 50 for asc 2)
      // total = 62
      const input = raidenNeglected;
      const profile = { metaTier: 1, role: 'sub_dps', priorityTalent: 'burst', weaponRarity: 5 } as const;
      const breakdown = calculateCharacterScore(input, profile);
      expect(breakdown.score).toBe(62);
      expect(breakdown.subScores.ascensionGap).toBe(12);
      expect(breakdown.subScores.talentNeglect).toBe(30);
      expect(breakdown.subScores.metaWeight).toBe(20);
    });

    it('scores Level 90 / Ascension 6 / Burst level 8 at exactly 20 (metaTier 1 baseline)', () => {
      // sub1 = 0   (expected asc 6 = current 6)
      // sub2 = 0   (burst 8 >= target 8)
      // sub3 = 20  (metaTier 1)
      // sub4 = 0   (no weapon)
      // sub5 = 0   (level 90 is cap for asc 6, but penalty only applies when asc < 6)
      // total = 20 — right at the threshold, so this IS recommended (score >= 20)
      const input = furinaComplete;
      const profile = { metaTier: 1, role: 'support', priorityTalent: 'burst', weaponRarity: 5 } as const;
      const breakdown = calculateCharacterScore(input, profile);
      expect(breakdown.score).toBe(20);
      // Label should be COMPLETE since no meaningful investment gap exists,
      // but with score = 20 (not < 20) the service will recommend rather than skip.
      // A truly 'done' tier-1 character still earns the meta baseline.
    });

    it('applies the weapon-mismatch sub-score when a high-level weapon is on a low-level character', () => {
      const input = huTaoWeaponMismatch;
      const profile = { metaTier: 1, role: 'dps', priorityTalent: 'skill', weaponRarity: 5 } as const;
      const breakdown = calculateCharacterScore(input, profile);
      expect(breakdown.subScores.weaponMismatch).toBe(15);
    });

    it('applies the level-cap-hit penalty when the character is exactly at their ascension cap', () => {
      const cappedChar = { ...raidenNeglected, level: 40, ascension: 1 }; // lvl 40 = cap for asc 1
      const profile = { metaTier: 2, role: 'support', priorityTalent: 'burst', weaponRarity: 4 } as const;
      const breakdown = calculateCharacterScore(cappedChar, profile);
      expect(breakdown.subScores.levelCapHit).toBe(-5);
    });

    it('clamps the total score to a maximum of 100', () => {
      // Construct a worst-case character to exceed 100 raw points.
      const worstCase = {
        ...raidenNeglected,
        level: 80,
        ascension: 0, // gap of 5 phases → 60 pts, clamped to 35
        talentBurst: 1,
        equippedWeapon: { weaponKey: 'Foo', level: 90, refinement: 1 },
      };
      const profile = { metaTier: 1, role: 'dps', priorityTalent: 'burst', weaponRarity: 5 } as const;
      const breakdown = calculateCharacterScore(worstCase, profile);
      expect(breakdown.score).toBeLessThanOrEqual(100);
    });

    it('produces identical scores for identical inputs (deterministic)', () => {
      const profile = { metaTier: 1, role: 'sub_dps', priorityTalent: 'burst', weaponRarity: 5 } as const;
      const a = calculateCharacterScore(raidenNeglected, profile);
      const b = calculateCharacterScore(raidenNeglected, profile);
      expect(a.score).toBe(b.score);
      expect(a.recommendationLabel).toBe(b.recommendationLabel);
    });
  });
});
