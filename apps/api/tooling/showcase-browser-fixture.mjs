// Test-only full-app fixture. No browser/API response interception, login or database.
if (
  process.env.NODE_ENV !== 'test' ||
  process.env.DATABASE_URL !== 'postgresql://synthetic:synthetic@127.0.0.1:1/never_connect'
) {
  throw new Error('Requires the explicit synthetic, unreachable database declaration.');
}
const { createApp } = await import('../src/app.ts');
const { ShowcaseService } = await import('../src/games/genshin/showcase/showcase.service.ts');
const { syntheticShowcase } = await import('../src/games/genshin/showcase/showcase.fixtures.ts');
const { default: express } = await import('express');
let mode = process.env.SHOWCASE_FIXTURE_MODE ?? 'ok';
let calls = 0;
let authRequests = 0;
const service = new ShowcaseService(async (url) => {
  calls++;
  if (mode === 'fail') return new Response('', { status: 503, headers: { 'Retry-After': '5' } });
  if (mode === 'notfound') return new Response('', { status: 404 });
  if (mode === 'limit') return new Response('', { status: 429, headers: { 'Retry-After': '5' } });
  const payload = syntheticShowcase(String(url).split('/').filter(Boolean).at(-1));
  payload.ttl = 10; // Short real-time cache windows for repeatable browser checks.
  if (mode === 'empty') payload.avatarInfoList = [];
  if (mode === 'columbina')
    payload.avatarInfoList = [
      {
        avatarId: 10000125,
        fightPropMap: {},
        propMap: { 4001: { val: '90' } },
        skillLevelMap: { 11251: 8, 11252: 9, 11255: 10 },
      },
    ];
  return new Response(JSON.stringify(payload));
}, Date.now);
const app = createApp({ showcaseService: service });
app.post('/__fixture/:mode', (req, res) => {
  mode = req.params.mode;
  res.json({ calls, mode });
});
app.get('/__fixture', (_req, res) => res.json({ calls, mode, authRequests }));
const listener = express();
listener.use((req, _res, next) => {
  if (req.path.startsWith('/api/v1/auth/')) authRequests++;
  next();
});
listener.use(app);
const server = listener.listen(45760, '127.0.0.1', () =>
  console.log('Synthetic showcase fixture: 127.0.0.1:45760'),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close(() => process.exit(0)));
