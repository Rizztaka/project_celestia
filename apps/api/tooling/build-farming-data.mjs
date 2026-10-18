import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const cache = process.argv[2];
const progressionSource = process.argv[3];
if (!cache || !progressionSource)
  throw new Error('Supply a private cache and pinned progression source-data.json.');
const sources = {
  coordinates: {
    repository: 'https://github.com/qiuxiang/canvas-genshin-maps',
    commit: '2154df87e9e4ac8a0733c7603120603cc1d489b6',
    file: 'data/maps-data.json',
    local: 'map-points.json',
    // Raw bytes checked against pinned Git blob e7ee0a29c6ce399d12e7399fb29d15416c1063d9.
    // The previous checksum represented LF-normalized text, not the repository's mixed line endings.
    sha256: '46065214cad4f791585fce2db1a37683f3d04fb27315f7cb556bf208fa2a309f',
  },
  yields: {
    repository: 'https://github.com/MadeBaruna/paimon-moe',
    commit: '105d0ebd1d551de96668b805d88c2c9a0590177a',
    file: 'src/data/dropRates.js',
    local: 'dropRates.js',
    sha256: '0c28845d0adea8ccdf1a8b620c9743c8b201209f0d705c70ffd072df97e57626',
  },
};
const hash = (value) => createHash('sha256').update(value).digest('hex');
async function source(info) {
  const path = join(cache, info.local);
  let bytes;
  try {
    bytes = readFileSync(path);
  } catch {
    const url =
      info.repository.replace('github.com', 'raw.githubusercontent.com') +
      '/' +
      info.commit +
      '/' +
      info.file;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Source download failed: ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    mkdirSync(cache, { recursive: true });
    writeFileSync(path, bytes);
  }
  if (hash(bytes) !== info.sha256)
    throw new Error(`Pinned source checksum mismatch: ${info.local}`);
  return bytes.toString('utf8');
}
const maps = JSON.parse(await source(sources.coordinates));
const drops = await source(sources.yields);
// Parse only the pinned numeric literals. Never import/evaluate downloaded JS.
const literal = (name) => {
  const match = drops.match(new RegExp(name + ':\\s*(\\[[\\s\\S]*?\\]),\\s*(?:weapon|boss):'));
  if (!match) throw new Error(`Missing rate table: ${name}`);
  const values = JSON.parse(match[1].replace(/,\s*]/g, ']'));
  if (
    values.length !== 4 ||
    values.some(
      (row) =>
        row.length !== (name === 'book' ? 3 : 4) || row.some((n) => !Number.isFinite(n) || n < 0),
    )
  )
    throw new Error('Invalid yield table.');
  return values;
};
const catalog = JSON.parse(
  readFileSync(join(root, 'apps/api/src/games/genshin/static/progression-catalog.json')),
);
const upstream = JSON.parse(readFileSync(progressionSource));
if (upstream.commit !== catalog.source.commit) throw new Error('Progression revision mismatch.');
const byId = new Map(upstream.collected.materials.map((row) => [row.data.id, row.data]));
const families = Object.values(catalog.domains).map((domain) => {
  const keys = [...domain.dropKeys].sort(
    (a, b) =>
      byId.get(catalog.materials[a].gameItemId).rarity -
      byId.get(catalog.materials[b].gameItemId).rarity,
  );
  if (
    ![3, 4].includes(keys.length) ||
    keys.some((key, i) => byId.get(catalog.materials[key].gameItemId).rarity !== i + 2)
  )
    throw new Error('Non-contiguous domain material tiers.');
  return { domain, kind: keys.length === 3 ? 'talent' : 'weapon', materialKeys: keys };
});
const world = maps.find((map) => map.id === 2);
if (!world) throw new Error('Surface map missing.');
const labels = world.mapPointLabels.flatMap((group) => group.children);
const label = (id) => {
  const value = labels.find((row) => row.id === id);
  if (!value) throw new Error(`Missing source label ${id}`);
  return value;
};
const anchorNames = {
  望舒客栈: 'Wangshu Inn',
  轻策庄: 'Qingce Village',
  无妄坡: 'Wuwang Hill',
  荻花洲: 'Dihua Marsh',
  石门: 'Stone Gate',
  归离原: 'Guili Plains',
  明蕴镇: 'Mingyun Village',
  瑶光滩: 'Yaoguang Shoal',
  渌华池: 'Luhua Pool',
  璃月港: 'Liyue Harbor',
  奥藏山: 'Mt. Aocang',
  庆云顶: 'Qingyun Peak',
  蒙德城: 'Mondstadt',
  清泉镇: 'Springvale',
  晨曦酒庄: 'Dawn Winery',
  低语森林: 'Whispering Woods',
  风起地: 'Windrise',
  摘星崖: 'Starsnatch Cliff',
  奔狼领: 'Wolvendom',
  望风山地: 'Stormbearer Mountains',
  望风角: 'Stormbearer Point',
  鹰翔海滩: 'Falcon Coast',
  稻妻城: 'Inazuma City',
  鸣神大社: 'Grand Narukami Shrine',
  清籁丸: 'Seiraimaru',
};
const anchors = world.mapAnchors
  .flatMap((a) => (a.children.length ? a.children : [a]))
  .map((a) => ({ name: anchorNames[a.name] ?? a.name, x: a.x, y: a.y }));
