// Project material matches by game ID from the existing pinned catalog, offline.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { writeCatalogJson } from './catalog-json.mjs';

export function buildTodayDomainCatalog(catalog) {
  const domains = Object.values(catalog.domains);
  const matches = (rows = []) => {
    const materials = new Set(rows.flatMap((row) => Object.keys(row.costs)));
    return domains
      .filter((domain) => domain.dropKeys.some((key) => materials.has(key)))
      .map((domain) => domain.domainKey);
  };
  return {
    source: { repository: catalog.source.repository, commit: catalog.source.commit },
    characters: Object.fromEntries(
      Object.values(catalog.characters)
        // Traveler's per-talent schedules are not covered by this catalog.
        .filter((character) => character.talent.length && !character.key.startsWith('Traveler'))
        .map((character) => [character.gameId, matches(character.talent)]),
    ),
    weapons: Object.fromEntries(
      Object.values(catalog.weapons).map((weapon) => [weapon.gameId, matches(weapon.ascension)]),
    ),
  };
}

export async function writeTodayDomainCatalog(catalog) {
  return writeCatalogJson(
    new URL('../../web/src/lib/today-domain-matches.json', import.meta.url),
    buildTodayDomainCatalog(catalog),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeTodayDomainCatalog(
    JSON.parse(
      readFileSync(
        new URL('../src/games/genshin/static/progression-catalog.json', import.meta.url),
        'utf8',
      ),
    ),
  );
}
