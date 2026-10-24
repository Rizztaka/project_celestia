import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Pinned official metadata linked from Enka's Genshin API documentation.
const revision = 'a9b583eb4a708dd3db56f6bdef35c3e84e4d213c';
const directory = new URL('../src/games/genshin/static/enka/', import.meta.url);
await mkdir(directory, { recursive: true });
const sources = [];
const acquired = {};
for (const name of ['gi/avatars', 'loc', 'gi/locs']) {
  const url = `https://raw.githubusercontent.com/EnkaNetwork/API-docs/${revision}/store/${name}.json`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ProjectCelestia-P1/1.0 (+https://github.com/Rizztaka/project_celestia)',
    },
    signal: AbortSignal.timeout(15000),
    redirect: 'error',
  });
  if (!response.ok) throw new Error('Metadata acquisition failed.');
  const raw = await response.text();
  const data = JSON.parse(raw);
  if (!data || typeof data !== 'object') throw new Error('Invalid metadata.');
  acquired[name] = data;
  sources.push({
    url,
    output: name === 'gi/avatars' ? 'characters.json' : 'english.json',
    upstreamSha256: createHash('sha256').update(raw).digest('hex'),
  });
}
const characters = Object.fromEntries(
  Object.entries(acquired['gi/avatars'])
    .filter(
      ([, row]) =>
        typeof row.NameTextMapHash === 'number' &&
        typeof row.SideIconName === 'string' &&
        Array.isArray(row.SkillOrder),
    )
    .map(([id, row]) => [
      id,
      {
        NameTextMapHash: row.NameTextMapHash,
        Element: row.Element,
        SideIconName: row.SideIconName,
        SkillOrder: row.SkillOrder,
        ProudMap: row.ProudMap ?? {},
        Costumes: Object.fromEntries(
          Object.entries(row.Costumes ?? {}).map(([costumeId, costume]) => [
            costumeId,
            { icon: costume.Icon, sideIconName: costume.SideIcon },
          ]),
        ),
      },
    ]),
);
// Current character hashes and older live equipment hashes both occur in Enka responses.
// Keep both upstream English maps; current values take precedence for shared keys.
const english = { ...acquired.loc.en, ...acquired['gi/locs'].en };
// Reuse the pinned, integrity-checked character references for talent names.
// Join by game ID and Enka's element for Traveler, never by the account's level-map order.
const referenceDirectory = new URL(
  '../src/games/genshin/static/profile-reference/',
  import.meta.url,
);
const referenceIndexBytes = await readFile(new URL('index.json', referenceDirectory));
const referenceIndex = JSON.parse(referenceIndexBytes);
const references = new Map();
for (const [key, entry] of Object.entries(referenceIndex.characters)) {
  if (!/^characters-[A-Za-z0-9]+\.json$/.test(entry.file))
    throw new Error('Invalid reference file.');
  const bytes = await readFile(new URL(entry.file, referenceDirectory));
  if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256)
    throw new Error('Reference integrity mismatch.');
  const reference = JSON.parse(bytes);
  if (reference.key !== key) throw new Error('Reference identity mismatch.');
  references.set(key, reference);
}
const elements = {
  Wind: 'Anemo',
  Rock: 'Geo',
  Electric: 'Electro',
  Grass: 'Dendro',
  Water: 'Hydro',
  Fire: 'Pyro',
  Ice: 'Cryo',
};
const talentNames = {};
for (const [metadataId, row] of Object.entries(acquired['gi/avatars'])) {
  const gameId = Number(metadataId.split('-')[0]);
  const reference =
    gameId === 10000005 || gameId === 10000007
      ? (references.get(`Traveler${elements[row.Element] ?? ''}`) ??
        references.get(gameId === 10000005 ? 'Aether' : 'Lumine'))
      : [...references.values()].find((ref) => ref.gameId === gameId);
  if (reference && characters[metadataId]) {
    characters[metadataId].WeaponType = reference.weaponType;
    characters[metadataId].Rarity = reference.rarity;
  }
  if (!reference || !Array.isArray(row.SkillOrder) || row.SkillOrder.length !== 3) continue;
  const labels = {};
  for (const [order, kind] of ['normal', 'skill', 'burst'].entries()) {
    const matches = reference.talents.filter((talent) => talent.kind === kind);
    if (matches.length === 1) labels[row.SkillOrder[order]] = matches[0].name;
  }
  if (Object.keys(labels).length) talentNames[metadataId] = labels;
}
for (const [filename, data] of [
  ['characters.json', characters],
  ['english.json', english],
  ['talent-names.json', talentNames],
]) {
  await writeFile(new URL(filename, directory), JSON.stringify(data, null, 2) + '\n');
}
await writeFile(
  new URL('provenance.json', directory),
  JSON.stringify(
    {
      revision,
      acquiredAt: new Date().toISOString(),
      documentation: 'https://github.com/EnkaNetwork/API-docs/blob/master/docs/gi/api.md',
      sources,
      talentReference: {
        index: '../profile-reference/index.json',
        sha256: createHash('sha256').update(referenceIndexBytes).digest('hex'),
        output: 'talent-names.json',
      },
      transformation:
        'Current store/gi/avatars.json reduced to name, element, portrait, skill order, proud-skill and costume fields; costume fields normalized to internal names. English maps merged from legacy store/loc.json and current store/gi/locs.json, current map takes precedence. Talent names, character weapon type and character rarity projected from integrity-checked local character references by game ID; talents follow combat kind in Enka SkillOrder and Traveler forms use Enka Element. No account data or calculated progression.',
    },
    null,
    2,
  ) + '\n',
);
console.log('Acquired pinned Enka character and English metadata.');
