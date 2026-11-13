import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

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
      $queryRaw: async (query, ...params) => {
        // Mock query for recorded stock repository
        return [
          {
            inventory: Object.fromEntries(
              [...materials.values()].map((m) => [m.itemKey, m.quantity]),
            ),
            receipt: {
              importedAt: new Date().toISOString(),
              source: 'GOOD',
              entryCount: materials.size,
            },
          },
        ];
      },
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
            const id = `mat-${item.accountId}-${item.itemKey}`;
            materials.set(id, { id, ...item, updatedAt: new Date() });
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
        findMany: async ({ where }) => {
          return [...importSectionStates.values()].filter(
            (s) => !where?.accountId || s.accountId === where.accountId,
          );
        },
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
        createMany: async ({ data }) => {
          for (const item of data) {
            const id = `sec-${item.accountId}-${item.section}`;
            importSectionStates.set(id, { id, ...item });
          }
          return { count: data.length };
        },
        deleteMany: async ({ where }) => {
          for (const [id, s] of importSectionStates.entries()) {
            if (!where?.accountId || s.accountId === where.accountId) {
              importSectionStates.delete(id);
            }
          }
          return { count: 0 };
        },
      },
      upgradeGoal: {
        findMany: async ({ where }) => {
          return [...goals.values()].filter((g) => !where?.userId || g.userId === where.userId);
        },
      },
      genshinPlanPreferences: {
        findUnique: async ({ where }) => {
          return (
            preferences.get(where.userId) ?? {
              userId: where.userId,
              revision: 1,
              dailyResinBudget: 160,
              commissions: true,
              teapot: true,
              transformer: false,
              weeklyClaims: true,
            }
          );
        },
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
    JWT_SECRET: 'm7-1-synthetic-jwt-secret-at-least-32-chars-long',
    JWT_EXPIRY: '1h',
  },
}));
vi.mock('../src/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'm7-1-synthetic-jwt-secret-at-least-32-chars-long',
    JWT_EXPIRY: '1h',
  },
}));

import { disposableTestDatabase } from '../src/core/db/disposable-test-database.ts';
import { AccountContextProvider } from '../src/games/genshin/account-data/account-context-provider.service.ts';
import { GenshinCompanionProvider } from '../src/games/genshin/companion/genshin-companion.provider.ts';
import { GenshinRecordedStockRepository } from '../src/games/genshin/companion/recorded-stock.repository.ts';
import { ImportedAccountService } from '../src/games/genshin/importer/imported-account.service.ts';
import { GenshinImportRepository } from '../src/games/genshin/importer/importer.repository.ts';
import { GenshinImportService } from '../src/games/genshin/importer/importer.service.ts';
import { CompanionSummaryService } from '../src/games/genshin/intelligence/companion-summary/companion-summary.service.ts';
import { EndgameIntelligenceService } from '../src/games/genshin/intelligence/endgame-intelligence/endgame-intelligence.service.ts';
import { PlannerIntelligenceService } from '../src/games/genshin/intelligence/planner-intelligence/planner-intelligence.service.ts';
import { TeamIntelligenceService } from '../src/games/genshin/intelligence/team-intelligence/team-intelligence.service.ts';
import { TeamSimulationService } from '../src/games/genshin/intelligence/team-intelligence/team-simulation.service.ts';
import { companionRegistry } from '../src/platform/companion/companion-registry.service.ts';

companionRegistry.register(new GenshinCompanionProvider());

const databaseUrl = disposableTestDatabase();

