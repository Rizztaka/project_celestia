#!/usr/bin/env node

/**
 * 7-Axis Game Data Integrity & Maintenance Quality Gate for Project Celestia.
 *
 *   Axis 1: Entity Counts, Schema & ID Uniqueness (Characters, Weapons, Artifacts, Talent Scaling, Rotations)
 *   Axis 2: Referential Integrity (Builds, Banners + Weapons, Theater Cast/Element Rules, Set Effects, Character IDs)
 *   Axis 3: Schedule Chronology, Date Validity & Abyss Encounter Schema (Chambers, HP, 8-Element RES)
 *   Axis 4: Enka Avatar Showcase Mapping Completeness (122 Unique + Aether & Lumine)
 *   Axis 5: Single Canonical Game Version SSOT Enforcement (No Duplicated Hardcoded Constants)
 *   Axis 6: Substantive Provenance & Evidence Audit (Method, Audited Fields, Specific Notes — Not Just HTTPS URLs)
 *   Axis 7: Active Dataset Freshness & Expiration Check
 */

import fs from 'fs';
import path from 'path';

function readFileNormalized(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
}

const errors = [];
const warnings = [];

function recordError(axis, message) {
  errors.push(`[${axis}] ${message}`);
}

function recordWarning(axis, message) {
  warnings.push(`[${axis}] ${message}`);
}

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const VALID_ELEMENTS = new Set(['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo']);
const VALID_WEAPON_TYPES = new Set(['Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst']);

console.log('\n' + '═'.repeat(76));
console.log('🛡️  Project Celestia — 7-Axis Game Data Integrity & Maintenance Gate');
console.log('═'.repeat(76));

// ─────────────────────────────────────────────────────────────────────────────
// Axis 1: Entity Counts, Schema & ID Uniqueness
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Axis 1] Auditing Entity Counts, Schema & ID Uniqueness...');

// 1. Characters
const charText = readFileNormalized('src/data/characters.ts');
const characters = [];
const charById = new Map();
const duplicateCharIds = [];

for (const line of charText.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('{"id":')) {
    try {
      const char = JSON.parse(trimmed.replace(/,\s*$/, ''));
      characters.push(char);
      if (charById.has(char.id)) {
        duplicateCharIds.push(char.id);
      }
      charById.set(char.id, char);
    } catch (e) {
      recordError('Axis 1', `Failed to parse character JSON: ${e.message}`);
    }
  }
}

if (duplicateCharIds.length > 0) {
  recordError('Axis 1', `Duplicate character IDs detected: ${duplicateCharIds.join(', ')}`);
}
if (characters.length !== 128) {
  recordError('Axis 1', `Expected 128 playable characters, found ${characters.length}`);
}

for (const c of characters) {
  if (!VALID_ELEMENTS.has(c.element)) {
    recordError('Axis 1', `Character "${c.id}" has invalid element "${c.element}"`);
  }
  if (!VALID_WEAPON_TYPES.has(c.weapon)) {
    recordError('Axis 1', `Character "${c.id}" has invalid weapon type "${c.weapon}"`);
  }
  if (c.rarity !== 4 && c.rarity !== 5) {
    recordError('Axis 1', `Character "${c.id}" has invalid rarity ${c.rarity}`);
  }
  if (!Array.isArray(c.roles) || c.roles.length === 0) {
    recordError('Axis 1', `Character "${c.id}" is missing role tags`);
  }
  if (!Array.isArray(c.talents) || c.talents.length < 3) {
    recordError('Axis 1', `Character "${c.id}" has incomplete talent records`);
  }
  if (!Array.isArray(c.constellations) || c.constellations.length !== 6) {
    recordError('Axis 1', `Character "${c.id}" must define 6 constellations`);
  }
}
console.log(`  ✓ ${characters.length} Characters audited (IDs, elements, weapons, roles, talents, constellations)`);

// 2. Weapons
const weaponText = readFileNormalized('src/data/weapons.ts');
const wDecl = 'export const WEAPONS_DATA: WeaponData[] = [';
const wStart = weaponText.indexOf(wDecl);
const wEnd = weaponText.indexOf('];\n\nexport const WEAPONS_BY_KEY');

