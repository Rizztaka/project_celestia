import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { z } from 'zod';

import { AppError } from '@/core/errors/app-error.js';

import type { SyncedCharacter } from './hoyolab.types.js';
const integer = z.number().int();
const stat = z.object({
  property_type: z.union([z.string(), z.number()]),
  value: z.union([z.string(), z.number()]),
});
const detailSchema = z.object({
  base: z.object({
    id: integer,
    level: integer.min(1).max(100),
    element: z.string(),
    actived_constellation_num: integer.min(0).max(6),
    promote_level: integer.min(0).max(6).optional(),
    max_level: integer.optional(),
  }),
  skills: z.array(
    z.object({
      skill_type: integer,
      level: integer.min(1).max(15),
      is_unlock: z.boolean().optional(),
    }),
  ),
  weapon: z.object({
    id: integer,
    level: integer.min(1).max(90),
    promote_level: integer.min(0).max(6).optional(),
    max_level: integer.optional(),
    affix_level: integer.min(1).max(5),
  }),
  relics: z
    .array(
      z.object({
        pos: integer.min(1).max(5),
        level: integer.min(0).max(20),
        rarity: integer.min(1).max(5),
        set: z.object({ id: integer }),
        main_property: stat,
        sub_property_list: z.array(stat).max(4),
      }),
    )
    .max(5),
});
const root = new URL('../static/profile-reference/', import.meta.url);
type Ref = { key: string; gameId: number | null; element?: string };
const maps: Record<string, Ref[]> = {};
function references(kind: 'characters' | 'weapons' | 'artifacts') {
  if (maps[kind]) return maps[kind]!;
  const index = JSON.parse(readFileSync(new URL('index.json', root), 'utf8'))[kind] as Record<
    string,
    { file: string; sha256: string }
  >;
  return (maps[kind] = Object.entries(index).map(([key, entry]) => {
    if (!entry.file.startsWith(kind + '-') || !/^[A-Za-z0-9-]+\.json$/.test(entry.file))
      throw Error('Invalid reference file');
    const bytes = readFileSync(new URL(entry.file, root));
    if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256)
      throw Error('Reference integrity failed');
    const ref = JSON.parse(bytes.toString());
    return { key, gameId: ref.gameId, element: ref.element };
  }));
}
const elements: Record<string, string> = {
  Anemo: 'Anemo',
  Wind: 'Anemo',
  wind: 'Anemo',
  Geo: 'Geo',
  Rock: 'Geo',
  rock: 'Geo',
  Electro: 'Electro',
  Electric: 'Electro',
  electric: 'Electro',
  Dendro: 'Dendro',
  Grass: 'Dendro',
  grass: 'Dendro',
  Hydro: 'Hydro',
  Water: 'Hydro',
  water: 'Hydro',
  Pyro: 'Pyro',
  Fire: 'Pyro',
  fire: 'Pyro',
  Cryo: 'Cryo',
  Ice: 'Cryo',
  ice: 'Cryo',
};
function key(kind: 'characters' | 'weapons' | 'artifacts', id: number, element?: string) {
  if (kind === 'characters' && (id === 10000005 || id === 10000007)) {
    const form = 'Traveler' + (element ? (elements[element] ?? '') : '');
    if (references(kind).some((r) => r.key === form)) return form;
    return `HoyolabTraveler${id}`;
  }
  return (
    references(kind).find((r) => r.gameId === id)?.key ??
    `Hoyolab${kind === 'characters' ? 'Character' : kind === 'weapons' ? 'Weapon' : 'Set'}${id}`
  );
}
export function observedAscension(
  level: number,
  explicit?: number,
  maxLevel?: number,
): number | null {
  if (level > 90) return null;
  const caps = [20, 40, 50, 60, 70, 80, 90];
  const phase =
    explicit ??
    (maxLevel !== undefined && caps.includes(maxLevel) ? caps.indexOf(maxLevel) : undefined);
  if (phase !== undefined) {
    if (level > caps[phase]! || level < (phase ? caps[phase - 1]! : 1))
      throw new AppError(
        'HoYoLAB returned inconsistent level caps. Your saved builds were kept.',
        502,
        'HOYOLAB_INCOMPLETE',
      );
    return phase;
  }
  if (caps.slice(0, 6).includes(level) || level > 90) return null;
  return caps.findIndex((cap) => level <= cap);
}
const statNames: Record<string, string> = {
  hp: 'hp',
  atk: 'atk',
  attack: 'atk',
  def: 'def',
  defense: 'def',
  critrate: 'critRate_',
  critdmg: 'critDMG_',
  criticaldamage: 'critDMG_',
  energyrecharge: 'enerRech_',
  elementalmastery: 'eleMas',
  healingbonus: 'heal_',
  physicaldmgbonus: 'physical_dmg_',
  pyrodmgbonus: 'pyro_dmg_',
  hydrodmgbonus: 'hydro_dmg_',
  cryodmgbonus: 'cryo_dmg_',
  dendrodmgbonus: 'dendro_dmg_',
  geodmgbonus: 'geo_dmg_',
  electrodmgbonus: 'electro_dmg_',
  anemodmgbonus: 'anemo_dmg_',
};
function property(
  p: z.infer<typeof stat>,
  map: Record<string, { name?: string; filter_name?: string }>,
) {
  const type = String(p.property_type),
    descriptor = map[type];
  const labels = [descriptor?.filter_name, descriptor?.name].map((name) =>
    (name ?? '').toLowerCase().replace(/[^a-z]/g, ''),
  );
  let mapped = labels.map((label) => statNames[label]).find(Boolean);
  if (String(p.value).includes('%') && ['hp', 'atk', 'def'].includes(mapped ?? '')) mapped += '_';
  const text = String(p.value).replace(/,/g, '').trim();
  if (!/^-?\d+(\.\d+)?%?$/.test(text))
    throw new AppError(
      'HoYoLAB returned incomplete equipment data. Your saved builds were kept.',
      502,
      'HOYOLAB_INCOMPLETE',
    );
  const value = Number(text.replace('%', ''));
  if (!Number.isFinite(value)) throw Error('Invalid stat value');
  return { key: mapped ?? `hoyolab_stat_${type}`, value };
}
export function mapCharacters(raw: unknown, expectedIds: number[]): SyncedCharacter[] {
  const response = z
    .object({
      list: z.array(detailSchema).min(1).max(250),
      property_map: z
        .record(z.object({ name: z.string().optional(), filter_name: z.string().optional() }))
        .default({}),
    })
    .parse(raw);
  const ids = response.list.map((c) => c.base.id);
  if (
    new Set(ids).size !== ids.length ||
    ids.length !== expectedIds.length ||
    expectedIds.some((id) => !ids.includes(id))
  )
    throw new AppError(
      'HoYoLAB returned a partial roster. Your saved builds were kept.',
      502,
      'HOYOLAB_INCOMPLETE',
    );
  return response.list.map((c) => {
    const active = c.skills.filter((s) => s.skill_type === 1);
    if (active.length !== 3 || new Set(c.relics.map((r) => r.pos)).size !== c.relics.length)
      throw new AppError(
        'HoYoLAB returned incomplete character data. Your saved builds were kept.',
        502,
        'HOYOLAB_INCOMPLETE',
      );
    return {
      key: key('characters', c.base.id, c.base.element),
      level: c.base.level,
      ascension: observedAscension(c.base.level, c.base.promote_level, c.base.max_level),
      constellation: c.base.actived_constellation_num,
      talents: { normal: active[0]!.level, skill: active[1]!.level, burst: active[2]!.level },
      weapon: {
        key: key('weapons', c.weapon.id),
        level: c.weapon.level,
        ascension: observedAscension(c.weapon.level, c.weapon.promote_level, c.weapon.max_level),
        refinement: c.weapon.affix_level,
      },
      artifacts: c.relics.map((a) => {
        const main = property(a.main_property, response.property_map);
        return {
          key: key('artifacts', a.set.id),
          slot: ['flower', 'plume', 'sands', 'goblet', 'circlet'][a.pos - 1]!,
          level: a.level,
          rarity: a.rarity,
          mainStatKey: main.key,
          mainStatValue: main.value,
          subStats: a.sub_property_list.map((p) => property(p, response.property_map)),
        };
      }),
    };
  });
}