const nearestName = (point) =>
  [...anchors].sort(
    (a, b) => Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y),
  )[0].name;
function points(id) {
  return label(id).mapPoints.map((p) => {
    if (!Number.isSafeInteger(p.id) || !Number.isFinite(p.x) || !Number.isFinite(p.y))
      throw new Error('Invalid coordinate.');
    return { id: `${id}-${p.id}`, x: p.x, y: p.y, landmark: nearestName(p) };
  });
}
const enemyJoins = [
  ['slimes', 'Slimes', [59], ['SlimeCondensate', 'SlimeSecretions', 'SlimeConcentrate']],
  [
    'whopperflowers',
    'Whopperflowers',
    [47],
    ['WhopperflowerNectar', 'ShimmeringNectar', 'EnergyNectar'],
  ],
  ['hilichurls', 'Hilichurls', [55], ['DamagedMask', 'StainedMask', 'OminousMask']],
  [
    'shooters',
    'Hilichurl Shooters',
    [56],
    ['FirmArrowhead', 'SharpArrowhead', 'WeatheredArrowhead'],
  ],
  ['samachurls', 'Samachurls', [57], ['DiviningScroll', 'SealedScroll', 'ForbiddenCurseScroll']],
  [
    'treasure-hoarders',
    'Treasure Hoarders',
    [58],
    ['TreasureHoarderInsignia', 'SilverRavenInsignia', 'GoldenRavenInsignia'],
  ],
  [
    'fatui',
    'Fatui Skirmishers',
    [54],
    ['RecruitsInsignia', 'SergeantsInsignia', 'LieutenantsInsignia'],
  ],
  ['abyss-mages', 'Abyss Mages', [24], ['DeadLeyLineBranch', 'DeadLeyLineLeaves', 'LeyLineSprout']],
  ['nobushi', 'Nobushi', [209], ['OldHandguard', 'KageuchiHandguard', 'FamedHandguard']],
  ['specters', 'Specters', [229], ['SpectralHusk', 'SpectralHeart', 'SpectralNucleus']],
  [
    'ruin-machines',
    'Ruin Guards, Hunters and Graders',
    [27, 28, 150],
    ['ChaosDevice', 'ChaosCircuit', 'ChaosCore'],
  ],
  ['ruin-sentinels', 'Ruin Sentinels', [215], ['ChaosGear', 'ChaosAxis', 'ChaosOculus']],
  [
    'vishaps',
    'Geovishaps',
    [49, 169],
    ['FragileBoneShard', 'SturdyBoneShard', 'FossilizedBoneShard'],
  ],
  [
    'agents',
    'Fatui Pyro Agents',
    [25],
    ['HuntersSacrificialKnife', 'AgentsSacrificialKnife', 'InspectorsSacrificialKnife'],
  ],
  ['cicin-mages', 'Fatui Cicin Mages', [26], ['MistGrassPollen', 'MistGrass', 'MistGrassWick']],
  ['mitachurls', 'Mitachurls', [149], ['HeavyHorn', 'BlackBronzeHorn', 'BlackCrystalHorn']],
];
const specialties = {
  29: 'Valberry',
  30: 'JueyunChili',
  31: 'CallaLily',
  32: 'Qingxin',
  33: 'SmallLampGrass',
  34: 'Violetgrass',
  35: 'Cecilia',
  36: 'SilkFlower',
  37: 'DandelionSeed',
  38: 'GlazeLily',
  39: 'PhilanemoMushroom',
  40: 'CorLapis',
  41: 'Wolfhook',
  42: 'NoctilucousJade',
  43: 'WindwheelAster',
  78: 'Starconch',
  185: 'SeaGanoderma',
  196: 'Onikabuto',
  197: 'NakuWeed',
  198: 'Dendrobium',
  199: 'SakuraBloom',
  211: 'CrystalMarrow',
  227: 'SangoPearl',
  228: 'AmakumoFruit',
  266: 'FluorescentFungus',
  400: 'NilotpalaLotus',
  401: 'KalpalataLotus',
  402: 'RukkhashavaMushrooms',
  413: 'Padisarah',
  430: 'Scarab',
  431: 'HennaBerry',
  462: 'SandGreasePupa',
};
const routes = enemyJoins.map(([key, name, ids, materialKeys]) => ({
  key,
  name,
  kind: 'enemy',
  materialKeys,
  points: ids.flatMap(points),
}));
for (const [id, key] of Object.entries(specialties)) {
  if (!catalog.materials[key]) throw new Error(`Unmatched specialty ${key}`);
  routes.push({
    key,
    name: catalog.materials[key].name,
    kind: 'gathering',
    materialKeys: [key],
    points: points(Number(id)),
  });
}
for (const route of routes)
  if (!route.points.length || route.materialKeys.some((k) => !catalog.materials[k]))
    throw new Error(`Invalid route join: ${route.key}`);
