import type { DataProvenance } from '../types/genshin';
import { CURRENT_GAME_VERSION } from './game-version';

/**
 * Decoupled Data Provenance Registry for Project Celestia.
 *
 * Tracks verification dates, authoritative primary source URLs, and specific patch evidence
 * for all active datasets without bloating character or weapon runtime bundles.
 */
export const DATA_PROVENANCE_REGISTRY: Record<string, DataProvenance> = {
  // Banner Phases
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

  // Spiral Abyss
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

  // Imaginarium Theater
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
