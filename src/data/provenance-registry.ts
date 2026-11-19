import type { DataProvenance } from '../types/genshin';
import { CURRENT_GAME_VERSION } from './game-version';

/**
 * Decoupled Data Provenance Registry for Project Celestia.
 *
 * Tracks verification dates, authoritative primary source URLs, and specific patch evidence
 * for all active datasets without bloating character or weapon runtime bundles.
 */
export const DATA_PROVENANCE_REGISTRY: Record<string, DataProvenance> = {
  // Banner Phases (Active & Historical)
  banner_7_2_phase_1: {
    datasetId: 'banner_7_2_phase_1',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'HoyoLAB Version 7.2 Phase 1 Event Wish Announcement: Mitya & Furina, Starsealed Edict signature weapon',
    status: 'verified',
  },
  banner_7_2_phase_2: {
    datasetId: 'banner_7_2_phase_2',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'HoyoLAB Version 7.2 Phase 2 Event Wish Announcement: Zibai & Linnea with Light of Foliar Incision & Aqua Simulacra',
    status: 'verified',
  },
  banner_7_2_natlan_chronicled: {
    datasetId: 'banner_7_2_natlan_chronicled',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'HoyoLAB Version 7.2 Natlan Chronicled Wish Announcement: Xilonen, Chasca, Kinich, Mualani, Varesa',
    status: 'verified',
  },
  banner_5_4_phase_1: {
    datasetId: 'banner_5_4_phase_1',
    version: '5.4',
    verifiedAt: '2025-02-12',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'HoyoLAB Version 5.4 Phase 1 Event Wish Announcement: Yumemizuki Mizuki & Sigewinne',
    status: 'stale',
  },
  banner_5_3_phase_1: {
    datasetId: 'banner_5_3_phase_1',
    version: '5.3',
    verifiedAt: '2025-01-01',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'HoyoLAB Version 5.3 Phase 1 Event Wish Announcement: Mavuika & Citlali',
    status: 'stale',
  },
  banner_5_3_phase_2: {
    datasetId: 'banner_5_3_phase_2',
    version: '5.3',
    verifiedAt: '2025-01-21',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'HoyoLAB Version 5.3 Phase 2 Event Wish Announcement: Arlecchino & Clorinde',
    status: 'stale',
  },
  banner_5_2_phase_1: {
    datasetId: 'banner_5_2_phase_1',
    version: '5.2',
    verifiedAt: '2024-11-20',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'HoyoLAB Version 5.2 Phase 1 Event Wish Announcement: Chasca & Lyney',
    status: 'stale',
  },
  banner_5_2_phase_2: {
    datasetId: 'banner_5_2_phase_2',
    version: '5.2',
    verifiedAt: '2024-12-10',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'HoyoLAB Version 5.2 Phase 2 Event Wish Announcement: Zhongli & Neuvillette',
    status: 'stale',
  },
  banner_5_1_phase_1: {
    datasetId: 'banner_5_1_phase_1',
    version: '5.1',
    verifiedAt: '2024-10-09',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'HoyoLAB Version 5.1 Phase 1 Event Wish Announcement: Xilonen & Chiori',
    status: 'stale',
  },
  banner_5_1_phase_2: {
    datasetId: 'banner_5_1_phase_2',
    version: '5.1',
    verifiedAt: '2024-10-29',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'HoyoLAB Version 5.1 Phase 2 Event Wish Announcement: Nahida & Hu Tao',
    status: 'stale',
  },

  // Spiral Abyss (Active & Historical)
  'cycle-7-2': {
    datasetId: 'cycle-7-2',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 7.2 Spiral Abyss Phase 1 In-Game Schedule & Floor 12 Enemy Lineup Verification (Stellar Fracture - Polestar Domain)',
    status: 'verified',
  },
  abyss_floor_12_v7_2: {
    datasetId: 'abyss_floor_12_v7_2',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 7.2 Spiral Abyss Floor 12 Chamber 1-3 Enemy Lineup, HP, and Elemental Resistance Calibration',
    status: 'verified',
  },
  'cycle-7-1': {
    datasetId: 'cycle-7-1',
    version: '7.1',
    verifiedAt: '2026-10-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 7.1 Spiral Abyss Phase 2 In-Game Lineup Archive (Lunar Gleam - Ascendant Radiance)',
    status: 'stale',
  },
  'cycle-5-3': {
    datasetId: 'cycle-5-3',
    version: '5.3',
    verifiedAt: '2025-01-01',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 5.3 Spiral Abyss Floor 12 Lineup Archive (Blazing Nightspirit)',
    status: 'stale',
  },
  'cycle-5-2': {
    datasetId: 'cycle-5-2',
    version: '5.2',
    verifiedAt: '2024-11-20',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 5.2 Spiral Abyss Floor 12 Lineup Archive (Emperor of Fire and Iron)',
    status: 'stale',
  },
  'cycle-5-1': {
    datasetId: 'cycle-5-1',
    version: '5.1',
    verifiedAt: '2024-10-09',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 5.1 Spiral Abyss Floor 12 Lineup Archive (Setekh Wenut & Mountain Matus)',
    status: 'stale',
  },
  'custom-sandbox': {
    datasetId: 'custom-sandbox',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'User-customized sandbox simulation. Real-time dynamic lineup testing environment.',
    status: 'provisional',
  },

  // Imaginarium Theater (Active & Historical)
  'season-7-2-hydro-electro-geo': {
    datasetId: 'season-7-2-hydro-electro-geo',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 7.2 Imaginarium Theater November 2026 Season Schedule (Hydro/Electro/Geo Opening Cast & Boss Roster)',
    status: 'verified',
  },
  theater_season_7_2_nov: {
    datasetId: 'theater_season_7_2_nov',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 7.2 Imaginarium Theater November 2026 Opening Cast & Special Guests Verification',
    status: 'verified',
  },
  'season-7-2-dec-pyro-hydro-geo': {
    datasetId: 'season-7-2-dec-pyro-hydro-geo',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 7.2 Imaginarium Theater December 2026 Schedule (Pyro/Hydro/Geo Opening Cast & Boss Encounters)',
    status: 'verified',
  },
  theater_season_7_2_dec: {
    datasetId: 'theater_season_7_2_dec',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 7.2 Imaginarium Theater December 2026 Opening Cast & Special Guests Verification',
    status: 'verified',
  },
  'season-7-snezhnaya-cryo-hydro-electro': {
    datasetId: 'season-7-snezhnaya-cryo-hydro-electro',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 7.2 Snezhnaya Season Speculative Opening Cast & Special Guest Lineup Verification',
    status: 'provisional',
  },
  'season-7-nod-krai-anemo-pyro-geo': {
    datasetId: 'season-7-nod-krai-anemo-pyro-geo',
    version: '7.1',
    verifiedAt: '2026-10-01',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 7.1 Imaginarium Theater October Season Schedule Archive (Anemo / Pyro / Geo)',
    status: 'stale',
  },
  'season-natlan-pyro-hydro-anemo': {
    datasetId: 'season-natlan-pyro-hydro-anemo',
    version: '5.2',
    verifiedAt: '2024-11-01',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 5.2 Imaginarium Theater Season 1 Lineup Archive (Pyro / Hydro / Anemo)',
    status: 'stale',
  },
  'season-bloom-hydro-electro-dendro': {
    datasetId: 'season-bloom-hydro-electro-dendro',
    version: '5.0',
    verifiedAt: '2024-09-01',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 5.0 Imaginarium Theater Season 2 Lineup Archive (Hydro / Electro / Dendro)',
    status: 'stale',
  },

  // Characters & Core Data
  characters_v7_2_batch7: {
    datasetId: 'characters_v7_2_batch7',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 7.2 In-Game Archive, Character Trial Run, and Talent Curves for Batch 7 characters (Mitya, Valeriy, Linnea, Zibai, Alyosha, Flins, Ifa, Lohen, Odette, Sandrone, Varesa, Vesna)',
    status: 'verified',
  },
  weapons_v7_2_signatures: {
    datasetId: 'weapons_v7_2_signatures',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 7.2 Weapon Archive verification for Starsealed Edict, Vivid Notions, and 76 authentic 5★ signatures',
    status: 'verified',
  },
  artifacts_v7_2_master: {
    datasetId: 'artifacts_v7_2_master',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Version 7.2 Reliquary and Artifact Domain Registry covering all 64 master sets and 37 combat sets',
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
