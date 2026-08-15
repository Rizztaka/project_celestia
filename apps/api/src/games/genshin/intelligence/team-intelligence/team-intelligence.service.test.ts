import { beforeEach,describe, expect, it, vi } from 'vitest';

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

import {
  calculateTeamScore,
  type CharacterInput,
  scoreAllTemplates,
  type TeamTemplate,
} from './team-intelligence.calculator.js';
import { TeamIntelligenceService } from './team-intelligence.service.js';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockAccount = { id: 'account-1', userId: 'user-1' };

// ── Character fixtures ──────────────────────────────────────────────────────

/** Fully invested HuTao — Pyro DPS */
const huTao: CharacterInput = {
  characterKey: 'HuTao',
  level: 90,
  ascension: 6,
  constellation: 1,
  talentNormal: 8,
  talentSkill: 10,
  talentBurst: 8,
  equippedWeapon: { weaponKey: 'StaffOfHoma', level: 90, refinement: 1 },
};

/** Well-built Xingqiu — Hydro Enabler */
const xingqiu: CharacterInput = {
  characterKey: 'Xingqiu',
  level: 80,
  ascension: 6,
  constellation: 6,
  talentNormal: 6,
  talentSkill: 8,
  talentBurst: 10,
  equippedWeapon: null,
};

/** Moderately built Bennett — ATK Buffer */
const bennett: CharacterInput = {
  characterKey: 'Bennett',
  level: 70,
  ascension: 5,
  constellation: 1,
  talentNormal: 6,
  talentSkill: 6,
  talentBurst: 8,
  equippedWeapon: null,
};

/** Underlevelled Kazuha — Anemo shred */
const kazuha: CharacterInput = {
  characterKey: 'KaedeharaKazuha',
  level: 40,
  ascension: 2,
  constellation: 0,
  talentNormal: 1,
  talentSkill: 1,
  talentBurst: 1,
  equippedWeapon: null,
};

/** Diluc — alternative Pyro DPS (lower investment than HuTao) */
const diluc: CharacterInput = {
  characterKey: 'Diluc',
  level: 70,
  ascension: 4,
  constellation: 0,
  talentNormal: 6,
  talentSkill: 6,
  talentBurst: 6,
  equippedWeapon: null,
};

/** Fischl — Electro, relevant to Taser teams */
const fischl: CharacterInput = {
  characterKey: 'Fischl',
  level: 70,
  ascension: 5,
  constellation: 6,
  talentNormal: 6,
  talentSkill: 6,
  talentBurst: 6,
  equippedWeapon: null,
};

/** Full National roster + extras */
const fullNationalRoster = [huTao, xingqiu, bennett, kazuha, diluc, fischl];

// A minimal roster with only 3 characters — not enough to build a team.
const tinyRoster = [huTao, xingqiu, bennett];

