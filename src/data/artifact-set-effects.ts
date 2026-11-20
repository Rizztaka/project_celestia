import type { StatKey } from '../types/genshin';
import { MAX_SUBSTAT_VALUES, getCharacterStatWeights } from './artifact-weights';

export interface SetStatBonus {
  stats?: Partial<Record<StatKey, number>>;
  dmgBonus?: number;
  resShred?: number;
  teamDmgBonus?: number;
  teamAtkPct?: number;
  desc: string;
}

export interface SetEffectDefinition {
  name: string;
  piece2: SetStatBonus;
  piece4: {
    stats?: Partial<Record<StatKey, number>>;
    conditionalStats?: (characterIdOrName: string, totalEr: number) => Partial<Record<StatKey, number>>;
    dmgBonus?: number | ((characterIdOrName: string, totalEr: number) => number);
    resShred?: number;
    teamDmgBonus?: number;
    teamAtkPct?: number;
    desc: string;
  };
}

export const ARTIFACT_SET_EFFECTS: Record<string, SetEffectDefinition> = {
  'Emblem of Severed Fate': {
    name: 'Emblem of Severed Fate',
    piece2: { stats: { enerRech_: 20 }, desc: 'Energy Recharge +20%' },
    piece4: {
      dmgBonus: (_char, totalEr) => Math.min(75, Math.max(0, (totalEr || 100) * 0.25)),
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
    piece2: { dmgBonus: 15, desc: 'While in Nightsoul Blessing, DMG dealt is increased by 15%' },
    piece4: {
      stats: { critRate_: 40 },
      desc: 'Consuming Nightsoul points on field increases CRIT Rate by 40% for 6s.',
    },
  },
  'Blizzard Strayer': {
    name: 'Blizzard Strayer',
    piece2: { stats: { cryo_dmg_: 15 }, desc: 'Cryo DMG Bonus +15%' },
    piece4: {
      stats: { critRate_: 30 }, // Average between 20% (Cryo) and 40% (Frozen)
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
      dmgBonus: 10,
      desc: 'Swirl DMG +60%. Decreases opponents Elemental RES to the element infused in the Swirl by 40% for 10s.',
    },
  },
  'Golden Troupe': {
    name: 'Golden Troupe',
    piece2: { dmgBonus: 20, desc: 'Elemental Skill DMG +20%' },
    piece4: {
      dmgBonus: 50, // 25% + 25% off-field = 70% total Skill DMG
      desc: 'Increases Elemental Skill DMG by 25%. Additionally, when not on the field, Elemental Skill DMG is increased by a further 25%.',
    },
  },
  'Crimson Witch of Flames': {
    name: 'Crimson Witch of Flames',
    piece2: { stats: { pyro_dmg_: 15 }, desc: 'Pyro DMG Bonus +15%' },
    piece4: {
      stats: { pyro_dmg_: 22.5 }, // 3 stacks of 50% 2pc bonus
      dmgBonus: 15, // Vaporize/Melt reaction multiplier +15%
      desc: 'Increases Overloaded, Burning, and Burgeon DMG by 40%. Increases Vaporize and Melt DMG by 15%. Casting Skill increases 2pc by 50% (max 3 stacks).',
    },
  },
  'Gilded Dreams': {
    name: 'Gilded Dreams',
    piece2: { stats: { eleMas: 80 }, desc: 'Elemental Mastery +80' },
    piece4: {
      stats: { eleMas: 100, atk_: 14 }, // Typical 2 different + 1 same element party
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
      stats: { def_: 24, geo_dmg_: 24 }, // 4 Curiosity stacks
      desc: 'Curiosity stacks grant up to +24% DEF and +24% Geo DMG Bonus.',
    },
  },
  'Fragment of Harmonic Whimsy': {
    name: 'Fragment of Harmonic Whimsy',
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      dmgBonus: 54, // 3 stacks of 18% DMG
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
    piece2: { stats: { enerRech_: 10 }, desc: 'Energy restored upon nearby Nightsoul Burst' },
    piece4: {
      teamDmgBonus: 40,
      desc: 'Elemental reactions grant 12% DMG bonus; in Nightsoul state, grants an additional 28% (total +40% party DMG).',
    },
  },
  'Gladiator\'s Finale': {
    name: "Gladiator's Finale",
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      dmgBonus: 35,
      desc: 'Sword, Claymore, or Polearm wielder deals 35% increased Normal Attack DMG.',
    },
  },
  'Shimenawa\'s Reminiscence': {
    name: "Shimenawa's Reminiscence",
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      dmgBonus: 50,
      desc: 'Casting Skill consumes 15 Energy to increase Normal, Charged, and Plunging Attack DMG by 50% for 10s.',
    },
  },
  'Wanderer\'s Troupe': {
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
      stats: { atk_: 18, physical_dmg_: 25 }, // 2 stacks double 2pc and grant 18% ATK
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
    piece2: { stats: { def_: 15 }, desc: 'Shield Strength +35%' },
    piece4: {
      dmgBonus: 40,
      desc: 'While protected by a shield, gain an additional 40% Normal and Charged Attack DMG.',
    },
  },
  'Thundering Fury': {
    name: 'Thundering Fury',
    piece2: { stats: { electro_dmg_: 15 }, desc: 'Electro DMG Bonus +15%' },
    piece4: {
      dmgBonus: 25,
      desc: 'Overloaded, Electro-Charged, Superconduct, and Hyperbloom DMG +40%, Aggravate +20%. Triggering reactions reduces Skill CD by 1s.',
    },
  },
  'Thundersoother': {
    name: 'Thundersoother',
    piece2: { stats: { electro_dmg_: 0 }, desc: 'Electro RES +40%' },
    piece4: {
      dmgBonus: 35,
      desc: 'Increases DMG against opponents affected by Electro by 35%.',
    },
  },
  'Lavawalker': {
    name: 'Lavawalker',
    piece2: { stats: { pyro_dmg_: 0 }, desc: 'Pyro RES +40%' },
    piece4: {
      dmgBonus: 35,
      desc: 'Increases DMG against opponents affected by Pyro by 35%.',
    },
  },
  'Ocean-Hued Clam': {
    name: 'Ocean-Hued Clam',
    piece2: { stats: { heal_: 15 }, desc: 'Healing Bonus +15%' },
    piece4: {
      dmgBonus: 20, // Sea-Dyed Foam physical detonation equivalent
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
      dmgBonus: 80, // Bloom / Hyperbloom / Burgeon reaction DMG
      desc: 'Increases Bloom, Hyperbloom, and Burgeon reaction DMG by 40% (+80% at max stacks).',
    },
  },
  'Nymph\'s Dream': {
    name: 'Nymph\'s Dream',
    piece2: { stats: { hydro_dmg_: 15 }, desc: 'Hydro DMG Bonus +15%' },
    piece4: {
      stats: { atk_: 25, hydro_dmg_: 15 }, // 3 Mirrored Nymph stacks
      desc: 'Normal/Charged/Plunge/Skill/Burst hits grant up to +25% ATK and +15% Hydro DMG Bonus.',
    },
  },
  'Vourukasha\'s Glow': {
    name: "Vourukasha's Glow",
    piece2: { stats: { hp_: 20 }, desc: 'HP +20%' },
    piece4: {
      dmgBonus: 50, // Skill and Burst DMG +10% + 5 stacks of 8%
      desc: 'Increases Elemental Skill and Burst DMG by 10%. Taking DMG increases this bonus up to 50%.',
    },
  },
  'Vermillion Hereafter': {
    name: 'Vermillion Hereafter',
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      stats: { atk_: 48 }, // 8% initial + 4 stacks of 10%
      desc: 'After Burst, gain +8% ATK. Taking HP decrease grants +10% ATK up to 4 times (total +66% ATK).',
    },
  },
  'Echoes of an Offering': {
    name: 'Echoes of an Offering',
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      dmgBonus: 35, // Valley Rite average normal attack damage uplift
      desc: 'Normal Attacks have a 36% chance to trigger Valley Rite, increasing Normal Attack DMG by 70% of ATK.',
    },
  },
  'Nighttime Whispers in the Echoing Woods': {
    name: 'Nighttime Whispers in the Echoing Woods',
    piece2: { stats: { atk_: 18 }, desc: 'ATK +18%' },
    piece4: {
      stats: { geo_dmg_: 50 }, // 20% base + 150% under Crystallize shield = 50% Geo DMG
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
  'Silken Moon\'s Serenade': {
    name: "Silken Moon's Serenade",
    piece2: { stats: { enerRech_: 20 }, desc: 'Energy Recharge +20%' },
    piece4: {
      stats: { eleMas: 120 },
      dmgBonus: 36,
      desc: 'When Moonsign is active, triggering Lunar reactions grants +36% team reaction DMG and +120 EM for 12s.',
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
};

/**
 * Normalizes set names and finds best match in ARTIFACT_SET_EFFECTS
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
 * Converts active set bonuses into Equivalent Substat Rolls (ESR)
 * calibrated against character stat weights and standard KQM valuation models.
 */
export function calculateSetEquivalentSubstatRolls(
  activeSets: { setKey: string; pieces: number }[],
  characterIdOrName: string | { id?: string; name?: string },
  totalEr: number = 100,
): SetEsrResult {
  const charKey =
    typeof characterIdOrName === 'string'
      ? characterIdOrName
      : characterIdOrName?.id || characterIdOrName?.name || 'Hu Tao';

  const weights = getCharacterStatWeights(charKey);
  const statWeights = (weights.statWeights || {}) as Record<string, number>;

  const breakdown: Record<string, number> = {};
  const active2pc: string[] = [];
  const active4pc: string[] = [];

  for (const set of activeSets) {
    const def = getSetEffectDefinition(set.setKey);
    if (!def) continue;

    // 2-Piece Bonus
    if (set.pieces >= 2) {
      active2pc.push(def.name);
      const p2 = def.piece2;

      // Direct stat bonuses
      if (p2.stats) {
        for (const [stat, val] of Object.entries(p2.stats)) {
          if (!val) continue;
          const maxVal = MAX_SUBSTAT_VALUES[stat as StatKey] || 1;
          const weight = statWeights[stat] ?? 0.5;
          const rolls = (val / maxVal) * weight;
          breakdown[stat] = Number(((breakdown[stat] || 0) + rolls).toFixed(2));
        }
      }

      // DMG Bonus % (standard 1 roll = ~5.0% DMG bonus)
      if (p2.dmgBonus) {
        const rolls = (p2.dmgBonus / 5.0) * 1.0;
        breakdown['dmg_bonus'] = Number(
          ((breakdown['dmg_bonus'] || 0) + rolls).toFixed(2),
        );
      }
    }

    // 4-Piece Bonus
    if (set.pieces >= 4) {
      active4pc.push(def.name);
      const p4 = def.piece4;

      // Fixed stats
      if (p4.stats) {
        for (const [stat, val] of Object.entries(p4.stats)) {
          if (!val) continue;
          const maxVal = MAX_SUBSTAT_VALUES[stat as StatKey] || 1;
          const weight = statWeights[stat] ?? 0.5;
          const rolls = (val / maxVal) * weight;
          breakdown[stat] = Number(((breakdown[stat] || 0) + rolls).toFixed(2));
        }
      }

      // Dynamic conditional stats
      if (p4.conditionalStats) {
        const condStats = p4.conditionalStats(charKey, totalEr);
        for (const [stat, val] of Object.entries(condStats)) {
          if (!val) continue;
          const maxVal = MAX_SUBSTAT_VALUES[stat as StatKey] || 1;
          const weight = statWeights[stat] ?? 0.5;
          const rolls = (val / maxVal) * weight;
          breakdown[stat] = Number(((breakdown[stat] || 0) + rolls).toFixed(2));
        }
      }

      // DMG Bonus %
      const dmgBonusVal =
        typeof p4.dmgBonus === 'function'
          ? p4.dmgBonus(charKey, totalEr)
          : p4.dmgBonus;

      if (dmgBonusVal) {
        const rolls = (dmgBonusVal / 5.0) * 1.0;
        breakdown['dmg_bonus'] = Number(
          ((breakdown['dmg_bonus'] || 0) + rolls).toFixed(2),
        );
      }

      // Resistance Shred (VV 40% = ~8.8 rolls, Deepwood 30% = ~6.6 rolls)
      if (p4.resShred) {
        const rolls = (p4.resShred / 4.5);
        breakdown['res_shred'] = Number(
          ((breakdown['res_shred'] || 0) + rolls).toFixed(2),
        );
      }

      // Team DMG % or Team ATK %
      if (p4.teamDmgBonus) {
        const rolls = (p4.teamDmgBonus / 6.0);
        breakdown['team_buff'] = Number(
          ((breakdown['team_buff'] || 0) + rolls).toFixed(2),
        );
      }
      if (p4.teamAtkPct) {
        const rolls = (p4.teamAtkPct / 5.83);
        breakdown['team_buff'] = Number(
          ((breakdown['team_buff'] || 0) + rolls).toFixed(2),
        );
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
