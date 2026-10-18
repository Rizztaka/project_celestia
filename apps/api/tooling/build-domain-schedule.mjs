// Reuse the already pinned catalog; never fetch or scrape another dataset.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function normalizeDomainSchedule(domains) {
  const values = Object.values(domains);
  const talentDomains = values.filter((domain) =>
    domain.dropKeys.some((key) => key.startsWith('TeachingsOf')),
  );
  return {
    _comment:
      'Derived offline from progression-catalog.json. 0=Monday through 6=Sunday; every material family opens Sunday.',
    talentDomains,
    weaponDomains: values.filter((domain) => !talentDomains.includes(domain)),
  };
}

export function writeDomainSchedule(catalog) {
  const schedule = normalizeDomainSchedule(catalog.domains);
  writeFileSync(
    new URL('../src/games/genshin/static/domain-schedule.json', import.meta.url),
    JSON.stringify(schedule, null, 2) + '\n',
  );
  return [...schedule.talentDomains, ...schedule.weaponDomains];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const catalog = JSON.parse(
    readFileSync(
      new URL('../src/games/genshin/static/progression-catalog.json', import.meta.url),
      'utf8',
    ),
  );
  writeDomainSchedule(catalog);
}