// ── Template helper (extracts National template from real JSON) ─────────────
import teamTemplatesJson from '../../static/team-templates.json' with { type: 'json' };
const { templates: ALL_TEMPLATES } = teamTemplatesJson as { templates: TeamTemplate[] };
const nationalTemplate = ALL_TEMPLATES.find((t) => t.id === 'national')!;
const freezeTemplate = ALL_TEMPLATES.find((t) => t.id === 'freeze')!;

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TeamIntelligenceService', () => {
  let service: TeamIntelligenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TeamIntelligenceService();
  });

  // ── Error cases ─────────────────────────────────────────────────────────

  it('throws NotFoundError (404) when the user has no Genshin account', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(null);

    await expect(service.getRecommendations('user-1')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'NOT_FOUND',
    });
  });

  it('throws UnprocessableError (422) when the roster has fewer than 4 characters', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(mockAccount as any);
    mockGetCharactersForUser.mockResolvedValueOnce(tinyRoster);

    await expect(service.getRecommendations('user-1')).rejects.toMatchObject({
      statusCode: 422,
      errorCode: 'UNPROCESSABLE_ENTITY',
    });
  });

  it('throws UnprocessableError (422) when no buildable team exists in the roster', async () => {
    // A roster of 4 characters where none match any required role candidates.
    const weirdRoster: CharacterInput[] = [
      { characterKey: 'Amber', level: 20, ascension: 1, constellation: 0, talentNormal: 1, talentSkill: 1, talentBurst: 1, equippedWeapon: null },
      { characterKey: 'Lisa', level: 20, ascension: 1, constellation: 0, talentNormal: 1, talentSkill: 1, talentBurst: 1, equippedWeapon: null },
      { characterKey: 'Noelle', level: 20, ascension: 1, constellation: 0, talentNormal: 1, talentSkill: 1, talentBurst: 1, equippedWeapon: null },
      { characterKey: 'Kaeya', level: 20, ascension: 1, constellation: 0, talentNormal: 1, talentSkill: 1, talentBurst: 1, equippedWeapon: null },
    ];
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(mockAccount as any);
    mockGetCharactersForUser.mockResolvedValueOnce(weirdRoster);

    await expect(service.getRecommendations('user-1')).rejects.toMatchObject({
      statusCode: 422,
      errorCode: 'UNPROCESSABLE_ENTITY',
    });
  });

  it('returns top 3 buildable teams for a good roster', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(mockAccount as any);
    mockGetCharactersForUser.mockResolvedValueOnce(fullNationalRoster);

    const result = await service.getRecommendations('user-1');

    expect(result.recommendations).toHaveLength(3);
    expect(result.recommendations[0].rank).toBe(1);
    expect(result.recommendations[1].rank).toBe(2);
    expect(result.recommendations[2].rank).toBe(3);

    // All returned teams must be buildable.
    for (const rec of result.recommendations) {
      expect(rec.isBuildable).toBe(true);
    }
  });

  it('ranks recommendations in descending score order', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(mockAccount as any);
    mockGetCharactersForUser.mockResolvedValueOnce(fullNationalRoster);

    const result = await service.getRecommendations('user-1');
    const scores = result.recommendations.map((r) => r.score);

    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }
  });

  it('each recommendation includes at least one explanation', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(mockAccount as any);
    mockGetCharactersForUser.mockResolvedValueOnce(fullNationalRoster);

    const result = await service.getRecommendations('user-1');

    for (const rec of result.recommendations) {
      expect(rec.explanations.length).toBeGreaterThan(0);
    }
  });

  it('attaches a valid ISO analysedAt timestamp', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValueOnce(mockAccount as any);
    mockGetCharactersForUser.mockResolvedValueOnce(fullNationalRoster);

    const result = await service.getRecommendations('user-1');

    expect(() => new Date(result.analysedAt)).not.toThrow();
    expect(new Date(result.analysedAt).toISOString()).toBe(result.analysedAt);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Calculator unit tests — pure function, no mocking needed
// ────────────────────────────────────────────────────────────────────────────

describe('calculateTeamScore', () => {
  it('buildability: returns isBuildable=true when all required roles are filled', () => {
    const roster = [huTao, xingqiu, bennett, kazuha];
    const breakdown = calculateTeamScore(nationalTemplate, roster);
    expect(breakdown.isBuildable).toBe(true);
  });

  it('buildability: returns isBuildable=false when a required role is missing', () => {
    // No Hydro enabler in this roster
    const rosterNoHydro = [huTao, bennett, kazuha, diluc];
    const breakdown = calculateTeamScore(nationalTemplate, rosterNoHydro);
    expect(breakdown.isBuildable).toBe(false);
  });

  it('deduplication: the same character cannot fill two roles', () => {
    // Roster with only HuTao and Xingqiu — HuTao should not appear twice
    const sparseRoster = [huTao, xingqiu];
    const breakdown = calculateTeamScore(nationalTemplate, sparseRoster);

    const filledKeys = breakdown.roles
      .filter((r) => r.filledBy !== null)
      .map((r) => r.filledBy);
    const uniqueKeys = new Set(filledKeys);

    expect(filledKeys.length).toBe(uniqueKeys.size);
  });

  it('role assignment: prefers higher-investment candidate when two qualify for the same role', () => {
    // Both HuTao (fully built) and Diluc (moderately built) are Pyro DPS candidates.
    // HuTao should win the pyro_dps slot.
    const roster = [diluc, huTao, xingqiu, bennett];
    const breakdown = calculateTeamScore(nationalTemplate, roster);

    const pyroDpsRole = breakdown.roles.find((r) => r.roleId === 'pyro_dps');
    expect(pyroDpsRole?.filledBy).toBe('HuTao');
  });

  it('role coverage: all 4 roles filled = roleCoverage of 50', () => {
    const roster = [huTao, xingqiu, bennett, kazuha];
    const breakdown = calculateTeamScore(nationalTemplate, roster);
    expect(breakdown.subScores.roleCoverage).toBe(50);
  });

  it('role coverage: partial fill produces proportional coverage', () => {
    // Only pyro_dps (weight 35) and hydro_enabler (weight 30) filled.
    // Total weight = 100, filled weight = 65. Expected = round(65/100 * 50) = 33
    const roster = [huTao, xingqiu]; // No bennett or kazuha
    const breakdown = calculateTeamScore(nationalTemplate, roster);

    expect(breakdown.subScores.roleCoverage).toBe(33);
  });

  it('resonance bonus: two Pyro characters in National team yields 12', () => {
    // HuTao (Pyro) + Bennett (Pyro) → Pyro Resonance (high-value element)
    const roster = [huTao, xingqiu, bennett, kazuha];
    const breakdown = calculateTeamScore(nationalTemplate, roster);
    expect(breakdown.subScores.resonanceBonus).toBe(12);
  });

  it('resonance bonus: no resonance when all characters are different elements', () => {
    // Freeze template with no resonance: Ayaka(Cryo), Mona(Hydro), KukiShinobu(Electro), Kazuha(Anemo)
    const ayaka: CharacterInput = { characterKey: 'Ayaka', level: 80, ascension: 6, constellation: 0, talentNormal: 8, talentSkill: 8, talentBurst: 8, equippedWeapon: null };
    const mona: CharacterInput = { characterKey: 'Mona', level: 70, ascension: 5, constellation: 0, talentNormal: 6, talentSkill: 6, talentBurst: 6, equippedWeapon: null };
    const roster = [ayaka, mona, kazuha];
    const breakdown = calculateTeamScore(freezeTemplate, roster);
    // Only Ayaka and Mona have defined elements in freeze template roles; they are different
    expect(breakdown.subScores.resonanceBonus).toBe(0);
  });

  it('reaction completeness: both elements covered → 8 points', () => {
    // National Vaporize needs Pyro + Hydro. HuTao=Pyro, Xingqiu=Hydro.
    const roster = [huTao, xingqiu, bennett, kazuha];
    const breakdown = calculateTeamScore(nationalTemplate, roster);
    expect(breakdown.subScores.reactionCompleteness).toBe(8);
  });

  it('reaction completeness: only one element covered → 4 points', () => {
    // Only Pyro covered (HuTao, Bennett), no Hydro
    const roster = [huTao, bennett, kazuha, diluc];
    const breakdown = calculateTeamScore(nationalTemplate, roster);
    expect(breakdown.subScores.reactionCompleteness).toBe(4);
  });

  it('reaction completeness: neither element covered → 0 points', () => {
    // Freeze template needs Cryo + Hydro. Roster has none.
    const roster = [huTao, bennett, fischl, kazuha];
    const breakdown = calculateTeamScore(freezeTemplate, roster);
    expect(breakdown.subScores.reactionCompleteness).toBe(0);
  });

  it('score is clamped to [0, 100]', () => {
    const roster = [huTao, xingqiu, bennett, kazuha];
    const breakdown = calculateTeamScore(nationalTemplate, roster);
    expect(breakdown.score).toBeGreaterThanOrEqual(0);
    expect(breakdown.score).toBeLessThanOrEqual(100);
  });

  it('determinism: identical inputs produce identical outputs', () => {
    const roster = [huTao, xingqiu, bennett, kazuha];
    const first = calculateTeamScore(nationalTemplate, roster);
    const second = calculateTeamScore(nationalTemplate, roster);
    expect(first).toEqual(second);
  });

  it('scoreAllTemplates returns all 8 templates sorted by score descending', () => {
    const roster = [huTao, xingqiu, bennett, kazuha, diluc, fischl];
    const results = scoreAllTemplates(ALL_TEMPLATES, roster);

    expect(results).toHaveLength(ALL_TEMPLATES.length);

    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
    }
  });

  it('investment level: fully-built characters yield higher investmentLevel than low-level ones', () => {
    const wellBuiltRoster = [huTao, xingqiu, bennett, kazuha];
    const poorly: CharacterInput = { characterKey: 'Diluc', level: 1, ascension: 0, constellation: 0, talentNormal: 1, talentSkill: 1, talentBurst: 1, equippedWeapon: null };
    const poorlyBuiltRoster = [
      poorly,
      { ...xingqiu, level: 1, ascension: 0 },
      { ...bennett, level: 1, ascension: 0 },
      { ...kazuha, level: 1, ascension: 0 },
    ];

    const good = calculateTeamScore(nationalTemplate, wellBuiltRoster);
    const bad = calculateTeamScore(nationalTemplate, poorlyBuiltRoster);

    expect(good.subScores.investmentLevel).toBeGreaterThan(bad.subScores.investmentLevel);
  });
});
