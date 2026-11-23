import type { DataProvenance } from '../types/genshin';
import { CURRENT_GAME_VERSION } from './game-version';

/**
 * Central Data Provenance Registry for Project Celestia.
 *
 * Enforces evidence-backed verification (method, verified fields, and specific
 * patch/in-game verification notes) rather than relying solely on generic news-index URLs.
 * Schedule start/end dates live exclusively in canonical schedule entities.
 */
export const DATA_PROVENANCE_REGISTRY: Record<string, DataProvenance> = {
  // ── Banner Phases (Active & Historical) ─────────────────────────────────────
  banner_7_2_phase_1: {
    datasetId: 'banner_7_2_phase_1',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'official_notice',
    verifiedFields: ['characterBanners', 'featured4StarIds', 'weaponBanner', 'startDate', 'endDate'],
    evidence:
      'Version 7.2 Phase 1 Event Wish notice (2026-11-04 to 2026-11-24): 5★ Mitya & Furina; 4★ Valeriy, Charlotte, Rosaria; Epitome Invocation Starsealed Edict & Splendor of Tranquil Waters.',
    status: 'verified',
  },
  banner_7_2_phase_2: {
    datasetId: 'banner_7_2_phase_2',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'official_notice',
    verifiedFields: ['characterBanners', 'weaponBanner', 'startDate', 'endDate'],
    evidence:
      'Version 7.2 Phase 2 Event Wish notice (2026-11-24 to 2026-12-15): 5★ Zibai & Linnea; Epitome Invocation Light of Foliar Incision & Aqua Simulacra.',
    status: 'verified',
  },
  banner_7_2_natlan_chronicled: {
    datasetId: 'banner_7_2_natlan_chronicled',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'official_notice',
    verifiedFields: ['characterBanners', 'weaponBanner', 'startDate', 'endDate'],
    evidence:
      'Version 7.2 Natlan Chronicled Wish notice (2026-11-24 to 2026-12-15): Xilonen, Chasca, Kinich, Mualani, Varesa and their 5 signature weapons.',
    status: 'verified',
  },

  // ── Gacha System & Mathematical Engine Rules ────────────────────────────────
  gacha_rules_character_7_2: {
    datasetId: 'gacha_rules_character_7_2',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-20',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news/detail/125274',
    verificationMethod: 'official_notice',
    verifiedFields: ['baseRate', 'softPityStart', 'hardPity', 'radianceStreakRates', 'consolidatedWinRate'],
    evidence:
      'HoYoverse Event Wish disclosure (#125274): 0.600% base rate, pull 74 soft pity (+6%/pull), pull 90 hard pity, 4-state Capturing Radiance Markov model ([0.50, 0.50, 8/11, 1.00]) converging to 55.000% consolidated win rate.',
    status: 'verified',
  },
  gacha_rules_weapon_7_2: {
    datasetId: 'gacha_rules_weapon_7_2',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-20',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news/detail/125274',
    verificationMethod: 'official_notice',
    verifiedFields: ['baseRate', 'softPityStart', 'hardPity', 'fatePointCeiling', 'guaranteeCarriesOver'],
    evidence:
      'HoYoverse Epitome Invocation disclosure (#125274): 0.700% base rate, pull 63 soft pity (+7%/pull), pull 80 hard pity, 1 Fate Point ceiling, and 75/25 off-banner guarantee carryover.',
    status: 'verified',
  },
  gacha_rules_chronicled_7_2: {
    datasetId: 'gacha_rules_chronicled_7_2',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-20',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news/detail/120786',
    verificationMethod: 'official_notice',
    verifiedFields: ['baseRate', 'softPityStart', 'hardPity', 'fatePointCeiling', 'pityCarriesOver'],
    evidence:
      'HoYoverse Chronicled Wish disclosure (#120786): 0.600% base rate, pull 74 soft pity, pull 90 hard pity, 50% featured rate, 1 Fate Point ceiling (resets per period; pity carries over).',
    status: 'verified',
  },
  gacha_rules_4star_7_2: {
    datasetId: 'gacha_rules_4star_7_2',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-20',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news/detail/125274',
    verificationMethod: 'official_notice',
    verifiedFields: [
      'characterBaseRate',
      'weaponBaseRate',
      'softPityStart',
      'weaponSoftPityStart',
      'hardPity',
      'featuredPoolCount',
      'weaponFeaturedPoolCount',
    ],
    evidence:
      'HoYoverse Event Wish 4★ disclosure: Character Wish 5.100% base (pull 9 soft 56.1%, pull 10 hard 100%, 50% rate-up across 3 featured); Weapon Wish 6.000% base (pull 8 soft 66%, pull 9 96%, pull 10 hard 100%, 75% rate-up across 5 featured); no Fate Point ceiling.',
    status: 'verified',
  },
  gacha_rules_starglitter_7_2: {
    datasetId: 'gacha_rules_starglitter_7_2',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-20',
    sourceUrl: 'https://keqingmains.com/',
    verificationMethod: 'theorycraft_consensus',
    verifiedFields: ['cashbackRate', 'starglitterPerFate'],
    evidence:
      'Masterless Starglitter exchange rate (5 Starglitter = 1 Intertwined Fate) yields ~8.0% effective pull refund across mature rosters from duplicate 4★ (+2/+5) and 5★ (+10/+25) drops.',
    status: 'verified',
  },

  // ── Historical Banner Archive (Explicitly Stale) ────────────────────────────
  banner_5_4_phase_1: {
    datasetId: 'banner_5_4_phase_1',
    version: '5.4',
    verifiedAt: '2025-02-12',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'official_notice',
    verifiedFields: ['characterBanners', 'weaponBanner', 'startDate', 'endDate'],
    evidence:
      'Historical Archive · Version 5.4 Phase 1 (2025-02-12 to 2025-03-04): Nefer & Furina with Reliquary of Truth & Splendor of Tranquil Waters.',
    status: 'stale',
  },
  banner_5_3_phase_1: {
    datasetId: 'banner_5_3_phase_1',
    version: '5.3',
    verifiedAt: '2025-01-01',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'official_notice',
    verifiedFields: ['characterBanners', 'weaponBanner', 'startDate', 'endDate'],
    evidence:
      'Historical Archive · Version 5.3 Phase 1 (2025-01-01 to 2025-01-21): Mavuika & Citlali with A Thousand Blazing Suns & Starcaller\'s Watch.',
    status: 'stale',
  },
  banner_5_3_phase_2: {
    datasetId: 'banner_5_3_phase_2',
    version: '5.3',
    verifiedAt: '2025-01-21',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'official_notice',
    verifiedFields: ['characterBanners', 'weaponBanner', 'startDate', 'endDate'],
    evidence:
      'Historical Archive · Version 5.3 Phase 2 (2025-01-21 to 2025-02-11): Arlecchino & Clorinde with Crimson Moon\'s Semblance & Absolution.',
    status: 'stale',
  },
  banner_5_2_phase_1: {
    datasetId: 'banner_5_2_phase_1',
    version: '5.2',
    verifiedAt: '2024-11-20',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'official_notice',
    verifiedFields: ['characterBanners', 'weaponBanner', 'startDate', 'endDate'],
    evidence:
      'Historical Archive · Version 5.2 Phase 1 (2024-11-20 to 2024-12-10): Chasca & Lyney with Astral Vulture\'s Crimson Plumage & The First Great Magic.',
    status: 'stale',
  },
  banner_5_2_phase_2: {
    datasetId: 'banner_5_2_phase_2',
    version: '5.2',
    verifiedAt: '2024-12-10',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'official_notice',
    verifiedFields: ['characterBanners', 'weaponBanner', 'startDate', 'endDate'],
    evidence:
      'Historical Archive · Version 5.2 Phase 2 (2024-12-10 to 2024-12-31): Neuvillette & Zhongli with Tome of the Eternal Flow & Vortex Vanquisher.',
    status: 'stale',
  },
  banner_5_1_phase_1: {
    datasetId: 'banner_5_1_phase_1',
    version: '5.1',
    verifiedAt: '2024-10-09',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'official_notice',
    verifiedFields: ['characterBanners', 'weaponBanner', 'startDate', 'endDate'],
    evidence:
      'Historical Archive · Version 5.1 Phase 1 (2024-10-09 to 2024-10-29): Xilonen & Chiori with Peak Patrol Song & Uraku Misugiri.',
    status: 'stale',
  },
  banner_5_1_phase_2: {
    datasetId: 'banner_5_1_phase_2',
    version: '5.1',
    verifiedAt: '2024-10-29',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'official_notice',
    verifiedFields: ['characterBanners', 'weaponBanner', 'startDate', 'endDate'],
    evidence:
      'Historical Archive · Version 5.1 Phase 2 (2024-10-29 to 2024-11-19): Nahida & Hu Tao with A Thousand Floating Dreams & Staff of Homa.',
    status: 'stale',
  },

  // ── Spiral Abyss (Active & Historical) ──────────────────────────────────────
  'cycle-7-2': {
    datasetId: 'cycle-7-2',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'in_game_verification',
    verifiedFields: ['chambers', 'enemies', 'hp', 'baseRes', 'shields', 'buffDescription'],
    evidence:
      'Version 7.2 Spiral Abyss Phase 1 (2026-11-16 to 2026-12-16) in-game Floor 12 verification: Stellar Fracture - Polestar Domain, Chambers 1–3 enemy HP, elemental resistances, and Pyro/Polestar shield units.',
    status: 'verified',
  },
  'cycle-7-1': {
    datasetId: 'cycle-7-1',
    version: '7.1',
    verifiedAt: '2026-10-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'in_game_verification',
    verifiedFields: ['chambers', 'enemies', 'hp', 'baseRes', 'shields'],
    evidence:
      'Historical Archive · Version 7.1 Spiral Abyss Phase 2 (Lunar Gleam - Ascendant Radiance). Superseded by Version 7.2.',
    status: 'stale',
  },
  'cycle-5-3': {
    datasetId: 'cycle-5-3',
    version: '5.3',
    verifiedAt: '2025-01-01',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'in_game_verification',
    verifiedFields: ['chambers', 'enemies', 'hp', 'baseRes', 'shields'],
    evidence:
      'Historical Archive · Version 5.3 Spiral Abyss Floor 12 (Blazing Nightspirit: Tenebrous Papilla & Secret Source Automaton).',
    status: 'stale',
  },
  'cycle-5-2': {
    datasetId: 'cycle-5-2',
    version: '5.2',
    verifiedAt: '2024-11-20',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'in_game_verification',
    verifiedFields: ['chambers', 'enemies', 'hp', 'baseRes', 'shields'],
    evidence:
      'Historical Archive · Version 5.2 Spiral Abyss Floor 12 (Soaring Gales: Emperor of Fire and Iron & Golden Wolflord).',
    status: 'stale',
  },
  'cycle-5-1': {
    datasetId: 'cycle-5-1',
    version: '5.1',
    verifiedAt: '2024-10-09',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'in_game_verification',
    verifiedFields: ['chambers', 'enemies', 'hp', 'baseRes', 'shields'],
    evidence:
      'Historical Archive · Version 5.1 Spiral Abyss Floor 12 (Resonant Crystals: Setekh Wenut & Mountain Matus).',
    status: 'stale',
  },
  'custom-sandbox': {
    datasetId: 'custom-sandbox',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    verifiedFields: ['chambers'],
    evidence:
      'User-customized Spiral Abyss Floor 12 sandbox simulation evaluated against active combat mechanics.',
    status: 'provisional',
  },

  // ── Imaginarium Theater (Active & Historical) ───────────────────────────────
  'season-7-2-hydro-electro-geo': {
    datasetId: 'season-7-2-hydro-electro-geo',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'in_game_verification',
    verifiedFields: ['elements', 'openingCastIds', 'specialGuestIds', 'bosses', 'dates'],
    evidence:
      'Version 7.2 Imaginarium Theater November 2026 season (2026-11-01 to 2026-12-01): Hydro/Electro/Geo restrictions, 6 Opening Cast, 4 off-element Special Guests, Acts 3/6/8/10 bosses.',
    status: 'verified',
  },
  'season-7-2-dec-pyro-hydro-geo': {
    datasetId: 'season-7-2-dec-pyro-hydro-geo',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'official_notice',
    verifiedFields: ['elements', 'openingCastIds', 'specialGuestIds', 'bosses', 'dates'],
    evidence:
      'Version 7.2 Imaginarium Theater December 2026 schedule (2026-12-01 to 2027-01-01): Pyro/Hydro/Geo restrictions, 6 Opening Cast, 4 off-element Special Guests (Citlali, Nahida, Clorinde, Kazuha), Acts 3/6/8/10 bosses.',
    status: 'verified',
  },
  'season-7-snezhnaya-cryo-hydro-electro': {
    datasetId: 'season-7-snezhnaya-cryo-hydro-electro',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'theorycraft_consensus',
    verifiedFields: ['elements', 'openingCastIds', 'specialGuestIds', 'bosses'],
    evidence:
      'Provisional Version 7.2 Snezhnaya Cryo/Hydro/Electro planning preset (unscheduled in-game; verify opening cast when live).',
    status: 'provisional',
  },
  'season-7-nod-krai-anemo-pyro-geo': {
    datasetId: 'season-7-nod-krai-anemo-pyro-geo',
    version: '7.1',
    verifiedAt: '2026-10-01',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'in_game_verification',
    verifiedFields: ['elements', 'openingCastIds', 'specialGuestIds', 'bosses'],
    evidence:
      'Historical Archive · Version 7.1 Imaginarium Theater October 2026 season (Anemo/Pyro/Geo).',
    status: 'stale',
  },
  'season-natlan-pyro-hydro-anemo': {
    datasetId: 'season-natlan-pyro-hydro-anemo',
    version: '5.2',
    verifiedAt: '2024-11-01',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'in_game_verification',
    verifiedFields: ['elements', 'openingCastIds', 'specialGuestIds', 'bosses'],
    evidence:
      'Historical Archive · Version 5.2 Imaginarium Theater Season 1 (Pyro/Hydro/Anemo opening cast & boss lineup).',
    status: 'stale',
  },
  'season-bloom-hydro-electro-dendro': {
    datasetId: 'season-bloom-hydro-electro-dendro',
    version: '5.0',
    verifiedAt: '2024-09-01',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'in_game_verification',
    verifiedFields: ['elements', 'openingCastIds', 'specialGuestIds', 'bosses'],
    evidence:
      'Historical Archive · Version 5.0 Imaginarium Theater Season 2 (Hydro/Electro/Dendro opening cast & boss lineup).',
    status: 'stale',
  },

  // ── Core Game Datasets (Characters, Weapons, Artifacts, Rotations, Enka) ────
  characters_v7_2_batch7: {
    datasetId: 'characters_v7_2_batch7',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'in_game_verification',
    verifiedFields: ['id', 'element', 'weapon', 'rarity', 'stats', 'talents', 'constellations', 'build'],
    evidence:
      'Version 7.2 in-game Character Archive & Trial Run audit covering all 128 playable characters including Batch 7 (Mitya, Valeriy, Linnea, Zibai, Alyosha, Flins, Ifa, Lohen, Odette, Sandrone, Varesa, Vesna).',
    status: 'verified',
  },
  weapons_v7_2_signatures: {
    datasetId: 'weapons_v7_2_signatures',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'in_game_verification',
    verifiedFields: ['key', 'weaponType', 'rarity', 'baseAtk', 'subStat', 'passiveDesc', 'refinements'],
    evidence:
      'Version 7.2 Weapon Archive audit across all 256 weapons including Starsealed Edict, Vivid Notions, and all 5★/4★ passive refinement scaling.',
    status: 'verified',
  },
  artifacts_v7_2_master: {
    datasetId: 'artifacts_v7_2_master',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'in_game_verification',
    verifiedFields: ['id', 'name', 'maxRarity', 'effect2Pc', 'effect4Pc', 'pieces'],
    evidence:
      'Version 7.2 Reliquary & Artifact Domain audit covering all 64 master artifact sets and 37 combat sets.',
    status: 'verified',
  },
  artifact_weights_v7_2: {
    datasetId: 'artifact_weights_v7_2',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://keqingmains.com/',
    verificationMethod: 'theorycraft_consensus',
    verifiedFields: ['statWeights', 'substatRollValues', 'mainStatTargets', 'setEffects'],
    evidence:
      'Version 7.2 substat roll tiers, marginal roll value weights, and 2pc/4pc combat set effect modifiers validated against theorycrafting standards.',
    status: 'verified',
  },
  talent_scaling_v7_2_curves: {
    datasetId: 'talent_scaling_v7_2_curves',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    verificationMethod: 'in_game_verification',
    verifiedFields: ['normal', 'skill', 'burst', 'level1To15Multipliers'],
    evidence:
      'Version 7.2 Level 1–15 talent scaling JSON curves verified across all 128 playable characters.',
    status: 'verified',
  },
  rotations_v7_2_catalog: {
    datasetId: 'rotations_v7_2_catalog',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://keqingmains.com/',
    verificationMethod: 'theorycraft_consensus',
    verifiedFields: ['actions', 'fieldTime', 'energyRequirement', 'synergyTags'],
    evidence:
      'Version 7.2 individual character rotations, field-time windows, and energy assumptions audited across all 128 characters.',
    status: 'verified',
  },
  enka_id_map_v7_2: {
    datasetId: 'enka_id_map_v7_2',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://enka.network/',
    verificationMethod: 'in_game_verification',
    verifiedFields: ['ENKA_ID_MAP', 'avatarIds', 'travelerIds'],
    evidence:
      'Version 7.2 Enka.Network avatarId mapping verified for all 122 unique characters plus Aether (10000005) and Lumine (10000007).',
    status: 'verified',
  },
  team_archetypes_v7_2: {
    datasetId: 'team_archetypes_v7_2',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://keqingmains.com/',
    verificationMethod: 'theorycraft_consensus',
    verifiedFields: ['archetypeTemplates', 'reactionSynergies', 'resonanceRules'],
    evidence:
      'Version 7.2 team archetype templates, Nightsoul/Lunar/Polestar reaction synergies, and role-tag rules verified against active character roster.',
    status: 'verified',
  },
};

/**
 * Retrieves provenance metadata for a given dataset ID.
 */
export function getProvenance(datasetId: string): DataProvenance | undefined {
  return DATA_PROVENANCE_REGISTRY[datasetId];
}

/**
 * Returns all registered dataset provenances.
 */
export function getAllProvenances(): DataProvenance[] {
  return Object.values(DATA_PROVENANCE_REGISTRY);
}
