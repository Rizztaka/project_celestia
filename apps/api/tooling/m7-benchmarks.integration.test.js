import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDbHolder, createInMemoryPrisma } = vi.hoisted(() => {
  function makeInMemoryPrisma() {
    const users = new Map();
    const accounts = new Map();
    const characters = new Map();
    const weapons = new Map();
    const artifacts = new Map();
    const materials = new Map();
    const importSectionStates = new Map();
    const goals = new Map();
    const preferences = new Map();

    const memClient = {
      user: {
        findUnique: async ({ where }) => users.get(where.id) ?? null,
        create: async ({ data }) => {
          const u = { ...data, createdAt: new Date(), updatedAt: new Date() };
          users.set(data.id, u);
          return u;
        },
        deleteMany: async () => {
          users.clear();
          return { count: 0 };
        },
      },
      $queryRaw: async () => [{ id: 'valid-owner' }],
      $transaction: async (fn) => fn(memClient),
      genshinAccount: {
        findUnique: async ({ where, include }) => {
          let acc = null;
          for (const a of accounts.values()) {
            if (where?.userId && a.userId === where.userId) acc = a;
            if (where?.id && a.id === where.id) acc = a;
          }
          if (!acc) return null;
          if (!include) return acc;
          return {
            ...acc,
            characters: [...characters.values()].filter((c) => c.accountId === acc.id),
            weapons: [...weapons.values()].filter((w) => w.accountId === acc.id),
            artifacts: [...artifacts.values()].filter((a) => a.accountId === acc.id),
            materials: [...materials.values()].filter((m) => m.accountId === acc.id),
            importStates: [...importSectionStates.values()].filter((s) => s.accountId === acc.id),
          };
        },
        create: async ({ data }) => {
          const id = data.id || `acc-${Math.random().toString(36).slice(2)}`;
          const acc = {
            id,
            userId: data.userId,
            uid: data.uid || null,
            nickname: data.nickname || null,
            adventureRank: data.adventureRank || null,
            worldLevel: data.worldLevel || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          accounts.set(id, acc);
          return acc;
        },
        update: async ({ where, data }) => {
          const acc = accounts.get(where.id);
          if (acc) {
            Object.assign(acc, data, { updatedAt: new Date() });
          }
          return acc;
        },
      },
      genshinCharacter: {
        findMany: async ({ where }) => {
          return [...characters.values()].filter(
            (c) => !where?.accountId || c.accountId === where.accountId,
          );
        },
        upsert: async ({ where, create, update }) => {
          let found = null;
          for (const c of characters.values()) {
            if (
              where.accountId_characterKey &&
              c.accountId === where.accountId_characterKey.accountId &&
              c.characterKey === where.accountId_characterKey.characterKey
            ) {
              found = c;
              break;
            }
          }
          if (found) {
            Object.assign(found, update, { updatedAt: new Date() });
            return found;
          }
          const id = `char-${Math.random().toString(36).slice(2)}`;
          const newChar = {
            id,
            ...create,
            equippedWeaponId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          characters.set(id, newChar);
          return newChar;
        },
        update: async ({ where, data }) => {
          const c = characters.get(where.id);
          if (c) Object.assign(c, data, { updatedAt: new Date() });
          return c;
        },
        updateMany: async ({ where, data }) => {
          let count = 0;
          for (const c of characters.values()) {
            if (!where?.accountId || c.accountId === where.accountId) {
              Object.assign(c, data, { updatedAt: new Date() });
              count++;
            }
          }
          return { count };
        },
        deleteMany: async ({ where }) => {
          for (const [id, c] of characters.entries()) {
            if (!where?.accountId || c.accountId === where.accountId) {
              characters.delete(id);
            }
          }
          return { count: 0 };
        },
      },
      genshinWeapon: {
        findMany: async ({ where }) => {
          return [...weapons.values()].filter(
            (w) => !where?.accountId || w.accountId === where.accountId,
          );
        },
        createMany: async ({ data }) => {
          for (const item of data) {
            const id = item.id || `weap-${Math.random().toString(36).slice(2)}`;
            weapons.set(id, {
              id,
              ...item,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          return { count: data.length };
        },
        deleteMany: async ({ where }) => {
          for (const [id, w] of weapons.entries()) {
            if (!where?.accountId || w.accountId === where.accountId) {
              weapons.delete(id);
            }
          }
          return { count: 0 };
        },
      },
      genshinArtifact: {
        findMany: async ({ where }) => {
          return [...artifacts.values()].filter(
            (a) => !where?.accountId || a.accountId === where.accountId,
          );
        },
        createMany: async ({ data }) => {
          for (const item of data) {
            const id = item.id || `art-${Math.random().toString(36).slice(2)}`;
            artifacts.set(id, {
              id,
              ...item,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          return { count: data.length };
        },
        deleteMany: async ({ where }) => {
          for (const [id, a] of artifacts.entries()) {
            if (!where?.accountId || a.accountId === where.accountId) {
              artifacts.delete(id);
            }
          }
          return { count: 0 };
        },
      },
      genshinMaterial: {
        findMany: async ({ where }) => {
          return [...materials.values()].filter(
            (m) => !where?.accountId || m.accountId === where.accountId,
          );
        },
        createMany: async ({ data }) => {
          for (const item of data) {
            const id = `mat-${Math.random().toString(36).slice(2)}`;
            materials.set(id, { id, ...item });
          }
          return { count: data.length };
        },
        deleteMany: async ({ where }) => {
          for (const [id, m] of materials.entries()) {
            if (!where?.accountId || m.accountId === where.accountId) {
              materials.delete(id);
            }
          }
          return { count: 0 };
        },
      },
      genshinImportSectionState: {
        upsert: async ({ where, create, update }) => {
          const key = `${where.accountId_section.accountId}_${where.accountId_section.section}`;
          const existing = importSectionStates.get(key);
          if (existing) {
            Object.assign(existing, update);
            return existing;
          }
          const id = `receipt-${Math.random().toString(36).slice(2)}`;
          const state = { id, ...create };
          importSectionStates.set(key, state);
          return state;
        },
      },
      upgradeGoal: {
        findMany: async () => [...goals.values()],
      },
      genshinPlanPreferences: {
        findUnique: async ({ where }) =>
          where?.userId ? preferences.get(where.userId) ?? null : null,
      },
      genshinPlanDismissal: {
        findMany: async () => [],
      },
      genshinRoutineState: {
        findUnique: async () => null,
        upsert: async () => ({}),
      },
      dailyCompanion: {
        findUnique: async () => null,
        upsert: async () => ({}),
      },
      weeklyBossState: {
        findUnique: async () => null,
        upsert: async () => ({}),
      },
    };

    return memClient;
  }

  const initialMock = makeInMemoryPrisma();
  return {
    mockDbHolder: { current: initialMock },
    createInMemoryPrisma: makeInMemoryPrisma,
  };
});

vi.mock('@/core/db/prisma.js', () => ({
  get prisma() {
    return mockDbHolder.current;
  },
}));
vi.mock('../src/core/db/prisma.js', () => ({
  get prisma() {
    return mockDbHolder.current;
  },
}));
vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'm7-synthetic-jwt-secret-at-least-32-chars-long',
    JWT_EXPIRY: '1h',
  },
}));
vi.mock('../src/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'm7-synthetic-jwt-secret-at-least-32-chars-long',
    JWT_EXPIRY: '1h',
  },
}));

import { disposableTestDatabase } from '../src/core/db/disposable-test-database.ts';
import { AccountContextProvider } from '../src/games/genshin/account-data/account-context-provider.service.ts';
import { GenshinCompanionProvider } from '../src/games/genshin/companion/genshin-companion.provider.ts';
import { ImportedAccountService } from '../src/games/genshin/importer/imported-account.service.ts';
import { GenshinImportRepository } from '../src/games/genshin/importer/importer.repository.ts';
import { GenshinImportService } from '../src/games/genshin/importer/importer.service.ts';
import { CompanionSummaryService } from '../src/games/genshin/intelligence/companion-summary/companion-summary.service.ts';
import {
  evaluateEncounterPackStatus,
  solveAbyssJoint,
} from '../src/games/genshin/intelligence/endgame-intelligence/abyss-joint.calculator.ts';
import { explainAbyssJoint } from '../src/games/genshin/intelligence/endgame-intelligence/abyss-joint.explainer.ts';
import { EndgameIntelligenceService } from '../src/games/genshin/intelligence/endgame-intelligence/endgame-intelligence.service.ts';
import { solveOnslaughtJoint } from '../src/games/genshin/intelligence/endgame-intelligence/onslaught-joint.calculator.ts';
import { explainOnslaughtJoint } from '../src/games/genshin/intelligence/endgame-intelligence/onslaught-joint.explainer.ts';
import {
  evaluateSeasonStatus,
  solveTheaterActPlan,
} from '../src/games/genshin/intelligence/endgame-intelligence/theater-act-planner.calculator.ts';
import { explainTheaterActPlan } from '../src/games/genshin/intelligence/endgame-intelligence/theater-act-planner.explainer.ts';
import { discoverAutonomousProgression } from '../src/games/genshin/intelligence/planner-intelligence/autonomous-progression.calculator.ts';
import { PlannerIntelligenceService } from '../src/games/genshin/intelligence/planner-intelligence/planner-intelligence.service.ts';
import { PullIntelligenceService } from '../src/games/genshin/intelligence/pull-intelligence/pull-intelligence.service.ts';
import { TeamIntelligenceService } from '../src/games/genshin/intelligence/team-intelligence/team-intelligence.service.ts';
import { TeamSimulationService } from '../src/games/genshin/intelligence/team-intelligence/team-simulation.service.ts';
import { companionRegistry } from '../src/platform/companion/companion-registry.service.ts';

companionRegistry.register(new GenshinCompanionProvider());

const databaseUrl = disposableTestDatabase();

describe('Milestone 7 Complete Integration Verification Benchmarks', () => {
  let db;
  let client;
  let importRepository;
  let importService;
  let contextProvider;
  let testUserId;

  beforeAll(async () => {
    if (databaseUrl) {
      client = new pg.Client({ connectionString: databaseUrl });
      await client.connect();
      await client.query("SET timezone='UTC'; SET datestyle='ISO,YMD'");
      db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
      mockDbHolder.current = db;
    } else {
      db = createInMemoryPrisma();
      mockDbHolder.current = db;
    }

    importRepository = new GenshinImportRepository(db);
    importService = new GenshinImportService(importRepository);
    contextProvider = new AccountContextProvider(new ImportedAccountService(importRepository));
  });

  afterAll(async () => {
    if (client) {
      await client.end();
    }
    if (db && typeof db.$disconnect === 'function') {
      await db.$disconnect();
    }
  });

  beforeEach(async () => {
    testUserId = randomUUID();
    await db.user.create({
      data: {
        id: testUserId,
        username: `m7-user-${testUserId}`,
        email: `${testUserId}@test.invalid`,
        password: 'test-synthetic-password-hash',
      },
    });
  });

  // ---------------------------------------------------------------------------
  // Benchmark 1: Import Persistence & Account-Context Resolution
  // ---------------------------------------------------------------------------
  describe('Benchmark 1 (Import Persistence & Account-Context Resolution)', () => {
    it('imports a complete valid GOOD payload and resolves accurate roster, equipped gear, and freshness', async () => {
      const goodPayload = {
        requestVersion: 1,
        payload: {
          format: 'GOOD',
          version: 2,
          source: 'Celestia M7 Integration Benchmark',
          characters: [
            {
              key: 'HuTao',
              level: 90,
              constellation: 1,
              ascension: 6,
              talent: { auto: 8, skill: 10, burst: 8 },
            },
            {
              key: 'Xingqiu',
              level: 80,
              constellation: 6,
              ascension: 6,
              talent: { auto: 1, skill: 8, burst: 8 },
            },
            {
              key: 'Yelan',
              level: 90,
              constellation: 0,
              ascension: 6,
              talent: { auto: 1, skill: 9, burst: 9 },
            },
            {
              key: 'Zhongli',
              level: 90,
              constellation: 0,
              ascension: 6,
              talent: { auto: 1, skill: 9, burst: 8 },
            },
          ],
          weapons: [
            {
              key: 'StaffOfHoma',
              level: 90,
              ascension: 6,
              refinement: 1,
              location: 'HuTao',
              lock: true,
            },
            {
              key: 'FavoniusSword',
              level: 90,
              ascension: 6,
              refinement: 5,
              location: 'Xingqiu',
              lock: true,
            },
            {
              key: 'FavoniusWarbow',
              level: 90,
              ascension: 6,
              refinement: 5,
              location: 'Yelan',
              lock: true,
            },
            {
              key: 'BlackTassel',
              level: 90,
              ascension: 6,
              refinement: 5,
              location: 'Zhongli',
              lock: true,
            },
          ],
          artifacts: [
            {
              setKey: 'CrimsonWitchOfFlames',
              slotKey: 'flower',
              level: 20,
              rarity: 5,
              mainStatKey: 'hp',
              location: 'HuTao',
              substats: [
                { key: 'critRate_', value: 10.5 },
                { key: 'critDMG_', value: 21.0 },
              ],
              lock: true,
            },
            {
              setKey: 'EmblemOfSeveredFate',
              slotKey: 'flower',
              level: 20,
              rarity: 5,
              mainStatKey: 'hp',
              location: 'Xingqiu',
              substats: [
                { key: 'critRate_', value: 7.0 },
                { key: 'enerRech_', value: 11.0 },
              ],
              lock: true,
            },
          ],
          materials: {
            Mora: 2500000,
            PhilosophiesOfDiligence: 12,
          },
        },
        sections: ['characters', 'weapons', 'artifacts', 'materials'],
      };

      // 1. Preview
      const preview = await importService.preview(testUserId, goodPayload);
      expect(preview.previewToken).toBeDefined();
      expect(preview.sections.length).toBeGreaterThan(0);

      // 2. Commit / Import
      const importResult = await importService.importAccount(testUserId, {
        ...goodPayload,
        previewToken: preview.previewToken,
        confirmClear: preview.clearSections,
      });
      expect(importResult.charactersImported).toBe(4);
      expect(importResult.weaponsImported).toBe(4);
      expect(importResult.artifactsImported).toBe(2);

      // 3. Resolve context via AccountContextProvider
      const resolved = await contextProvider.getForUser(testUserId);
      expect(resolved).toBeDefined();
      expect(resolved.context.scope).toBe('private_authenticated');
      expect(resolved.context.sources).toContain('stored_account');
      expect(resolved.context.freshness).toBeDefined();
      expect(['fresh', 'unknown', 'current']).toContain(resolved.context.freshness);

      // Verify roster levels, ascension, and talents
      expect(resolved.rawRoster).toHaveLength(4);
      const huTao = resolved.rawRoster.find((c) => c.characterKey === 'HuTao');
      expect(huTao).toBeDefined();
      expect(huTao?.level).toBe(90);
      expect(huTao?.ascension).toBe(6);
      expect(huTao?.talentNormal).toBe(8);
      expect(huTao?.talentSkill).toBe(10);
      expect(huTao?.talentBurst).toBe(8);

      // Verify equipped weapon linkage
      expect(huTao?.equippedWeapon).toBeDefined();
      expect(huTao?.equippedWeapon?.weaponKey).toBe('StaffOfHoma');
      expect(huTao?.equippedWeapon?.level).toBe(90);
      expect(huTao?.equippedWeapon?.refinement).toBe(1);

      // Verify artifacts resolution
      expect(resolved.artifacts.length).toBeGreaterThanOrEqual(2);
      const huTaoFlower = resolved.artifacts.find((a) => a.equippedCharacterId === huTao?.id);
      expect(huTaoFlower).toBeDefined();
      expect(huTaoFlower?.setKey).toBe('CrimsonWitchOfFlames');
      expect(huTaoFlower?.level).toBe(20);
    });
  });

  // ---------------------------------------------------------------------------
  // Benchmark 2: Real GCSim Worker Execution & Tested Damage
  // ---------------------------------------------------------------------------
  describe('Benchmark 2 (Real GCSim Worker Execution & Tested Damage)', () => {
    it('executes real GCSim worker thread simulation asserting tested DPS, confidence error margin, actions, and energy diagnostics', async () => {
      const simulationService = new TeamSimulationService(
        new URL('./gcsim/runtime-runner.mjs', import.meta.url),
      );

      const candidateMembers = ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'];
      const simResult = await simulationService.simulateTeam(candidateMembers, {
        duration: 20,
        enemyLevel: 100,
        resistance: 10,
        samples: 2,
        timeoutMs: 15000,
      });

      expect(simResult.simulationStatus).toBe('VERIFIED_SIMULATION');
      expect(simResult.simulatedDps).toBeGreaterThan(0);
      expect(simResult.errorMargin).toBeGreaterThanOrEqual(0);
      expect(simResult.samples).toBe(2);
      expect(simResult.members).toHaveLength(4);

      // Check executed burst and skill counts
      let totalSkills = 0;
      let totalBursts = 0;
      let totalActions = 0;

      for (const member of simResult.members) {
        expect(member.key).toBeTruthy();
        expect(member.damage).toBeGreaterThanOrEqual(0);
        expect(member.dps).toBeGreaterThanOrEqual(0);
        expect(member.actions).toBeGreaterThan(0);
        totalActions += member.actions;

        if (member.actionCounts) {
          totalSkills += member.actionCounts.skill ?? 0;
          totalBursts += member.actionCounts.burst ?? 0;
        }

        // Energy and attempt diagnostics from gcsim engine
        expect(member.blockedAttempts).toBeDefined();
      }

      expect(totalActions).toBeGreaterThan(0);
      expect(totalSkills).toBeGreaterThan(0);
      expect(totalBursts).toBeGreaterThan(0);
    }, 25000);
  });

  // ---------------------------------------------------------------------------
  // Benchmark 3: Account-Wide Autonomous Progression Discovery
  // ---------------------------------------------------------------------------
  describe('Benchmark 3 (Account-Wide Autonomous Progression Discovery)', () => {
    it('discovers high-ROI progression candidates without manual goals and applies priority weighting for core team and bottleneck units', async () => {
      const roster = [
        {
          id: 'char-bennett',
          accountId: 'acc-1',
          characterKey: 'Bennett',
          level: 80,
          ascension: 5,
          constellation: 1,
          talentNormal: 1,
          talentSkill: 6,
          talentBurst: 8,
          equippedWeaponId: 'weap-fav',
          equippedWeapon: {
            id: 'weap-fav',
            accountId: 'acc-1',
            weaponKey: 'FavoniusSword',
            level: 80,
            ascension: 5,
            refinement: 3,
            locked: true,
            createdAt: new Date('2026-10-20T00:00:00Z'),
            updatedAt: new Date('2026-10-20T00:00:00Z'),
          },
          createdAt: new Date('2026-10-20T00:00:00Z'),
          updatedAt: new Date('2026-10-20T00:00:00Z'),
        },
        {
          id: 'char-xiangling',
          accountId: 'acc-1',
          characterKey: 'Xiangling',
          level: 80,
          ascension: 5,
          constellation: 4,
          talentNormal: 1,
          talentSkill: 6,
          talentBurst: 8,
          equippedWeaponId: 'weap-catch',
          equippedWeapon: {
            id: 'weap-catch',
            accountId: 'acc-1',
            weaponKey: 'TheCatch',
            level: 80,
            ascension: 5,
            refinement: 5,
            locked: true,
            createdAt: new Date('2026-10-20T00:00:00Z'),
            updatedAt: new Date('2026-10-20T00:00:00Z'),
          },
          createdAt: new Date('2026-10-20T00:00:00Z'),
          updatedAt: new Date('2026-10-20T00:00:00Z'),
        },
        {
          id: 'char-hutao',
          accountId: 'acc-1',
          characterKey: 'HuTao',
          level: 80,
          ascension: 5,
          constellation: 1,
          talentNormal: 8,
          talentSkill: 8,
          talentBurst: 6,
          equippedWeaponId: 'weap-bane',
          equippedWeapon: {
            id: 'weap-bane',
            accountId: 'acc-1',
            weaponKey: 'DragonsBane',
            level: 80,
            ascension: 5,
            refinement: 1,
            locked: true,
            createdAt: new Date('2026-10-20T00:00:00Z'),
            updatedAt: new Date('2026-10-20T00:00:00Z'),
          },
          createdAt: new Date('2026-10-20T00:00:00Z'),
          updatedAt: new Date('2026-10-20T00:00:00Z'),
        },
      ];

      // 1. Direct calculator evaluation
      const discovery = discoverAutonomousProgression({
        rawRoster: roster,
        manualGoals: [],
        teamMemberKeys: ['HuTao'], // Core team member -> Priority 1
        bottleneckCharacterKeys: ['Bennett'], // Bottleneck unit -> Priority 2
      });

      expect(discovery.candidates.length).toBeGreaterThan(0);
      expect(discovery.metadata.discoveredCandidateCount).toBeGreaterThan(0);

      const huTaoCandidate = discovery.candidates.find((c) => c.characterKey === 'HuTao');
      expect(huTaoCandidate).toBeDefined();
      expect(huTaoCandidate?.goalPriority).toBe(1);
      expect(huTaoCandidate?.isCoreTeam).toBe(true);

      const bennettCandidate = discovery.candidates.find((c) => c.characterKey === 'Bennett');
      expect(bennettCandidate).toBeDefined();
      expect(bennettCandidate?.goalPriority).toBe(2);
      expect(bennettCandidate?.isBottleneck).toBe(true);

      // 2. Integration via PlannerIntelligenceService with 0 manual upgrade goals
      const mockContextProvider = {
        getForUser: vi.fn().mockResolvedValue({
          context: {
            version: 1,
            scope: 'private_authenticated',
            uid: '800000001',
            accountId: 'acc-1',
            rosterScope: 'complete',
            sources: ['stored_account'],
            equipmentExclusivity: 'verified_snapshot',
            rejectedRecordCount: 0,
            sourceTimestamps: [],
            characters: [],
            missingData: [],
            issues: [],
          },
          rawRoster: roster,
          weapons: roster.map((r) => r.equippedWeapon).filter(Boolean),
          artifacts: [],
          evidence: {
            identitySource: { kind: 'local_catalog', sha256: 'a'.repeat(64) },
            characters: [],
            weapons: [],
            artifacts: [],
            receipts: [],
            issues: [],
          },
        }),
      };

      const mockRoutineService = {
        getSnapshot: vi.fn().mockResolvedValue({
          contractVersion: 2,
          revision: 1,
          serverId: 'asia',
          clockStatus: 'verified',
          serverNow: '2026-11-10T10:00:00.000Z',
          period: {
            dailyPeriodId: 'd-1',
            dailyResetAt: '2026-11-10T20:00:00Z',
            weeklyPeriodId: 'w-1',
            weeklyResetAt: '2026-11-15T20:00:00Z',
          },
          resin: {
            known: true,
            currentAmount: 160,
            maxAmount: 200,
            capAt: '2026-11-10T15:20:00Z',
            recordedAt: '2026-11-10T09:00:00Z',
          },
          tasks: [],
          weeklyClaims: { available: true, remainingClaims: 3 },
          legacySummary: null,
        }),
      };

      const plannerService = new PlannerIntelligenceService(
        mockContextProvider,
        undefined,
        mockRoutineService,
      );

      // Must succeed without throwing 422 UnprocessableError
      const plannerResult = await plannerService.getRecommendations('user-autonomous');
      expect(plannerResult).toBeDefined();
      expect(plannerResult.optimization).toBeDefined();
      expect(plannerResult.optimization.allocatedPlan.length).toBeGreaterThan(0);
      expect(plannerResult.route.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Benchmark 4: Unified Optimization Pipeline & Dashboard Alignment
  // ---------------------------------------------------------------------------
  describe('Benchmark 4 (Unified Optimization Pipeline & Dashboard Alignment)', () => {
    it('proves CompanionSummaryResponse.primaryAction mirrors Task #1 of allocatedPlan', async () => {
      const roster = [
        {
          id: 'char-hutao',
          accountId: 'acc-1',
          characterKey: 'HuTao',
          level: 80,
          ascension: 5,
          constellation: 1,
          talentNormal: 8,
          talentSkill: 8,
          talentBurst: 6,
          equippedWeaponId: 'weap-1',
          equippedWeapon: {
            id: 'weap-1',
            accountId: 'acc-1',
            weaponKey: 'DragonsBane',
            level: 80,
            ascension: 5,
            refinement: 1,
            locked: true,
            createdAt: new Date('2026-10-20T00:00:00Z'),
            updatedAt: new Date('2026-10-20T00:00:00Z'),
          },
          createdAt: new Date('2026-10-20T00:00:00Z'),
          updatedAt: new Date('2026-10-20T00:00:00Z'),
        },
      ];

      const mockContextProvider = {
        getForUser: vi.fn().mockResolvedValue({
          context: {
            version: 1,
            scope: 'private_authenticated',
            uid: '800000001',
            accountId: 'acc-1',
            rosterScope: 'complete',
            sources: ['stored_account'],
            equipmentExclusivity: 'verified_snapshot',
            rejectedRecordCount: 0,
            sourceTimestamps: [],
            characters: [],
            missingData: [],
            issues: [],
          },
          rawRoster: roster,
          weapons: roster.map((r) => r.equippedWeapon).filter(Boolean),
          artifacts: [],
          evidence: {
            identitySource: { kind: 'local_catalog', sha256: 'a'.repeat(64) },
            characters: [],
            weapons: [],
            artifacts: [],
            receipts: [],
            issues: [],
          },
        }),
      };

      const mockStockRepository = {
        readForUser: vi.fn().mockResolvedValue({
          inventory: { TeachingsOfDiligence: 0, GuideToDiligence: 0, PhilosophiesOfDiligence: 0 },
          stockBasis: {
            kind: 'recorded_import',
            importedAt: '2026-11-09T00:00:00.000Z',
            source: 'GOOD',
            scope: 'replacement_section',
            suppliedEntryCount: 0,
          },
        }),
      };

      // Tuesday in Asia: Taishan Mansion (Diligence) open
      const mockRoutineService = {
        getSnapshot: vi.fn().mockResolvedValue({
          contractVersion: 2,
          revision: 1,
          serverId: 'asia',
          clockStatus: 'verified',
          serverNow: '2026-11-10T10:00:00.000Z',
          period: {
            dailyPeriodId: 'd-1',
            dailyResetAt: '2026-11-10T20:00:00Z',
            weeklyPeriodId: 'w-1',
            weeklyResetAt: '2026-11-15T20:00:00Z',
          },
          resin: {
            known: true,
            currentAmount: 160,
            maxAmount: 200,
            capAt: '2026-11-10T15:20:00Z',
            recordedAt: '2026-11-10T09:00:00Z',
          },
          tasks: [],
          weeklyClaims: { available: true, remainingClaims: 3 },
          legacySummary: null,
        }),
      };

      const plannerService = new PlannerIntelligenceService(
        mockContextProvider,
        mockStockRepository,
        mockRoutineService,
      );

      const endgameService = new EndgameIntelligenceService();
      const teamService = new TeamIntelligenceService(mockContextProvider);

      const summaryService = new CompanionSummaryService(
        mockContextProvider,
        undefined,
        endgameService,
        undefined,
        undefined,
        undefined,
        teamService,
        undefined,
        plannerService,
      );

      const summary = await summaryService.getSummary('user-pipeline');
      const plan = await plannerService.getOptimizedPlan('user-pipeline');

      expect(summary.primaryAction).toBeDefined();
      expect(plan.allocatedPlan.length).toBeGreaterThan(0);

      const taskOne = plan.allocatedPlan[0];
      expect(summary.primaryAction.headline).toContain(taskOne.targetKey);

      if (taskOne.timeGated || taskOne.actionType.startsWith('domain_')) {
        expect(summary.primaryAction.category).toBe('FARMING_AVAILABLE');
        expect(summary.primaryAction.targetRoute).toBe('/planner?tab=farming');
      } else {
        expect(summary.primaryAction.category).toBe('BUILD_INVESTMENT');
        expect(summary.primaryAction.targetRoute).toBe(`/roster/${taskOne.targetKey}`);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Benchmark 5: Reliable Game-Data Infrastructure & Expiry Guards
  // ---------------------------------------------------------------------------
  describe('Benchmark 5 (Reliable Game-Data Infrastructure & Expiry Guards)', () => {
    it('asserts expired encounter packs or unverified banners degrade confidence and emit explicit caveats', () => {
      const expiredDate = new Date('2028-01-01T00:00:00Z');

      // 1. Encounter pack status & joint evaluators
      const abyssPackStatus = evaluateEncounterPackStatus('5.2-1', expiredDate);
      expect(abyssPackStatus.isExpired).toBe(true);
      expect(abyssPackStatus.isCurrentCycle).toBe(false);
      expect(abyssPackStatus.expirationNote).toMatch(/expired/i);

      const candidateTeams = [
        {
          id: 'team_1',
          name: 'HuTao Vaporize',
          memberKeys: ['HuTao', 'Yelan', 'Xingqiu', 'Zhongli'],
          baseDps: 70000,
          comfortScore: 85,
        },
        {
          id: 'team_2',
          name: 'Raiden National',
          memberKeys: ['RaidenShogun', 'Xiangling', 'Bennett', 'KaedeharaKazuha'],
          baseDps: 68000,
          comfortScore: 80,
        },
        {
          id: 'team_3',
          name: 'Neuvillette Hyper',
          memberKeys: ['Neuvillette', 'Furina', 'Baizhu', 'Fischl'],
          baseDps: 72000,
          comfortScore: 90,
        },
      ];

      const abyssResult = solveAbyssJoint(
        {
          cycleId: '5.2-1',
          floor: 12,
          chamber: 1,
          candidateTeams: candidateTeams.slice(0, 2),
        },
        expiredDate,
      );
      expect(abyssResult.isExpired).toBe(true);
      expect(abyssResult.isCurrentCycle).toBe(false);
      const abyssExplanations = explainAbyssJoint(abyssResult);
      expect(abyssExplanations.some((e) => e.includes('ARCHIVED / HISTORICAL CYCLE'))).toBe(true);

      const onslaughtResult = solveOnslaughtJoint(
        {
          cycleId: '5.2-1',
          candidateTeams,
        },
        expiredDate,
      );
      expect(onslaughtResult.isExpired).toBe(true);
      expect(onslaughtResult.isCurrentCycle).toBe(false);
      const onslaughtExplanations = explainOnslaughtJoint(onslaughtResult);
      expect(onslaughtExplanations.some((e) => e.includes('ARCHIVED / HISTORICAL CYCLE'))).toBe(true);

      const theaterSeasonStatus = evaluateSeasonStatus('2026-11-01', expiredDate);
      expect(theaterSeasonStatus.isExpired).toBe(true);
      expect(theaterSeasonStatus.isCurrentSeason).toBe(false);

      const theaterResult = solveTheaterActPlan(
        {
          seasonId: '2026-11-01',
          difficulty: 'VISIONARY',
          castKeys: [
            'Bennett',
            'Xiangling',
            'Xingqiu',
            'Yelan',
            'Fischl',
            'KaedeharaKazuha',
            'Furina',
            'Nahida',
            'Zhongli',
            'RaidenShogun',
            'HuTao',
            'Arlecchino',
            'Keqing',
            'Diluc',
            'Yoimiya',
            'Kachina',
            'Diona',
            'Sayu',
            'Collei',
            'Chevreuse',
            'Mika',
            'Layla',
          ],
          currentAct: 1,
          remainingVigor: {
            Bennett: 2,
            Xiangling: 2,
            Xingqiu: 2,
            Yelan: 2,
            Fischl: 2,
            KaedeharaKazuha: 2,
            Furina: 2,
            Nahida: 2,
            Zhongli: 2,
            RaidenShogun: 2,
            HuTao: 2,
            Arlecchino: 2,
            Keqing: 2,
            Diluc: 2,
            Yoimiya: 2,
            Kachina: 2,
            Diona: 2,
            Sayu: 2,
            Collei: 2,
            Chevreuse: 2,
            Mika: 2,
            Layla: 2,
          },
          completedActs: [],
        },
        expiredDate,
      );
      expect(theaterResult.isExpired).toBe(true);
      expect(theaterResult.isCurrentSeason).toBe(false);
      const theaterExplanations = explainTheaterActPlan(theaterResult);
      expect(theaterExplanations.some((e) => e.includes('ARCHIVED / HISTORICAL SEASON'))).toBe(true);

      // 2. Unverified or expired pull banners
      const pullService = new PullIntelligenceService();

      const unverifiedBanner = {
        bannerId: 'test_unverified',
        name: 'Unverified Test Banner',
        type: 'CHARACTER',
        fiveStarKey: 'Mavuika',
        fourStarKeys: [],
        startDate: '2026-01-01',
        endDate: '2029-12-31',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news/detail/127690',
        source: {
          id: 'unverified-source',
          verified: false,
        },
      };

      const expiredBanner = {
        bannerId: 'test_expired',
        name: 'Expired Test Banner',
        type: 'CHARACTER',
        fiveStarKey: 'Mavuika',
        fourStarKeys: [],
        startDate: '2024-01-01',
        endDate: '2024-01-21',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news/detail/127690',
        source: {
          id: 'official-genshin-old',
          verified: true,
        },
      };

      const unverifiedRec = pullService.evaluateBannerRecommendation(unverifiedBanner, {
        referenceDate: new Date('2026-06-01'),
      });
      expect(unverifiedRec.strategicRecommendation).toBe('CONDITIONAL_DATA_GAP');
      expect(unverifiedRec.strategicRecommendation).not.toBe('HIGH_ACCOUNT_VALUE');
      expect(
        unverifiedRec.missingDataNotes.some((n) => /unverified/i.test(n)) ||
          unverifiedRec.provenanceNotices?.some((n) => /unverified/i.test(n)),
      ).toBe(true);

      const expiredRec = pullService.evaluateBannerRecommendation(expiredBanner, {
        referenceDate: new Date('2026-06-01'),
      });
      expect(expiredRec.strategicRecommendation).toBe('CONDITIONAL_DATA_GAP');
      expect(expiredRec.strategicRecommendation).not.toBe('HIGH_ACCOUNT_VALUE');
      expect(
        expiredRec.missingDataNotes.some((n) => /expired/i.test(n)) ||
          expiredRec.provenanceNotices?.some((n) => /expired/i.test(n)),
      ).toBe(true);
    });
  });
});
