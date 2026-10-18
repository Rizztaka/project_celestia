// C5 synthetic acceptance only. Never imported by production startup.
import { appendFileSync, readFileSync } from 'node:fs';

import cors from 'cors';
import express from 'express';

import { disposableTestDatabase } from '../dist/core/db/disposable-test-database.js';

if (!disposableTestDatabase() || !process.env.CELESTIA_TEST_CONTROL_FILE)
  throw new Error('Guarded disposable database and control file required.');
const { app } = await import('../dist/app.js');
const { prisma } = await import('../dist/core/db/prisma.js');
const { AuthService } = await import('../dist/platform/auth/auth.service.js');
const { requireAuth } = await import('../dist/core/middleware/auth.middleware.js');
const { RoutineService } = await import('../dist/platform/companion/routine.service.js');
const { RoutineRepository } = await import('../dist/platform/companion/routine.repository.js');
const { PlanService } = await import('../dist/platform/companion/plan.service.js');
const { GenshinCompanionProvider } =
  await import('../dist/games/genshin/companion/genshin-companion.provider.js');
const owners = {};
for (const suffix of ['a', 'b', 'empty']) {
  const email = `c5-${suffix}@test.invalid`;
  if (!(await prisma.user.findUnique({ where: { email } })))
    await new AuthService().register({
      email,
      username: `c5-${suffix}`,
      password: 'Celestia-c5-only!',
    });
  owners[suffix] = (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
}
const control = () => JSON.parse(readFileSync(process.env.CELESTIA_TEST_CONTROL_FILE, 'utf8'));
let clockStamp, clockBase, clockReceived;
function clock() {
  const stamp = control().clock;
  if (!stamp) return new Date();
  if (stamp !== clockStamp) {
    clockBase = Date.parse(stamp);
    if (!Number.isFinite(clockBase)) throw new Error('Invalid fixture clock');
    clockStamp = stamp;
    clockReceived = performance.now();
  }
  return new Date(clockBase + performance.now() - clockReceived);
}
const provider = new GenshinCompanionProvider();
const routine = new RoutineService(new RoutineRepository(), provider, clock);
const plan = new PlanService(provider, undefined, undefined, undefined, clock);
const fixture = express();
fixture.use(cors({ origin: 'http://127.0.0.1:45449' }));
fixture.use(async (req, res, next) => {
  const settings = control();
  const match = req.path === settings.path && req.method === settings.method;
  // Only synthetic request metadata is logged; never bearer tokens or request bodies.
  const record = { method: req.method, path: req.path, started: new Date().toISOString() };
  res.on('finish', () => {
    if (process.env.CELESTIA_TEST_REQUEST_LOG)
      appendFileSync(
        process.env.CELESTIA_TEST_REQUEST_LOG,
        JSON.stringify({ ...record, status: res.statusCode, ended: new Date().toISOString() }) +
          '\n',
      );
  });
  if (match && settings.delayMs) {
    if (!Number.isInteger(settings.delayMs) || settings.delayMs < 0 || settings.delayMs > 30000)
      throw new Error('Invalid delay');
    await new Promise((resolve) => setTimeout(resolve, settings.delayMs));
  }
  if (match && settings.fail)
    return res.status(503).json({
      success: false,
      error: { code: 'FIXTURE_FAILURE', message: 'Synthetic fixture failure' },
    });
  next();
});
// Controlled clock overrides use the actual services and production-default rule availability.
const timed = express.Router();
timed.use(express.json());
timed.use(requireAuth);
timed.get('/routine', async (req, res) =>
  res.json({ success: true, data: await routine.getSnapshot(req.user.id) }),
);
for (const [path, method] of [
  ['settings', 'patchSettings'],
  ['checklist', 'patchChecklist'],
  ['resin', 'patchResin'],
  ['weekly-claims', 'patchWeeklyClaims'],
])
  timed.patch(`/routine/${path}`, async (req, res) =>
    res.json({ success: true, data: await routine[method](req.user.id, req.body) }),
  );
timed.get('/plan', async (req, res) =>
  res.json({ success: true, data: await plan.getSnapshot(req.user.id) }),
);
timed.get('/plan/advice', async (req, res) =>
  res.json({ success: true, data: await plan.getAdvice(req.user.id) }),
);
timed.patch('/plan', async (req, res) =>
  res.json({ success: true, data: await plan.update(req.user.id, req.body) }),
);
fixture.use('/api/v1/companion', (req, res, next) =>
  control().clock ? timed(req, res, next) : next(),
);
fixture.use(app);
fixture.use((error, _req, res, _next) => {
  void _next;
  res.status(error.statusCode ?? 500).json({
    success: false,
    error: { code: error.errorCode ?? 'FIXTURE_ERROR', message: error.message },
  });
});
const server = fixture.listen(45448, '127.0.0.1', () =>
  process.stdout.write('C5 fixture ready: 127.0.0.1:45448\n'),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      void prisma.$disconnect().then(() => process.exit(0));
    }),
  );
