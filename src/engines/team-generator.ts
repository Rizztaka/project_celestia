import type {
  Character,
  Element,
  TeamRecommendation,
  OwnedCharacterProfile,
  OwnedWeapon,
  TeamScoreBreakdown,
  TeamDamageOutputInfo,
} from '../types/genshin';
import { CHARACTERS } from '../data/characters';
import { getWeaponByKey } from '../data/weapons';
import { synthesizeTeamRotation } from './rotation-synthesizer';
import { assignOptimalTeamWeapons } from './weapon-solver';
import { getSavedWeapons } from '../services/storage';
import {
  isSameCharacterOrTraveler,
  isAllowedTeammate,
  detectBennettC6Conflict,
  detectDualCarryContention,
  detectFurinaHealerDeficit,
  detectFreezeAuraDisruption,
  calculateComfortScore,
  evaluateEnergyBattery,
  getEffectiveCharacterTags,
  isHealerCharacter,
  isShielderCharacter,
} from './team-rules';
import { generateTeamExplanation } from './team-explain';

// Re-export for SSOT contract & backward compatibility
export { isSameCharacterOrTraveler };

export interface ArchetypeTemplate {
  name: string;
  archetype: string;
  leadTags: string[];
  requiredElements?: (Element | string)[];
  exclusiveElements?: (Element | string)[];
  requiredTriggerIds?: string[];
  idealSupports?: string[];
  supportTags: string[];
  rotation: string;
  baseSynergy: number;
}

