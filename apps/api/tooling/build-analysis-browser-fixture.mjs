if (
  process.env.NODE_ENV !== 'test' ||
  process.env.DATABASE_URL !== 'postgresql://synthetic:synthetic@127.0.0.1:1/never_connect'
)
  throw new Error('Synthetic fixture environment required.');
import { readFileSync } from 'node:fs';

import { analysisFixture } from './build-analysis-fixtures.mjs';
const { createApp } = await import('../src/app.ts');
const { ShowcaseService } = await import('../src/games/genshin/showcase/showcase.service.ts');
const metadata = JSON.parse(
  readFileSync(new URL('../src/games/genshin/static/enka/characters.json', import.meta.url)),
);
let calls = 0;
function raw(uid) {
  const f = analysisFixture(uid);
  return {
    uid,
    ttl: 10,
    playerInfo: { nickname: f.snapshot.nickname, level: 60, worldLevel: 9 },
    avatarInfoList: f.snapshot.characters.map((c) => ({
      avatarId: c.id,
      skillDepotId: c.skillDepotId,
      propMap: { 4001: { val: String(c.level) }, 1002: { val: '6' } },
      fightPropMap: Object.fromEntries(c.stats.map((s) => [s.id, s.value])),
      skillLevelMap: Object.fromEntries(
        (metadata[String(c.id)]?.SkillOrder ?? []).map((id, i) => [id, i === 0 ? 1 : 8]),
      ),
      equipList: [c.weapon, ...c.artifacts].map((item) => ({
        itemId: item.id,
        ...(item.slot
          ? { reliquary: { level: 21 } }
          : { weapon: { level: 90, promoteLevel: 6, affixMap: { test: 4 } } }),
        flat: {
          itemType: item.slot ? 'ITEM_RELIQUARY' : 'ITEM_WEAPON',
          nameTextMapHash: 'synthetic',
          rankLevel: 5,
          ...(item.slot
            ? {
                equipType: {
                  Flower: 'EQUIP_BRACER',
                  Plume: 'EQUIP_NECKLACE',
                  Sands: 'EQUIP_SHOES',
                  Goblet: 'EQUIP_RING',
                  Circlet: 'EQUIP_DRESS',
                }[item.slot],
                setNameTextMapHash: 'unknown-synthetic-set',
                reliquaryMainstat: { mainPropId: item.mainStat.id, statValue: item.mainStat.value },
                reliquarySubstats: [{ appendPropId: 'FIGHT_PROP_CRITICAL', statValue: 7 }],
              }
            : { weaponStats: [{ appendPropId: 'FIGHT_PROP_CHARGE_EFFICIENCY', statValue: 45.9 }] }),
        },
      })),
    })),
  };
}
const service = new ShowcaseService(async (url) => {
  calls++;
  const uid = String(url).split('/').filter(Boolean).at(-1);
  return new Response(JSON.stringify(raw(uid)));
}, Date.now);
const app = createApp({ showcaseService: service });
app.get('/__fixture', (_req, res) =>
  res.json({ calls, source: 'synthetic-only', base: 'e8f6a95', cwd: process.cwd() }),
);
const server = app.listen(45760, '127.0.0.1', () =>
  console.log('Build analysis fixture on 45760; no account/database credentials.'),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close(() => process.exit(0)));
