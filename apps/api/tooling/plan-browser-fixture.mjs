// Disposable C4 browser acceptance only. Never imported by the application.
import { readFile } from 'node:fs/promises';

import express from 'express';

import { disposableTestDatabase } from '../dist/core/db/disposable-test-database.js';

if (!disposableTestDatabase()) throw new Error('Explicit test database required.');
const { app } = await import('../dist/app.js');
const { prisma } = await import('../dist/core/db/prisma.js');
const { AuthService } = await import('../dist/platform/auth/auth.service.js');
const { GoalService } = await import('../dist/platform/companion/goal.service.js');
const { GenshinImportService } = await import('../dist/games/genshin/importer/importer.service.js');
const auth = new AuthService(),
  importer = new GenshinImportService(),
  goals = new GoalService();
for (const suffix of ['a', 'b', 'empty']) {
  const email = `c4-${suffix}@test.invalid`;
  if (await prisma.user.findUnique({ where: { email } })) continue;
  await auth.register({ email, username: `c4-${suffix}`, password: 'Celestia-c4-only!' });
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  if (suffix === 'empty') continue;
  const payload = {
    characters: [
      {
        key: 'HuTao',
        level: suffix === 'a' ? 80 : 20,
        ascension: suffix === 'a' ? 5 : 0,
        constellation: 0,
        talent: { auto: 1, skill: 1, burst: 1 },
      },
    ],
    ...(suffix === 'a' ? { materials: { Mora: 13000, GuideToDiligence: 1 } } : {}),
  };
  const request = {
    requestVersion: 1,
    sections: Object.keys(payload),
    payload: { format: 'GOOD', version: 2, source: `C4 synthetic ${suffix}`, ...payload },
  };
  const preview = await importer.preview(user.id, request);
  await importer.importAccount(user.id, {
    ...request,
    previewToken: preview.previewToken,
    confirmClear: preview.clearSections,
  });
  await prisma.genshinRoutineState.create({ data: { userId: user.id, serverId: 'asia' } });
  if (suffix === 'a') {
    for (const [slot, priority] of [
      ['normal', 1],
      ['skill', 2],
      ['burst', 2],
    ])
      await goals.createGoal(user.id, {
        contractVersion: 3,
        requestId: crypto.randomUUID(),
        goalType: 'CHARACTER_TALENT',
        targetKey: 'HuTao',
        talentType: slot,
        fromPhase: 1,
        toPhase: 6,
        priority,
      });
    await goals.createGoal(user.id, {
      contractVersion: 3,
      requestId: crypto.randomUUID(),
      goalType: 'CHARACTER_ASCENSION',
      targetKey: 'HuTao',
      fromPhase: 5,
      toPhase: 6,
      priority: 3,
    });
    await prisma.upgradeGoal.create({
      data: {
        userId: user.id,
        goalType: 'CHARACTER_TALENT',
        targetKey: 'LegacyReviewTarget',
        fromPhase: -8,
        toPhase: 99,
        talentType: 'invalid',
        priority: 4,
      },
    });
  }
}
const fixture = express();
fixture.use(async (req, res, next) => {
  const control = process.env.CELESTIA_TEST_CONTROL_FILE
    ? JSON.parse(await readFile(process.env.CELESTIA_TEST_CONTROL_FILE, 'utf8'))
    : {};
  const save = req.method === 'PATCH' && req.path.startsWith('/api/v1/companion/');
  const fail =
    (save && control.failSave) ||
    (req.method === 'GET' && req.path === '/api/v1/companion/plan/advice' && control.failAdvice);
  if (save && control.delayMs) {
    if (!Number.isInteger(control.delayMs) || control.delayMs < 0 || control.delayMs > 30000)
      throw new Error('Invalid delay');
    await new Promise((resolve) => setTimeout(resolve, control.delayMs));
  }
  if (fail)
    return res
      .header('Access-Control-Allow-Origin', 'http://127.0.0.1:45449')
      .status(503)
      .json({
        success: false,
        error: { code: 'FIXTURE_FAILURE', message: 'Synthetic fixture failure' },
      });
  next();
});
fixture.use(app);
const server = fixture.listen(45448, '127.0.0.1', () =>
  process.stdout.write('C4 browser fixture ready on 127.0.0.1:45448\n'),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      void prisma.$disconnect().then(() => process.exit(0));
    }),
  );