export const TEMPLATES: ArchetypeTemplate[] = [
  {
    name: 'Lunar-Bloom Dominion',
    archetype: 'Lunar-Bloom',
    leadTags: ['Lunar-Bloom', 'Dendro-App', 'Charged-Attacker'],
    requiredElements: ['Dendro', 'Hydro'],
    exclusiveElements: ['Hydro', 'Dendro'],
    idealSupports: ['Furina', 'Nahida', 'Lauma', 'Baizhu', 'SangonomiyaKokomi', 'Xingqiu'],
    supportTags: ['Nod-Krai', 'Hydro-App', 'Dendro-Core', 'EM-Buffer', 'Healer', 'Team-Healer'],
    rotation:
      'Support Skill/Burst → Hydro Enabler Burst/Skill → Nefer E (Shadow Dance) → Enhanced Charged Attacks absorbing Seeds of Deceit',
    baseSynergy: 96,
  },
  {
    name: 'Bountiful Bloom Symphony',
    archetype: 'Bountiful-Bloom',
    leadTags: ['Hydro', 'Sword'],
    requiredElements: ['Hydro', 'Dendro'],
    exclusiveElements: ['Hydro', 'Dendro'],
    requiredTriggerIds: ['Nilou'],
    idealSupports: ['Nahida', 'SangonomiyaKokomi', 'Baizhu', 'TravelerDendro', 'Yelan', 'Xingqiu'],
    supportTags: ['Dendro-Core', 'EM-Buffer', 'Healer', 'Team-Healer'],
    rotation:
      'Nilou EEE (Golden Chalice) → Nahida E Q → Hydro/Dendro Support → Instant Bountiful Core detonation',
    baseSynergy: 94,
  },
  {
    name: 'Vaporize Ascendance',
    archetype: 'Vaporize',
    leadTags: ['Vaporize', 'Pyro-App', 'On-Field DPS'],
    requiredElements: ['Pyro', 'Hydro'],
    idealSupports: ['Furina', 'Yelan', 'Xingqiu', 'Bennett', 'KaedeharaKazuha', 'Xilonen', 'Zhongli', 'Mavuika'],
    supportTags: ['Hydro-App', 'VV', 'Cinder-City', 'Huge-ATK-Buff', 'Universal-Buffer', 'DMG-Buffer'],
    rotation:
      'Hydro Enabler Burst/Skill → Buffer Skill/Burst (VV / Cinder City) → Bennett Q → Pyro Carry Skill & Combo',
    baseSynergy: 94,
  },
  {
    name: 'National Accord',
    archetype: 'National',
    leadTags: ['Snap-Shot', 'Off-Field', 'Pyro', 'Vaporize'],
    requiredElements: ['Pyro', 'Hydro'],
    idealSupports: ['Xingqiu', 'Bennett', 'Xiangling', 'Sucrose', 'KaedeharaKazuha', 'RaidenShogun', 'Yelan'],
    supportTags: ['Hydro-App', 'Huge-ATK-Buff', 'ATK-Buffer', 'VV', 'Vaporize'],
    rotation:
      'Xingqiu/Yelan Q E → Bennett Q E → Xiangling Q E (Snapshot ATK Buff) → Driver normal attacks',
    baseSynergy: 94,
  },
  {
    name: 'Hyperbloom Annihilation',
    archetype: 'Hyperbloom',
    leadTags: ['Hyperbloom-Driver', 'Hyperbloom-Trigger', 'Hyperbloom'],
    requiredElements: ['Dendro', 'Hydro', 'Electro'],
    idealSupports: ['Nahida', 'Alhaitham', 'KukiShinobu', 'RaidenShogun', 'Yelan', 'Xingqiu', 'Furina', 'Baizhu'],
    supportTags: ['Dendro-Core', 'Hydro-App', 'Full-EM', 'Electro-App'],
    rotation:
      'Nahida E Q → Hydro Enabler (Furina/Yelan/Xingqiu) Q E → Kuki E → Driver normal attacks to spawn and detonate cores',
    baseSynergy: 95,
  },
  {
    name: 'Burgeon Detonation',
    archetype: 'Burgeon',
    leadTags: ['Burgeon', 'Dendro-Core'],
    requiredElements: ['Pyro', 'Hydro', 'Dendro'],
    idealSupports: ['Nahida', 'Thoma', 'Xingqiu', 'Yelan', 'Baizhu', 'SangonomiyaKokomi', 'Kinich'],
    supportTags: ['Dendro-Core', 'Hydro-App', 'EM-Buffer', 'Shielder', 'Pyro-App'],
    rotation:
      'Dendro Applier E Q → Hydro Enabler Q E → Thoma Q E → Active carry normal attacks triggering Burgeon blasts',
    baseSynergy: 91,
  },
  {
    name: 'Quicken Aggravate / Spread',
    archetype: 'Quicken',
    leadTags: ['Aggravate', 'Spread', 'Quicken'],
    requiredElements: ['Dendro', 'Electro'],
    idealSupports: ['Nahida', 'Fischl', 'KaedeharaKazuha', 'Zhongli', 'Baizhu', 'YaeMiko'],
    supportTags: ['EM-Buffer', 'VV', 'Cinder-City', 'Electro-Battery', 'Off-Field'],
    rotation:
      'Dendro Applier E Q → Anemo/Geo Swirl/Crystallize shred → Electro Sub-DPS E → On-field Carry Quicken DPS window',
    baseSynergy: 92,
  },
  {
    name: 'Chevreuse Overload Protocol',
    archetype: 'Overload',
    leadTags: ['Overload-Only', 'Overload'],
    requiredElements: ['Pyro', 'Electro'],
    exclusiveElements: ['Pyro', 'Electro'],
    requiredTriggerIds: ['Chevreuse'],
    idealSupports: ['Chevreuse', 'Bennett', 'Fischl', 'Xiangling', 'Clorinde', 'Mavuika', 'RaidenShogun', 'Iansan'],
    supportTags: ['Nightsoul', 'RES-Shred', 'ATK-Buffer', 'Fighting-Spirit', 'Pyro-App', 'Electro-App'],
    rotation:
      'Electro Sub-DPS E → Chevreuse Hold E (trigger Overload & shred) → Bennett Q / Mavuika Q → Electro/Pyro Carry DPS',
    baseSynergy: 92,
  },
  {
    name: 'Glacial Freeze / Melt',
    archetype: 'Freeze / Melt',
    leadTags: ['Freeze', 'Melt', 'Cryo-Nuke'],
    requiredElements: ['Cryo'],
    idealSupports: ['Furina', 'Shenhe', 'KaedeharaKazuha', 'Charlotte', 'SangonomiyaKokomi', 'Xiangling', 'Bennett', 'Citlali'],
    supportTags: ['Hydro-App', 'VV', 'Cryo-Buff', 'Nightsoul', 'Team-Healer'],
    rotation:
      'Cryo support E Q → Anemo VV Shred / Hydro Freeze → Enabler Burst → Cryo carry frontloaded burst/punches',
    baseSynergy: 90,
  },
  {
    name: 'Cinder Shrapnel Crystallize',
    archetype: 'Crystallize',
    leadTags: ['Gunbrella', 'Cinder-City', 'Crystallize'],
    requiredElements: ['Geo'],
    idealSupports: ['Xilonen', 'Zhongli', 'Furina', 'Bennett', 'Xiangling', 'Chiori', 'Yelan'],
    supportTags: ['Universal-Buffer', 'Hydro-App', 'Huge-ATK-Buff', 'Cinder-City', 'RES-Shred'],
    rotation:
      'Zhongli/Xilonen E Q → Hydro/Pyro Off-field Q E → Navia Q E (Gunbrella blasts upon collecting 3-6 shards)',
    baseSynergy: 91,
  },
  {
    name: 'Mono Geo Cataclysm',
    archetype: 'Mono-Geo',
    leadTags: ['Mono-Geo', 'Geo', 'Claymore'],
    requiredElements: ['Geo'],
    idealSupports: ['Gorou', 'Zhongli', 'Chiori', 'Albedo', 'Xilonen', 'AratakiItto'],
    supportTags: ['DEF-Buffer', 'Geo-Buff', 'Shielder', 'Off-Field'],
    rotation:
      'Zhongli Hold E → Gorou E Q → Albedo/Chiori E → Itto Q & Arataki Kesagiri slashes',
    baseSynergy: 91,
  },
  {
    name: 'Plunge Liberation',
    archetype: 'Plunge',
    leadTags: ['Plunge-Enabler', 'Plunge-Attacker', 'Plunge-Buffer', 'Plunge-Nuke', 'Plunge-AoE'],
    requiredElements: ['Anemo'],
    idealSupports: ['Xianyun', 'Furina', 'Bennett', 'Faruzan', 'Gaming', 'Xiao', 'Diluc'],
    supportTags: ['Team-Healer', 'Hydro-App', 'Universal-Buffer', 'Huge-ATK-Buff', 'Plunge-Enabler'],
    rotation:
      'Sub-DPS E Q → Xianyun E Q (Jump buff + healing) → Bennett Q → Carry continuous high-jump plunge attacks',
    baseSynergy: 93,
  },
  {
    name: 'Tidal Hypercarry',
    archetype: 'Hydro Hypercarry',
    leadTags: ['Hydro Hypercarry', 'Hydro', 'Catalyst', 'On-Field DPS'],
    requiredElements: ['Hydro'],
    idealSupports: ['Furina', 'KaedeharaKazuha', 'Zhongli', 'Xilonen', 'Baizhu', 'Chasca'],
    supportTags: ['Universal-Buffer', 'VV', 'Team-Healer', 'Hydro-App', 'Shielder'],
    rotation:
      'Support Skill/Burst → Buffer VV Shred / Shield → Hydro enabler → Hydro Carry continuous attacks',
    baseSynergy: 95,
  },
  {
    name: 'Thunderous Hypercarry',
    archetype: 'Electro Hypercarry',
    leadTags: ['Electro Hypercarry', 'Electro', 'Polearm', 'On-Field DPS'],
    requiredElements: ['Electro'],
    idealSupports: ['Sara', 'Bennett', 'KaedeharaKazuha', 'Chevreuse', 'Fischl'],
    supportTags: ['Electro-Battery', 'ATK-Buffer', 'VV', 'Huge-ATK-Buff', 'Crit-Buffer'],
    rotation:
      'Raiden E → Kazuha E Q → Bennett Q → Sara E Q → Raiden Q & Musou Isshin slashes',
    baseSynergy: 92,
  },
  {
    name: 'Gale Hypercarry',
    archetype: 'Anemo Hypercarry',
    leadTags: ['Anemo Hypercarry', 'Anemo', 'Catalyst', 'Polearm', 'On-Field DPS'],
    requiredElements: ['Anemo'],
    idealSupports: ['Faruzan', 'Bennett', 'Furina', 'Zhongli', 'Xianyun'],
    supportTags: ['Anemo-Buff', 'Huge-ATK-Buff', 'Shielder', 'Team-Healer'],
    rotation:
      'Faruzan Q E → Shield/Buffer E Q → Bennett Q → Wanderer/Xiao On-field DPS window',
    baseSynergy: 91,
  },
  {
    name: 'Superconduct Physical Onslaught',
    archetype: 'Physical',
    leadTags: ['Physical', 'Claymore'],
    requiredElements: ['Cryo', 'Electro'],
    idealSupports: ['RaidenShogun', 'Fischl', 'Mika', 'Zhongli', 'Rosaria', 'Furina'],
    supportTags: ['Superconduct', 'Physical-Buff', 'Shielder', 'Healer'],
    rotation:
      'Raiden/Fischl E → Cryo Battery E Q → Mika/Zhongli Hold E Q → Eula Q combo',
    baseSynergy: 89,
  },
  {
    name: 'Mono Pyro Inferno',
    archetype: 'Mono-Pyro',
    leadTags: ['Mono-Pyro', 'Pyro', 'Bow', 'On-Field DPS'],
    requiredElements: ['Pyro'],
    idealSupports: ['Bennett', 'Xiangling', 'KaedeharaKazuha', 'Zhongli', 'Mavuika', 'Xilonen'],
    supportTags: ['Huge-ATK-Buff', 'VV', 'Shielder', 'Pyro-App', 'Cinder-City'],
    rotation:
      'Bennett Q E → Kazuha E Q → Xiangling Q E → Lyney/Klee Charged Attack barrage',
    baseSynergy: 90,
  },
  {
    name: 'Mono Hydro Cascade',
    archetype: 'Mono-Hydro',
    leadTags: ['Mono-Hydro', 'Hydro', 'Sword', 'On-Field DPS'],
    requiredElements: ['Hydro'],
    idealSupports: ['Furina', 'Yelan', 'Xingqiu', 'KaedeharaKazuha', 'Jean', 'Xilonen'],
    supportTags: ['Hydro-App', 'VV', 'Team-Healer', 'Universal-Buffer'],
    rotation:
      'Furina E Q → Yelan/Xingqiu Q E → Kazuha/Jean E Q → Ayato/Neuvillette Hydro onslaught',
    baseSynergy: 91,
  },
];

