const fs = require('fs');
const path = require('path');
const gdb = require('genshin-db');

// Helper to normalize weapon/character keys
function normalizeKey(str) {
  if (!str) return '';
  return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

// -------------------------------------------------------------
// 1. EXTRACT TALENT HELPERS
// -------------------------------------------------------------
function extractCD(combat) {
  if (!combat || !combat.attributes || !combat.attributes.labels) return undefined;
  for (const label of combat.attributes.labels) {
    if (/CD\|/i.test(label) || /Cooldown\|/i.test(label)) {
      const match = label.match(/\{param(\d+)/);
      if (match) {
        const paramKey = 'param' + match[1];
        const val = combat.attributes.parameters && combat.attributes.parameters[paramKey];
        if (val && val[0] !== undefined) return Number(val[0].toFixed(1));
      }
    }
  }
  return undefined;
}

function extractEnergy(combat) {
  if (!combat || !combat.attributes || !combat.attributes.labels) return undefined;
  for (const label of combat.attributes.labels) {
    if (/Energy Cost\|/i.test(label) || /Elemental Energy\|/i.test(label)) {
      const match = label.match(/\{param(\d+)/);
      if (match) {
        const paramKey = 'param' + match[1];
        const val = combat.attributes.parameters && combat.attributes.parameters[paramKey];
        if (val && val[0] !== undefined) return Math.round(val[0]);
      }
    }
  }
  return undefined;
}

// -------------------------------------------------------------
// 2. EXTRACT CHARACTERS
// -------------------------------------------------------------
console.log('Extracting Characters...');

const charText = fs.readFileSync('src/data/characters.ts', 'utf8');
const charLines = charText.split('\n');
const existingChars = [];

for (const line of charLines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('{"id":')) {
    try {
      const cleaned = trimmed.replace(/,\s*$/, '');
      const obj = JSON.parse(cleaned);
      existingChars.push(obj);
    } catch (e) {
      console.error('Error parsing character:', e.message);
    }
  }
}

console.log(`Loaded ${existingChars.length} existing characters.`);

// Enrich existing character talents with scalingKey, CD, energy
for (const char of existingChars) {
  const t = gdb.talents(char.name) || gdb.talents(char.id);
  if (t && char.talents) {
    for (const talent of char.talents) {
      if (talent.type === 'normal') {
        talent.scalingKey = `${char.id}_normal`;
      } else if (talent.type === 'skill') {
        talent.scalingKey = `${char.id}_skill`;
        const cd = extractCD(t.combat2);
        if (cd !== undefined) talent.cooldown = cd;
      } else if (talent.type === 'burst') {
        talent.scalingKey = `${char.id}_burst`;
        const cd = extractCD(t.combat3);
        if (cd !== undefined) talent.cooldown = cd;
        const energy = extractEnergy(t.combat3);
        if (energy !== undefined) talent.energyCost = energy;
      }
    }
  }
}

// Fix Chevreuse weapon name to authentic plural
for (const char of existingChars) {
  if (char.id === 'Chevreuse' && char.build && char.build.weapons) {
    for (const w of char.build.weapons) {
      if (w.name === 'Dialogue of the Desert Sages') {
        w.name = 'Dialogues of the Desert Sages';
      }
    }
  }
}

// Traveler elemental configurations
const travelerConfigs = [
  {
    element: 'Anemo',
    roles: ['Buffer/Shred', 'Off-Field DPS'],
    tags: ['Anemo', 'Sword', 'Swirl', 'Battery', 'VV'],
    weapons: [
      { name: 'Freedom-Sworn', rarity: 5, reason: 'Premier Support BiS: +20% ATK and +16% Normal/Charged DMG buff for party upon triggering Swirl' },
      { name: 'Favonius Sword', rarity: 4, reason: 'Universal Battery: High ER generating neutral energy particles for team rotations' },
      { name: 'Sacrificial Sword', rarity: 4, reason: 'Double Palm Vortex for crowd grouping and double particle generation' },
      { name: 'Iron Sting', rarity: 4, reason: 'F2P Craftable: High EM substat maximizing Swirl reaction damage' }
    ],
    artifacts: [
      { name: 'Viridescent Venerer', pieces: 4, reason: 'Undisputed Best in Slot: 40% Elemental RES shred on Swirl for team carries' },
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Burst Support: Grants party-wide +20% ATK buff upon casting Gust Surge' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'Elemental Mastery'],
      goblet: ['Anemo DMG Bonus', 'Elemental Mastery'],
      circlet: ['CRIT Rate', 'Elemental Mastery']
    },
    subStats: ['Energy Recharge (~180-200%)', 'Elemental Mastery', 'CRIT Rate', 'ATK%']
  },
  {
    element: 'Geo',
    roles: ['Off-Field DPS', 'Buffer/Shred'],
    tags: ['Geo', 'Sword', 'Crystallize', 'Geo-Construct', 'CRIT-Buffer'],
    weapons: [
      { name: 'Primordial Jade Cutter', rarity: 5, reason: '44.1% CRIT Rate with bonus ATK scaling from base HP' },
      { name: 'Festering Desire', rarity: 4, reason: 'High ER with +32% Skill DMG and +12% Skill CRIT Rate on Starfell Sword' },
      { name: 'Favonius Sword', rarity: 4, reason: 'Universal Battery: High ER generating neutral particles' },
      { name: 'Harbinger of Dawn', rarity: 3, reason: 'Premier F2P 3★: 46.9% CRIT DMG and +28% CRIT Rate kept off-field' }
    ],
    artifacts: [
      { name: 'Golden Troupe', pieces: 4, reason: 'Best in Slot: Colossal +70% off-field Starfell Sword burst damage' },
      { name: 'Archaic Petra', pieces: 4, reason: 'Team Buffer: 35% Elemental DMG bonus to party on collecting crystallize shards' },
      { name: 'Noblesse Oblige', pieces: 4, reason: '+20% party ATK buff upon burst cast' }
    ],
    mainStats: {
      sands: ['ATK%', 'Energy Recharge'],
      goblet: ['Geo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Energy Recharge (~130-150%)']
  },
  {
    element: 'Electro',
    roles: ['Buffer/Shred', 'Off-Field DPS'],
    tags: ['Electro', 'Sword', 'Battery', 'Energy-Buffer'],
    weapons: [
      { name: 'Favonius Sword', rarity: 4, reason: 'Universal Battery BiS: High ER generating neutral particles for team rotations' },
      { name: 'Sacrificial Sword', rarity: 4, reason: 'Double skill casts to generate extra Abundance Amulets' },
      { name: 'Fleuve Cendre Ferryman', rarity: 4, reason: 'F2P Fishing Sword: High ER and bonus Skill CRIT Rate' },
      { name: 'Skyward Blade', rarity: 5, reason: '5★ High Base ATK and ER for consistent burst cycles' }
    ],
    artifacts: [
      { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Best in Slot: Directly converts high ER requirements into burst damage' },
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Grants +20% party ATK buff on burst cast' }
    ],
    mainStats: {
      sands: ['Energy Recharge'],
      goblet: ['Electro DMG Bonus', 'ATK%'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (to ~220-250%)', 'CRIT Rate', 'CRIT DMG', 'ATK%']
  },
  {
    element: 'Dendro',
    roles: ['Off-Field DPS', 'Buffer/Shred'],
    tags: ['Dendro', 'Sword', 'Bloom', 'Hyperbloom', 'Burgeon', 'Quicken'],
    weapons: [
      { name: 'Favonius Sword', rarity: 4, reason: 'Universal Battery BiS: High ER generating neutral particles to guarantee burst uptime' },
      { name: 'Sacrificial Sword', rarity: 4, reason: 'Reset Razorgrass Blade cooldown for immediate energy recovery' },
      { name: 'Sapwood Blade', rarity: 4, reason: 'Sumeru Craftable: ER substat and drops a Leaf of Consciousness for +120 EM' },
      { name: 'Freedom-Sworn', rarity: 5, reason: 'High EM substat and party +20% ATK buff upon triggering Dendro reactions' }
    ],
    artifacts: [
      { name: 'Deepwood Memories', pieces: 4, reason: 'Best in Slot: 30% Dendro RES shred triggered continuously by Lea Lotus Lamp' },
      { name: 'Gilded Dreams', pieces: 4, reason: 'Reaction Driver: Massive EM and ATK scaling in Bloom and Spread teams' },
      { name: 'Instructor', pieces: 4, reason: 'Early / F2P Buffer: Grants +120 party EM on elemental reaction' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'Elemental Mastery'],
      goblet: ['Dendro DMG Bonus', 'Elemental Mastery'],
      circlet: ['CRIT Rate', 'CRIT DMG', 'Elemental Mastery']
    },
    subStats: ['Energy Recharge (to ~200-220%)', 'Elemental Mastery', 'CRIT Rate', 'ATK%']
  },
  {
    element: 'Hydro',
    roles: ['Off-Field DPS'],
    tags: ['Hydro', 'Sword', 'Sourcewater-Droplet'],
    weapons: [
      { name: 'Fleuve Cendre Ferryman', rarity: 4, reason: 'Premier F2P Fishing Sword: High ER with +16% Skill CRIT Rate' },
      { name: 'Favonius Sword', rarity: 4, reason: 'Universal Battery: High ER generating neutral energy particles' },
      { name: 'Sacrificial Sword', rarity: 4, reason: 'Resets Aquacrest Saber cooldown for additional Hydro application' },
      { name: 'Primordial Jade Cutter', rarity: 5, reason: 'Massive 44.1% CRIT Rate and HP% scaling' }
    ],
    artifacts: [
      { name: 'Golden Troupe', pieces: 4, reason: 'Best in Slot: Colossal +70% off-field Skill DMG for Aquacrest torrents' },
      { name: 'Nymph\'s Dream', pieces: 4, reason: 'Stacking Hydro DMG and ATK% buffs on skill and normal hits' },
      { name: 'Marechaussee Hunter', pieces: 4, reason: 'Self-inflicted HP fluctuation grants effortless +36% CRIT Rate' }
    ],
    mainStats: {
      sands: ['HP%', 'Energy Recharge'],
      goblet: ['Hydro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (~160-180%)', 'CRIT Rate', 'CRIT DMG', 'HP%', 'ATK%']
  },
  {
    element: 'Pyro',
    roles: ['Buffer/Shred', 'Off-Field DPS'],
    tags: ['Pyro', 'Sword', 'Nightsoul', 'Cinder-City', 'Universal-Buffer'],
    weapons: [
      { name: 'Favonius Sword', rarity: 4, reason: 'Universal Battery: High ER generating neutral particles for party members' },
      { name: 'Peak Patrol Song', rarity: 5, reason: 'DEF and all-elemental DMG buffer for Nightsoul teams' },
      { name: 'Freedom-Sworn', rarity: 5, reason: 'Party ATK% and normal/charged attack damage amplification' },
      { name: 'Flute of Ezpitzal', rarity: 4, reason: 'Natlan Craftable: DEF substat and normal attack buffs' }
    ],
    artifacts: [
      { name: 'Scroll of the Hero of Cinder City', pieces: 4, reason: 'Best in Slot: Unconditional +40% elemental damage bonus for reacted elements' },
      { name: 'Obsidian Codex', pieces: 4, reason: '+40% CRIT Rate when consuming Nightsoul points during combat' },
      { name: 'Noblesse Oblige', pieces: 4, reason: '+20% party-wide ATK buff on burst cast' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'ATK%'],
      goblet: ['Pyro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (~160-180%)', 'CRIT Rate', 'CRIT DMG', 'ATK%']
  }
];

const aether = gdb.character('Aether');
const aetherStats = aether.stats(90);

const travelerCharacters = travelerConfigs.map(cfg => {
  const gdbKey = `Traveler (${cfg.element})`;
  const t = gdb.talents(gdbKey);
  const c = gdb.constellations(gdbKey);
  const charId = `Traveler${cfg.element}`;

  const talents = [];
  if (t) {
    if (t.combat1) {
      talents.push({
        name: t.combat1.name,
        type: 'normal',
        description: t.combat1.description,
        icon: t.images?.filename_combat1 ? `https://enka.network/ui/${t.images.filename_combat1}.png` : undefined,
        scalingKey: `${charId}_normal`
      });
    }
    if (t.combat2) {
      talents.push({
        name: t.combat2.name,
        type: 'skill',
        description: t.combat2.description,
        icon: t.images?.filename_combat2 ? `https://enka.network/ui/${t.images.filename_combat2}.png` : undefined,
        scalingKey: `${charId}_skill`,
        cooldown: extractCD(t.combat2)
      });
    }
    if (t.combat3) {
      talents.push({
        name: t.combat3.name,
        type: 'burst',
        description: t.combat3.description,
        icon: t.images?.filename_combat3 ? `https://enka.network/ui/${t.images.filename_combat3}.png` : undefined,
        scalingKey: `${charId}_burst`,
        cooldown: extractCD(t.combat3),
        energyCost: extractEnergy(t.combat3)
      });
    }
    if (t.passive1) {
      talents.push({
        name: t.passive1.name,
        type: 'passive',
        description: t.passive1.description,
        icon: t.images?.filename_passive1 ? `https://enka.network/ui/${t.images.filename_passive1}.png` : undefined
      });
    }
    if (t.passive2) {
      talents.push({
        name: t.passive2.name,
        type: 'passive',
        description: t.passive2.description,
        icon: t.images?.filename_passive2 ? `https://enka.network/ui/${t.images.filename_passive2}.png` : undefined
      });
    }
  }

  const constellations = [];
  if (c) {
    for (let i = 1; i <= 6; i++) {
      const cKey = `c${i}`;
      if (c[cKey]) {
        constrainIcon = c.images && c.images[`filename_${cKey}`] ? `https://enka.network/ui/${c.images[`filename_${cKey}`]}.png` : undefined;
        constellations.push({
          level: i,
          name: c[cKey].name,
          description: c[cKey].description,
          icon: constrainIcon
        });
      }
    }
  }

  return {
    id: charId,
    name: gdbKey,
    element: cfg.element,
    weapon: 'Sword',
    rarity: 5,
    roles: cfg.roles,
    tags: cfg.tags,
    icon: 'https://enka.network/ui/UI_AvatarIcon_PlayerBoy.png',
    sideIcon: 'https://enka.network/ui/UI_AvatarIcon_Side_PlayerBoy.png',
    description: `A traveler from another world who had their only kin taken away, resonated with the ${cfg.element} element across Teyvat.`,
    title: 'Traveler',
    constellationName: 'Viator',
    stats: {
      hp: Math.round(aetherStats.hp),
      attack: Math.round(aetherStats.attack),
      defense: Math.round(aetherStats.defense),
      specializedStat: 'ATK',
      specializedValue: '+24.0%'
    },
    talents,
    constellations,
    build: {
      weapons: cfg.weapons,
      artifacts: cfg.artifacts,
      mainStats: cfg.mainStats,
      subStats: cfg.subStats
    }
  };
});

// Filter out any existing Travelers from existingChars to avoid duplicates
const filteredExisting = existingChars.filter(c => !c.id.startsWith('Traveler'));
const allCharacters = [...filteredExisting, ...travelerCharacters];

console.log(`Total canonical characters: ${allCharacters.length}`);

// Write characters.ts
let charOut = "import type { Character } from '../types/genshin';\n\nexport const CHARACTERS: Character[] = [\n";
for (let i = 0; i < allCharacters.length; i++) {
  const line = JSON.stringify(allCharacters[i]);
  charOut += `  ${line}${i < allCharacters.length - 1 ? ',' : ''}\n`;
}
charOut += '];\n';
fs.writeFileSync('src/data/characters.ts', charOut);
console.log('Successfully wrote src/data/characters.ts');

// -------------------------------------------------------------
// 3. EXTRACT WEAPONS (ALL 256)
// -------------------------------------------------------------
console.log('Extracting Weapons...');

// Load original baseline weapons for keys, tags and icon preservation
let existingWeapons = [];
try {
  const cp = require('child_process');
  const orig = cp.execSync('git show HEAD:src/data/weapons.ts').toString();
  const decl = 'export const WEAPONS_DATA: WeaponData[] = [';
  const s = orig.indexOf(decl) + decl.length - 1;
  const e = orig.indexOf('];\n\nexport const WEAPONS_BY_KEY');
  existingWeapons = JSON.parse(orig.slice(s, e + 1));
} catch (e) {
  try {
    const weaponText = fs.readFileSync('src/data/weapons.ts', 'utf8');
    const decl = 'export const WEAPONS_DATA: WeaponData[] = [';
    const s = weaponText.indexOf(decl) + decl.length - 1;
    const e = weaponText.indexOf('];\n\nexport const WEAPONS_BY_KEY');
    existingWeapons = JSON.parse(weaponText.slice(s, e + 1));
  } catch (err) {
    console.error('Error reading weapons:', err.message);
  }
}
const existingMap = new Map();
for (const w of existingWeapons) {
  existingMap.set(normalizeKey(w.name), w);
  existingMap.set(normalizeKey(w.key), w);
}

const gdbWeapons = gdb.weapons('names', { matchCategories: true, verboseCategories: true });
console.log(`GDB weapons found: ${gdbWeapons.length}`);

const statKeyMap = {
  FIGHT_PROP_CRITICAL_HURT: 'critDMG_',
  FIGHT_PROP_ATTACK_PERCENT: 'atk_',
  FIGHT_PROP_PHYSICAL_ADD_HURT: 'physical_dmg_',
  FIGHT_PROP_HP_PERCENT: 'hp_',
  FIGHT_PROP_CRITICAL: 'critRate_',
  FIGHT_PROP_ELEMENT_MASTERY: 'eleMas',
  FIGHT_PROP_CHARGE_EFFICIENCY: 'enerRech_',
  FIGHT_PROP_DEFENSE_PERCENT: 'def_'
};

function formatSubStat(type, val) {
  if (!type || val === undefined || val === 0) return undefined;
  if (type === 'FIGHT_PROP_ELEMENT_MASTERY') {
    return Math.round(val).toString();
  }
  return (val * 100).toFixed(1) + '%';
}

const allWeapons = [];

for (const w of gdbWeapons) {
  if (!w) continue;

  let weaponKey;
  if (w.dupealias === 'Prized Isshin Blade 0') {
    weaponKey = 'PrizedIsshinBlade';
  } else if (w.dupealias === 'Prized Isshin Blade 1') {
    weaponKey = 'PrizedIsshinBlade1';
  } else if (w.dupealias === 'Prized Isshin Blade 2') {
    weaponKey = 'PrizedIsshinBlade2';
  } else {
    const key = normalizeKey(w.name);
    const existing = existingMap.get(key);
    weaponKey = existing && existing.key ? existing.key : w.name.replace(/[^a-zA-Z0-9]/g, '');
  }

  const existing = existingMap.get(normalizeKey(weaponKey)) || existingMap.get(normalizeKey(w.name));

  const stat = (typeof w.stats === 'function' ? w.stats(90) : null) || { attack: 0, specialized: 0 };
  const baseAtk = Math.round(stat.attack || w.baseAtkValue || 0);
  let subStatType = statKeyMap[w.mainStatType] || (existing ? existing.subStatType : undefined);
  let subStatValue = formatSubStat(w.mainStatType, stat.specialized) || (existing ? existing.subStatValue : undefined);

  if (w.dupealias === 'Prized Isshin Blade 1') {
    subStatType = undefined;
    subStatValue = undefined;
  } else if (w.dupealias === 'Prized Isshin Blade 2') {
    subStatType = 'atk_';
    subStatValue = '20.7%';
  }

  let refinements = undefined;
  if (w.r1 && w.r1.description) {
    refinements = {
      r1: w.r1.description,
      r2: w.r2 ? w.r2.description : undefined,
      r3: w.r3 ? w.r3.description : undefined,
      r4: w.r4 ? w.r4.description : undefined,
      r5: w.r5 ? w.r5.description : undefined
    };
  } else if (existing && existing.refinements) {
    refinements = existing.refinements;
  }

  let tags = existing && existing.tags ? existing.tags : [];
  if (tags.length === 0) {
    if (subStatType === 'critRate_' || subStatType === 'critDMG_') tags.push('crit');
    if (subStatType === 'enerRech_') tags.push('energy');
    if (subStatType === 'eleMas') tags.push('em');
    if (subStatType === 'atk_') tags.push('atk');
    if (subStatType === 'hp_') tags.push('hp');
    if (subStatType === 'def_') tags.push('def');
    if (subStatType === 'physical_dmg_') tags.push('phys');
    if (w.rarity <= 2) tags.push('starter');
  }

  let icon = existing && existing.icon ? existing.icon : undefined;
  if (!icon && w.images) {
    icon = w.images.mihoyo_icon || (w.images.filename_icon ? `https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/${w.images.filename_icon}.png` : undefined);
  }

  allWeapons.push({
    key: weaponKey,
    name: w.name,
    weaponType: w.weaponText,
    rarity: w.rarity,
    isCombatWeapon: w.rarity >= 3,
    baseAtk: baseAtk,
    subStatType: subStatType,
    subStatValue: subStatValue,
    passiveName: w.effectName || (existing ? existing.passiveName : undefined),
    passiveDesc: (w.r1 && w.r1.description) || (existing ? existing.passiveDesc : undefined),
    refinements: refinements,
    tags: tags.length > 0 ? tags : undefined,
    icon: icon
  });
}

// Sort weapons: Rarity descending, then weaponType, then name
const weaponTypeOrder = { Sword: 1, Claymore: 2, Polearm: 3, Bow: 4, Catalyst: 5 };
allWeapons.sort((a, b) => {
  if (b.rarity !== a.rarity) return b.rarity - a.rarity;
  if (weaponTypeOrder[a.weaponType] !== weaponTypeOrder[b.weaponType]) {
    return weaponTypeOrder[a.weaponType] - weaponTypeOrder[b.weaponType];
  }
  const cmp = a.name.localeCompare(b.name);
  if (cmp !== 0) return cmp;
  return a.key.localeCompare(b.key);
});

console.log(`Total weapons extracted: ${allWeapons.length}`);

// Write weapons.ts
let wepOut = `import type { WeaponData, WeaponType } from '../types/genshin';

export function normalizeWeaponKey(nameOrKey: string): string {
  if (!nameOrKey) return '';
  return nameOrKey.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export const WEAPONS_DATA: WeaponData[] = ${JSON.stringify(allWeapons, null, 2)};

export const WEAPONS_BY_KEY: Record<string, WeaponData> = {};
export const CANONICAL_WEAPON_MAP: Map<string, WeaponData> = new Map();
export const WEAPONS_BY_TYPE: Record<WeaponType, WeaponData[]> = {
  Sword: [],
  Claymore: [],
  Polearm: [],
  Bow: [],
  Catalyst: [],
};

for (const weapon of WEAPONS_DATA) {
  WEAPONS_BY_KEY[weapon.key] = weapon;
  CANONICAL_WEAPON_MAP.set(normalizeWeaponKey(weapon.key), weapon);
  CANONICAL_WEAPON_MAP.set(normalizeWeaponKey(weapon.name), weapon);
  if (WEAPONS_BY_TYPE[weapon.weaponType]) {
    WEAPONS_BY_TYPE[weapon.weaponType].push(weapon);
  }
}

// Canonical Aliases & Quest Variants
if (CANONICAL_WEAPON_MAP.has('dialoguesofthedesertsages')) {
  CANONICAL_WEAPON_MAP.set('dialogueofthedesertsages', CANONICAL_WEAPON_MAP.get('dialoguesofthedesertsages')!);
}
if (WEAPONS_BY_KEY['TheCatch']) {
  CANONICAL_WEAPON_MAP.set('thecatch', WEAPONS_BY_KEY['TheCatch']);
}
if (WEAPONS_BY_KEY['PrizedIsshinBlade']) {
  CANONICAL_WEAPON_MAP.set('prizedisshinblade', WEAPONS_BY_KEY['PrizedIsshinBlade']);
  CANONICAL_WEAPON_MAP.set('prizedisshinblade0', WEAPONS_BY_KEY['PrizedIsshinBlade']);
}
if (WEAPONS_BY_KEY['PrizedIsshinBlade1']) {
  CANONICAL_WEAPON_MAP.set('prizedisshinblade1', WEAPONS_BY_KEY['PrizedIsshinBlade1']);
}
if (WEAPONS_BY_KEY['PrizedIsshinBlade2']) {
  CANONICAL_WEAPON_MAP.set('prizedisshinblade2', WEAPONS_BY_KEY['PrizedIsshinBlade2']);
}

export function getWeaponByKey(keyOrName: string): WeaponData | undefined {
  if (!keyOrName) return undefined;
  if (WEAPONS_BY_KEY[keyOrName]) {
    return WEAPONS_BY_KEY[keyOrName];
  }
  const normalized = normalizeWeaponKey(keyOrName);
  return CANONICAL_WEAPON_MAP.get(normalized);
}
`;
fs.writeFileSync('src/data/weapons.ts', wepOut);
console.log('Successfully wrote src/data/weapons.ts');

// -------------------------------------------------------------
// 4. EXTRACT ARTIFACTS MASTER (64 SETS)
// -------------------------------------------------------------
console.log('Extracting Master Artifact Sets...');

const gdbArtifactNames = gdb.artifacts('names', { matchCategories: true });
console.log(`GDB artifacts found: ${gdbArtifactNames.length}`);

const allArtifactSets = [];

for (const name of gdbArtifactNames) {
  const a = gdb.artifact(name);
  if (!a) continue;

  const rarities = a.rarityList || [];
  const minRarity = rarities.length > 0 ? Math.min(...rarities) : 4;
  const maxRarity = rarities.length > 0 ? Math.max(...rarities) : 5;

  const pieces = {};
  if (a.flower) pieces.flower = { name: a.flower.name, icon: a.images?.mihoyo_flower, description: a.flower.description };
  if (a.plume) pieces.plume = { name: a.plume.name, icon: a.images?.mihoyo_plume, description: a.plume.description };
  if (a.sands) pieces.sands = { name: a.sands.name, icon: a.images?.mihoyo_sands, description: a.sands.description };
  if (a.goblet) pieces.goblet = { name: a.goblet.name, icon: a.images?.mihoyo_goblet, description: a.goblet.description };
  if (a.circlet) pieces.circlet = { name: a.circlet.name, icon: a.images?.mihoyo_circlet, description: a.circlet.description };

  const icon = pieces.flower?.icon || pieces.circlet?.icon;
  const isCombatSet = maxRarity >= 4 && (!!a.effect2Pc || !!a.effect4Pc);

  allArtifactSets.push({
    id: String(a.id || normalizeKey(a.name)),
    name: a.name,
    minRarity,
    maxRarity,
    effect1Pc: a.effect1Pc || undefined,
    effect2Pc: a.effect2Pc || undefined,
    effect4Pc: a.effect4Pc || undefined,
    pieces: Object.keys(pieces).length > 0 ? pieces : undefined,
    icon: icon,
    isCombatSet: isCombatSet
  });
}

// Add 64th artifact set: Initiate
allArtifactSets.push({
  id: '10000',
  name: 'Initiate',
  minRarity: 1,
  maxRarity: 1,
  effect1Pc: undefined,
  effect2Pc: undefined,
  effect4Pc: undefined,
  pieces: {
    flower: { name: "Initiate's Flower", description: "A simple artificial flower made of cloth. An entry-level accessory for trainees." },
    plume: { name: "Initiate's Feather", description: "A simple bird feather used as an introductory piece of equipment for newcomers." }
  },
  icon: undefined,
  isCombatSet: false
});

allArtifactSets.sort((a, b) => b.maxRarity - a.maxRarity || a.name.localeCompare(b.name));

console.log(`Total Master Artifact Sets: ${allArtifactSets.length}`);

// Write artifacts-master.ts
let artOut = `import type { ArtifactSetMaster } from '../types/genshin';

export const ARTIFACTS_MASTER: ArtifactSetMaster[] = ${JSON.stringify(allArtifactSets, null, 2)};

export const ARTIFACTS_BY_NAME: Record<string, ArtifactSetMaster> = {};
export const ARTIFACTS_BY_ID: Record<string, ArtifactSetMaster> = {};

for (const set of ARTIFACTS_MASTER) {
  ARTIFACTS_BY_NAME[set.name] = set;
  ARTIFACTS_BY_ID[set.id] = set;
}

export function getArtifactSet(nameOrId: string): ArtifactSetMaster | undefined {
  if (!nameOrId) return undefined;
  return ARTIFACTS_BY_NAME[nameOrId] || ARTIFACTS_BY_ID[nameOrId];
}
`;
fs.writeFileSync('src/data/artifacts-master.ts', artOut);
console.log('Successfully wrote src/data/artifacts-master.ts');

// -------------------------------------------------------------
// 5. EXTRACT MODULAR TALENT SCALING CURVES
// -------------------------------------------------------------
console.log('Extracting Talent Scaling Curves...');

const scalingDir = path.join('src', 'data', 'talent-scaling');
const scalingDataDir = path.join(scalingDir, 'data');
if (!fs.existsSync(scalingDataDir)) {
  fs.mkdirSync(scalingDataDir, { recursive: true });
}

const availableKeys = [];

for (const char of allCharacters) {
  const gdbName = char.id.startsWith('Traveler') ? char.name : (char.name || char.id);
  const t = gdb.talents(gdbName) || gdb.talents(char.id);
  const cleanId = normalizeKey(char.id);

  if (t) {
    const data = {
      characterId: char.id,
      name: char.name,
      normal: t.combat1 ? {
        name: t.combat1.name,
        labels: t.combat1.attributes?.labels || [],
        parameters: t.combat1.attributes?.parameters || {}
      } : undefined,
      skill: t.combat2 ? {
        name: t.combat2.name,
        labels: t.combat2.attributes?.labels || [],
        parameters: t.combat2.attributes?.parameters || {}
      } : undefined,
      burst: t.combat3 ? {
        name: t.combat3.name,
        labels: t.combat3.attributes?.labels || [],
        parameters: t.combat3.attributes?.parameters || {}
      } : undefined
    };

    fs.writeFileSync(path.join(scalingDataDir, `${cleanId}.json`), JSON.stringify(data, null, 2));
    availableKeys.push(cleanId);
  }
}

console.log(`Saved talent scaling curves for ${availableKeys.length} characters in ${scalingDataDir}`);

// Write index.ts for talent scaling
let indexOut = `export interface TalentScalingCombatSkill {
  name: string;
  labels: string[];
  parameters: Record<string, number[]>;
}

export interface TalentScalingData {
  characterId: string;
  name: string;
  normal?: TalentScalingCombatSkill;
  skill?: TalentScalingCombatSkill;
  burst?: TalentScalingCombatSkill;
}

export const AVAILABLE_SCALING_KEYS: string[] = ${JSON.stringify(availableKeys, null, 2)};

export const SCALING_ALIASES: Record<string, string> = {
  kazuha: 'kaedeharakazuha',
  raiden: 'raidenshogun',
  ayaka: 'kamisatoayaka',
  ayato: 'kamisatoayato',
  itto: 'aratakiitto',
  kokomi: 'sangonomiyakokomi',
  heizou: 'shikanoinheizou',
  sara: 'kujousara',
  shinobu: 'kukishinobu',
  mizuki: 'yumemizukimizuki',
  traveler: 'traveleranemo',
};

const TALENT_SCALING_CACHE = new Map<string, TalentScalingData>();

/**
 * Lazy loads talent scaling curve data for a given character ID or name.
 */
export async function getTalentScaling(characterIdOrName: string): Promise<TalentScalingData | undefined> {
  if (!characterIdOrName) return undefined;
  let key = characterIdOrName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (SCALING_ALIASES[key]) {
    key = SCALING_ALIASES[key];
  }
  if (TALENT_SCALING_CACHE.has(key)) {
    return TALENT_SCALING_CACHE.get(key);
  }
  try {
    const mod = await import(\`./data/\${key}.json\`);
    const data: TalentScalingData = mod.default || mod;
    TALENT_SCALING_CACHE.set(key, data);
    return data;
  } catch {
    return undefined;
  }
}
`;
fs.writeFileSync(path.join(scalingDir, 'index.ts'), indexOut);
console.log('Successfully wrote src/data/talent-scaling/index.ts');

console.log('All extractions completed successfully.');