let weapons = [];
if (wStart === -1 || wEnd === -1) {
  recordError('Axis 1', 'Failed to locate WEAPONS_DATA declaration in src/data/weapons.ts');
} else {
  try {
    weapons = JSON.parse(weaponText.slice(wStart + wDecl.length - 1, wEnd + 1));
  } catch (e) {
    recordError('Axis 1', `Failed to parse weapons JSON: ${e.message}`);
  }
}

const weaponByKey = new Map();
const duplicateWeaponKeys = [];
for (const w of weapons) {
  if (weaponByKey.has(w.key)) duplicateWeaponKeys.push(w.key);
  weaponByKey.set(w.key, w);

  if (!VALID_WEAPON_TYPES.has(w.weaponType)) {
    recordError('Axis 1', `Weapon "${w.key}" has invalid weaponType "${w.weaponType}"`);
  }
  if (typeof w.baseAtk !== 'number' || w.baseAtk <= 0) {
    recordError('Axis 1', `Weapon "${w.key}" has invalid baseAtk ${w.baseAtk}`);
  }
  if (!Number.isInteger(w.rarity) || w.rarity < 1 || w.rarity > 5) {
    recordError('Axis 1', `Weapon "${w.key}" has invalid rarity ${w.rarity}`);
  }
}
if (duplicateWeaponKeys.length > 0) {
  recordError('Axis 1', `Duplicate weapon keys detected: ${duplicateWeaponKeys.join(', ')}`);
}
if (weapons.length !== 256) {
  recordError('Axis 1', `Expected 256 weapons, found ${weapons.length}`);
}
console.log(`  ✓ ${weapons.length} Weapons audited (keys, classes, baseAtk, rarity)`);

// 3. Artifact Sets
const artText = readFileNormalized('src/data/artifacts-master.ts');
const aDecl = 'export const ARTIFACTS_MASTER: ArtifactSetMaster[] = [';
const aStart = artText.indexOf(aDecl);
const aEnd = artText.indexOf('];\n\nexport const ARTIFACTS_BY_NAME');

let artifacts = [];
if (aStart === -1 || aEnd === -1) {
  recordError('Axis 1', 'Failed to locate ARTIFACTS_MASTER declaration in src/data/artifacts-master.ts');
} else {
  try {
    artifacts = JSON.parse(artText.slice(aStart + aDecl.length - 1, aEnd + 1));
  } catch (e) {
    recordError('Axis 1', `Failed to parse artifacts JSON: ${e.message}`);
  }
}

const seenArtIds = new Set();
const seenArtNames = new Set();
for (const a of artifacts) {
  if (seenArtIds.has(a.id)) recordError('Axis 1', `Duplicate artifact set ID: "${a.id}"`);
  if (seenArtNames.has(a.name)) recordError('Axis 1', `Duplicate artifact set name: "${a.name}"`);
  seenArtIds.add(a.id);
  seenArtNames.add(a.name);
  if (!a.effect2Pc && !a.effect4Pc && !a.effect1Pc && a.name !== 'Initiate') {
    recordError('Axis 1', `Artifact set "${a.name}" has no set bonus text`);
  }
}
if (artifacts.length !== 64) {
  recordError('Axis 1', `Expected 64 Master Artifact Sets, found ${artifacts.length}`);
}
console.log(`  ✓ ${artifacts.length} Master Artifact Sets audited (IDs, names, set bonuses)`);

