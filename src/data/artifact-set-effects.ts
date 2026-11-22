import type { Element, StatKey, TeamContext } from '../types/genshin';
import { CHARACTERS } from './characters';
import { MAX_SUBSTAT_VALUES, getCharacterStatWeights } from './artifact-weights';

export interface SetStatBonus {
  stats?: Partial<Record<StatKey, number>>;
  dmgBonus?: number;
  reactionDmgBonus?: number; // Transformative / Lunar / Stellar reaction DMG%
  shieldStrength?: number;
  resShred?: number;
  teamDmgBonus?: number;
  teamAtkPct?: number;
  teamEm?: number;
  desc: string;
}

export interface SetEffectDefinition {
  name: string;
  piece2: SetStatBonus;
  piece4: {
    stats?: Partial<Record<StatKey, number>>;
    conditionalStats?: (
      characterIdOrName: string,
      totalEr: number,
    ) => Partial<Record<StatKey, number>>;
    dmgBonus?: number | ((characterIdOrName: string, totalEr: number) => number);
    reactionDmgBonus?: number;
    resShred?: number;
    teamDmgBonus?: number;
    teamAtkPct?: number;
    teamEm?: number;
    desc: string;
  };
}

const ELEMENTAL_DMG_STAT_TO_ELEMENT: Partial<Record<StatKey, Element>> = {
  pyro_dmg_: 'Pyro',
  hydro_dmg_: 'Hydro',
  dendro_dmg_: 'Dendro',
  electro_dmg_: 'Electro',
  anemo_dmg_: 'Anemo',
  cryo_dmg_: 'Cryo',
  geo_dmg_: 'Geo',
};

/** Equivalent single-roll denominators for non-substat set bonus stats (KQM standard). */
const NON_SUBSTAT_ROLL_EQUIVALENT: Partial<Record<StatKey, number>> = {
  pyro_dmg_: 5.0,
  hydro_dmg_: 5.0,
  dendro_dmg_: 5.0,
  electro_dmg_: 5.0,
  anemo_dmg_: 5.0,
  cryo_dmg_: 5.0,
  geo_dmg_: 5.0,
  physical_dmg_: 6.25,
  heal_: 4.5,
};

