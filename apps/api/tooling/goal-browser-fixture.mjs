// Disposable browser acceptance only. Never loaded by the application.
import { readFile } from 'node:fs/promises';

import express from 'express';

const url = new URL(process.env.CELESTIA_TEST_DATABASE_URL ?? '');
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
  !url.pathname.startsWith('/celestia_test_')
)
  throw new Error('Explicit disposable loopback celestia_test_* database required.');
process.env.DATABASE_URL = url.toString();
process.env.NODE_ENV = 'test';
process.env.DOTENV_CONFIG_PATH = 'NUL';
process.env.JWT_SECRET = 'c3b-browser-fixture-secret-only-at-least-32';
process.env.OPENROUTER_API_KEY = 'c3b-disposable-dummy';
const { app } = await import('../dist/app.js');
const { prisma } = await import('../dist/core/db/prisma.js');
const { AuthService } = await import('../dist/platform/auth/auth.service.js');
const { GenshinImportService } = await import('../dist/games/genshin/importer/importer.service.js');
const auth = new AuthService();
const importer = new GenshinImportService();
const character = (key, level = 80) => ({
  key,
  level,
  ascension: 5,
  constellation: 3,
  talent: { auto: 9, skill: 12, burst: 15 },
});
for (const [suffix, payload] of [
  [
    'a',
    {
      characters: [character('HuTao'), character('UnknownPilot')],
      weapons: [{ key: 'StaffOfHoma', level: 80, ascension: 5, refinement: 1, location: 'HuTao' }],
      artifacts: ['flower', 'plume', 'sands', 'goblet', 'circlet'].map((slotKey) => ({
        setKey: 'CrimsonWitchOfFlames',
        slotKey,
        level: 20,
        rarity: 5,
        mainStatKey: 'opaque_main_',
        substats: [{ key: 'opaque_substat', value: 0 }],
        location: 'HuTao',
      })),
      materials: { Mora: 13000 },
    },
  ],
  ['b', { characters: [character('HuTao', 20), character('OtherPilot', 20)] }],
  ['empty', null],
]) {
  const email = `c3b-${suffix}@test.invalid`;
  if (await prisma.user.findUnique({ where: { email } })) continue;
  await auth.register({ email, username: `c3b-${suffix}`, password: 'Celestia-c3b-only!' });
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  await prisma.genshinRoutineState.create({
    data: { userId: user.id, serverId: 'asia', resinAmount: 0, resinRecordedAt: new Date() },
  });
  if (payload) {
    const request = {
      requestVersion: 1,
      sections: Object.keys(payload),
      payload: { format: 'GOOD', version: 2, source: `C3b synthetic ${suffix}`, ...payload },
    };
    const preview = await importer.preview(user.id, request);
    await importer.importAccount(user.id, {
      ...request,
      previewToken: preview.previewToken,
      confirmClear: preview.clearSections,
    });
  }
}
const fixture = express();
fixture.use(async (req, res, next) => {
  if (
    process.env.CELESTIA_TEST_CONTROL_FILE &&
    ['POST', 'PATCH'].includes(req.method) &&
    req.path.includes('/companion/goals')
  ) {
    const control = JSON.parse(await readFile(process.env.CELESTIA_TEST_CONTROL_FILE, 'utf8'));
    const delay = control.delayMs ?? 0;
    if (!Number.isInteger(delay) || delay < 0 || delay > 30000)
      throw new Error('Invalid fixture delay.');
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    if (control.failSave)
      return res
        .header('Access-Control-Allow-Origin', 'http://127.0.0.1:45447')
        .status(503)
        .json({
          success: false,
          error: {
            code: 'FIXTURE_FAILURE',
            message: 'Synthetic failed save. Your draft has been retained.',
          },
        });
  }
  next();
});
fixture.use(app);
const server = fixture.listen(45446, '127.0.0.1', () =>
  process.stdout.write('C3b synthetic browser fixture on 127.0.0.1:45446\n'),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      void prisma.$disconnect().then(() => process.exit(0));
    }),
  );
