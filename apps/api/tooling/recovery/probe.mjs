// A private child of rehearse.mjs; never imported by the application or test discovery.
import { readFileSync } from 'node:fs';

import { connectTarget, privateWrite } from './fixture.mjs';
import { containedPath, requireSafe, safeFailure, validateTarget } from './policy.mjs';
import { ids, stamp } from './seed.mjs';

let root, prisma;
try {
  validateTarget(process.env); // Before any database-capable imports.
  const ticketPath = process.env.CELESTIA_RECOVERY_TICKET;
  requireSafe(!!ticketPath, 'PRIVATE_PROBE_TICKET_REQUIRED');
  const ticket = JSON.parse(readFileSync(ticketPath, 'utf8'));
  root = ticket.root;
  containedPath(root, ticketPath);
  requireSafe(
    ticket.target.database === new URL(process.env.DATABASE_URL).pathname.slice(1) &&
      ticket.target.role === new URL(process.env.DATABASE_URL).username,
    'PROBE_TARGET_MISMATCH',
  );
  const target = {
    ...ticket.target,
    password: new URL(process.env.DATABASE_URL).password,
    env: process.env,
  };
  const identity = await connectTarget(target, ticket.fixture, process.env);
  requireSafe(
    (await identity.query('SHOW default_transaction_read_only')).rows[0]
      .default_transaction_read_only === 'on',
    'PROBE_READ_ONLY_REQUIRED',
  );
  await identity.end();
  const [{ PrismaClient }, { PrismaPg }, { default: supertest }] = await Promise.all([
    import('@prisma/client'),
    import('@prisma/adapter-pg'),
    import('supertest'),
  ]);
  const queries = [];
  prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: [{ emit: 'event', level: 'query' }],
  });
  prisma.$on('query', (event) => queries.push(event.query));
  globalThis.prisma = prisma; // Supported test/development singleton; real repositories/services.
  const { app } = await import('../../src/app.ts');
  const { logger } = await import('../../src/core/logger/logger.ts');
  logger.level = 'silent'; // Never persist request data or unexpected application diagnostics.
  const api = supertest(app),
    checks = [];
  const check = (name, condition) => {
    requireSafe(condition, `PROBE_${name}`);
    checks.push(name);
  };
  const tokens = {};
  const { default: jwt } = await import('jsonwebtoken');
  const { default: bcrypt } = await import('bcryptjs');
  for (const owner of ['a', 'b', 'empty']) {
    // Login now creates a session. This deliberately read-only probe uses the
    // representative restored session after independently checking its credential.
    const user = await prisma.user.findUnique({ where: { id: ids[owner] } });
    check(
      `RESTORED_CREDENTIAL_${owner}`,
      !!user && (await bcrypt.compare(process.env.CELESTIA_RECOVERY_LOGIN_PASSWORD, user.password)),
    );
    tokens[owner] = jwt.sign({ sid: ids[owner] }, process.env.JWT_SECRET, {
      subject: ids[owner],
      expiresIn: '15m',
    });
  }
  let requests = 0;
  const get = async (path, owner = 'a', status = 200) => {
    let request = api.get('/api/v1' + path);
    if (owner) request = request.auth(tokens[owner], { type: 'bearer' });
    const response = await request;
    requests++;
    requireSafe(response.status === status, `HTTP_EXPECTED_${status}_REQUEST_${requests}`);
    return response.body.data;
  };
  const protectedPaths = [
    `/users/${ids.a}`,
    '/games/genshin/characters',
    '/games/genshin/characters/HuTao/equipment',
    '/games/genshin/focus',
    '/companion/goals',
    '/companion/routine?contractVersion=2',
    '/companion/plan?contractVersion=1',
  ];
  for (const path of protectedPaths) await get(path, null, 401);
  check('UNAUTHENTICATED_DENIED', true);
  const profile = await get(`/users/${ids.a}`);
  check(
    'OWN_PROFILE',
    profile.id === ids.a && profile.createdAt === stamp && !('password' in profile),
  );
  await get(`/users/${ids.b}`, 'a', 404);
  await get('/games/genshin/characters/OpaqueSyntheticCharacter/equipment', 'b', 404);
  check('FOREIGN_OWNER_DENIED', true);
  const rosterA = (await get('/games/genshin/characters')).characters;
  const rosterB = (await get('/games/genshin/characters', 'b')).characters;
  check(
    'ROSTER_OWNERSHIP',
    rosterA.length === 2 &&
      rosterA.every((c) => c.accountId === ids.accountA) &&
      rosterB.length === 1 &&
      rosterB[0].accountId === ids.accountB,
  );
  const equipmentA = await get('/games/genshin/characters/HuTao/equipment');
  const equipmentB = await get('/games/genshin/characters/HuTao/equipment', 'b');
  check(
    'EQUIPMENT_ASSIGNED',
    equipmentA.character.level === 80 &&
      equipmentA.character.talents.burst === 15 &&
      equipmentA.weapon.state === 'recorded_assigned' &&
      Object.values(equipmentA.artifacts).every((v) => v.state === 'recorded_assigned'),
  );
  check(
    'EQUIPMENT_UNRECORDED_UNKNOWN',
    equipmentB.character.level === 20 &&
      equipmentB.weapon.state === 'unrecorded' &&
      Object.values(equipmentB.artifacts).every((v) => v.state === 'unknown'),
  );
  check(
    'RECEIPT_EXACT_DATE',
    equipmentA.provenance.artifacts.importedAt === '2026-10-03T03:04:05.678Z' &&
      equipmentA.provenance.artifacts.source === null,
  );
  check(
    'ZERO_RECEIPT_VERSUS_ABSENCE',
    equipmentB.provenance.weapons.entryCount === 0 &&
      equipmentB.provenance.artifacts.entryCount === null,
  );
  const focus = await get('/games/genshin/focus');
  check(
    'FOCUS_REVISIONS',
    focus.some((f) => f.characterKey === 'HuTao' && f.focused && f.revision === 7) &&
      focus.some((f) => !f.focused && f.revision === 4),
  );
  const goals = await get('/companion/goals');
  const foreign = await get('/companion/goals', 'b');
  const active = goals.find((g) => g.id === ids.active);
  check(
    'GOAL_HISTORY',
    goals.length === 5 &&
      active.predecessorId === ids.completed &&
      active.status === 'active' &&
      active.revision === 3 &&
      goals.find((g) => g.id === ids.completed).completionReason === 'good_enough' &&
      goals.find((g) => g.id === ids.archived).status === 'archived' &&
      goals.find((g) => g.id === ids.paused).status === 'paused',
  );
  check(
    'LEGACY_NOT_NORMALIZED',
    goals.find((g) => g.id === ids.legacy).fromPhase === -8 &&
      goals.find((g) => g.id === ids.legacy).toPhase === 99,
  );
  check(
    'GOAL_OWNER_FILTER',
    !goals.some((g) => g.id === ids.foreignGoal) &&
      foreign.length === 1 &&
      foreign[0].id === ids.foreignGoal,
  );
  const denied = await api
    .delete(`/api/v1/companion/goals/${ids.foreignGoal}`)
    .auth(tokens.a, { type: 'bearer' });
  requests++;
  check('FOREIGN_GOAL_DENIED', denied.status === 404);
  const routineA = await get('/companion/routine?contractVersion=2');
  const routineB = await get('/companion/routine?contractVersion=2', 'b');
  check(
    'MANUAL_CHECKPOINT',
    routineA.revision === 14 &&
      routineA.resin.known &&
      routineA.resin.checkpointAmount === 0 &&
      routineA.resin.recordedAt === stamp,
  );
  check(
    'UNKNOWN_CHECKPOINT',
    routineB.revision === 5 && !routineB.resin.known && routineB.weeklyClaims.rewardClaims === null,
  );
  const planA = await get('/companion/plan?contractVersion=1');
  const planB = await get('/companion/plan?contractVersion=1', 'b');
  check(
    'PLAN_ZERO_NULL',
    planA.revision === 11 &&
      planA.preferences.dailyResinBudget === 0 &&
      planB.preferences.dailyResinBudget === null,
  );
  check(
    'PLAN_ACTIVE_ONLY',
    planA.goals.length === 2 &&
      planA.goals.every((g) => ['active'].includes(g.goal.status)) &&
      planA.goalRevisions.length === 5,
  );
  const advice = await get('/companion/plan/advice?contractVersion=1');
  // Verified domain information can appear on an open server day, including Sunday.
  // The restored zero resin budget must never allocate a claim on any weekday.
  check(
    'NO_FABRICATED_FARMING',
    advice.budget === 0 &&
      advice.allocatedResin === 0 &&
      advice.sources.every((source) => source.claims === 0 && source.resin === 0),
  );
  const emptyRoster = (await get('/games/genshin/characters', 'empty')).characters;
  const emptyRoutine = await get('/companion/routine?contractVersion=2', 'empty');
  const emptyPlan = await get('/companion/plan?contractVersion=1', 'empty');
  check(
    'ABSENT_STATE_REMAINS_ABSENT',
    emptyRoster.length === 0 &&
      emptyRoutine.revision === 0 &&
      !emptyRoutine.resin.known &&
      emptyPlan.revision === 0 &&
      emptyPlan.goals.length === 0,
  );
  const { GenshinAccountService } =
    await import('../../src/games/genshin/accounts/account.service.ts');
  const account = await new GenshinAccountService().getAccountByUserId(ids.a);
  check(
    'OWN_ACCOUNT_SERVICE',
    account.id === ids.accountA &&
      account.userId === ids.a &&
      account.uid === null &&
      account.worldLevel === 0,
  );
  const nikke = await get('/games/nikke/accounts/me', 'b');
  check('RETAINED_NIKKE_READ', nikke.userId === ids.b && nikke.commanderName === 'C5b synthetic');
  // Existing clock-injection seam verifies saved-period semantics independently
  // of the real wall clock used by the HTTP routes. No provider/game facts are mocked.
  const { GenshinCompanionProvider } =
    await import('../../src/games/genshin/companion/genshin-companion.provider.ts');
  const { RoutineService } = await import('../../src/platform/companion/routine.service.ts');
  const { RoutineRepository } = await import('../../src/platform/companion/routine.repository.ts');
  const { PlanService } = await import('../../src/platform/companion/plan.service.ts');
  const { PlanRepository } = await import('../../src/platform/companion/plan.repository.ts');
  const provider = new GenshinCompanionProvider();
  const clock = () => new Date('2026-10-05T04:04:05.678Z');
  const savedRoutine = await new RoutineService(
    new RoutineRepository(prisma),
    provider,
    clock,
    prisma,
  ).getSnapshot(ids.a);
  const savedPlan = await new PlanService(
    provider,
    new PlanRepository(prisma),
    undefined,
    undefined,
    clock,
  ).getSnapshot(ids.a);
  check(
    'SAVED_WEEK_ZERO',
    savedRoutine.weeklyClaims.rewardClaims === 0 && savedRoutine.resin.checkpointAmount === 0,
  );
  check(
    'SAVED_DISMISSALS',
    savedPlan.goals.find((g) => g.goal.id === ids.active).dismissed.includes('day') &&
      savedPlan.routines.find((r) => r.kind === 'weeklyClaims').dismissed,
  );
  check(
    'SELECT_ONLY',
    queries.length > 0 && queries.every((query) => /^SELECT\b/i.test(query.trim())),
  );
  privateWrite(
    root,
    'application-read-results.json',
    JSON.stringify(
      {
        passed: true,
        requests,
        checks,
        queryCount: queries.length,
        onlySelect: true,
        productionRoutes: true,
        syntheticAuthentication: true,
        rawQueriesPersisted: false,
      },
      null,
      2,
    ) + '\n',
  );
} catch (error) {
  if (root)
    privateWrite(root, 'application-read-failure.json', JSON.stringify(safeFailure(error)) + '\n');
  process.exitCode = 1;
} finally {
  await prisma?.$disconnect();
}
