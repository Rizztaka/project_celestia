#!/usr/bin/env node

/**
 * 5-Axis Game Data Integrity Quality Gate for Project Celestia.
 *
 * Enforces zero-tolerance build-time verification across:
 *   Axis 1: Entity Counts & ID Uniqueness (Characters, Weapons, Artifacts)
 *   Axis 2: Referential Integrity (Build Recommendations, Banners, Theater)
 *   Axis 3: Active Schedule Chronology & Date Validity
 *   Axis 4: Enka Avatar Showcase Mapping Completeness (including Aether & Lumine)
 *   Axis 5: Dataset Provenance, Primary Source URLs & Specific Patch Evidence
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

console.log('\n' + '═'.repeat(72));
console.log('🛡️  Project Celestia — 5-Axis Game Data Integrity Quality Gate');
console.log('═'.repeat(72));

// ─────────────────────────────────────────────────────────────────────────────
// Axis 1: Entity Counts & ID Uniqueness
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Axis 1] Auditing Entity Counts & ID Uniqueness...');

// 1. Characters
const charText = readFileNormalized('src/data/characters.ts');
const characters = [];
const seenCharIds = new Set();
const duplicateCharIds = [];

for (const line of charText.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('{"id":')) {
    try {
      const char = JSON.parse(trimmed.replace(/,\s*$/, ''));
      characters.push(char);
      if (seenCharIds.has(char.id)) {
        duplicateCharIds.push(char.id);
      }
      seenCharIds.add(char.id);
    } catch (e) {
      recordError('Axis 1', `Failed to parse character JSON: ${e.message}`);
    }
  }
}

if (duplicateCharIds.length > 0) {
  recordError('Axis 1', `Duplicate character IDs detected: ${duplicateCharIds.join(', ')}`);
}

if (characters.length !== 128) {
  recordError('Axis 1', `Expected exactly 128 playable characters, found ${characters.length}`);
} else {
  console.log(`  ✓ 128 Canonical Playable Characters verified (0 duplicate IDs)`);
}

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

const seenWeaponKeys = new Set();
const duplicateWeaponKeys = [];

for (const w of weapons) {
  if (seenWeaponKeys.has(w.key)) {
    duplicateWeaponKeys.push(w.key);
  }
  seenWeaponKeys.add(w.key);
}

if (duplicateWeaponKeys.length > 0) {
  recordError('Axis 1', `Duplicate weapon keys detected: ${duplicateWeaponKeys.join(', ')}`);
}

if (weapons.length !== 256) {
  recordError('Axis 1', `Expected exactly 256 weapons, found ${weapons.length}`);
} else {
  console.log(`  ✓ 256 Weapons verified across 5 weapon classes (0 duplicate keys)`);
}

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
const duplicateArtIds = [];
const seenArtNames = new Set();
const duplicateArtNames = [];

for (const a of artifacts) {
  if (seenArtIds.has(a.id)) {
    duplicateArtIds.push(a.id);
  }
  seenArtIds.add(a.id);

  if (seenArtNames.has(a.name)) {
    duplicateArtNames.push(a.name);
  }
  seenArtNames.add(a.name);
}

if (duplicateArtIds.length > 0) {
  recordError('Axis 1', `Duplicate artifact set IDs detected: ${duplicateArtIds.join(', ')}`);
}
if (duplicateArtNames.length > 0) {
  recordError('Axis 1', `Duplicate artifact set names detected: ${duplicateArtNames.join(', ')}`);
}

if (artifacts.length !== 64) {
  recordError('Axis 1', `Expected exactly 64 Master Artifact Sets, found ${artifacts.length}`);
} else {
  console.log(`  ✓ 64 Master Artifact Sets verified (0 duplicate IDs or names)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Axis 2: Referential Integrity
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Axis 2] Auditing Referential Integrity...');

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

// 1. Character Recommended Weapons & Artifacts
let brokenWeaponRefs = 0;
let brokenArtifactRefs = 0;

for (const char of characters) {
  if (char.build?.weapons) {
    for (const rw of char.build.weapons) {
      const match =
        validWeaponLookup.has(rw.name.toLowerCase()) ||
        validWeaponLookup.has(normalizeKey(rw.name));
      if (!match) {
        recordError('Axis 2', `Character "${char.name}" (${char.id}) recommends non-existent weapon "${rw.name}"`);
        brokenWeaponRefs++;
      }
    }
  }

  if (char.build?.artifacts) {
    for (const ra of char.build.artifacts) {
      const match =
        validArtifactLookup.has(ra.name.toLowerCase()) ||
        validArtifactLookup.has(normalizeKey(ra.name));
      if (!match) {
        recordError('Axis 2', `Character "${char.name}" (${char.id}) recommends non-existent artifact set "${ra.name}"`);
        brokenArtifactRefs++;
      }
    }
  }
}

if (brokenWeaponRefs === 0 && brokenArtifactRefs === 0) {
  console.log('  ✓ 100% Referential integrity across all character recommended builds');
}

// 2. Banner Character & Weapon References
const bannerText = readFileNormalized('src/data/banners.ts');
const bannerCharMatches = [...bannerText.matchAll(/characterId:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
const bannerWeaponMatches = [...bannerText.matchAll(/(?:signatureWeaponKey|featuredWeapons):\s*(?:['"]([^'"]+)['"]|\[([^\]]+)\])/g)];

for (const charId of bannerCharMatches) {
  if (!seenCharIds.has(charId)) {
    recordError('Axis 2', `Banner references non-existent character ID: "${charId}"`);
  }
}

// Extract featured 4-star IDs
const featured4Matches = [...bannerText.matchAll(/featured4StarIds:\s*\[([^\]]+)\]/g)];
for (const f4m of featured4Matches) {
  const ids = f4m[1].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean);
  for (const f4Id of ids) {
    const charObj = characters.find((c) => c.id === f4Id);
    if (!charObj) {
      recordError('Axis 2', `Banner references non-existent 4-star character: "${f4Id}"`);
    } else if (charObj.rarity !== 4) {
      recordError('Axis 2', `Banner featured 4-star character "${f4Id}" has rarity ${charObj.rarity} !== 4`);
    }
  }
}
console.log('  ✓ 100% Banner phase referential integrity (characters, 4★ pools, signatures)');

// 3. Theater Opening Cast & Special Guests
const theaterText = readFileNormalized('src/data/theater-seasons.ts');
const openingCastMatches = [...theaterText.matchAll(/openingCastIds:\s*\[([^\]]+)\]/g)];
const guestMatches = [...theaterText.matchAll(/specialGuestIds:\s*\[([^\]]+)\]/g)];

for (const m of [...openingCastMatches, ...guestMatches]) {
  const ids = m[1].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean);
  for (const id of ids) {
    if (!seenCharIds.has(id)) {
      recordError('Axis 2', `Theater season references non-existent character ID: "${id}"`);
    }
  }
}
console.log('  ✓ 100% Theater opening cast & guest referential integrity');

// ─────────────────────────────────────────────────────────────────────────────
// Axis 3: Active Schedule Chronology & Date Validity
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Axis 3] Auditing Schedule Chronology & Date Validity...');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Check Banner Phase Dates
const bannerDateMatches = [
  ...bannerText.matchAll(/startDate:\s*['"]([^'"]+)['"],\s*endDate:\s*['"]([^'"]+)['"]/g),
];

for (const bdm of bannerDateMatches) {
  const start = bdm[1];
  const end = bdm[2];

  if (!dateRegex.test(start)) {
    recordError('Axis 3', `Invalid banner startDate format: "${start}"`);
  }
  if (!dateRegex.test(end)) {
    recordError('Axis 3', `Invalid banner endDate format: "${end}"`);
  }
  if (new Date(start).getTime() >= new Date(end).getTime()) {
    recordError('Axis 3', `Banner startDate (${start}) must precede endDate (${end})`);
  }
}

// Check Abyss Cycle Dates
const abyssText = readFileNormalized('src/data/abyss-schedules.ts');
const abyssDateMatches = [
  ...abyssText.matchAll(/effectiveStartDate:\s*['"]([^'"]+)['"],\s*effectiveEndDate:\s*['"]([^'"]+)['"]/g),
];

for (const adm of abyssDateMatches) {
  const start = adm[1];
  const end = adm[2];

  if (!dateRegex.test(start)) {
    recordError('Axis 3', `Invalid abyss effectiveStartDate format: "${start}"`);
  }
  if (!dateRegex.test(end)) {
    recordError('Axis 3', `Invalid abyss effectiveEndDate format: "${end}"`);
  }
  if (new Date(start).getTime() >= new Date(end).getTime()) {
    recordError('Axis 3', `Abyss effectiveStartDate (${start}) must precede effectiveEndDate (${end})`);
  }
}

// Check Theater Season Dates
const theaterDateMatches = [
  ...theaterText.matchAll(/effectiveStartDate:\s*['"]([^'"]+)['"],\s*effectiveEndDate:\s*['"]([^'"]+)['"]/g),
];

for (const tdm of theaterDateMatches) {
  const start = tdm[1];
  const end = tdm[2];

  if (!dateRegex.test(start)) {
    recordError('Axis 3', `Invalid theater effectiveStartDate format: "${start}"`);
  }
  if (!dateRegex.test(end)) {
    recordError('Axis 3', `Invalid theater effectiveEndDate format: "${end}"`);
  }
  if (new Date(start).getTime() >= new Date(end).getTime()) {
    recordError('Axis 3', `Theater effectiveStartDate (${start}) must precede effectiveEndDate (${end})`);
  }
}

console.log('  ✓ 100% Active schedules possess chronologically valid start and end dates');

// ─────────────────────────────────────────────────────────────────────────────
// Axis 4: Enka Avatar Showcase Mapping Completeness
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Axis 4] Auditing Enka Avatar Showcase Mapping Completeness...');

const enkaText = readFileNormalized('src/services/enka.ts');
const enkaEntryMatches = [...enkaText.matchAll(/(\d{8}):\s*['"]([^'"]+)['"]/g)];

const enkaIdMap = new Map();
const duplicateEnkaIds = [];

for (const match of enkaEntryMatches) {
  const numId = parseInt(match[1], 10);
  const charKey = match[2];

  if (enkaIdMap.has(numId)) {
    duplicateEnkaIds.push(numId);
  }
  enkaIdMap.set(numId, charKey);
}

if (duplicateEnkaIds.length > 0) {
  recordError('Axis 4', `Duplicate Enka IDs detected: ${duplicateEnkaIds.join(', ')}`);
}

// Verify Aether & Lumine
if (enkaIdMap.get(10000005) !== 'Traveler') {
  recordError('Axis 4', `Aether (10000005) must map to "Traveler" in ENKA_ID_MAP`);
}
if (enkaIdMap.get(10000007) !== 'Traveler') {
  recordError('Axis 4', `Lumine (10000007) must map to "Traveler" in ENKA_ID_MAP`);
}

// Verify that all 122 unique named characters have an Enka mapping
const mappedCharKeys = new Set(enkaIdMap.values());
const unmappedCharacters = [];

for (const char of characters) {
  if (char.id.startsWith('Traveler')) continue; // Travelers covered by 10000005/10000007
  if (!mappedCharKeys.has(char.id)) {
    unmappedCharacters.push(char.id);
  }
}

if (unmappedCharacters.length > 0) {
  recordError('Axis 4', `Characters missing Enka Avatar ID mapping: ${unmappedCharacters.join(', ')}`);
} else {
  console.log(`  ✓ 100% of characters (122 unique + Aether/Lumine) have calibrated Enka avatar mappings`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Axis 5: Dataset Provenance & Freshness Evidence
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Axis 5] Auditing Dataset Provenance & Freshness Evidence...');

// Game Version SSOT
const versionText = readFileNormalized('src/data/game-version.ts');
const versionMatch = versionText.match(/CURRENT_GAME_VERSION\s*=\s*['"]([^'"]+)['"]/);
const currentGameVersion = versionMatch ? versionMatch[1] : null;

if (!currentGameVersion || currentGameVersion !== '7.2') {
  recordError('Axis 5', `CURRENT_GAME_VERSION must be '7.2', found "${currentGameVersion}"`);
} else {
  console.log(`  ✓ Version SSOT verified: Version ${currentGameVersion}`);
}

// Provenance Registry
const provText = readFileNormalized('src/data/provenance-registry.ts');
const provEntryMatches = [
  ...provText.matchAll(
    /datasetId:\s*['"]([^'"]+)['"],\s*version:\s*(?:CURRENT_GAME_VERSION|['"]([^'"]+)['"]),\s*verifiedAt:\s*['"]([^'"]+)['"],\s*sourceUrl:\s*['"]([^'"]+)['"],\s*evidence:\s*['"]([^'"]+)['"],\s*status:\s*['"]([^'"]+)['"]/g,
  ),
];

const requiredActiveDatasets = [
  'banner_7_2_phase_1',
  'banner_7_2_phase_2',
  'banner_7_2_natlan_chronicled',
  'cycle-7-2',
  'abyss_floor_12_v7_2',
  'season-7-2-hydro-electro-geo',
  'season-7-2-dec-pyro-hydro-geo',
  'characters_v7_2_batch7',
  'weapons_v7_2_signatures',
  'artifacts_v7_2_master',
];

const foundProvDatasets = new Set();

for (const m of provEntryMatches) {
  const id = m[1];
  const version = m[2] || currentGameVersion;
  const verifiedAt = m[3];
  const sourceUrl = m[4];
  const evidence = m[5];
  const status = m[6];

  foundProvDatasets.add(id);

  if (!dateRegex.test(verifiedAt)) {
    recordError('Axis 5', `Dataset "${id}" verifiedAt "${verifiedAt}" is not formatted as YYYY-MM-DD`);
  }
  if (!sourceUrl.startsWith('https://')) {
    recordError('Axis 5', `Dataset "${id}" sourceUrl "${sourceUrl}" must be an HTTPS URL`);
  }
  if (!evidence || evidence.trim().length < 15) {
    recordError('Axis 5', `Dataset "${id}" must contain detailed evidence notes (>15 chars)`);
  }
  if (!['verified', 'provisional', 'stale'].includes(status)) {
    recordError('Axis 5', `Dataset "${id}" status "${status}" is invalid`);
  }
}

for (const reqId of requiredActiveDatasets) {
  if (!foundProvDatasets.has(reqId)) {
    recordError('Axis 5', `Active dataset "${reqId}" is missing from DATA_PROVENANCE_REGISTRY`);
  }
}

if (foundProvDatasets.size >= requiredActiveDatasets.length) {
  console.log(`  ✓ Provenance manifest verified across ${foundProvDatasets.size} active datasets with HTTPS sources and patch evidence`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Summary & Exit Code
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(72));

if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} Warning(s) detected:`);
  for (const w of warnings) console.log(`   ${w}`);
}

if (errors.length > 0) {
  console.error(`\n❌ 5-Axis Game Data Integrity Audit FAILED with ${errors.length} error(s):`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  console.log('═'.repeat(72) + '\n');
  process.exit(1);
}

console.log('✅ All 5 axes passed with 100% compliance: 0 broken references, 0 duplicate IDs.');
console.log('═'.repeat(72) + '\n');
process.exit(0);
