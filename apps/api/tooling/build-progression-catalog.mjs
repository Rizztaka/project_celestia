// Offline normalization from the pinned source cache. No upstream code executes.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeDomainSchedule } from './build-domain-schedule.mjs';
import { buildGameReferences } from './build-game-references.mjs';
import { writeTodayDomainCatalog } from './build-today-domains.mjs';
import { writeCatalogJson } from './catalog-json.mjs';
import { refreshFarmingFamilies } from './refresh-farming-families.mjs';

const cache = process.argv[2];
if (!cache)
  throw new Error('Supply the source-cache directory produced by sync-progression-catalog.');
const { commit, collected } = JSON.parse(readFileSync(resolve(cache, 'source-data.json'), 'utf8'));
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const keyOf = (name) =>
  name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f'’"“”]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
const materialsById = new Map(collected.materials.map((entry) => [entry.data.id, entry]));
const domainsById = new Map(collected.domains.map((entry) => [entry.data.id, entry]));
const sourceHashes = {};
const useSource = (entry) => {
  const bytes = readFileSync(resolve(cache, commit, entry.sourcePath.replaceAll('/', '__')));
  if (
    createHash('sha256').update(bytes).digest('hex') !== entry.sourceHash ||
    JSON.stringify(JSON.parse(bytes.toString('utf8'))) !== JSON.stringify(entry.data)
  )
    throw new Error(`Source cache integrity mismatch: ${entry.sourcePath}`);
  sourceHashes[entry.sourcePath] = entry.sourceHash;
  return entry.data;
};
const materials = {};
function material(id) {
  const entry = materialsById.get(id);
  if (!entry) throw new Error(`Missing material ID ${id}`);
  const data = useSource(entry);
  const key = keyOf(data.name);
  if (!/^[A-Z][A-Za-z0-9]*$/.test(key)) throw new Error(`Unsupported material key for ${id}`);
  if (materials[key] && materials[key].gameItemId !== id)
    throw new Error(`Ambiguous material key ${key}`);
  materials[key] = {
    key,
    gameItemId: id,
    name: data.name,
    sources: (data.sources ?? []).filter((source) => !source.startsWith('Placeholder')),
    category: data.typeText?.startsWith('Local Specialty')
      ? 'local_specialty'
      : data.typeText === 'Character Talent Material' && data.dropDomainId
        ? 'talent_book'
        : data.typeText === 'Weapon Ascension Material'
          ? 'weapon_material'
          : data.typeText === 'Character Level-Up Material' && data.rarity === 5
            ? 'weekly_boss'
            : data.typeText === 'Character Level-Up Material' &&
                data.id >= 113000 &&
                data.id < 114000
              ? 'world_boss'
              : 'progression_support',
    domainKey: null,
  };
  return key;
}
function steps(costs, prefix) {
  const rows = Object.entries(costs)
    .filter(([name]) => new RegExp(`^${prefix}[1-9][0-9]*$`).test(name))
    .map(([name, items]) => {
      const phase = Number(name.slice(prefix.length));
      if (!Array.isArray(items) || !items.length) throw new Error(`Empty costs ${name}`);
      const quantities = {};
      for (const item of items) {
        if (!Number.isSafeInteger(item.count) || item.count < 0)
          throw new Error(`Invalid quantity ${name}`);
        if (item.count === 0) continue;
        const key = material(item.id);
        if (Object.hasOwn(quantities, key)) throw new Error(`Duplicate material ${name}/${key}`);
        quantities[key] = item.count;
      }
      return { phase, costs: quantities };
    })
    .sort((a, b) => a.phase - b.phase);
  if (!rows.length || rows.some((row, index) => row.phase !== index + (prefix === 'lvl' ? 2 : 1)))
    throw new Error('Non-contiguous source costs');
  return rows;
}
const characters = {};
const excludedTargets = [];
const talents = new Map(collected.talents.map((entry) => [entry.file, entry]));
for (const entry of collected.characters) {
  if (['manekin.json', 'manekina.json'].includes(entry.file)) {
    excludedTargets.push({
      file: entry.file,
      reason: 'Source ascension rows omit material quantities; no zero-cost assumption.',
    });
    continue;
  }
  const data = useSource(entry);
  const key = keyOf(data.name);
  if (characters[key]) throw new Error(`Duplicate character key ${key}`);
  const talentEntry = talents.get(entry.file);
  // Traveler's slot-specific exceptions are not represented in this source shape.
  // Keep their ascension usable; never apply one generic cost table to all slots.
  const talent =
    talentEntry && !entry.file.startsWith('traveler')
      ? steps(useSource(talentEntry).costs, 'lvl')
      : [];
  characters[key] = {
    key,
    name: data.name,
    gameId: data.id,
    ascension: steps(data.costs, 'ascend').filter((row) => row.phase <= 6),
    talent,
    talentUnavailableReason: talent.length
      ? null
      : 'Traveler talent costs require a verified per-slot source; ascension costs are available.',
  };
}
// Traveler forms share the verified protagonist ascension table. Their slot-specific
// talent differences remain unavailable rather than applying one generic table.
for (const entry of collected.talents.filter((entry) =>
  /^traveler[a-z]+\.json$/.test(entry.file),
)) {
  const data = useSource(entry);
  const key = keyOf(data.name);
  characters[key] = {
    ...characters.Aether,
    key,
    name: data.name,
    talent: [],
    talentUnavailableReason:
      'Traveler talent costs require a verified per-slot source; ascension costs are available.',
  };
}
const weapons = {};
for (const entry of collected.weapons) {
  if (entry.data.name === 'Prized Isshin Blade') {
    excludedTargets.push({
      file: entry.file,
      reason:
        'Temporary quest weapon variants share a name and cannot be joined to one canonical GOOD weapon key.',
    });
    continue;
  }
  const data = useSource(entry);
  const key = keyOf(data.name);
  if (weapons[key]) throw new Error(`Duplicate weapon key ${key}`);
  weapons[key] = {
    key,
    name: data.name,
    gameId: data.id,
    ascension: steps(data.costs, 'ascend').filter((row) => row.phase <= 6),
  };
}
// Include scheduled families even when no current target consumes one of their tiers.
for (const entry of collected.materials) {
  if (
    entry.data.dropDomainId &&
    ['Character Talent Material', 'Weapon Ascension Material'].includes(entry.data.typeText)
  )
    material(entry.data.id);
}
const references = await buildGameReferences({ collected, root, keyOf, useSource, material });
// Recipes, not consecutive item IDs, establish the exact 3:1 direction.
const lower = new Map();
const higher = new Map();
for (const entry of collected.crafts) {
  const data = entry.data;
  const high = keyOf(data.name);
  if (
    data.resultCount !== 1 ||
    data.recipe?.length !== 1 ||
    data.recipe[0].count !== 3 ||
    !materials[high]
  )
    continue;
  const low = Object.values(materials).find((item) => item.gameItemId === data.recipe[0].id)?.key;
  if (!low) continue;
  if ((lower.has(high) && lower.get(high) !== low) || (higher.has(low) && higher.get(low) !== high))
    throw new Error(`Conflicting 3:1 recipe ${high}`);
  useSource(entry);
  lower.set(high, low);
  higher.set(low, high);
}
const conversionGroups = [];
for (const first of higher.keys()) {
  if (lower.has(first)) continue;
  const group = [first];
  while (higher.has(group.at(-1))) {
    const next = higher.get(group.at(-1));
    if (group.includes(next)) throw new Error('Cyclic 3:1 recipes');
    group.push(next);
  }
  conversionGroups.push(group);
}
if (conversionGroups.reduce((sum, group) => sum + group.length - 1, 0) !== lower.size)
  throw new Error('Unresolved cyclic 3:1 recipes');
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const domains = {};
for (const reference of Object.values(materials)) {
  const source = materialsById.get(reference.gameItemId).data;
  if (!source.dropDomainId) continue;
  const entry = domainsById.get(source.dropDomainId);
  if (!entry) throw new Error(`Missing domain ${source.dropDomainId}`);
  const domain = useSource(entry);
  if (!['UI_ABYSSUS_AVATAR_PROUD', 'UI_ABYSSUS_WEAPON_PROMOTE'].includes(domain.domainType))
    continue;
  const name = domain.name.replace(/ [IVX]+$/, '');
  const domainKey = keyOf(`${domain.entranceName} ${name}`);
  const weekdays = source.daysOfWeek.map((day) => days.indexOf(day)).sort();
  if (!weekdays.length || weekdays.some((day) => day < 0))
    throw new Error(`Invalid schedule ${domainKey}`);
  const existing = domains[domainKey];
  if (existing && JSON.stringify(existing.days) !== JSON.stringify(weekdays))
    throw new Error(`Conflicting days ${domainKey}`);
  const record = existing ?? {
    domainKey,
    name: `${domain.entranceName} · ${name.replace(/^Domain of (Mastery|Forgery): /, '')}`,
    location: `${domain.entranceName}, ${domain.regionName}`,
    days: weekdays,
    drops: [name],
    dropKeys: [],
    resinPerClaim: 20,
  };
  record.dropKeys.push(reference.key);
  domains[domainKey] = record;
  reference.domainKey = domainKey;
}
for (const domain of Object.values(domains)) domain.dropKeys.sort();
const catalog = {
  version: 1,
  source: {
    repository: 'https://github.com/theBowja/genshin-db',
    commit,
    reviewedOn: '2026-10-18',
    authority: 'community',
    resinSource: 'https://genshin.hoyoverse.com/en/news/detail/159349',
    license: 'MIT',
    sourceHashes,
  },
  excludedTargets,
  materials,
  characters,
  weapons,
  domains,
  conversionGroups,
};
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b, 'en'))
        .map(([key, item]) => [key, stable(item)]),
    );
  return value;
}
catalog.contentFingerprint = createHash('sha256')
  .update(JSON.stringify(stable(catalog)))
  .digest('hex');
