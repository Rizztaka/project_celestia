import { readFileSync } from 'node:fs';

import type {
  ShowcaseCharacter,
  ShowcaseEquipment,
  ShowcaseSnapshot,
  ShowcaseStat,
} from '@celestia/api-contracts';
import { z } from 'zod';

interface CharacterMetadata {
  NameTextMapHash: number;
  SideIconName: string;
  SkillOrder: number[];
  Element?: string;
  WeaponType?: string;
  Rarity?: number;
  ProudMap?: Record<string, number>;
  Costumes?: Record<string, { icon?: string; sideIconName?: string }>;
}
const characters: Record<string, CharacterMetadata> = JSON.parse(
  readFileSync(new URL('../static/enka/characters.json', import.meta.url), 'utf8'),
);
const english: Record<string, string> = JSON.parse(
  readFileSync(new URL('../static/enka/english.json', import.meta.url), 'utf8'),
);
const talentNames: Record<string, Record<string, string>> = JSON.parse(
  readFileSync(new URL('../static/enka/talent-names.json', import.meta.url), 'utf8'),
);
const numeric = z
  .union([
    z.number(),
    z
      .string()
      .regex(/^-?\d+(\.\d+)?$/)
      .transform(Number),
  ])
  .pipe(z.number().finite());
const positiveId = z.number().int().positive();
const stat = z
  .object({
    appendPropId: z.string().optional(),
    mainPropId: z.string().optional(),
    // Current public responses use statValue; Enka's documentation calls it propValue.
    statValue: z.number().finite().optional(),
    propValue: z.number().finite().optional(),
  })
  .refine(
    (s) =>
      (s.statValue !== undefined || s.propValue !== undefined) &&
      (s.statValue === undefined || s.propValue === undefined || s.statValue === s.propValue),
    'Missing or conflicting equipment stat value.',
  );
const equipment = z
  .object({
    itemId: positiveId,
    weapon: z
      .object({
        level: z.number().int().min(1).max(200),
        promoteLevel: z.number().int().min(0).max(10).optional(),
        affixMap: z.record(z.number().int().min(0).max(4)).optional(),
      })
      .optional(),
    reliquary: z.object({ level: z.number().int().min(1).max(21) }).optional(),
    flat: z.object({
      itemType: z.enum(['ITEM_WEAPON', 'ITEM_RELIQUARY']),
      nameTextMapHash: z.union([z.string(), z.number()]),
      setNameTextMapHash: z.union([z.string(), z.number()]).optional(),
      icon: z.string().max(200).optional(),
      rankLevel: z.number().int().min(1).max(5).optional(),
      equipType: z
        .enum(['EQUIP_BRACER', 'EQUIP_NECKLACE', 'EQUIP_SHOES', 'EQUIP_RING', 'EQUIP_DRESS'])
        .optional(),
      weaponStats: z.array(stat).max(10).optional(),
      reliquaryMainstat: stat.optional(),
      reliquarySubstats: z.array(stat).max(4).optional(),
    }),
  })
  .superRefine((item, context) => {
    if (
      (item.flat.itemType === 'ITEM_WEAPON' && (!item.weapon || item.reliquary)) ||
      (item.flat.itemType === 'ITEM_RELIQUARY' &&
        (!item.reliquary || item.weapon || !item.flat.equipType))
    ) {
      context.addIssue({ code: 'custom', message: 'Incomplete equipment.' });
    }
  });