// Cache for weapon bag summaries to eliminate redundant O(N) scans during team scoring
const WEAPON_BAG_CACHE = new WeakMap<
  OwnedWeapon[],
  { has5Star: Record<string, boolean>; has4Star: Record<string, boolean> }
>();

function getWeaponBagSummary(weaponBag: OwnedWeapon[]): {
  has5Star: Record<string, boolean>;
  has4Star: Record<string, boolean>;
} {
  const cached = WEAPON_BAG_CACHE.get(weaponBag);
  if (cached) return cached;

  const has5Star: Record<string, boolean> = {};
  const has4Star: Record<string, boolean> = {};

  for (const w of weaponBag) {
    const db = getWeaponByKey(w.key) || getWeaponByKey(w.name);
    if (db) {
      if (db.rarity === 5) has5Star[db.weaponType] = true;
      if (db.rarity === 4) has4Star[db.weaponType] = true;
    }
  }

  const summary = { has5Star, has4Star };
  WEAPON_BAG_CACHE.set(weaponBag, summary);
  return summary;
}

/**
 * Evaluates candidate character suitability for a team slot across 4 dimensions:
 * 1. Role match (up to 30 pts)
 * 2. Elemental resonance & archetype elemental requirements (up to 25 pts)
 * 3. Synergy tag overlap with template (up to 25 pts)
 * 4. Armory weapon availability & profile investment (up to 20 pts)
 * Total: 0–100 pts
 */
