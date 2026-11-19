export interface WeaponAliasInfo {
  key: string;
  name: string;
  rarity: number;
}

export function normalizeWeaponKey(nameOrKey: string): string {
  if (!nameOrKey || typeof nameOrKey !== 'string') return '';
  return nameOrKey
    .trim()
    .replace(/^["'“”«»]+|["'“”«»]+$/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

export const CANONICAL_WEAPON_ALIASES: Record<string, WeaponAliasInfo> = {
  pjws: { key: 'PrimordialJadeWingedSpear', name: 'Primordial Jade Winged-Spear', rarity: 5 },
  primordialjadewingedspear: { key: 'PrimordialJadeWingedSpear', name: 'Primordial Jade Winged-Spear', rarity: 5 },
  homa: { key: 'StaffOfHoma', name: 'Staff of Homa', rarity: 5 },
  staffofhoma: { key: 'StaffOfHoma', name: 'Staff of Homa', rarity: 5 },
  thecatch: { key: 'TheCatch', name: '"The Catch"', rarity: 4 },
  catch: { key: 'TheCatch', name: '"The Catch"', rarity: 4 },
  ttds: { key: 'ThrillingTalesOfDragonSlayers', name: 'Thrilling Tales of Dragon Slayers', rarity: 3 },
  thrillingtalesofdragonslayers: { key: 'ThrillingTalesOfDragonSlayers', name: 'Thrilling Tales of Dragon Slayers', rarity: 3 },
  widsith: { key: 'TheWidsith', name: 'The Widsith', rarity: 4 },
  thewidsith: { key: 'TheWidsith', name: 'The Widsith', rarity: 4 },
  ultimateoverlordsmegamagicsword: { key: 'UltimateOverlordSMegaMagicSword', name: '"Ultimate Overlord\'s Mega Magic Sword"', rarity: 4 },
  ultimateoverlordmegamagicsword: { key: 'UltimateOverlordSMegaMagicSword', name: '"Ultimate Overlord\'s Mega Magic Sword"', rarity: 4 },
  megamagicsword: { key: 'UltimateOverlordSMegaMagicSword', name: '"Ultimate Overlord\'s Mega Magic Sword"', rarity: 4 },
  dialoguesofthedesertsages: { key: 'DialoguesOfTheDesertSages', name: 'Dialogues of the Desert Sages', rarity: 4 },
  dialogueofthedesertsages: { key: 'DialoguesOfTheDesertSages', name: 'Dialogues of the Desert Sages', rarity: 4 },
};

export function resolveWeaponAlias(keyOrName?: string): WeaponAliasInfo | undefined {
  if (!keyOrName || typeof keyOrName !== 'string') return undefined;
  const normalized = normalizeWeaponKey(keyOrName);
  return CANONICAL_WEAPON_ALIASES[normalized];
}