// 4. Talent Scaling JSON Profiles (128 characters)
const scalingDir = path.resolve('src/data/talent-scaling/data');
const scalingFiles = fs.existsSync(scalingDir)
  ? new Set(fs.readdirSync(scalingDir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')))
  : new Set();

let missingScalingCount = 0;
for (const c of characters) {
  const key = c.id.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!scalingFiles.has(key)) {
    recordError('Axis 1', `Missing talent scaling JSON file for "${c.id}" (expected ${key}.json)`);
    missingScalingCount++;
  } else {
    try {
      const json = JSON.parse(readFileNormalized(path.join(scalingDir, `${key}.json`)));
      for (const slot of ['normal', 'skill', 'burst']) {
        if (!json[slot]) {
          recordError('Axis 1', `Talent scaling "${key}.json" missing "${slot}" curve`);
        }
      }
    } catch (e) {
      recordError('Axis 1', `Invalid talent scaling JSON "${key}.json": ${e.message}`);
    }
  }
}
if (missingScalingCount === 0) {
  console.log(`  ✓ ${scalingFiles.size} Talent Scaling JSON profiles audited (normal/skill/burst curves)`);
}

// 5. Character Rotations (128 characters)
const rotText = readFileNormalized('src/data/character-rotations.ts');
const rotKeys = new Set([...rotText.matchAll(/^\s{2}([a-z0-9_]+):\s*\{/gm)].map((m) => m[1]));
const missingRotations = characters
  .map((c) => c.id)
  .filter((id) => !rotKeys.has(id.toLowerCase()));
if (missingRotations.length > 0) {
  recordError('Axis 1', `Characters missing rotation profiles: ${missingRotations.join(', ')}`);
} else {
  console.log(`  ✓ 100% Character rotation coverage verified across all ${characters.length} characters`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Axis 2: Referential Integrity & Game-Rule Eligibility
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Axis 2] Auditing Referential Integrity & Eligibility Rules...');

function normalizeKey(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const validWeaponLookup = new Set();
for (const w of weapons) {
  validWeaponLookup.add(w.name.toLowerCase());
  validWeaponLookup.add(w.key.toLowerCase());
  validWeaponLookup.add(normalizeKey(w.name));
  validWeaponLookup.add(normalizeKey(w.key));
}

const validArtifactLookup = new Set();
for (const a of artifacts) {
  validArtifactLookup.add(a.name.toLowerCase());
  validArtifactLookup.add(normalizeKey(a.name));
}

// 1. Character Builds
for (const char of characters) {
  for (const rw of char.build?.weapons || []) {
    if (!validWeaponLookup.has(rw.name.toLowerCase()) && !validWeaponLookup.has(normalizeKey(rw.name))) {
      recordError('Axis 2', `Character "${char.id}" recommends unknown weapon "${rw.name}"`);
    }
  }
  for (const ra of char.build?.artifacts || []) {
    if (!validArtifactLookup.has(ra.name.toLowerCase()) && !validArtifactLookup.has(normalizeKey(ra.name))) {
      recordError('Axis 2', `Character "${char.id}" recommends unknown artifact set "${ra.name}"`);
    }
  }
}

// 2. Canonical Character IDs SSOT alignment
const cidText = readFileNormalized('src/data/character-ids.ts');
const canonicalIds = new Set([...cidText.matchAll(/'([^']+)'/g)].map((m) => m[1]));
for (const c of characters) {
  if (!canonicalIds.has(c.id)) {
    recordError('Axis 2', `src/data/character-ids.ts is missing canonical character ID "${c.id}"`);
  }
}

// 3. Banner Characters, 4★ Pools & Weapon Keys
const bannerText = readFileNormalized('src/data/banners.ts');
const bannerIds = [...bannerText.matchAll(/id:\s*'(banner_[^']+)'/g)].map((m) => m[1]);
const bannerCharMatches = [...bannerText.matchAll(/characterId:\s*'([^']+)'/g)].map((m) => m[1]);
const sigWeaponKeys = [...bannerText.matchAll(/signatureWeaponKey:\s*'([^']+)'/g)].map((m) => m[1]);
const featWeaponBlocks = [...bannerText.matchAll(/featuredWeapons:\s*\[([^\]]+)\]/g)];

for (const charId of bannerCharMatches) {
  if (!charById.has(charId)) {
    recordError('Axis 2', `Banner references unknown character ID: "${charId}"`);
  }
}
for (const wKey of sigWeaponKeys) {
  if (!weaponByKey.has(wKey)) {
    recordError('Axis 2', `Banner signatureWeaponKey "${wKey}" does not exist in WEAPONS_DATA`);
  }
}
for (const block of featWeaponBlocks) {
  const keys = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  for (const wKey of keys) {
    if (!weaponByKey.has(wKey)) {
      recordError('Axis 2', `Banner featured weapon "${wKey}" does not exist in WEAPONS_DATA`);
    }
  }
}
for (const f4m of [...bannerText.matchAll(/featured4StarIds:\s*\[([^\]]+)\]/g)]) {
  const ids = [...f4m[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  for (const f4Id of ids) {
    const c = charById.get(f4Id);
    if (!c) recordError('Axis 2', `Banner references unknown 4★ character: "${f4Id}"`);
    else if (c.rarity !== 4) recordError('Axis 2', `Banner featured 4★ "${f4Id}" has rarity ${c.rarity}`);
  }
}

// 4. Theater Cast, Element Eligibility, Off-Element Special Guests & Bosses
const theaterText = readFileNormalized('src/data/theater-seasons.ts');
const bossInfoKeys = new Set([...theaterText.matchAll(/^\s{2}'([^']+)':\s*\{/gm)].map((m) => m[1]));
const theaterSeasonIds = [];
const seasonRegex =
  /id:\s*'([^']+)'[\s\S]*?elements:\s*\[([^\]]+)\][\s\S]*?openingCastIds:\s*\[([^\]]+)\][\s\S]*?specialGuestIds:\s*\[([^\]]+)\][\s\S]*?bosses:\s*\{([^}]+)\}/g;

for (const m of theaterText.matchAll(seasonRegex)) {
  const [, sid, elemsStr, openStr, guestStr, bossStr] = m;
  theaterSeasonIds.push(sid);
  const elems = new Set([...elemsStr.matchAll(/'([^']+)'/g)].map((x) => x[1]));
  const opens = [...openStr.matchAll(/'([^']+)'/g)].map((x) => x[1]);
  const guests = [...guestStr.matchAll(/'([^']+)'/g)].map((x) => x[1]);
  const bosses = [...bossStr.matchAll(/:\s*'([^']+)'/g)].map((x) => x[1]);

  if (elems.size !== 3) {
    recordError('Axis 2', `Theater season "${sid}" must define 3 distinct elements`);
  }
  for (const cid of opens) {
    const c = charById.get(cid);
    if (!c) {
      recordError('Axis 2', `Theater season "${sid}" opening cast references unknown ID "${cid}"`);
    } else if (!elems.has(c.element)) {
      recordError(
        'Axis 2',
        `Theater season "${sid}" opening cast "${cid}" (${c.element}) is ineligible for [${[...elems].join('/')}]`,
      );
    }
  }
  const openSet = new Set(opens);
  for (const cid of guests) {
    const c = charById.get(cid);
    if (!c) {
      recordError('Axis 2', `Theater season "${sid}" special guest references unknown ID "${cid}"`);
    } else {
      if (openSet.has(cid)) {
        recordError('Axis 2', `Theater season "${sid}" duplicates "${cid}" in both openingCastIds and specialGuestIds`);
      }
      if (elems.has(c.element)) {
        recordError(
          'Axis 2',
          `Theater season "${sid}" special guest "${cid}" (${c.element}) must be outside season elements [${[...elems].join('/')}]`,
        );
      }
    }
  }
  for (const boss of bosses) {
    if (!bossInfoKeys.has(boss)) {
      recordError('Axis 2', `Theater season "${sid}" boss "${boss}" missing from THEATER_BOSS_INFO`);
    }
  }
}

// 5. Artifact Set Effects alignment
const setEffectsText = readFileNormalized('src/data/artifact-set-effects.ts');
for (const m of setEffectsText.matchAll(/^\s{2}(?:'([^']+)'|"([^"]+)"):\s*\{/gm)) {
  const setName = m[1] || m[2];
  if (!seenArtNames.has(setName)) {
    recordError('Axis 2', `artifact-set-effects.ts defines unknown artifact set "${setName}"`);
  }
}
console.log('  ✓ Referential integrity & Theater element-eligibility rules audited');

// ─────────────────────────────────────────────────────────────────────────────
// Axis 3: Schedule Chronology, Date Validity & Abyss Encounter Schema
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Axis 3] Auditing Schedule Chronology & Abyss Encounter Schema...');

function auditDatePairs(label, text, regex) {
  for (const m of text.matchAll(regex)) {
    const [, start, end] = m;
    if (!dateRegex.test(start)) recordError('Axis 3', `Invalid ${label} start date "${start}"`);
    if (!dateRegex.test(end)) recordError('Axis 3', `Invalid ${label} end date "${end}"`);
    if (new Date(start).getTime() >= new Date(end).getTime()) {
      recordError('Axis 3', `${label} start (${start}) must precede end (${end})`);
    }
  }
}

auditDatePairs('banner', bannerText, /startDate:\s*'([^']+)',\s*endDate:\s*'([^']+)'/g);
const abyssText = readFileNormalized('src/data/abyss-schedules.ts');
auditDatePairs('abyss', abyssText, /effectiveStartDate:\s*'([^']+)',\s*effectiveEndDate:\s*'([^']+)'/g);
auditDatePairs('theater', theaterText, /effectiveStartDate:\s*'([^']+)',\s*effectiveEndDate:\s*'([^']+)'/g);

const abyssCycleIds = [...abyssText.matchAll(/id:\s*'(cycle-[^']+)'/g)].map((m) => m[1]);
if (abyssCycleIds.length < 5) {
  recordError('Axis 3', `Expected at least 5 Abyss cycles, found ${abyssCycleIds.length}`);
}
console.log(`  ✓ Schedule dates (${bannerIds.length} banners, ${abyssCycleIds.length} Abyss cycles, ${theaterSeasonIds.length} Theater seasons) audited`);

// ─────────────────────────────────────────────────────────────────────────────
// Axis 4: Enka Avatar Showcase Mapping Completeness
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Axis 4] Auditing Enka Avatar Showcase Mapping Completeness...');

const enkaText = readFileNormalized('src/services/enka.ts');
const enkaIdMap = new Map();
for (const match of enkaText.matchAll(/(\d{8}):\s*'([^']+)'/g)) {
  const numId = parseInt(match[1], 10);
  const charKey = match[2];
  if (enkaIdMap.has(numId)) recordError('Axis 4', `Duplicate Enka ID: ${numId}`);
  if (charKey !== 'Traveler' && !charById.has(charKey)) {
    recordError('Axis 4', `Enka ID ${numId} maps to unknown character key "${charKey}"`);
  }
  enkaIdMap.set(numId, charKey);
}
if (enkaIdMap.get(10000005) !== 'Traveler' || enkaIdMap.get(10000007) !== 'Traveler') {
  recordError('Axis 4', 'Aether (10000005) and Lumine (10000007) must map to "Traveler"');
}
const mappedKeys = new Set(enkaIdMap.values());
for (const char of characters) {
  if (char.id.startsWith('Traveler')) continue;
  if (!mappedKeys.has(char.id)) {
    recordError('Axis 4', `Character "${char.id}" missing from ENKA_ID_MAP`);
  }
}
console.log(`  ✓ Enka avatar mapping audited (${enkaIdMap.size} entries, zero orphans)`);

// ─────────────────────────────────────────────────────────────────────────────
// Axis 5: Single Canonical Game Version SSOT Enforcement
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Axis 5] Auditing Canonical Game Version SSOT...');

const versionText = readFileNormalized('src/data/game-version.ts');
const versionMatch = versionText.match(/CURRENT_GAME_VERSION\s*=\s*'([^']+)'/);
const currentGameVersion = versionMatch ? versionMatch[1] : null;