export function scoreCandidateForSlot(
  candidate: Character,
  role: 'Buffer' | 'SubDPS' | 'Sustain',
  template: ArchetypeTemplate,
  currentMembers: Character[],
  weaponBag: OwnedWeapon[],
  profiles?: Record<string, OwnedCharacterProfile>,
): number {
  if (!isAllowedTeammate(template.archetype, candidate, currentMembers, template.exclusiveElements)) {
    return 0;
  }

  let roleScore = 0;
  let resonanceScore = 0;
  let tagScore = 0;
  let weaponScore = 8;

  const candidateTags = getEffectiveCharacterTags(candidate);

  // 1. Role match (up to 30 pts)
  if (role === 'Buffer') {
    if (candidate.roles.includes('Buffer/Shred')) {
      roleScore += 20;
    }
    const bufferTags = [
      'Universal-Buffer',
      'VV',
      'Anemo-VV',
      'Cinder-City',
      'ATK-Buffer',
      'EM-Buffer',
      'RES-Shred',
      'Huge-ATK-Buff',
      'DMG-Buffer',
    ];
    if (candidateTags.some((t) => bufferTags.includes(t)) || candidate.id === 'Bennett') {
      roleScore += 10;
    }
  } else if (role === 'SubDPS') {
    if (candidate.roles.includes('Off-Field DPS')) {
      roleScore += 25;
    } else if (candidate.roles.includes('On-Field DPS')) {
      roleScore += 10;
    }
    const subDpsTags = ['Hydro-App', 'Electro-Battery', 'Dendro-Core', 'Nightsoul', 'Off-Field', 'Pyro-App', 'Cryo-App'];
    if (candidateTags.some((t) => subDpsTags.includes(t))) {
      roleScore += 5;
    }
  } else if (role === 'Sustain') {
    if (candidate.roles.includes('Sustain')) {
      roleScore += 25;
    }
    const sustainTags = ['Healer', 'Team-Healer', 'Shielder', 'Shield'];
    if (candidateTags.some((t) => sustainTags.includes(t)) || candidate.id === 'Bennett') {
      roleScore += 5;
    }
    if (currentMembers.some((m) => m.roles.includes('Sustain') || getEffectiveCharacterTags(m).some((t) => sustainTags.includes(t)))) {
      roleScore = Math.max(0, roleScore - 15);
    }
  }
  roleScore = Math.min(30, Math.max(0, roleScore));

  // 2. Elemental resonance & required elements (up to 25 pts)
  if (template.requiredElements && template.requiredElements.includes(candidate.element)) {
    const isMissingRequired = !currentMembers.some((m) => m.element === candidate.element);
    resonanceScore += isMissingRequired ? 20 : 10;
  }
  const sameElementCount = currentMembers.filter((m) => m.element === candidate.element).length;
  if (sameElementCount === 1) {
    resonanceScore += 5;
    if (currentMembers.some((m) => m.id === 'Xiangling') && candidate.id === 'Bennett') {
      resonanceScore += 10;
    }
  } else if (
    template.archetype.startsWith('Mono-') &&
    currentMembers.length > 0 &&
    candidate.element === currentMembers[0].element
  ) {
    resonanceScore += 10;
  }
  resonanceScore = Math.min(25, Math.max(0, resonanceScore));

  // 3. Synergy tag overlap (up to 25 pts)
  if (template.supportTags && template.supportTags.length > 0) {
    let matchedCount = 0;
    for (const tag of template.supportTags) {
      if (candidateTags.includes(tag)) {
        matchedCount++;
      }
    }
    tagScore += matchedCount * 7;
  }
  if (
    candidateTags.includes('VV') ||
    candidateTags.includes('Anemo-VV') ||
    candidateTags.includes('Cinder-City') ||
    candidateTags.includes('Universal-Buffer')
  ) {
    tagScore += 6;
  }
  if (template.archetype === 'National' && (candidate.id === 'Xingqiu' || candidate.id === 'Bennett')) {
    tagScore += 8;
  }
  tagScore = Math.min(25, Math.max(0, tagScore));

  // 4. Weapon availability & investment in armory (up to 20 pts)
  if (weaponBag && weaponBag.length > 0) {
    const summary = getWeaponBagSummary(weaponBag);
    if (summary.has5Star[candidate.weapon]) {
      weaponScore = 14;
    } else if (summary.has4Star[candidate.weapon]) {
      weaponScore = 10;
    }
  }

  if (profiles && profiles[candidate.id]) {
    const prof = profiles[candidate.id];
    if (prof.level >= 80) weaponScore += 3;
    if (prof.constellation > 0) weaponScore += 3;
  }
  weaponScore = Math.min(20, Math.max(0, weaponScore));

  return Math.min(100, Math.max(0, roleScore + resonanceScore + tagScore + weaponScore));
}

function calculateResonance(members: Character[]): string[] {
  const counts: Record<string, number> = {};
  for (const m of members) {
    counts[m.element] = (counts[m.element] || 0) + 1;
  }
  const resonances: string[] = [];
  if (counts['Pyro'] >= 2) resonances.push('Fervent Flames: +25% ATK');
  if (counts['Hydro'] >= 2) resonances.push('Soothing Water: +25% Max HP');
  if (counts['Dendro'] >= 2) resonances.push('Sprawling Greenery: +50 to +100 EM');
  if (counts['Cryo'] >= 2) resonances.push('Shattering Ice: +15% CRIT Rate against Frozen/Cryo');
  if (counts['Geo'] >= 2) resonances.push('Enduring Rock: +15% Shield Strength & +15% DMG dealt');
  if (counts['Anemo'] >= 2) resonances.push('Impetuous Winds: -15% Stamina & +10% Movement Speed');
  if (counts['Electro'] >= 2) resonances.push('High Voltage: Electro reactions generate Energy particles');
  return resonances;
}

export function applyConstellationModifiers(
  team: Character[],
  baseSynergy: number,
  profiles?: Record<string, OwnedCharacterProfile>,
): { synergyScore: number; extraReasons: string[] } {
  if (!profiles) return { synergyScore: baseSynergy, extraReasons: [] };

  let synergyScore = baseSynergy;
  const extraReasons: string[] = [];

  for (const member of team) {
    const prof = profiles[member.id];
    if (!prof) continue;

    const c = prof.constellation;
    if (member.id === 'Xiangling' && c >= 4) {
      synergyScore += 4;
      extraReasons.push('Xiangling C4: Pyronado duration increased by +40% (+4s uptime).');
    }
    if (member.id === 'Bennett' && c >= 1) {
      synergyScore += 3;
      extraReasons.push('Bennett C1: Fantastic Voyage ATK buff has no HP restriction.');
    }
    if (member.id === 'Bennett' && c >= 6) {
      const hasPhysicalOrConflict = team.some((m) =>
        ['Eula', 'Razor', 'Keqing', 'KamisatoAyaka', 'Ayaka'].includes(m.id),
      );
      if (hasPhysicalOrConflict) {
        extraReasons.push(
          'Caution: Bennett C6 Pyro Infusion overrides Physical/Normal attack damage.',
        );
      } else {
        const hasPyroMelee = team.some(
          (m) =>
            m.id !== 'Bennett' &&
            m.element === 'Pyro' &&
            ['Sword', 'Claymore', 'Polearm'].includes(m.weapon),
        );
        if (hasPyroMelee) {
          synergyScore += 3;
          extraReasons.push(
            'Bennett C6: +15% Pyro DMG Bonus for Sword, Claymore, and Polearm carries.',
          );
        }
      }
    }
    if (member.id === 'Faruzan' && c >= 6) {
      synergyScore += 7;
      extraReasons.push(
        'Faruzan C6: Pressurized Collapse pressurized vortexes provide massive Anemo CRIT DMG & energy particles.',
      );
    }
    if (member.id === 'Furina' && c >= 2) {
      synergyScore += 6;
      extraReasons.push(
        'Furina C2: Hyper-accelerated Fanfare ramping and massive HP overflow.',
      );
    } else if (member.id === 'Furina' && c >= 1) {
      synergyScore += 3;
      extraReasons.push('Furina C1: Grants 150 immediate Fanfare stacks on Burst cast.');
    }
    if (member.id === 'Nahida' && c >= 2) {
      synergyScore += 6;
      extraReasons.push('Nahida C2: Critical Bloom/Hyperbloom & Quicken DEF shred.');
    }
    if (member.id === 'RaidenShogun' && c >= 2) {
      synergyScore += 6;
      extraReasons.push(
        'Raiden Shogun C2: Secret Art: Musou Shinsetsu ignores 60% of opponent DEF.',
      );
    }
    if (member.id === 'Xilonen' && c >= 2) {
      synergyScore += 5;
      extraReasons.push(
        'Xilonen C2: Universal party buffs based on element types without triggering Sampler state.',
      );
    }
    if (member.id === 'Mavuika' && c >= 2) {
      synergyScore += 6;
      extraReasons.push('Mavuika C2: Enhanced Fighting Spirit conversion & party ATK shred amplification.');
    }
  }

  return { synergyScore: Math.min(100, synergyScore), extraReasons };
}

