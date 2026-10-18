// Local acceptance only; never imported by the application or included in dist.
import express from 'express';
const url = new URL(process.env.CELESTIA_TEST_DATABASE_URL ?? '');
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
  !url.pathname.slice(1).startsWith('celestia_test_')
)
  throw new Error('Explicit disposable loopback celestia_test_* database required.');
process.env.DATABASE_URL = url.toString();
process.env.NODE_ENV = 'test';
process.env.DOTENV_CONFIG_PATH = 'NUL';
process.env.JWT_SECRET = 'local-c3a-browser-fixture-secret-at-least-32-characters';
process.env.OPENROUTER_API_KEY = 'test-only-no-network';
const { app } = await import('../dist/app.js');
const { prisma } = await import('../dist/core/db/prisma.js');
const { AuthService } = await import('../dist/platform/auth/auth.service.js');
const { GenshinImportService } = await import('../dist/games/genshin/importer/importer.service.js');
const auth = new AuthService();
const importer = new GenshinImportService();
const character = (key = 'HuTao') => ({
  key,
  level: 80,
  ascension: 6,
  constellation: 3,
  talent: { auto: 9, skill: 12, burst: 15 },
});
const slots = ['flower', 'plume', 'sands', 'goblet', 'circlet'];
for (const [suffix, payload] of [
  [
    'complete',
    {
      characters: [character()],
      weapons: [{ key: 'StaffOfHoma', level: 90, ascension: 6, refinement: 2, location: 'HuTao' }],
      artifacts: slots.map((slotKey, index) => ({
        setKey: index < 4 ? 'CrimsonWitchOfFlames' : 'OpaqueSet',
        slotKey,
        rarity: 5,
        level: 20,
        mainStatKey: index === 0 ? 'hp' : 'opaque_main_',
        location: 'HuTao',
        substats: [
          { key: 'critRate_', value: 7.7 },
          { key: 'opaque_substat', value: 0 },
        ],
      })),
    },
  ],
  [
    'partial',
    {
      characters: [character(), character('UnknownPilot')],
      artifacts: [
        {
          setKey: 'UnknownSet',
          slotKey: 'flower',
          level: 0,
          rarity: 4,
          mainStatKey: 'hp',
          location: 'HuTao',
          substats: [],
        },
      ],
    },
  ],
  ['empty', null],
]) {
  const email = `c3a-${suffix}@test.invalid`;
  if (await prisma.user.findUnique({ where: { email } })) continue;
  await auth.register({ email, username: `c3a-${suffix}`, password: 'Celestia-c3a-only!' });
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  if (!payload) continue;
  const request = {
    requestVersion: 1,
    sections: Object.keys(payload),
    payload: { format: 'GOOD', version: 2, source: `C3a ${suffix} fixture`, ...payload },
  };
  const preview = await importer.preview(user.id, request);
  await importer.importAccount(user.id, {
    ...request,
    previewToken: preview.previewToken,
    confirmClear: preview.clearSections,
  });
}
// Optional bounded transport delay for observing the actual page's loading state.
const delay = Number(process.env.CELESTIA_TEST_READ_DELAY_MS ?? 0);
if (!Number.isInteger(delay) || delay < 0 || delay > 5000) throw new Error('Invalid test delay.');
const fixture = express();
fixture.use(async (req, _res, next) => {
  if (
    delay &&
    req.method === 'GET' &&
    /^\/api\/v1\/games\/genshin\/characters\/.+\/equipment$/.test(req.path)
  ) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  next();
});
fixture.use(app);
const server = fixture.listen(45444, '127.0.0.1', () =>
  process.stdout.write('C3a synthetic browser fixture on 127.0.0.1:45444\n'),
);
process.on('SIGTERM', () =>
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  }),
);
