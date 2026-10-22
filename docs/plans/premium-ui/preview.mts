// Local visual acceptance only. All writes are in memory; no database connection.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

Object.assign(process.env, {
  NODE_ENV: 'test',
  DOTENV_CONFIG_PATH: 'NUL',
  DATABASE_URL: 'postgresql://synthetic:synthetic@127.0.0.1:1/never_connected',
  JWT_SECRET: 'premium-preview-synthetic-not-an-account-secret',
});
const root = new URL('../../../', import.meta.url);
const apiRequire = createRequire(new URL('apps/api/package.json', root));
const webRequire = createRequire(new URL('apps/web/package.json', root));
const express = apiRequire('express');
const { createServer } = webRequire('vite');
const { ProfileReferenceService } =
  await import('../../../apps/api/src/games/genshin/characters/profile-reference.service.ts');
const { BuildInsightsService } =
  await import('../../../apps/api/src/games/genshin/intelligence/build-insights/build-insights.service.ts');
const { GenshinCharacterEquipmentService } =
  await import('../../../apps/api/src/games/genshin/characters/character-equipment.service.ts');
const { buildInsightQuerySchema } = await import('../../../packages/api-contracts/dist/index.js');
const refs = new ProfileReferenceService();
const keys = [
  'Albedo',
  'Alhaitham',
  'Keqing',
  'Furina',
  'Nahida',
  'RaidenShogun',
  'HuTao',
  'KaedeharaKazuha',
  'Zhongli',
  'Xiangling',
  'Bennett',
  'Yelan',
];
const weaponFor = {
  Sword: 'HarbingerOfDawn',
  Claymore: 'DebateClub',
  Polearm: 'WhiteTassel',
  Catalyst: 'ThrillingTalesOfDragonSlayers',
  Bow: 'Slingshot',
};
const weapons = keys.map((key, i) => ({
  id: `weapon-${i}`,
  weaponKey: weaponFor[refs.character(key).weaponType],
  level: 90,
  ascension: 6,
  refinement: 5,
  locked: true,
}));
const characters = keys.map((key, i) => ({
  id: key,
  characterKey: key,
  level: i % 3 ? 90 : 80,
  ascension: 6,
  constellation: [0, 2, 1, 0, 2, 0, 1, 0, 0, 6, 5, 1][i],
  talentNormal: 8,
  talentSkill: 9,
  talentBurst: 10,
  equippedWeapon: weapons[i],
}));
const artifacts = ['flower', 'plume', 'sands', 'goblet'].map((slotKey, i) => ({
  id: `artifact-${i}`,
  slotKey,
  setKey: 'DeepwoodMemories',
  rarity: 5,
  level: 20,
  mainStatKey: i === 0 ? 'hp' : i === 1 ? 'atk' : 'atk_',
  subStats: [{ key: 'critRate_', value: 3.9 }],
  locked: false,
}));
const repository = {
  readForUser: async (_owner, key) => {
    const character = characters.find((c) => c.characterKey === key);
    return character
      ? {
          character,
          weapon: character.equippedWeapon,
          artifacts,
          receipts: [],
          weaponRelationConsistent: true,
          artifactRelationsConsistent: true,
        }
      : null;
  },
};
const insights = new BuildInsightsService(repository as never);
const equipment = new GenshinCharacterEquipmentService(repository as never);
const now = () => new Date().toISOString();
let focus = [{ characterKey: 'Albedo', focused: true, revision: 1 }];
let plan = {
  contractVersion: 1,
  revision: 0,
  routineRevision: 0,
  serverNow: now(),
  serverId: null,
  period: null,
  preferences: { dailyResinBudget: null, enabledRoutineKinds: [] },
  goalRevisions: [],
  goals: [],
  routines: [],
  weekly: { rewardClaims: null, available: false },
};
let routine = {
  contractVersion: 2,
  revision: 0,
  serverNow: now(),
  clockStatus: 'unselected',
  serverId: null,
  period: null,
  tasks: [],
  resin: { known: false, reason: 'no_checkpoint' },
  weeklyClaims: { available: false, rewardClaims: null },
  legacy: null,
};
const materials = {
  contractVersion: 2,
  needed: {},
  inventory: {},
  delta: {},
  planningDelta: {},
  goals: [],
  neededComplete: true,
  sources: [],
  stockBasis: {
    kind: 'recorded_import',
    source: null,
    importedAt: null,
    scope: null,
    suppliedEntryCount: null,
  },
};
const user = {
  id: 'local-ui-fixture',
  username: 'Traveler',
  email: 'traveler@test.invalid',
  createdAt: now(),
  emailVerified: true,
};
const token = `fixture.${Buffer.from(JSON.stringify({ sid: 'local-ui-only' })).toString('base64url')}.fixture`;
const requests: unknown[] = [];
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(async (req, res) => {
  res.on('finish', () => {
    requests.push({ method: req.method, path: req.path, status: res.statusCode });
    writeFileSync(
      new URL('browser-requests.json', import.meta.url),
      JSON.stringify(requests, null, 2),
    );
  });
  const path = req.path.replace('/api/v1', '');
  const ok = (data) => res.json({ success: true, data });
  try {
    if (path === '/auth/refresh')
      return res.status(401).json({
        success: false,
        error: { code: 'FIXTURE', message: 'Sign in to the local fixture.' },
      });
    if (path === '/auth/login' || path === '/auth/register') return ok({ user, token });
    if (path === '/auth/logout') return ok({});
    if (path === '/auth/oauth/providers') return ok({ discord: false, google: false });
    if (path === '/auth/me') return ok(user);
    if (path === '/auth/sessions') return ok([]);
    if (path === '/games/genshin/characters') return ok({ characters, total: characters.length });
    if (path === '/games/genshin/weapons') return ok({ weapons, total: weapons.length });
    if (path === '/games/genshin/artifacts') return ok({ artifacts, total: artifacts.length });
    if (path === '/games/genshin/import/status')
      return ok({
        sections: ['characters', 'weapons', 'artifacts'].map((section) => ({
          section,
          status: 'unknown',
          importedAt: null,
          source: null,
          entryCount: null,
          scope: section === 'characters' ? 'merged_entries' : 'replacement_section',
        })),
      });
    const character = path.match(
      /^\/games\/genshin\/characters\/([^/]+)\/(reference|equipment|build-insights|focus)$/,
    );
    if (character) {
      const [, key, action] = character;
      if (action === 'reference') return ok(refs.character(key));
      if (action === 'equipment') return ok(await equipment.read(user.id, key));
      if (action === 'build-insights')
        return ok(await insights.read(user.id, key, buildInsightQuerySchema.parse(req.query)));
      if (action === 'focus') {
        const row = {
          characterKey: key,
          focused: !!req.body.focused,
          revision: (focus.find((r) => r.characterKey === key)?.revision ?? 0) + 1,
        };
        focus = [...focus.filter((r) => r.characterKey !== key), row];
        return ok(row);
      }
    }
    const reference = path.match(/^\/games\/genshin\/references\/(weapons|artifacts)\/([^/]+)$/);
    if (reference)
      return ok(
        reference[1] === 'weapons' ? refs.weapon(reference[2]) : refs.artifact(reference[2]),
      );
    if (path === '/games/genshin/focus') return ok(focus);
    if (path === '/companion/goals') return ok([]);
    if (path === '/companion/goals/materials') return ok(materials);
    if (path === '/companion/events')
      return ok({
        availability: { available: false, reason: 'No synthetic event schedule.' },
        patch: 'fixture',
        totalUnclaimedPrimogems: 0,
        events: [],
      });
    if (path === '/companion/plan') {
      if (req.method === 'PATCH')
        plan = {
          ...plan,
          revision: plan.revision + 1,
          preferences: req.body.preferences ?? plan.preferences,
        };
      return ok({ ...plan, serverNow: now() });
    }
    if (path === '/companion/plan/advice')
      return ok({
        contractVersion: 1,
        revision: plan.revision,
        routineRevision: plan.routineRevision,
        goalRevisions: [],
        dailyPeriodId: null,
        serverNow: now(),
        materials,
        goalDemand: [],
        budget: null,
        availableResin: null,
        ceiling: null,
        allocatedResin: 0,
        sources: [],
        reason: 'Add goals to explore material planning.',
      });
    if (path === '/companion/routine') return ok({ ...routine, serverNow: now() });
    if (path === '/companion/routine/resin') {
      routine = {
        ...routine,
        revision: routine.revision + 1,
        resin: {
          known: true,
          currentAmount: req.body.amount,
          checkpointAmount: req.body.amount,
          cap: 200,
          recordedAt: now(),
          projectedAt: now(),
          regenIntervalMs: 480000,
          capAt: new Date(Date.now() + (200 - req.body.amount) * 480000).toISOString(),
        },
      } as never;
      return ok(routine);
    }
    if (path === '/games/genshin/endgame/abyss') return ok({ cycles: [], totalRuns: 0 });
    if (path === '/games/genshin/endgame/theater') return ok({ runs: [] });
    return res.status(503).json({
      success: false,
      error: {
        code: 'FIXTURE_UNSUPPORTED',
        message: 'This action is outside the local visual fixture.',
      },
    });
  } catch (error) {
    return res
      .status(error.statusCode ?? 400)
      .json({ success: false, error: { code: 'FIXTURE', message: error.message } });
  }
});
const api = app.listen(45472, '127.0.0.1');
const vite = await createServer({
  root: fileURLToPath(new URL('apps/web/', root)),
  configFile: fileURLToPath(new URL('apps/web/vite.config.ts', root)),
  plugins: [
    {
      name: 'premium-ui-mobile-fixture',
      configureServer(server) {
        server.middlewares.use('/__mobile', (req, res) => {
          const requested = Number(
            new URL(req.url ?? '/', 'http://127.0.0.1').searchParams.get('width'),
          );
          const width = [320, 390, 640, 1280].includes(requested) ? requested : 390;
          res.setHeader('Content-Type', 'text/html');
          res.end(
            `<!doctype html><html><head><title>${width}px mobile acceptance</title></head><body style="margin:0;background:#090a0b;display:flex;justify-content:center"><iframe title="Mobile Celestia" src="/roster" style="border:0;width:${width}px;height:700px;flex-shrink:0"></iframe><output id="layout" style="position:fixed;bottom:0;color:#ddd;font:11px monospace"></output><script>setInterval(()=>{const f=document.querySelector('iframe');const d=f.contentDocument;if(!d)return;const h=d.querySelector('.companion-header');const clipped=[...d.querySelectorAll('main button, main input, main select')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.left<0||r.right>f.contentWindow.innerWidth)}).length;document.querySelector('#layout').textContent='Viewport: '+f.contentWindow.innerWidth+' | Horizontal overflow: '+Math.max(0,d.documentElement.scrollWidth-d.documentElement.clientWidth)+' | Clipped controls: '+clipped+' | Header overflow: '+(h?Math.max(0,h.scrollHeight-h.clientHeight):0)},500)</script></body></html>`,
          );
        });
      },
    },
  ],
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('http://127.0.0.1:45471/api/v1') },
  server: {
    host: '127.0.0.1',
    port: 45471,
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:45472' } },
  },
});

await vite.listen();
console.log('Synthetic full-app preview: http://127.0.0.1:45471/login');
const close = async () => {
  await vite.close();
  api.close();
  process.exit(0);
};
process.on('SIGINT', close);
process.on('SIGTERM', close);