const avatar = z.object({
  avatarId: positiveId,
  skillDepotId: positiveId.optional(),
  costumeId: positiveId.optional(),
  propMap: z
    .record(z.object({ val: numeric.optional() }))
    .refine((v) => Object.keys(v).length <= 100),
  talentIdList: z.array(positiveId).max(6).optional(),
  skillLevelMap: z.record(z.number().int().min(1).max(20)).optional(),
  proudSkillExtraLevelMap: z.record(z.number().int().min(0).max(10)).optional(),
  fightPropMap: z.record(z.number().finite()).refine((v) => Object.keys(v).length <= 300),
  equipList: z.array(equipment).max(6).optional(),
});
const responseSchema = z.object({
  uid: z.union([z.string(), z.number().int()]).optional(),
  ttl: z.number().int().min(0).max(2_592_000),
  playerInfo: z.object({
    nickname: z.string().min(1).max(100),
    level: z.number().int().min(1).max(100).optional(),
    worldLevel: z.number().int().min(0).max(20).optional(),
    signature: z.string().max(2000).optional(),
  }),
  avatarInfoList: z.array(avatar).max(100).optional(),
});
const combatNames: Record<string, string> = {
  '1': 'Base HP',
  '2': 'Added HP',
  '3': 'HP%',
  '4': 'Base ATK',
  '5': 'Added ATK',
  '6': 'ATK%',
  '7': 'Base DEF',
  '8': 'Added DEF',
  '9': 'DEF%',
  '10': 'Base SPD',
  '11': 'SPD%',
  '20': 'CRIT Rate',
  '22': 'CRIT DMG',
  '23': 'Energy Recharge',
  '26': 'Healing Bonus',
  '27': 'Incoming Healing Bonus',
  '28': 'Elemental Mastery',
  '29': 'Physical RES',
  '30': 'Physical DMG Bonus',
  '40': 'Pyro DMG Bonus',
  '41': 'Electro DMG Bonus',
  '42': 'Hydro DMG Bonus',
  '43': 'Dendro DMG Bonus',
  '44': 'Anemo DMG Bonus',
  '45': 'Geo DMG Bonus',
  '46': 'Cryo DMG Bonus',
  '50': 'Pyro RES',
  '51': 'Electro RES',
  '52': 'Hydro RES',
  '53': 'Dendro RES',
  '54': 'Anemo RES',
  '55': 'Geo RES',
  '56': 'Cryo RES',
  '80': 'Cooldown reduction',
  '81': 'Shield Strength',
  '1010': 'Current HP',
  '2000': 'Max HP',
  '2001': 'ATK',
  '2002': 'DEF',
  '2003': 'SPD',
};
const combatPercent = new Set([
  '3',
  '6',
  '9',
  '11',
  '20',
  '22',
  '23',
  '26',
  '27',
  '29',
  '30',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '50',
  '51',
  '52',
  '53',
  '54',
  '55',
  '56',
  '80',
  '81',
  ...Array.from({ length: 22 }, (_, i) => String(3025 + i)),
]);
const equipmentPercent = new Set([
  'FIGHT_PROP_HP_PERCENT',
  'FIGHT_PROP_ATTACK_PERCENT',
  'FIGHT_PROP_DEFENSE_PERCENT',
  'FIGHT_PROP_CRITICAL',
  'FIGHT_PROP_CRITICAL_HURT',
  'FIGHT_PROP_CHARGE_EFFICIENCY',
  'FIGHT_PROP_HEAL_ADD',
  'FIGHT_PROP_PHYSICAL_ADD_HURT',
  'FIGHT_PROP_FIRE_ADD_HURT',
  'FIGHT_PROP_ELEC_ADD_HURT',
  'FIGHT_PROP_WATER_ADD_HURT',
  'FIGHT_PROP_WIND_ADD_HURT',
  'FIGHT_PROP_ICE_ADD_HURT',
  'FIGHT_PROP_ROCK_ADD_HURT',
  'FIGHT_PROP_GRASS_ADD_HURT',
]);
const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const elementNames: Record<string, NonNullable<ShowcaseCharacter['element']>> = {
  Wind: 'Anemo',
  Rock: 'Geo',
  Electric: 'Electro',
  Grass: 'Dendro',
  Water: 'Hydro',
  Fire: 'Pyro',
  Ice: 'Cryo',
};
const weaponTypeNames: Record<string, NonNullable<ShowcaseCharacter['weaponType']>> = {
  Sword: 'Sword',
  Claymore: 'Claymore',
  Polearm: 'Polearm',
  Bow: 'Bow',
  Catalyst: 'Catalyst',
};
export function formatShowcaseStat(
  id: string,
  value: number,
  context: 'combat' | 'equipment',
): ShowcaseStat {
  const percent = context === 'combat' ? combatPercent.has(id) : equipmentPercent.has(id);
  return {
    id,
    value,
    name: context === 'combat' ? (combatNames[id] ?? `Combat property ${id}`) : (english[id] ?? id),
    // fightPropMap contains ratios; flat equipment propValue already contains percentage points.
    formatted:
      numberFormat.format(percent && context === 'combat' ? value * 100 : value) +
      (percent ? '%' : ''),
  };
}
export function enkaIcon(name: string | undefined): string | null {
  const iconName = name?.startsWith('/ui/')
    ? /^\/ui\/((?:UI_|Skill_)[A-Za-z0-9_]+)\.png$/.exec(name)?.[1]
    : name;
  return iconName && /^(UI_|Skill_)[A-Za-z0-9_]+$/.test(iconName)
    ? `https://enka.network/ui/${iconName}.png`
    : null;
}
const slots: Record<string, string> = {
  EQUIP_BRACER: 'Flower',
  EQUIP_NECKLACE: 'Plume',
  EQUIP_SHOES: 'Sands',
  EQUIP_RING: 'Goblet',
  EQUIP_DRESS: 'Circlet',
};
function mapEquipment(item: z.infer<typeof equipment>): ShowcaseEquipment {
  const flat = item.flat;
  const affixes = Object.values(item.weapon?.affixMap ?? {});
  const rawStats =
    flat.itemType === 'ITEM_WEAPON'
      ? (flat.weaponStats ?? [])
      : [
          ...(flat.reliquaryMainstat ? [flat.reliquaryMainstat] : []),
          ...(flat.reliquarySubstats ?? []),
        ];
  return {
    id: item.itemId,
    name: english[String(flat.nameTextMapHash)] ?? `Equipment ${item.itemId}`,
    icon: enkaIcon(flat.icon),
    rarity: flat.rankLevel ?? null,
    level: item.weapon?.level ?? (item.reliquary ? item.reliquary.level - 1 : null),
    ascension: item.weapon?.promoteLevel ?? null,
    refinement: affixes.length === 1 ? affixes[0]! + 1 : null,
    slot: flat.equipType ? slots[flat.equipType]! : null,
    setName: flat.setNameTextMapHash
      ? (english[String(flat.setNameTextMapHash)] ?? `Set ${flat.setNameTextMapHash}`)
      : null,
    stats: rawStats.map((s) =>
      formatShowcaseStat(
        s.mainPropId ?? s.appendPropId ?? 'Unknown stat',
        (s.statValue ?? s.propValue)!,
        'equipment',
      ),
    ),
    mainStat:
      flat.itemType === 'ITEM_RELIQUARY' && flat.reliquaryMainstat
        ? formatShowcaseStat(
            flat.reliquaryMainstat.mainPropId ?? 'Unknown stat',
            (flat.reliquaryMainstat.statValue ?? flat.reliquaryMainstat.propValue)!,
            'equipment',
          )
        : null,
  };
}
function mapCharacter(data: z.infer<typeof avatar>): ShowcaseCharacter {
  const composite = `${data.avatarId}-${data.skillDepotId}`;
  // Traveler variants are keyed by avatar + depot in the official metadata.
  const metadataId = characters[composite] ? composite : String(data.avatarId);
  const metadata = characters[metadataId];
  const costume = data.costumeId ? metadata?.Costumes?.[data.costumeId] : undefined;
  const equipmentItems = (data.equipList ?? []).map(mapEquipment);
  const weapons = equipmentItems.filter((e) => e.slot === null);
  const artifacts = equipmentItems.filter((e) => e.slot !== null);
  if (weapons.length > 1 || new Set(artifacts.map((e) => e.slot)).size !== artifacts.length)
    throw new Error('Duplicate equipment.');
  const levels = data.skillLevelMap ?? {};
  const skillOrder = metadata?.SkillOrder ?? Object.keys(levels).map(Number);
  const orderedIds = [...new Set([...skillOrder.map(String), ...Object.keys(levels)])];
  const prop = (id: string, maximum: number) => {
    const value = data.propMap[id]?.val;
    if (value === undefined) return null;
    if (!Number.isInteger(value) || value < 0 || value > maximum)
      throw new Error('Invalid progression.');
    return value;
  };
  return {
    key: `${data.avatarId}:${data.skillDepotId ?? 'unknown'}`,
    id: data.avatarId,
    skillDepotId: data.skillDepotId ?? null,
    name: metadata
      ? (english[String(metadata.NameTextMapHash)] ?? `Character ${data.avatarId}`)
      : `Character ${data.avatarId}`,
    portrait: enkaIcon(costume?.icon ?? costume?.sideIconName ?? metadata?.SideIconName),
    element: metadata?.Element ? (elementNames[metadata.Element] ?? null) : null,
    metadataAvailable: !!metadata,
    weaponType: metadata?.WeaponType ? (weaponTypeNames[metadata.WeaponType] ?? null) : null,
    rarity: metadata?.Rarity === 4 || metadata?.Rarity === 5 ? metadata.Rarity : null,
    level: prop('4001', 200),
    ascension: prop('1002', 10),
    constellation: data.talentIdList?.length ?? 0,
    talents: orderedIds
      .filter((id) => levels[id] !== undefined)
      .map((id) => {
        const proud = metadata?.ProudMap?.[id];
        // Classify by the verified depot's skill order, not the returned array position.
        const kind =
          metadata?.SkillOrder.length === 3
            ? ((['normal', 'skill', 'burst'] as const)[metadata.SkillOrder.indexOf(Number(id))] ??
              null)
            : null;
        return {
          id,
          label: talentNames[metadataId]?.[id] ?? `Skill ${id}`,
          kind,
          baseLevel: levels[id]!,
          bonusLevel: proud === undefined ? null : (data.proudSkillExtraLevelMap?.[proud] ?? null),
        };
      }),
    equipmentAvailable: data.equipList !== undefined,
    weapon: weapons[0] ?? null,
    artifacts,
    stats: Object.entries(data.fightPropMap).map(([id, value]) =>
      formatShowcaseStat(id, value, 'combat'),
    ),
  };
}
export function parseShowcase(
  uid: string,
  raw: unknown,
): { snapshot: ShowcaseSnapshot; ttl: number } {
  const parsed = responseSchema.parse(raw);
  if (parsed.uid !== undefined && String(parsed.uid) !== uid) throw new Error('UID mismatch.');
  const mapped = (parsed.avatarInfoList ?? []).map(mapCharacter);
  if (new Set(mapped.map((c) => c.key)).size !== mapped.length)
    throw new Error('Duplicate characters.');
  return {
    ttl: parsed.ttl,
    snapshot: {
      uid,
      nickname: parsed.playerInfo.nickname,
      adventureRank: parsed.playerInfo.level ?? null,
      worldLevel: parsed.playerInfo.worldLevel ?? null,
      signature: parsed.playerInfo.signature ?? null,
      characters: mapped,
    },
  };
}
