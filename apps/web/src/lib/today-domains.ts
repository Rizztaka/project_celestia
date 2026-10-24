import {
  SERVER_POLICIES,
  type ShowcaseCharacter,
  type SupportedServerId,
} from '@celestia/api-contracts';

import { domainSchedule, materialCatalogEntry } from './catalog';
import { visualAssets } from './cdn-resolver';
import matches from './today-domain-matches.json';

export const farmingDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const hour = 3_600_000;
const day = 24 * hour;
const characterDomains = matches.characters as Record<string, string[]>;
const weaponDomains = matches.weapons as Record<string, string[]>;

export function farmingServer(uid?: string): SupportedServerId | null {
  const prefix = uid?.slice(0, -8);
  if (prefix === '6') return 'america';
  if (prefix === '7') return 'europe';
  if (prefix === '8' || prefix === '18') return 'asia';
  if (prefix === '9') return 'tw_hk_mo';
  return null;
}

/** The game day begins at 04:00 at the server's fixed UTC offset. */
export function farmingClock(now: number, server: SupportedServerId) {
  const shift = (SERVER_POLICIES[server].utcOffsetHours - 4) * hour;
  const shifted = now + shift;
  return {
    weekday: (new Date(shifted).getUTCDay() + 6) % 7,
    nextReset: (Math.floor(shifted / day) + 1) * day - shift,
  };
}

export function resetCountdown(nextReset: number, now: number) {
  const seconds = Math.max(0, Math.ceil((nextReset - now) / 1000));
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export const todayDomains = domainSchedule.map((domain) => {
  const talent = domain.dropKeys.some((key) => key.startsWith('TeachingsOf'));
  const dropKeys = [...domain.dropKeys].sort(
    (a, b) => (visualAssets.materials[a]?.rarity ?? 0) - (visualAssets.materials[b]?.rarity ?? 0),
  );
  const materialKey = talent
    ? domain.dropKeys.find((key) => key.startsWith('TeachingsOf'))!
    : dropKeys[0];
  const name = materialCatalogEntry(materialKey)?.name ?? materialKey;
  return {
    ...domain,
    kind: talent ? ('talent' as const) : ('weapon' as const),
    family: talent ? name.replace(/^Teachings of /, '').replace(/^"|"$/g, '') : name,
    dropKeys,
    region: visualAssets.domains[domain.domainKey]?.region ?? domain.location.split(', ').at(-1)!,
    entrance: domain.location.split(', ')[0],
  };
});
export type TodayDomain = (typeof todayDomains)[number];

export function charactersForDomain(domain: TodayDomain, characters: ShowcaseCharacter[]) {
  return characters.filter((character) =>
    (domain.kind === 'talent'
      ? characterDomains[String(character.id)]
      : character.weapon
        ? weaponDomains[String(character.weapon.id)]
        : undefined
    )?.includes(domain.domainKey),
  );
}

export function missingFarmingMappings(characters: ShowcaseCharacter[]) {
  return characters.some(
    (character) =>
      !characterDomains[String(character.id)] ||
      (character.weapon && !weaponDomains[String(character.weapon.id)]),
  );
}
