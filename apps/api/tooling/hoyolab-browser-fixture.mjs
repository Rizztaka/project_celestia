// Synthetic local acceptance only. This file is never imported by production.
import { disposableTestDatabase } from '../dist/core/db/disposable-test-database.js';
if (
  !disposableTestDatabase() ||
  process.env.DATABASE_URL !== process.env.CELESTIA_TEST_DATABASE_URL ||
  process.env.NODE_ENV !== 'test'
)
  throw Error('Explicit disposable test environment required.');
process.env.HOYOLAB_SESSION_KEY = Buffer.alloc(32, 42).toString('base64');
const { fixtureCookies, fixtureRole, fixtureDetailResponse, fixtureNotes } =
  await import('../dist/games/genshin/hoyolab/hoyolab.fixtures.js');
const { mapCharacters } = await import('../dist/games/genshin/hoyolab/hoyolab.mapper.js');
const { HoyolabProvider } = await import('../dist/games/genshin/hoyolab/hoyolab.provider.js');
HoyolabProvider.prototype.accounts = async () => [fixtureRole];
HoyolabProvider.prototype.snapshot = async () => ({
  role: fixtureRole,
  characters: mapCharacters(fixtureDetailResponse(), [10000038]),
  observedAt: new Date(),
  notes: {
    observedAt: new Date().toISOString(),
    resin: {
      current: fixtureNotes.current_resin,
      max: fixtureNotes.max_resin,
      fullInSeconds: Number(fixtureNotes.resin_recovery_time),
    },
    commissions: { completed: 4, total: 4, rewardClaimed: false },
    expeditions: { finished: 1, total: 1 },
    realmCurrency: null,
  },
});
const { prisma } = await import('../dist/core/db/prisma.js');
const { AuthService } = await import('../dist/platform/auth/auth.service.js');
const { HoyolabService } = await import('../dist/games/genshin/hoyolab/hoyolab.service.js');
const email = 'hoyolab-browser@test.invalid';
if (!(await prisma.user.findUnique({ where: { email } })))
  await new AuthService().register({
    email,
    username: 'hoyolab-browser',
    password: 'Celestia-hoyo-only!',
  });
const user = await prisma.user.findUniqueOrThrow({ where: { email } });
const connection = new HoyolabService();
const initial = await connection.status(user.id);
if (!initial.connected) await connection.connect(user.id, fixtureCookies);
if (!initial.syncedAt) await connection.sync(user.id);
const account = await prisma.genshinAccount.findUniqueOrThrow({ where: { userId: user.id } });
if (
  !(await prisma.genshinArtifact.findFirst({
    where: { accountId: account.id, setKey: 'UnwornFixture' },
  }))
)
  await prisma.genshinArtifact.create({
    data: {
      accountId: account.id,
      setKey: 'UnwornFixture',
      slotKey: 'flower',
      rarity: 5,
      level: 0,
      mainStatKey: 'hp',
      subStats: [],
    },
  });
const { app } = await import('../dist/app.js');
const server = app.listen(45450, '127.0.0.1', () =>
  process.stdout.write('Synthetic HoYoLAB acceptance API: 127.0.0.1:45450\n'),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      void prisma.$disconnect().then(() => process.exit(0));
    }),
  );