export const ARTIFACT_SET_EFFECTS: Record<string, SetEffectDefinition> = {
  'Emblem of Severed Fate': {
    name: 'Emblem of Severed Fate',
    piece2: { stats: { enerRech_: 20 }, desc: 'Energy Recharge +20%' },
    piece4: {
      dmgBonus: (_char, totalEr) =>
        Math.min(75, Math.max(0, (totalEr || 100) * 0.25)),
      desc: 'Increases Elemental Burst DMG by 25% of Energy Recharge. A maximum of 75% bonus DMG can be obtained.',
    },
  },
  'Marechaussee Hunter': {
    name: 'Marechaussee Hunter',
    piece2: { dmgBonus: 15, desc: 'Normal and Charged Attack DMG +15%' },
    piece4: {
      stats: { critRate_: 36 },
      desc: 'When current HP increases or decreases, CRIT Rate will be increased by 12% for 5s. Max 3 stacks (+36% CRIT Rate).',
    },
  },
  'Obsidian Codex': {
    name: 'Obsidian Codex',
    piece2: {
      dmgBonus: 15,
      desc: 'While in Nightsoul Blessing, DMG dealt is increased by 15%',
    },
    piece4: {
      stats: { critRate_: 40 },
      desc: 'Consuming Nightsoul points on field increases CRIT Rate by 40% for 6s.',
    },
  },
  'Blizzard Strayer': {
    name: 'Blizzard Strayer',
    piece2: { stats: { cryo_dmg_: 15 }, desc: 'Cryo DMG Bonus +15%' },
    piece4: {
      stats: { critRate_: 30 },
      desc: 'When an opponent is affected by Cryo, CRIT Rate +20%. If Frozen, CRIT Rate is increased by an additional 20%.',
    },
  },
  'Deepwood Memories': {
    name: 'Deepwood Memories',
    piece2: { stats: { dendro_dmg_: 15 }, desc: 'Dendro DMG Bonus +15%' },
    piece4: {
      resShred: 30,
      desc: 'Elemental Skills or Bursts decrease opponents Dendro RES by 30% for 8s.',
    },
  },
  'Viridescent Venerer': {
    name: 'Viridescent Venerer',
    piece2: { stats: { anemo_dmg_: 15 }, desc: 'Anemo DMG Bonus +15%' },
    piece4: {
      resShred: 40,
      reactionDmgBonus: 20,
      desc: 'Swirl DMG +60%. Decreases opponents Elemental RES to the element infused in the Swirl by 40% for 10s.',
    },
  },
  'Golden Troupe': {
    name: 'Golden Troupe',
    piece2: { dmgBonus: 20, desc: 'Elemental Skill DMG +20%' },
    piece4: {
      dmgBonus: 50,
      desc: 'Increases Elemental Skill DMG by 25%. Additionally, when not on the field, Elemental Skill DMG is increased by a further 25%.',
    },
  },
  'Crimson Witch of Flames': {
    name: 'Crimson Witch of Flames',
    piece2: { stats: { pyro_dmg_: 15 }, desc: 'Pyro DMG Bonus +15%' },
    piece4: {
      stats: { pyro_dmg_: 22.5 },
      dmgBonus: 15,
      desc: 'Increases Overloaded, Burning, and Burgeon DMG by 40%. Increases Vaporize and Melt DMG by 15%. Casting Skill increases 2pc by 50% (max 3 stacks).',
    },
  },
  'Gilded Dreams': {
    name: 'Gilded Dreams',
    piece2: { stats: { eleMas: 80 }, desc: 'Elemental Mastery +80' },
    piece4: {
      stats: { eleMas: 100, atk_: 14 },
      desc: 'Triggering reaction grants +14% ATK per same-element teammate and +50 EM per different-element teammate.',
    },
  },
  'Desert Pavilion Chronicle': {
    name: 'Desert Pavilion Chronicle',
    piece2: { stats: { anemo_dmg_: 15 }, desc: 'Anemo DMG Bonus +15%' },
    piece4: {
      dmgBonus: 40,
      desc: 'Charged Attack hits increase Normal ATK SPD by 10%, Normal/Charged/Plunging DMG by 40% for 15s.',
    },
  },
  'Husk of Opulent Dreams': {
    name: 'Husk of Opulent Dreams',
    piece2: { stats: { def_: 30 }, desc: 'DEF +30%' },
    piece4: {
      stats: { def_: 24, geo_dmg_: 24 },
      desc: 'Curiosity stacks grant up to +24% DEF and +24% Geo DMG Bonus.',
    },
  },
  'Fragment of Harmonic Whimsy': {
    name: 'Fragment of Harmonic Whimsy',
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      dmgBonus: 54,
      desc: 'When value of Bond of Life increases or decreases, deal 18% increased DMG for 6s (max 3 stacks, +54%).',
    },
  },
  'Noblesse Oblige': {
    name: 'Noblesse Oblige',
    piece2: { dmgBonus: 20, desc: 'Elemental Burst DMG +20%' },
    piece4: {
      teamAtkPct: 20,
      desc: 'Using an Elemental Burst increases all party members ATK by 20% for 12s.',
    },
  },
  'Tenacity of the Millelith': {
    name: 'Tenacity of the Millelith',
    piece2: { stats: { hp_: 20 }, desc: 'HP +20%' },
    piece4: {
      teamAtkPct: 20,
      desc: 'When Elemental Skill hits an opponent, all party members gain +20% ATK and +30% Shield Strength for 3s.',
    },
  },
  'Scroll of the Hero of Cinder City': {
    name: 'Scroll of the Hero of Cinder City',
    piece2: {
      stats: { enerRech_: 10 },
      desc: 'Energy restored upon nearby Nightsoul Burst',
    },
    piece4: {
      teamDmgBonus: 40,
      desc: 'Elemental reactions grant 12% DMG bonus; in Nightsoul state, grants an additional 28% (total +40% party DMG).',
    },
  },
  "Gladiator's Finale": {
    name: "Gladiator's Finale",
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      dmgBonus: 35,
      desc: 'Sword, Claymore, or Polearm wielder deals 35% increased Normal Attack DMG.',
    },
  },
  "Shimenawa's Reminiscence": {
    name: "Shimenawa's Reminiscence",
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      dmgBonus: 50,
      desc: 'Casting Skill consumes 15 Energy to increase Normal, Charged, and Plunging Attack DMG by 50% for 10s.',
    },
  },
  "Wanderer's Troupe": {
    name: "Wanderer's Troupe",
    piece2: { stats: { eleMas: 80 }, desc: 'Elemental Mastery +80' },
    piece4: {
      dmgBonus: 35,
      desc: 'Increases Charged Attack DMG by 35% if the character uses a Catalyst or Bow.',
    },
  },
  'Heart of Depth': {
    name: 'Heart of Depth',
    piece2: { stats: { hydro_dmg_: 15 }, desc: 'Hydro DMG Bonus +15%' },
    piece4: {
      dmgBonus: 30,
      desc: 'After using Elemental Skill, increases Normal and Charged Attack DMG by 30% for 15s.',
    },
  },
  'Pale Flame': {
    name: 'Pale Flame',
    piece2: { stats: { physical_dmg_: 25 }, desc: 'Physical DMG +25%' },
    piece4: {
      stats: { atk_: 18, physical_dmg_: 25 },
      desc: 'Skill hits grant +9% ATK for 7s (max 2 stacks). At 2 stacks, 2pc effect is increased by 100%.',
    },
  },
  'Bloodstained Chivalry': {
    name: 'Bloodstained Chivalry',
    piece2: { stats: { physical_dmg_: 25 }, desc: 'Physical DMG +25%' },
    piece4: {
      dmgBonus: 50,
      desc: 'After defeating an opponent, Charged Attack DMG +50% and stamina cost reduced to 0 for 10s.',
    },
  },
  'Archaic Petra': {
    name: 'Archaic Petra',
    piece2: { stats: { geo_dmg_: 15 }, desc: 'Geo DMG Bonus +15%' },
    piece4: {
      teamDmgBonus: 35,
      desc: 'Obtaining an Elemental Shard via Crystallize grants all party members 35% DMG Bonus for that element for 10s.',
    },
  },
  'Retracing Bolide': {
    name: 'Retracing Bolide',
    piece2: { shieldStrength: 35, desc: 'Shield Strength +35%' },
    piece4: {
      dmgBonus: 40,
      desc: 'While protected by a shield, gain an additional 40% Normal and Charged Attack DMG.',
    },
  },
  'Thundering Fury': {
    name: 'Thundering Fury',
    piece2: { stats: { electro_dmg_: 15 }, desc: 'Electro DMG Bonus +15%' },
    piece4: {
      reactionDmgBonus: 25,
      desc: 'Overloaded, Electro-Charged, Superconduct, and Hyperbloom DMG +40%, Aggravate +20%. Triggering reactions reduces Skill CD by 1s.',
    },
  },
  Thundersoother: {
    name: 'Thundersoother',
    piece2: { desc: 'Electro RES +40%' },
    piece4: {
      dmgBonus: 35,
      desc: 'Increases DMG against opponents affected by Electro by 35%.',
    },
  },
  Lavawalker: {
    name: 'Lavawalker',
    piece2: { desc: 'Pyro RES +40%' },
    piece4: {
      dmgBonus: 35,
      desc: 'Increases DMG against opponents affected by Pyro by 35%.',
    },
  },
  'Ocean-Hued Clam': {
    name: 'Ocean-Hued Clam',
    piece2: { stats: { heal_: 15 }, desc: 'Healing Bonus +15%' },
    piece4: {
      reactionDmgBonus: 20,
      desc: 'Accumulates healing for 3s, then detonates a Sea-Dyed Foam dealing 90% of healing as Physical DMG (up to ~30k).',
    },
  },
  'Song of Days Past': {
    name: 'Song of Days Past',
    piece2: { stats: { heal_: 15 }, desc: 'Healing Bonus +15%' },
    piece4: {
      teamDmgBonus: 15,
      desc: 'Records healing up to 15,000 for 6s, adding 8% of recorded healing to active characters hits.',
    },
  },
  'Flower of Paradise Lost': {
    name: 'Flower of Paradise Lost',
    piece2: { stats: { eleMas: 80 }, desc: 'Elemental Mastery +80' },
    piece4: {
      reactionDmgBonus: 45,
      desc: 'Increases Bloom, Hyperbloom, and Burgeon reaction DMG by 40% (+80% at max stacks).',
    },
  },
  "Nymph's Dream": {
    name: "Nymph's Dream",
    piece2: { stats: { hydro_dmg_: 15 }, desc: 'Hydro DMG Bonus +15%' },
    piece4: {
      stats: { atk_: 25, hydro_dmg_: 15 },
      desc: 'Normal/Charged/Plunge/Skill/Burst hits grant up to +25% ATK and +15% Hydro DMG Bonus.',
    },
  },
  "Vourukasha's Glow": {
    name: "Vourukasha's Glow",
    piece2: { stats: { hp_: 20 }, desc: 'HP +20%' },
    piece4: {
      dmgBonus: 50,
      desc: 'Increases Elemental Skill and Burst DMG by 10%. Taking DMG increases this bonus up to 50%.',
    },
  },
  'Vermillion Hereafter': {
    name: 'Vermillion Hereafter',
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      stats: { atk_: 48 },
      desc: 'After Burst, gain +8% ATK. Taking HP decrease grants +10% ATK up to 4 times (total +66% ATK).',
    },
  },
  'Echoes of an Offering': {
    name: 'Echoes of an Offering',
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      dmgBonus: 35,
      desc: 'Normal Attacks have a 36% chance to trigger Valley Rite, increasing Normal Attack DMG by 70% of ATK.',
    },
  },
  'Nighttime Whispers in the Echoing Woods': {
    name: 'Nighttime Whispers in the Echoing Woods',
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      stats: { geo_dmg_: 50 },
      desc: 'Using Skill grants 20% Geo DMG. While protected by Crystallize shield, effect is increased by 150% (+50% Geo DMG).',
    },
  },
  'Unfinished Reverie': {
    name: 'Unfinished Reverie',
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      dmgBonus: 50,
      desc: 'When leaving combat or against Burning opponents, DMG dealt is increased by 50%.',
    },
  },
  'Finale of the Deep Galleries': {
    name: 'Finale of the Deep Galleries',
    piece2: { stats: { cryo_dmg_: 15 }, desc: 'Cryo DMG Bonus +15%' },
    piece4: {
      dmgBonus: 60,
      desc: 'When the equipping character has 0 Energy, Normal Attack DMG and Elemental Burst DMG are increased by 60%.',
    },
  },
  "Long Night's Oath": {
    name: "Long Night's Oath",
    piece2: { dmgBonus: 25, desc: 'Plunging Attack DMG +25%' },
    piece4: {
      dmgBonus: 60,
      desc: 'Plunging Attacks, Charged Attacks, and Elemental Skills grant stacks increasing Plunging Attack DMG up to +75% (avg ~60% uptime).',
    },
  },
  "Night of the Sky's Unveiling": {
    name: "Night of the Sky's Unveiling",
    piece2: { stats: { eleMas: 80 }, desc: 'Elemental Mastery +80' },
    piece4: {
      stats: { critRate_: 22.5 }, // 15% Nascent / 30% Ascendant Gleam
      reactionDmgBonus: 20,
      desc: 'When Moonsign is active, triggering Lunar reactions grants +15%/+30% CRIT Rate and increases Lunar reaction DMG.',
    },
  },
  "Silken Moon's Serenade": {
    name: "Silken Moon's Serenade",
    piece2: { stats: { enerRech_: 20 }, desc: 'Energy Recharge +20%' },
    piece4: {
      teamEm: 120,
      reactionDmgBonus: 30,
      desc: 'When Moonsign is active, triggering Lunar reactions grants +36% team reaction DMG and +120 party EM for 12s.',
    },
  },
  'A Day Carved From Rising Winds': {
    name: 'A Day Carved From Rising Winds',
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      stats: { atk_: 25, critRate_: 15 },
      desc: 'Increases ATK by 25% and CRIT Rate during coordinated wind/Hexerei combat states.',
    },
  },
  'Disenchantment in Deep Shadow': {
    name: 'Disenchantment in Deep Shadow',
    piece2: { stats: { critRate_: 8 }, desc: 'CRIT Rate +8%' },
    piece4: {
      stats: { critRate_: 16 },
      dmgBonus: 32,
      desc: 'Grants stacking CRIT Rate (+16%) and Skill/Burst DMG Bonus during sustained combat.',
    },
  },
  'Aubade of Morningstar and Moon': {
    name: 'Aubade of Morningstar and Moon',
    piece2: { stats: { eleMas: 80 }, desc: 'Elemental Mastery +80' },
    piece4: {
      reactionDmgBonus: 40,
      desc: 'Increases off-field Lunar reaction DMG by 20% (+40% under Ascendant Gleam).',
    },
  },
  'Scarlet Proof': {
    name: 'Scarlet Proof',
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      stats: { critRate_: 16 },
      dmgBonus: 36,
      desc: 'Grants +16% CRIT Rate and +36% active combat DMG Bonus.',
    },
  },
  'Heart of the Furnace': {
    name: 'Heart of the Furnace',
    piece2: { stats: { hp_: 20 }, desc: 'HP +20%' },
    piece4: {
      dmgBonus: 40,
      desc: 'Converts Max HP thresholds into sustained active DMG Bonus.',
    },
  },
  'Maiden Beloved': {
    name: 'Maiden Beloved',
    piece2: { stats: { heal_: 15 }, desc: 'Character Healing Effectiveness +15%' },
    piece4: {
      stats: { heal_: 20 },
      desc: 'Using Skill or Burst increases healing received by all party members by 20% for 10s.',
    },
  },
  'The Exile': {
    name: 'The Exile',
    piece2: { stats: { enerRech_: 20 }, desc: 'Energy Recharge +20%' },
    piece4: {
      stats: { enerRech_: 10 },
      desc: 'Using Burst regenerates 2 Energy for all party members (excluding wielder) every 2s for 6s.',
    },
  },
  Instructor: {
    name: 'Instructor',
    piece2: { stats: { eleMas: 80 }, desc: 'Elemental Mastery +80' },
    piece4: {
      teamEm: 120,
      desc: 'Upon triggering an Elemental Reaction, increases all party members Elemental Mastery by 120 for 8s.',
    },
  },
  Scholar: {
    name: 'Scholar',
    piece2: { stats: { enerRech_: 20 }, desc: 'Energy Recharge +20%' },
    piece4: {
      stats: { enerRech_: 8 },
      desc: 'Gaining Elemental Particles or Orbs restores 3 Energy to all Bow and Catalyst party members.',
    },
  },
};

