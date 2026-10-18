// Local acceptance harness. Never imported by the application or included in dist.
// Requires an explicit disposable database and a clock file controlled by the tester.
import { readFileSync } from 'node:fs';

import cors from 'cors';
import express from 'express';

const url = new URL(process.env.CELESTIA_TEST_DATABASE_URL ?? '');
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
  !url.pathname.slice(1).startsWith('celestia_test_') ||
  !process.env.CELESTIA_TEST_CLOCK_FILE
) {
  throw new Error('Explicit loopback celestia_test_* database and test clock file required.');
}
process.env.DATABASE_URL = url.toString();
process.env.NODE_ENV = 'test';
process.env.DOTENV_CONFIG_PATH = 'NUL';
process.env.JWT_SECRET = 'local-c2a-browser-fixture-secret-at-least-32-characters';
process.env.OPENROUTER_API_KEY = 'test-only-no-network';

const { app } = await import('../dist/app.js');
const { requireAuth } = await import('../dist/core/middleware/auth.middleware.js');
const { RoutineService } = await import('../dist/platform/companion/routine.service.js');
const { RoutineRepository } = await import('../dist/platform/companion/routine.repository.js');
const { GenshinCompanionProvider } =
  await import('../dist/games/genshin/companion/genshin-companion.provider.js');
let stamp;
let base;
let received;
function clock() {
  const next = readFileSync(process.env.CELESTIA_TEST_CLOCK_FILE, 'utf8').trim();
  if (next !== stamp) {
    base = Date.parse(next);
    if (!Number.isFinite(base)) throw new Error('Invalid fixture clock.');
    stamp = next;
    received = performance.now();
  }
  return new Date(base + performance.now() - received);
}
clock();
const service = new RoutineService(new RoutineRepository(), new GenshinCompanionProvider(), clock);
const fixture = express();
fixture.use(cors({ origin: 'http://127.0.0.1:45441' }));
fixture.use(express.json());
const root = '/api/v1/companion/routine';
fixture.get(root, requireAuth, async (req, res) => {
  res.json({ success: true, data: await service.getSnapshot(req.user.id) });
});
for (const [route, method] of [
  ['settings', 'patchSettings'],
  ['checklist', 'patchChecklist'],
  ['resin', 'patchResin'],
  ['weekly-claims', 'patchWeeklyClaims'],
]) {
  fixture.patch(`${root}/${route}`, requireAuth, async (req, res) => {
    res.json({ success: true, data: await service[method](req.user.id, req.body) });
  });
}
fixture.use(app);
fixture.use((error, _req, res, _next) => {
  void _next; // Express identifies error middleware by all four parameters.
  res.status(error.statusCode ?? 400).json({
    success: false,
    error: { code: error.errorCode ?? 'BAD_REQUEST', message: error.message },
  });
});
fixture.listen(45440, '127.0.0.1', () => {
  process.stdout.write('Test-only injected routine clock on 127.0.0.1:45440\n');
});