await refreshFarmingFamilies(catalog, collected, root);
const output = resolve(root, 'apps/api/src/games/genshin/static/progression-catalog.json');
const serialized = await writeCatalogJson(output, catalog);
const targets = {
  materials: Object.values(materials).map(({ key, name, sources, domainKey, category }) => ({
    key,
    name,
    sources,
    domainKey,
    category,
  })),
  domains: await writeDomainSchedule(catalog),
  characters: Object.values(characters).map(({ key, name, talent }) => ({
    key,
    name,
    talentMax: talent.at(-1)?.phase ?? null,
  })),
  weapons: Object.values(weapons).map(({ key, name, ascension }) => ({
    key,
    name,
    ascensionMax: ascension.at(-1).phase,
  })),
  artifactSets: Object.values(references.artifactSets),
};
await writeCatalogJson(resolve(root, 'apps/web/src/lib/progression-targets.json'), targets);
await writeTodayDomainCatalog(catalog);
const notice = resolve(root, 'docs/third-party/genshin-db-LICENSE.txt');
mkdirSync(dirname(notice), { recursive: true });
writeFileSync(notice, readFileSync(resolve(cache, 'LICENSE'), 'utf8'));
console.log(
  JSON.stringify({
    characters: Object.keys(characters).length,
    talentCharacters: Object.values(characters).filter((entry) => entry.talent.length).length,
    weapons: Object.keys(weapons).length,
    materials: Object.keys(materials).length,
    domains: Object.keys(domains).length,
    profiles: references.profileCount,
    artifactSets: Object.keys(references.artifactSets).length,
    weeklyBosses: references.bosses.length,
    worldBosses: references.worldBosses.length,
    craftingFamilies: conversionGroups.length,
    sha256: createHash('sha256').update(serialized).digest('hex'),
  }),
);