if (!currentGameVersion || !/^\d+\.\d+$/.test(currentGameVersion)) {
  recordError('Axis 5', `Invalid CURRENT_GAME_VERSION in src/data/game-version.ts: "${currentGameVersion}"`);
} else {
  console.log(`  ✓ Canonical CURRENT_GAME_VERSION = "${currentGameVersion}"`);
}

// Verify no duplicated hardcoded version constant in banner-rules.ts or data-freshness.ts
const bannerRulesText = readFileNormalized('src/data/banner-rules.ts');
if (/export const GACHA_RULES_VERSION\s*=\s*['"]\d+\.\d+['"]/.test(bannerRulesText)) {
  recordError('Axis 5', 'src/data/banner-rules.ts hardcodes GACHA_RULES_VERSION instead of importing CURRENT_GAME_VERSION');
}
const freshnessText = readFileNormalized('src/services/data-freshness.ts');
if (/['"][^'"]*\bv\d+\.\d+\b[^'"]*['"]/.test(freshnessText)) {
  recordError('Axis 5', 'src/services/data-freshness.ts contains a hardcoded version literal instead of CURRENT_GAME_VERSION');
}

// ─────────────────────────────────────────────────────────────────────────────
// Axis 6 & 7: Substantive Provenance Evidence & Active Freshness Check
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Axis 6 & 7] Auditing Substantive Provenance Evidence & Freshness...');

const provText = readFileNormalized('src/data/provenance-registry.ts');
const provBlocks = [...provText.matchAll(/datasetId:\s*'([^']+)'[\s\S]*?status:\s*'([^']+)'/g)];
const provMap = new Map();

for (const b of provBlocks) {
  const full = b[0];
  const id = b[1];
  const status = b[2];
  const verMatch = full.match(/version:\s*(CURRENT_GAME_VERSION|'([^']+)')/);
  const version = verMatch ? (verMatch[2] || currentGameVersion) : null;
  const verifiedAt = full.match(/verifiedAt:\s*'([^']+)'/)?.[1] || '';
  const sourceUrlMatch = full.match(/sourceUrl:\s*'([^']*)'/);
  const sourceUrl = sourceUrlMatch ? sourceUrlMatch[1] : undefined;
  const method = full.match(/verificationMethod:\s*'([^']+)'/)?.[1] || '';
  const fieldsMatch = full.match(/verifiedFields:\s*\[([^\]]+)\]/);
  const evidenceMatch = full.match(/evidence:\s*(?:\n\s*)?'((?:\\'|[^'])+)'/);
  const evidence = evidenceMatch ? evidenceMatch[1] : '';

  provMap.set(id, { id, version, verifiedAt, sourceUrl, method, hasFields: Boolean(fieldsMatch), evidence, status });

  if (!dateRegex.test(verifiedAt)) {
    recordError('Axis 6', `Provenance "${id}" has invalid verifiedAt "${verifiedAt}"`);
  }
  const isSandbox = id === 'custom-sandbox';
  const allowsMissingUrl = isSandbox || method === 'in_game_verification';
  if (sourceUrl !== undefined) {
    if (!sourceUrl.startsWith('https://')) {
      recordError('Axis 6', `Provenance "${id}" sourceUrl must be HTTPS`);
    }
  } else if (!allowsMissingUrl) {
    recordError(
      'Axis 6',
      `Provenance "${id}" requires an HTTPS sourceUrl for verificationMethod "${method || 'none'}"`,
    );
  }
  if (!method && !isSandbox) {
    recordError('Axis 6', `Provenance "${id}" must specify verificationMethod (not just a URL)`);
  }
  if (!fieldsMatch) {
    recordError('Axis 6', `Provenance "${id}" must declare verifiedFields[]`);
  }
  if (!evidence || evidence.trim().length < 25) {
    recordError('Axis 6', `Provenance "${id}" must provide specific verification evidence (>= 25 chars)`);
  }
}

