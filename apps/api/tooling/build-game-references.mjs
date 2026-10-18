// Metadata is sourced; subjective build rankings are never inferred from a biography.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { writeCatalogJson } from './catalog-json.mjs';

export async function buildGameReferences({ collected, root, keyOf, useSource, material }) {
  const directory = resolve(root, 'apps/api/src/games/genshin/static');
  const write = (file, data) => writeCatalogJson(resolve(directory, file), data);
  const previous = JSON.parse(readFileSync(resolve(directory, 'character-profiles.json'), 'utf8'));
  const elements = {};
  const weapons = {};
  const profiles = {
    _comment:
      'Verified genshin-db metadata. Existing recommendation fields are legacy editorial opinions, not datamined mechanics; absent opinions remain unavailable.',
  };
  const addCharacter = (data, key = keyOf(data.name)) => {
    const legacy = previous[key];
    elements[key] = data.elementText === 'None' ? 'Adaptive' : data.elementText;
    weapons[key] = data.weaponText;
    profiles[key] = {
      name: data.name,
      gameId: data.id,
      element: elements[key],
      weaponType: data.weaponText,
      rarity: data.rarity,
      title: data.title,
      description: data.description,
      birthday: data.birthday || null,
      affiliation: data.affiliation || null,
      region: data.region || null,
      constellation: data.constellation || null,
      voiceActors: data.cv,
      ...(legacy?.metaTier
        ? {
            metaTier: legacy.metaTier,
            role: legacy.role,
            priorityTalent: legacy.priorityTalent,
            weaponRarity: legacy.weaponRarity,
          }
        : {}),
      recommendationBasis: legacy?.metaTier ? 'legacy_editorial' : 'unavailable',
    };
  };
  for (const entry of collected.characters) addCharacter(useSource(entry));
  const traveler = collected.characters.find((entry) => entry.data.name === 'Aether').data;
  for (const entry of collected.talents.filter((entry) =>
    /^traveler[a-z]+\.json$/.test(entry.file),
  )) {
    const data = useSource(entry);
    const element = /^Traveler \((Anemo|Geo|Electro|Dendro|Hydro|Pyro|Cryo)\)$/.exec(
      data.name,
    )?.[1];
    if (!element) throw new Error(`Unsupported Traveler form ${data.name}`);
    addCharacter({ ...traveler, name: data.name, elementText: element }, `Traveler${element}`);
  }
  await write('character-elements.json', elements);
  await write('character-weapon-types.json', weapons);
  await write('character-profiles.json', profiles);

  const artifactSets = {};
  for (const entry of collected.artifacts) {
    const data = useSource(entry);
    const key = keyOf(data.name);
    if (artifactSets[key]) throw new Error(`Duplicate artifact set ${key}`);
    artifactSets[key] = {
      key,
      gameId: data.id,
      name: data.name,
      rarities: data.rarityList,
      effect1Pc: data.effect1Pc ?? null,
      effect2Pc: data.effect2Pc ?? null,
      effect4Pc: data.effect4Pc ?? null,
    };
  }
  // Sets describe conditional effects; the scorer's stat weights remain character-specific.
  const weights = JSON.parse(
    readFileSync(resolve(directory, 'artifact-stat-weights.json'), 'utf8'),
  );
  weights._comment =
    'Character stat weights are editorial planning heuristics. _sets contains sourced conditional set effects, not unconditional scoring multipliers.';
  weights._sets = artifactSets;
  await write('artifact-stat-weights.json', weights);

  // Stable keys for real existing bosses are retained. Fictional placeholder rows are removed.
  // Entrance/region joins are reviewed separately in docs/plans/genshin-parity/sources.md.
  const entrances = {
    Stormterror: ['Dvalin', 'Mondstadt', 'Confront Stormterror'],
    'Lupus Boreas, Dominator of Wolves': ['Lupus', 'Mondstadt', 'Wolf of the North Challenge'],
    Childe: ['Childe', 'Liyue', 'Enter the Golden House'],
    Azhdaha: ['Azhdaha', 'Liyue', 'Beneath the Dragon-Queller'],
    'La Signora': ['Signora', 'Inazuma', 'Narukami Island: Tenshukaku'],
    'Magatsu Mitake Narukami no Mikoto': ['Shogun', 'Inazuma', 'End of the Oneiric Euthymia'],
    'Shouki no Kami, the Prodigal': ['Scaramouche', 'Sumeru', 'Joururi Workshop'],
    "Guardian of Apep's Oasis": ['Apep', 'Sumeru', 'The Realm of Beginnings'],
    'All-Devouring Narwhal': ['Shoukumonegate', 'Fontaine', 'Shadow of Another World'],
    'The Knave': ['TheKnave', 'Fontaine', 'Scattered Ruins'],
    'Lord of Eroded Primal Fire': ['LordOfErodedPrimalFire', 'Natlan', 'Stone Stele Records'],
    'The Game Before the Gate': ['TheGameBeforeTheGate', 'Mondstadt', 'Unresolved Chess Game'],
  };
  const bosses = [];
  const worldBosses = [];
  for (const entry of collected.enemies) {
    const data = entry.data;
    if (data.enemyType !== 'BOSS') continue;
    const rewards = (data.rewardPreview ?? []).filter((reward) => {
      const source = collected.materials.find((entry) => entry.data.id === reward.id)?.data;
      return (
        source?.typeText === 'Character Level-Up Material' && source.category === 'AVATAR_MATERIAL'
      );
    });
    if (!rewards.length) continue;
    useSource(entry);
    const dropKeys = rewards.map((reward) => material(reward.id));
    const weekly = rewards.some(
      (reward) =>
        collected.materials.find((entry) => entry.data.id === reward.id)?.data.rarity === 5,
    );
    if (weekly) {
      const entrance = entrances[data.name];
      bosses.push({
        key: entrance?.[0] ?? keyOf(data.name),
        name: data.name,
        location: entrance?.[1] ?? 'Unknown',
        domainName: entrance?.[2] ?? 'Entrance not recorded in the pinned source',
        dropKeys,
        wikiUrl: entrance
          ? `https://genshin-impact.fandom.com/wiki/${entrance[2].replaceAll(' ', '_')}`
          : null,
      });
    } else worldBosses.push({ key: keyOf(data.name), gameId: data.id, name: data.name, dropKeys });
  }
  await write('weekly-bosses.json', {
    _comment:
      'Reward joins from pinned genshin-db enemy previews. Unknown entrances remain explicit; no weekly yield or resin estimate is inferred.',
    bosses,
  });
  await write('world-bosses.json', { bosses: worldBosses });
  return { artifactSets, profileCount: Object.keys(profiles).length - 1, bosses, worldBosses };
}