function resolveCharacterElement(charKey: string): Element | undefined {
  const norm = charKey.replace(/[\s\-_]/g, '').toLowerCase();
  const match = CHARACTERS.find((c) => {
    const cId = c.id.toLowerCase();
    const cName = c.name.replace(/[\s\-_]/g, '').toLowerCase();
    return cId === norm || cName === norm || cId.endsWith(norm) || cName.endsWith(norm);
  });
  return match?.element;
}

/**
 * Normalizes set names and finds best match in ARTIFACT_SET_EFFECTS.
 */
export function getSetEffectDefinition(
  setKeyOrName?: string,
): SetEffectDefinition | undefined {
  if (!setKeyOrName) return undefined;
  if (ARTIFACT_SET_EFFECTS[setKeyOrName]) return ARTIFACT_SET_EFFECTS[setKeyOrName];

  const norm = setKeyOrName.replace(/[\s\-_'’]/g, '').toLowerCase();
  for (const [key, def] of Object.entries(ARTIFACT_SET_EFFECTS)) {
    if (key.replace(/[\s\-_'’]/g, '').toLowerCase() === norm) {
      return def;
    }
  }
  return undefined;
}

/**
 * Parses equipped piece set keys to identify active 2-piece and 4-piece bonuses.
 */
export function parseActiveSetBonuses(
  pieceSetKeys: (string | undefined)[],
): { active2pc: string[]; active4pc: string[] } {
  const counts: Record<string, number> = {};

  for (const raw of pieceSetKeys) {
    const def = getSetEffectDefinition(raw);
    if (!def) continue;
    counts[def.name] = (counts[def.name] || 0) + 1;
  }

  const active2pc: string[] = [];
  const active4pc: string[] = [];

  for (const [name, count] of Object.entries(counts)) {
    if (count >= 4) {
      active4pc.push(name);
      active2pc.push(name);
    } else if (count >= 2) {
      active2pc.push(name);
    }
  }

  return { active2pc, active4pc };
}

export interface SetEsrResult {
  totalEsr: number;
  breakdown: Record<string, number>;
  active2pc: string[];
  active4pc: string[];
}

/**
 * Converts active set bonuses into Equivalent Substat Rolls (ESR) calibrated
 * against character stat weights, element match, and optional TeamContext dilution.
 */
export function calculateSetEquivalentSubstatRolls(
  activeSets: { setKey: string; pieces: number }[],
  characterIdOrName: string | { id?: string; name?: string },
  totalEr: number = 100,
  teamContext?: TeamContext,
): SetEsrResult {
  const charKey =
    typeof characterIdOrName === 'string'
      ? characterIdOrName
      : characterIdOrName?.id || characterIdOrName?.name || 'Hu Tao';

  const weights = getCharacterStatWeights(charKey);
  const statWeights = (weights.statWeights || {}) as Record<string, number>;
  const charElement = resolveCharacterElement(charKey);

  // Team buff saturation multipliers
  const bennettActive =
    teamContext?.preset === 'hypercarry_bennett_furina' ||
    Boolean(teamContext?.hasBennett) ||
    (teamContext?.customFlatAtkBuff ?? 0) >= 800;
  const dmgDilutionActive =
    teamContext?.preset === 'hypercarry_bennett_furina' ||
    Boolean(teamContext?.hasFurina) ||
    Boolean(teamContext?.hasKazuhaOrVV) ||
    (teamContext?.customDmgBonus ?? 0) >= 50;
  const isHyperbloom = teamContext?.preset === 'hyperbloom';

  const atkDilutionMult = bennettActive ? 0.65 : isHyperbloom ? 0.3 : 1.0;
  const dmgDilutionMult = isHyperbloom ? 0.25 : dmgDilutionActive ? 0.82 : 1.0;
  const isNonCritBuild =
    (statWeights.critRate_ ?? 0) <= 0 && (statWeights.critDMG_ ?? 0) <= 0;

  const breakdown: Record<string, number> = {};
  const active2pc: string[] = [];
  const active4pc: string[] = [];

  const addBreakdown = (key: string, delta: number) => {
    if (!Number.isFinite(delta) || delta <= 0) return;
    breakdown[key] = Number(((breakdown[key] || 0) + delta).toFixed(2));
  };

  const applyStatMap = (stats?: Partial<Record<StatKey, number>>) => {
    if (!stats) return;
    for (const [stat, val] of Object.entries(stats)) {
      if (!val || val <= 0) continue;
      const statKey = stat as StatKey;

      // 1. Elemental DMG% bonuses (e.g. pyro_dmg_: 15 -> 3.0 rolls if element matches)
      const bonusElement = ELEMENTAL_DMG_STAT_TO_ELEMENT[statKey];
      if (bonusElement) {
        if (charElement && charElement !== bonusElement) continue;
        const denom = NON_SUBSTAT_ROLL_EQUIVALENT[statKey] || 5.0;
        const relevance = isNonCritBuild ? 0.5 : 1.0;
        addBreakdown(statKey, (val / denom) * relevance * dmgDilutionMult);
        continue;
      }

      // 2. Physical DMG%
      if (statKey === 'physical_dmg_') {
        const prefersPhys = weights.preferredMainStats?.goblet?.includes('physical_dmg_');
        const denom = NON_SUBSTAT_ROLL_EQUIVALENT.physical_dmg_ || 6.25;
        const relevance = prefersPhys ? 1.0 : 0.25;
        addBreakdown(statKey, (val / denom) * relevance * dmgDilutionMult);
        continue;
      }

      // 3. Healing Bonus% (only meaningful if character values healing)
      if (statKey === 'heal_') {
        const healWeight =
          statWeights.heal_ ??
          (weights.preferredMainStats?.circlet?.includes('heal_') ? 0.8 : 0);
        if (healWeight <= 0) continue;
        const denom = NON_SUBSTAT_ROLL_EQUIVALENT.heal_ || 4.5;
        addBreakdown(statKey, (val / denom) * healWeight);
        continue;
      }

      // 4. Standard substat-backed stats
      const maxVal = MAX_SUBSTAT_VALUES[statKey] || 0;
      if (maxVal <= 0) continue;
      let weight = statWeights[statKey] ?? 0;
      if (statKey === 'atk_') weight *= atkDilutionMult;
      if (isHyperbloom && (statKey === 'critRate_' || statKey === 'critDMG_')) {
        weight *= 0.25;
      }
      addBreakdown(statKey, (val / maxVal) * weight);
    }
  };

  for (const set of activeSets) {
    const def = getSetEffectDefinition(set.setKey);
    if (!def) continue;

    // 2-Piece Bonus
    if (set.pieces >= 2) {
      active2pc.push(def.name);
      const p2 = def.piece2;
      applyStatMap(p2.stats);

      if (p2.dmgBonus) {
        const relevance = isNonCritBuild ? 0.45 : 1.0;
        addBreakdown('dmg_bonus', (p2.dmgBonus / 5.0) * relevance * dmgDilutionMult);
      }
      if (p2.reactionDmgBonus) {
        addBreakdown('reaction_dmg', p2.reactionDmgBonus / 5.0);
      }
      if (p2.shieldStrength) {
        addBreakdown('shield_utility', p2.shieldStrength / 25.0);
      }
    }

    // 4-Piece Bonus
    if (set.pieces >= 4) {
      active4pc.push(def.name);
      const p4 = def.piece4;
      applyStatMap(p4.stats);

      if (p4.conditionalStats) {
        applyStatMap(p4.conditionalStats(charKey, totalEr));
      }

      const dmgBonusVal =
        typeof p4.dmgBonus === 'function'
          ? p4.dmgBonus(charKey, totalEr)
          : p4.dmgBonus;

      if (dmgBonusVal) {
        const relevance = isNonCritBuild ? 0.45 : 1.0;
        addBreakdown('dmg_bonus', (dmgBonusVal / 5.0) * relevance * dmgDilutionMult);
      }

      if (p4.reactionDmgBonus) {
        addBreakdown('reaction_dmg', p4.reactionDmgBonus / 5.0);
      }

      if (p4.resShred) {
        addBreakdown('res_shred', p4.resShred / 4.5);
      }

      if (p4.teamDmgBonus) {
        addBreakdown('team_buff', (p4.teamDmgBonus / 6.0) * dmgDilutionMult);
      }
      if (p4.teamAtkPct) {
        addBreakdown('team_buff', (p4.teamAtkPct / 5.83) * atkDilutionMult);
      }
      if (p4.teamEm) {
        addBreakdown('team_buff', p4.teamEm / 23.31);
      }
    }
  }

  const totalEsr = Number(
    Object.values(breakdown)
      .reduce((acc, val) => acc + val, 0)
      .toFixed(2),
  );

  return {
    totalEsr,
    breakdown,
    active2pc,
    active4pc,
  };
}

export const COMBAT_SET_NAMES: string[] = Object.keys(ARTIFACT_SET_EFFECTS).sort();
