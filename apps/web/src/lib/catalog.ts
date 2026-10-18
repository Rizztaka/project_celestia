import targets from './progression-targets.json';

const names = new Map(
  [...targets.characters, ...targets.weapons].map((entry) => [entry.key, entry.name]),
);
const materials = new Map(targets.materials.map((entry) => [entry.key, entry]));
const domains = new Map(targets.domains.map((entry) => [entry.domainKey, entry]));
export const domainSchedule = targets.domains;
export const targetDisplayName = (key: string) => names.get(key) ?? key;
export function materialCatalogEntry(key: string) {
  const entry = materials.get(key);
  return entry
    ? { ...entry, domain: entry.domainKey ? domains.get(entry.domainKey) : undefined }
    : null;
}
export const progressionCoverage = {
  characters: targets.characters.length,
  talents: targets.characters.filter((entry) => entry.talentMax !== null).length,
  weapons: targets.weapons.length,
};