/**
 * Calculates pure mechanical compatibility score (0-100%).
 * Synthesizes archetype synergy, role distribution, resonance, energy battery,
 * and penalizes anti-synergies (Bennett C6 conflict, dual-carry contention, Furina deficit, etc.).
 */
export function calculateCompatibilityScore(
  team: Character[],
  template: ArchetypeTemplate,
  profiles?: Record<string, OwnedCharacterProfile>,
  weaponAssignments?: any[],
): number {
  let score = template.baseSynergy;

  // 1. Constellation synergy bonuses
  const constMods = applyConstellationModifiers(team, score, profiles);
  score = constMods.synergyScore;

  // 2. Role distribution bonus
  const hasCarry = team.some((m) => m.roles.includes('On-Field DPS'));
  const hasSubDps = team.some((m) => m.roles.includes('Off-Field DPS'));
  const hasBuffer = team.some(
    (m) =>
      m.roles.includes('Buffer/Shred') ||
      getEffectiveCharacterTags(m).some((t) =>
        ['VV', 'Anemo-VV', 'Cinder-City', 'Universal-Buffer', 'DMG-Buffer'].includes(t),
      ),
  );
  const hasSustain = team.some((m) => m.roles.includes('Sustain') || getEffectiveCharacterTags(m).some((t) => ['Healer', 'Team-Healer', 'Shielder'].includes(t)));

  if (hasCarry && hasSubDps && (hasBuffer || hasSustain)) {
    score += 2;
  }

  // 3. Energy battery presence
  const energy = evaluateEnergyBattery(team, weaponAssignments);
  if (energy.status === 'optimal') {
    score += 1;
  } else if (energy.status === 'deficit') {
    score -= 6;
  }

  // 4. Anti-synergies
  const bennettConflict = detectBennettC6Conflict(team, profiles);
  if (bennettConflict.hasConflict) {
    score -= bennettConflict.penalty;
  }

  const dualCarry = detectDualCarryContention(team);
  if (dualCarry.hasContention) {
    score -= dualCarry.penalty;
  }

  const freezeDisruption = detectFreezeAuraDisruption(team, template.archetype);
  if (freezeDisruption.hasDisruption) {
    score -= freezeDisruption.penalty;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Calculates practical investment readiness score (0-100) based on owned levels,
 * constellations, talent milestones, and weapon armory match.
 */
export function calculateInvestmentScore(
  team: Character[],
  profiles?: Record<string, OwnedCharacterProfile>,
  weaponAssignments?: any[],
): number {
  let totalScore = 0;

  // 1. Character Level & Talent Progression (up to 35 pts)
  let levelPts = 0;
  for (const m of team) {
    const prof = profiles?.[m.id];
    const lvl = prof?.level ?? 90;
    let charLevelPts: number;
    if (lvl >= 90) charLevelPts = 6.25;
    else if (lvl >= 80) charLevelPts = 5.0;
    else if (lvl >= 70) charLevelPts = 3.5;
    else if (lvl >= 60) charLevelPts = 2.0;
    else charLevelPts = 1.0;

    let charTalentPts = 2.5;
    if (prof?.talents) {
      const avgTalent = (prof.talents.auto + prof.talents.skill + prof.talents.burst) / 3;
      if (avgTalent >= 9) charTalentPts = 2.5;
      else if (avgTalent >= 8) charTalentPts = 2.0;
      else if (avgTalent >= 6) charTalentPts = 1.5;
      else charTalentPts = 0.5;
    }
    levelPts += charLevelPts + charTalentPts;
  }
  totalScore += Math.min(35, levelPts);

  // 2. Constellation Milestones (up to 25 pts)
  let constPts = 10;
  for (const m of team) {
    const prof = profiles?.[m.id];
    const c = prof?.constellation ?? 0;
    if (c >= 6) constPts += 3.75;
    else if (c >= 2) constPts += 2.5;
    else if (c >= 1) constPts += 1.25;
  }
  totalScore += Math.min(25, constPts);

  // 3. Weapon assignments & tier match (up to 40 pts)
  let weaponPts: number;
  if (weaponAssignments && weaponAssignments.length > 0) {
    let assignedPts = 0;
    for (const wa of weaponAssignments) {
      const tier = wa.scoreResult?.tier;
      if (tier === 'BiS') assignedPts += 10;
      else if (tier === 'Optimal') assignedPts += 8;
      else if (tier === 'Great') assignedPts += 6;
      else if (tier === 'Usable') assignedPts += 4;
      else assignedPts += 2;
    }
    weaponPts = assignedPts;
  } else {
    weaponPts = 32;
  }
  totalScore += Math.min(40, weaponPts);

  return Math.min(100, Math.max(0, Math.round(totalScore)));
}

/**
 * Calculates holistic practical performance score (0-100%) synthesizing
 * compatibility, comfort, account investment, and rotational reliability.
 */
export function calculatePracticalPerformanceScore(
  compatibilityScore: number,
  comfortScore: number,
  investmentScore: number,
  energyStatus: 'optimal' | 'adequate' | 'deficit',
  hasCriticalAntiSynergy: boolean,
): number {
  let score = compatibilityScore * 0.55 + comfortScore * 0.25 + investmentScore * 0.20;
  if (energyStatus === 'deficit') score -= 8;
  if (hasCriticalAntiSynergy) score -= 10;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Calculates damage output meta rating and percentile.
 * Explicitly marked as heuristic_only / unsimulated.
 */
export function calculateDamageOutputInfo(
  _archetype: string,
  benchmarkTier: 'S+' | 'S' | 'A' | 'B',
  compatibilityScore: number,
  investmentScore: number,
): TeamDamageOutputInfo {
  const baseTierPercentile =
    benchmarkTier === 'S+' ? 92 : benchmarkTier === 'S' ? 82 : benchmarkTier === 'A' ? 68 : 52;
  const percentile = Math.min(
    99,
    Math.max(
      35,
      Math.round(baseTierPercentile * 0.5 + compatibilityScore * 0.25 + investmentScore * 0.25),
    ),
  );

  return {
    status: 'heuristic_only',
    archetypeTier: benchmarkTier,
    relativeOutputPercentile: percentile,
    disclaimer:
      'Theoretical combat damage is not simulated with a frame-by-frame engine. Rating and percentile are derived from archetype theorycrafting ceilings and account investment.',
  };
}

/**
 * Maps community theorycrafting power rating into benchmark tiers ('S+' | 'S' | 'A' | 'B').
 */
export function determineBenchmarkTier(
  archetype: string,
  compatibilityScore: number,
  team: Character[],
): 'S+' | 'S' | 'A' | 'B' {
  const S_PLUS_ARCHETYPES = [
    'Lunar-Bloom',
    'Vaporize',
    'Hyperbloom',
    'Hydro Hypercarry',
    'Bountiful-Bloom',
    'Overload',
  ];

  const S_PLUS_ANCHORS = [
    'Nefer',
    'Mavuika',
    'Neuvillette',
    'Furina',
    'Alhaitham',
    'Arlecchino',
    'Clorinde',
    'Navia',
    'Skirk',
  ];

  const hasAnchor = team.some((m) => S_PLUS_ANCHORS.includes(m.id));

  if (compatibilityScore >= 90 && S_PLUS_ARCHETYPES.includes(archetype) && hasAnchor) {
    return 'S+';
  }
  if (compatibilityScore >= 82) {
    return 'S';
  }
  if (compatibilityScore >= 70) {
    return 'A';
  }
  return 'B';
}

export function generateBestTeams(
  availableIds: string[],
  focusCharacterId?: string,
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
  ownedWeapons?: OwnedWeapon[],
  allowCatalogFallback: boolean = false,
): TeamRecommendation[] {
  const ownedSet = new Set(availableIds);
  const pool = CHARACTERS.filter((c) => ownedSet.has(c.id));

  if (focusCharacterId && !ownedSet.has(focusCharacterId)) {
    if (!allowCatalogFallback) {
      return [];
    }
    const catalogPool = CHARACTERS.map((c) => ({
      ...c,
      isOwned: ownedSet.has(c.id),
    }));
    const teams = generateTeamsFromPool(catalogPool, focusCharacterId, rosterProfiles, ownedWeapons);
    return teams.map((t) => ({ ...t, isTheoretical: true }));
  }

  if (pool.length < 4) {
    if (!allowCatalogFallback) {
      return [];
    }
    const catalogPool = CHARACTERS.map((c) => ({
      ...c,
      isOwned: ownedSet.has(c.id),
    }));
    const teams = generateTeamsFromPool(catalogPool, focusCharacterId, rosterProfiles, ownedWeapons);
    return teams.map((t) => ({ ...t, isTheoretical: true }));
  }

  const ownedPool = pool.map((c) => ({
    ...c,
    isOwned: true,
  }));
  return generateTeamsFromPool(ownedPool, focusCharacterId, rosterProfiles, ownedWeapons);
}

export const generateTeamRecommendations = generateBestTeams;

const S_PLUS_ANCHOR_SET = new Set([
  'Nefer', 'Mavuika', 'Neuvillette', 'Furina', 'Alhaitham', 'Arlecchino', 'Clorinde', 'Navia', 'Skirk',
]);

function generateTeamsFromPool(
  pool: Character[],
  focusId?: string,
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
  ownedWeapons?: OwnedWeapon[],
): TeamRecommendation[] {
  const results: TeamRecommendation[] = [];
  const focus = focusId ? pool.find((c) => c.id === focusId) : undefined;
  const weaponBag = ownedWeapons || getSavedWeapons();

  for (const template of TEMPLATES) {
    if (results.some((r) => r.archetype === template.archetype)) continue;

    // If template requires specific triggers (e.g. Chevreuse, Nilou, Skirk), verify presence in pool
    if (template.requiredTriggerIds && template.requiredTriggerIds.length > 0) {
      const hasAllTriggers = template.requiredTriggerIds.every((id) =>
        pool.some((c) => c.id === id),
      );
      if (!hasAllTriggers) continue;
    }

    const focusCanLead =
      focus &&
      (template.leadTags.some((tag) => getEffectiveCharacterTags(focus).includes(tag)) ||
        (focus.roles.includes('On-Field DPS') &&
          (!template.requiredElements || template.requiredElements.includes(focus.element)))) &&
      (!template.exclusiveElements || template.exclusiveElements.includes(focus.element));

    const leadCandidates = pool.filter((c) => {
      if (focusCanLead) {
        return c.id === focus!.id;
      }
      if (focus && c.id === focus.id) {
        return (
          template.leadTags.some((tag) => getEffectiveCharacterTags(c).includes(tag)) &&
          (!template.exclusiveElements || template.exclusiveElements.includes(c.element))
        );
      }
      const elementOk = !template.exclusiveElements || template.exclusiveElements.includes(c.element);
      const isDps = c.roles.includes('On-Field DPS') || c.roles.includes('Off-Field DPS');
      const tags = getEffectiveCharacterTags(c);
      return (
        elementOk &&
        isDps &&
        (template.leadTags.some((tag) => tags.includes(tag)) ||
          (c.roles.includes('On-Field DPS') &&
            (!template.requiredElements || template.requiredElements.includes(c.element))))
      );
    });

    // Evidence-based lead candidate ranking (replaces naive alphabetical order)
    leadCandidates.sort((a, b) => {
      if (focus && a.id === focus.id) return -1;
      if (focus && b.id === focus.id) return 1;

      // 1. Archetype anchors list
      const isAnchorA = (template.idealSupports?.includes(a.id) ?? false) || S_PLUS_ANCHOR_SET.has(a.id);
      const isAnchorB = (template.idealSupports?.includes(b.id) ?? false) || S_PLUS_ANCHOR_SET.has(b.id);
      if (isAnchorA !== isAnchorB) return isAnchorA ? -1 : 1;

      // 2. Pure On-Field DPS over hybrid
      const aOnField = a.roles[0] === 'On-Field DPS';
      const bOnField = b.roles[0] === 'On-Field DPS';
      if (aOnField !== bOnField) return aOnField ? -1 : 1;

      // 3. 5★ rarity over 4★
      if (b.rarity !== a.rarity) return b.rarity - a.rarity;

      // 4. Account investment
      const aLvl = rosterProfiles?.[a.id]?.level ?? 0;
      const bLvl = rosterProfiles?.[b.id]?.level ?? 0;
      if (bLvl !== aLvl) return bLvl - aLvl;

      const aConst = rosterProfiles?.[a.id]?.constellation ?? 0;
      const bConst = rosterProfiles?.[b.id]?.constellation ?? 0;
      return bConst - aConst;
    });

    for (const lead of leadCandidates) {
      if (focus && lead.id !== focus.id) {
        if (isSameCharacterOrTraveler(lead, focus)) continue;

        const focusEffectiveTags = getEffectiveCharacterTags(focus);
        const canFitAsSupport =
          isAllowedTeammate(template.archetype, focus, [lead], template.exclusiveElements) &&
          (template.supportTags.some((t) => focusEffectiveTags.includes(t)) ||
            (template.requiredElements ? template.requiredElements.includes(focus.element) : false) ||
            focus.roles.some((r) => ['Off-Field DPS', 'Buffer/Shred', 'Sustain'].includes(r)));
        if (!canFitAsSupport) continue;
      }

      const chosen: Character[] = [lead];
      if (
        focus &&
        focus.id !== lead.id &&
        isAllowedTeammate(template.archetype, focus, chosen, template.exclusiveElements)
      ) {
        chosen.push(focus);
      }

      // Draft mandatory requiredTriggerIds into team if not yet present (e.g. Chevreuse, Nilou)
      if (template.requiredTriggerIds) {
        for (const triggerId of template.requiredTriggerIds) {
          if (!chosen.some((m) => m.id === triggerId) && chosen.length < 4) {
            const triggerChar = pool.find((c) => c.id === triggerId);
            if (
              triggerChar &&
              isAllowedTeammate(template.archetype, triggerChar, chosen, template.exclusiveElements)
            ) {
              chosen.push(triggerChar);
            }
          }
        }
      }

      // 1. Prioritize fulfilling missing requiredElements
      const missingElements = (template.requiredElements || []).filter(
        (el) => !chosen.some((m) => m.element === el),
      );

      for (const missingEl of missingElements) {
        if (chosen.length >= 4) break;
        const matchingCandidates = pool
          .filter(
            (c) =>
              c.element === missingEl &&
              isAllowedTeammate(template.archetype, c, chosen, template.exclusiveElements),
          )
          .map((c) => {
            const sSub = scoreCandidateForSlot(c, 'SubDPS', template, chosen, weaponBag, rosterProfiles);
            const sBuf = scoreCandidateForSlot(c, 'Buffer', template, chosen, weaponBag, rosterProfiles);
            const sSus = scoreCandidateForSlot(c, 'Sustain', template, chosen, weaponBag, rosterProfiles);
            return { character: c, score: Math.max(sSub, sBuf, sSus) };
          })
          .sort((a, b) => b.score - a.score);

        if (matchingCandidates.length > 0) {
          chosen.push(matchingCandidates[0].character);
        }
      }

      // 2. Check missing roles dynamically
      const hasSubDps = () => chosen.some((m) => m.roles.includes('Off-Field DPS'));
      const hasBuffer = () =>
        chosen.some(
          (m) =>
            m.roles.includes('Buffer/Shred') ||
            getEffectiveCharacterTags(m).some((t) =>
              ['VV', 'Anemo-VV', 'Cinder-City', 'Universal-Buffer', 'DMG-Buffer'].includes(t),
            ),
        );
      const hasSustain = () => chosen.some((m) => m.roles.includes('Sustain') || isHealerCharacter(m) || isShielderCharacter(m));

      // Slot 1: Sub-DPS if still needed
      if (!hasSubDps() && chosen.length < 4) {
        const subDpsCandidates = pool
          .filter((c) => isAllowedTeammate(template.archetype, c, chosen, template.exclusiveElements))
          .map((c) => ({
            character: c,
            score: scoreCandidateForSlot(c, 'SubDPS', template, chosen, weaponBag, rosterProfiles),
          }))
          .sort((a, b) => b.score - a.score);

        if (subDpsCandidates.length > 0 && subDpsCandidates[0].score >= 20) {
          chosen.push(subDpsCandidates[0].character);
        }
      }

      // Slot 2: Buffer if still needed
      if (!hasBuffer() && chosen.length < 4) {
        const bufferCandidates = pool
          .filter((c) => isAllowedTeammate(template.archetype, c, chosen, template.exclusiveElements))
          .map((c) => ({
            character: c,
            score: scoreCandidateForSlot(c, 'Buffer', template, chosen, weaponBag, rosterProfiles),
          }))
          .sort((a, b) => b.score - a.score);

        if (bufferCandidates.length > 0 && bufferCandidates[0].score >= 20) {
          chosen.push(bufferCandidates[0].character);
        }
      }

      // Slot 3: Sustain if still needed
      if (!hasSustain() && chosen.length < 4) {
        const sustainCandidates = pool
          .filter((c) => isAllowedTeammate(template.archetype, c, chosen, template.exclusiveElements))
          .map((c) => ({
            character: c,
            score: scoreCandidateForSlot(c, 'Sustain', template, chosen, weaponBag, rosterProfiles),
          }))
          .sort((a, b) => b.score - a.score);

        if (sustainCandidates.length > 0 && sustainCandidates[0].score >= 20) {
          chosen.push(sustainCandidates[0].character);
        }
      }

      // Fill remaining slots up to 4 using highest suitability
      while (chosen.length < 4) {
        const remaining = pool
          .filter((c) => isAllowedTeammate(template.archetype, c, chosen, template.exclusiveElements))
          .map((c) => {
            const sSub = scoreCandidateForSlot(c, 'SubDPS', template, chosen, weaponBag, rosterProfiles);
            const sBuf = scoreCandidateForSlot(c, 'Buffer', template, chosen, weaponBag, rosterProfiles);
            const sSus = scoreCandidateForSlot(c, 'Sustain', template, chosen, weaponBag, rosterProfiles);
            return { character: c, score: Math.max(sSub, sBuf, sSus) };
          })
          .sort((a, b) => b.score - a.score);

        if (remaining.length === 0) break;
        chosen.push(remaining[0].character);
      }

      // Verify all required elements are present
      if (
        template.requiredElements &&
        !template.requiredElements.every((el) => chosen.some((m) => m.element === el))
      ) {
        continue;
      }

      if (chosen.length === 4) {
        const stepped = synthesizeTeamRotation(chosen);
        const constMods = applyConstellationModifiers(chosen, template.baseSynergy, rosterProfiles);
        const weaponAssignments = assignOptimalTeamWeapons(chosen, weaponBag, rosterProfiles);

        const compatibilityScore = calculateCompatibilityScore(
          chosen,
          template,
          rosterProfiles,
          weaponAssignments,
        );
        const investmentScore = calculateInvestmentScore(chosen, rosterProfiles, weaponAssignments);
        const benchmarkTier = determineBenchmarkTier(
          template.archetype,
          compatibilityScore,
          chosen,
        );
        const comfortScore = calculateComfortScore(chosen, rosterProfiles);
        const energyBattery = evaluateEnergyBattery(chosen, weaponAssignments);
        const bennettConflict = detectBennettC6Conflict(chosen, rosterProfiles);
        const dualCarry = detectDualCarryContention(chosen);
        const furinaDeficit = detectFurinaHealerDeficit(chosen);

        const hasCriticalConflict =
          bennettConflict.hasConflict ||
          dualCarry.hasContention ||
          furinaDeficit.severity === 'severe';

        const practicalPerformanceScore = calculatePracticalPerformanceScore(
          compatibilityScore,
          comfortScore,
          investmentScore,
          energyBattery.status,
          hasCriticalConflict,
        );

        const damageOutput = calculateDamageOutputInfo(
          template.archetype,
          benchmarkTier,
          compatibilityScore,
          investmentScore,
        );

        const scores: TeamScoreBreakdown = {
          compatibilityScore,
          investmentScore,
          benchmarkTier,
          practicalPerformanceScore,
          damageOutput,
        };

        const explanation = generateTeamExplanation(
          chosen,
          template,
          pool,
          rosterProfiles,
          weaponAssignments,
          (t) => calculateCompatibilityScore(t, template, rosterProfiles, weaponAssignments),
        );

        const teamSustain = chosen.find((m) => m.roles.includes('Sustain') || isHealerCharacter(m) || isShielderCharacter(m));

        results.push({
          id: `team-${template.archetype}-${lead.id}`.toLowerCase(),
          name: `${lead.name} · ${template.name}`,
          archetype: template.archetype,
          members: chosen,
          synergyScore: compatibilityScore,
          compositionCompatibilityScore: compatibilityScore,
          comfortScore,
          reasons: Array.from(
            new Set([
              `${lead.name} acts as the core ${lead.roles[0]} driving ${template.archetype}.`,
              `${chosen[1].name} enables high-frequency elemental chain reactions.`,
              `${chosen[2].name} amplifies team damage through buffs and resistance reduction.`,
              teamSustain
                ? `${teamSustain.name} guarantees safe clear windows with survivability.`
                : 'High aggressive offensive output with minimal downtime.',
              ...constMods.extraReasons,
              ...(explanation.antiSynergyWarnings || []),
            ]),
          ),
          rotation: stepped.summaryString || template.rotation,
          steppedRotation: stepped,
          resonance: calculateResonance(chosen),
          weaponAssignments,
          scores,
          explanation,
        });
        break; // One strong variant per archetype
      }
    }
  }

  // Filter for focus character if specified
  const eligibleTeams = focus
    ? results.filter((r) => r.members.some((m) => m.id === focus.id))
    : results;

  // Sort final recommendations by practical performance score, secondary by investment
  eligibleTeams.sort((a, b) => {
    const pA = a.scores?.practicalPerformanceScore ?? a.synergyScore;
    const pB = b.scores?.practicalPerformanceScore ?? b.synergyScore;
    if (pB !== pA) return pB - pA;
    const invA = a.scores?.investmentScore ?? 0;
    const invB = b.scores?.investmentScore ?? 0;
    return invB - invA;
  });

  return eligibleTeams.slice(0, 6);
}