const payload = {
  version: 1,
  reviewedOn: '2026-10-18',
  sources,
  progressionFingerprint: catalog.contentFingerprint,
  yields: { talent: literal('book'), weapon: literal('weapon') },
  families,
  routes,
  teleports: [...points(2), ...points(3)],
};
function stable(value) {
  return Array.isArray(value)
    ? value.map(stable)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort((a, b) => a.localeCompare(b, 'en'))
            .map((k) => [k, stable(value[k])]),
        )
      : value;
}
payload.contentFingerprint = hash(JSON.stringify(stable(payload)));
const destination = join(root, 'apps/api/src/games/genshin/static/farming-data.json');
writeFileSync(destination, JSON.stringify(payload, null, 2) + '\n');
for (const [info, file, out] of [
  [sources.coordinates, 'license', 'canvas-genshin-maps-LICENSE.txt'],
  [sources.yields, 'LICENSE', 'paimon-moe-LICENSE.txt'],
]) {
  const response = await fetch(
    info.repository.replace('github.com', 'raw.githubusercontent.com') +
      '/' +
      info.commit +
      '/' +
      file,
  );
  if (!response.ok) throw new Error('License unavailable.');
  writeFileSync(join(root, 'docs/third-party', out), await response.text());
}
console.log(
  JSON.stringify({
    families: families.length,
    routes: routes.length,
    points: routes.reduce((sum, r) => sum + r.points.length, 0),
    teleports: payload.teleports.length,
    fingerprint: payload.contentFingerprint,
  }),
);