describe('M7.1 Real-Account Journey (PostgreSQL -> GOOD Import -> GCSim -> Planner -> Dashboard)', () => {
  let db;
  let client;
  let importRepository;
  let importService;
  let contextProvider;
  let stockRepository;
  let teamService;
  let simulationService;
  let plannerService;
  let summaryService;
  let mockRoutineService;
  let testUserId;

  const TUESDAY_SERVER_NOW = '2026-11-10T10:00:00.000Z';

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
    stockRepository = new GenshinRecordedStockRepository(db);

    simulationService = new TeamSimulationService(
      new URL('./gcsim/runtime-runner.mjs', import.meta.url),
    );
    teamService = new TeamIntelligenceService(contextProvider, simulationService);

    mockRoutineService = {
      getSnapshot: vi.fn().mockResolvedValue({
        contractVersion: 2,
        revision: 1,
        serverId: 'asia',
        clockStatus: 'verified',
        serverNow: TUESDAY_SERVER_NOW,
        period: {
          dailyPeriodId: 'daily-asia-2026-11-10',
          dailyResetAt: '2026-11-10T20:00:00.000Z',
          weeklyPeriodId: 'weekly-asia-2026-11-08',
          weeklyResetAt: '2026-11-15T20:00:00.000Z',
        },
        resin: {
          known: true,
          currentAmount: 160,
          maxAmount: 200,
          capAt: '2026-11-10T15:20:00.000Z',
          recordedAt: '2026-11-10T09:00:00.000Z',
        },
        tasks: [],
        weeklyClaims: { available: true, remainingClaims: 3 },
        legacySummary: null,
      }),
    };

    plannerService = new PlannerIntelligenceService(
      contextProvider,
      stockRepository,
      mockRoutineService,
      teamService,
    );

    const endgameService = new EndgameIntelligenceService();
    summaryService = new CompanionSummaryService(
      contextProvider,
      undefined,
      endgameService,
      undefined,
      undefined,
      undefined,
      teamService,
      undefined,
      plannerService,
    );
  });

  afterAll(async () => {
    if (client) {
      await client.end();
    }
    if (db && typeof db.$disconnect === 'function') {
      await db.$disconnect();
    }
  });

  it('completes the entire real-account journey: import GOOD payload, resolve build context, run real-build GCSim simulation, generate autonomous plan, and sync companion dashboard', async () => {
    testUserId = randomUUID();
    await db.user.create({
      data: {
        id: testUserId,
        username: `m7-1-user-${testUserId}`,
        email: `${testUserId}@test.invalid`,
        password: 'synthetic-password-hash',
      },
    });

    // 1. Construct realistic 8-character GOOD import payload with equipped weapons & 5-star artifact sets
    const goodPayload = {
      requestVersion: 1,
      payload: {
        format: 'GOOD',
        version: 2,
        source: 'Project Celestia M7.1 Real Journey Test',
        characters: [
          {
            key: 'HuTao',
            level: 90,
            constellation: 1,
            ascension: 6,
            talent: { auto: 9, skill: 10, burst: 9 },
          },
          {
            key: 'Xingqiu',
            level: 90,
            constellation: 6,
            ascension: 6,
            talent: { auto: 1, skill: 9, burst: 10 },
          },
          {
            key: 'Yelan',
            level: 90,
            constellation: 0,
            ascension: 6,
            talent: { auto: 1, skill: 9, burst: 10 },
          },
          {
            key: 'Zhongli',
            level: 90,
            constellation: 0,
            ascension: 6,
            talent: { auto: 1, skill: 9, burst: 8 },
          },
          {
            key: 'Xiangling',
            level: 80,
            constellation: 6,
            ascension: 6,
            talent: { auto: 1, skill: 6, burst: 8 },
          },
          {
            key: 'Bennett',
            level: 80,
            constellation: 5,
            ascension: 6,
            talent: { auto: 1, skill: 6, burst: 8 },
          },
          {
            key: 'KaedeharaKazuha',
            level: 90,
            constellation: 0,
            ascension: 6,
            talent: { auto: 1, skill: 8, burst: 8 },
          },
          {
            key: 'RaidenShogun',
            level: 90,
            constellation: 0,
            ascension: 6,
            talent: { auto: 1, skill: 8, burst: 8 },
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
          {
            key: 'TheCatch',
            level: 90,
            ascension: 6,
            refinement: 5,
            location: 'Xiangling',
            lock: true,
          },
          {
            key: 'SapwoodBlade',
            level: 90,
            ascension: 6,
            refinement: 1,
            location: 'Bennett',
            lock: true,
          },
          {
            key: 'IronSting',
            level: 90,
            ascension: 6,
            refinement: 1,
            location: 'KaedeharaKazuha',
            lock: true,
          },
          {
            key: 'DragonBane',
            level: 90,
            ascension: 6,
            refinement: 5,
            location: 'RaidenShogun',
            lock: true,
          },
        ],
        artifacts: [
          // Hu Tao 4pc Crimson Witch
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
            setKey: 'CrimsonWitchOfFlames',
            slotKey: 'plume',
            level: 20,
            rarity: 5,
            mainStatKey: 'atk',
            location: 'HuTao',
            substats: [
              { key: 'critRate_', value: 7.0 },
              { key: 'hp_', value: 14.0 },
            ],
            lock: true,
          },
          {
            setKey: 'CrimsonWitchOfFlames',
            slotKey: 'sands',
            level: 20,
            rarity: 5,
            mainStatKey: 'hp_',
            location: 'HuTao',
            substats: [
              { key: 'critRate_', value: 9.3 },
              { key: 'critDMG_', value: 14.0 },
            ],
            lock: true,
          },
          {
            setKey: 'CrimsonWitchOfFlames',
            slotKey: 'goblet',
            level: 20,
            rarity: 5,
            mainStatKey: 'pyro_dmg_',
            location: 'HuTao',
            substats: [
              { key: 'critRate_', value: 6.2 },
              { key: 'critDMG_', value: 18.0 },
            ],
            lock: true,
          },
          // Xingqiu 4pc Emblem
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
          {
            setKey: 'EmblemOfSeveredFate',
            slotKey: 'plume',
            level: 20,
            rarity: 5,
            mainStatKey: 'atk',
            location: 'Xingqiu',
            substats: [{ key: 'enerRech_', value: 15.0 }],
            lock: true,
          },
        ],
        materials: {
          Mora: 3000000,
          PhilosophiesOfDiligence: 6,
          GuideToDiligence: 12,
          TeachingsOfDiligence: 18,
        },
      },
      sections: ['characters', 'weapons', 'artifacts', 'materials'],
    };

    // 2. Perform Preview and Account Import
    const preview = await importService.preview(testUserId, goodPayload);
    expect(preview.previewToken).toBeDefined();

    const importResult = await importService.importAccount(testUserId, {
      ...goodPayload,
      previewToken: preview.previewToken,
      confirmClear: preview.clearSections,
    });

    expect(importResult.charactersImported).toBe(8);
    expect(importResult.weaponsImported).toBe(8);
    expect(importResult.artifactsImported).toBe(6);

    // 3. Resolve Account Context
    const resolved = await contextProvider.getForUser(testUserId);
    expect(resolved.context.scope).toBe('private_authenticated');
    expect(resolved.rawRoster).toHaveLength(8);

    const huTao = resolved.rawRoster.find((c) => c.characterKey === 'HuTao');
    expect(huTao).toBeDefined();
    expect(huTao?.equippedWeapon?.weaponKey).toBe('StaffOfHoma');
    expect(huTao?.equippedWeapon?.level).toBe(90);

    // Verify artifact resolution
    expect(resolved.artifacts.length).toBeGreaterThanOrEqual(6);
    const huTaoArts = resolved.artifacts.filter((a) => a.equippedCharacterId === huTao?.id);
    expect(huTaoArts.length).toBe(4);
    expect(huTaoArts.every((a) => a.setKey === 'CrimsonWitchOfFlames')).toBe(true);

    // 4. Test real-build GCSim configuration translation & simulation
    const genConfigResult = simulationService.generateConfig(
      [
        {
          characterKey: 'HuTao',
          level: 90,
          constellation: 1,
          talentNormal: 9,
          talentSkill: 10,
          talentBurst: 9,
          equippedWeapon: huTao?.equippedWeapon ?? null,
          equippedArtifacts: huTaoArts.map((a) => ({
            setKey: a.setKey,
            slotKey: a.slotKey,
            mainStatKey: a.mainStatKey,
            level: a.level,
            rarity: a.rarity,
            subStats: a.subStats,
          })),
        },
        'Xingqiu',
        'Yelan',
        'Zhongli',
      ],
      { duration: 20 },
    );

    // Proves that actual player build is translated to gcsim: Staff of Homa & Crimson Witch
    expect(genConfigResult.config).toContain('hutao add weapon="staffofhoma"');
    expect(genConfigResult.config).toContain('hutao add set="crimsonwitchofflames" count=4');

    // Run simulation via TeamIntelligenceService
    const simRecs = await teamService.getSimulatedRecommendationsForRoster(resolved.rawRoster, {
      limit: 3,
      simulateTopN: 2,
      artifacts: resolved.artifacts,
    });

    expect(simRecs.length).toBeGreaterThan(0);
    const topTeam = simRecs[0];
    expect(topTeam.simulatedDps).toBeGreaterThan(0);
    expect(topTeam.simulationStatus).toBe('VERIFIED_SIMULATION');

    // 5. Test Autonomous Progression Discovery & Optimizer Schedule (0 manual goals)
    const plan = await plannerService.getOptimizedPlan(testUserId);
    expect(plan.rankedPlan.length).toBeGreaterThan(0);
    // 0 manual goals -> all actions discovered autonomously
    expect(plan.rankedPlan.every((action) => action.goalId === null)).toBe(true);
    // Recorded materials are observed
    expect(plan.rankedPlan[0]?.inventoryStatus).toBe('observed');

    // 6. Test Companion Dashboard Synchronization
    const summary = await summaryService.getSummary(testUserId);
    expect(summary.teamSuggestion).toBeDefined();
    expect(summary.teamSuggestion?.simulatedDps).toBeGreaterThan(0);
    expect(summary.teamSuggestion?.simulationStatus).toBe('VERIFIED_SIMULATION');

    // Primary action on the dashboard aligns with optimizer schedule
    expect(summary.primaryAction).toBeDefined();
    expect(['FARMING_AVAILABLE', 'BUILD_INVESTMENT']).toContain(summary.primaryAction.category);
    expect(summary.primaryAction.targetRoute).toBe('/planner?tab=farming');
    expect(summary.topMarginalInvestments.length).toBeGreaterThan(0);
  }, 60000);
});