// Every banner, Abyss cycle, Theater season, and core dataset must be registered
const requiredCoreDatasets = [
  ...bannerIds,
  ...abyssCycleIds,
  ...theaterSeasonIds,
  'gacha_rules_character_7_2',
  'gacha_rules_weapon_7_2',
  'gacha_rules_chronicled_7_2',
  'characters_v7_2_batch7',
  'weapons_v7_2_signatures',
  'artifacts_v7_2_master',
  'artifact_weights_v7_2',
  'talent_scaling_v7_2_curves',
  'rotations_v7_2_catalog',
  'enka_id_map_v7_2',
  'team_archetypes_v7_2',
];

for (const reqId of requiredCoreDatasets) {
  if (!provMap.has(reqId)) {
    recordError('Axis 6', `Dataset "${reqId}" is missing from DATA_PROVENANCE_REGISTRY`);
  }
}

// Axis 7: Ensure active core datasets match CURRENT_GAME_VERSION and are not stale
const activeCoreIds = [
  'characters_v7_2_batch7',
  'weapons_v7_2_signatures',
  'artifacts_v7_2_master',
  'artifact_weights_v7_2',
  'talent_scaling_v7_2_curves',
  'rotations_v7_2_catalog',
  'enka_id_map_v7_2',
  'team_archetypes_v7_2',
  'cycle-7-2',
  'season-7-2-hydro-electro-geo',
];
for (const activeId of activeCoreIds) {
  const entry = provMap.get(activeId);
  if (entry && (entry.status === 'stale' || entry.version !== currentGameVersion)) {
    recordError('Axis 7', `Active dataset "${activeId}" is stale or behind v${currentGameVersion}`);
  }
}

console.log(`  ✓ ${provMap.size} Provenance records audited with verificationMethod, verifiedFields, and specific evidence`);

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(76));
if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} Warning(s):`);
  for (const w of warnings) console.log(`   ${w}`);
}
if (errors.length > 0) {
  console.error(`\n❌ 7-Axis Game Data Integrity Audit FAILED with ${errors.length} error(s):`);
  for (const err of errors) console.error(`  - ${err}`);
  console.log('═'.repeat(76) + '\n');
  process.exit(1);
}

console.log('✅ All 7 axes passed with 100% compliance: 0 broken references, 0 duplicate IDs, 0 unverified datasets.');
console.log('═'.repeat(76) + '\n');
process.exit(0);
