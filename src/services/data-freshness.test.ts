import { describe, it, expect } from 'vitest';
import { isDatasetStale, getFreshnessInfo } from './data-freshness';
import type { DataProvenance } from '../types/genshin';
import { CURRENT_GAME_VERSION, PATCH_CYCLE_DAYS } from '../data/game-version';

describe('Data Freshness Service', () => {
  const baseDate = new Date('2026-11-20T12:00:00Z');

  describe('isDatasetStale', () => {
    it('returns false for data verified within the 42-day patch threshold', () => {
      const freshProvenance: DataProvenance = {
        datasetId: 'test_fresh',
        version: CURRENT_GAME_VERSION,
        verifiedAt: '2026-11-16', // 4 days old relative to baseDate
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        evidence: 'Official 7.2 notice',
        status: 'verified',
      };

      expect(isDatasetStale(freshProvenance, PATCH_CYCLE_DAYS, baseDate)).toBe(false);
    });

    it('returns false when exactly at 42 days threshold', () => {
      // 42 days before 2026-11-20 is 2026-10-09
      const boundaryProvenance: DataProvenance = {
        datasetId: 'test_boundary_42',
        version: CURRENT_GAME_VERSION,
        verifiedAt: '2026-10-09',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        evidence: 'Boundary check',
        status: 'verified',
      };

      expect(isDatasetStale(boundaryProvenance, PATCH_CYCLE_DAYS, baseDate)).toBe(false);
    });

    it('returns true when age strictly exceeds 42 days (43 days)', () => {
      // 43 days before 2026-11-20 is 2026-10-08
      const staleProvenance: DataProvenance = {
        datasetId: 'test_stale_43',
        version: CURRENT_GAME_VERSION,
        verifiedAt: '2026-10-08',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        evidence: 'Exceeded threshold',
        status: 'verified',
      };

      expect(isDatasetStale(staleProvenance, PATCH_CYCLE_DAYS, baseDate)).toBe(true);
    });

    it('returns true if provenance status is explicitly marked stale regardless of date', () => {
      const explicitStale: DataProvenance = {
        datasetId: 'test_explicit_stale',
        version: CURRENT_GAME_VERSION,
        verifiedAt: '2026-11-19', // 1 day old
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        evidence: 'Outdated rotation profile',
        status: 'stale',
      };

      expect(isDatasetStale(explicitStale, PATCH_CYCLE_DAYS, baseDate)).toBe(true);
    });

    it('returns true if dataset version is older than CURRENT_GAME_VERSION', () => {
      const oldVersion: DataProvenance = {
        datasetId: 'test_old_version',
        version: '5.4',
        verifiedAt: '2026-11-19',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        evidence: 'Natlan legacy patch',
        status: 'verified',
      };

      expect(isDatasetStale(oldVersion, PATCH_CYCLE_DAYS, baseDate)).toBe(true);
    });

    it('handles leap year dates and exact day boundaries accurately', () => {
      const leapYearProv: DataProvenance = {
        datasetId: 'test_leap_year',
        version: CURRENT_GAME_VERSION,
        verifiedAt: '2024-02-29',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        evidence: 'Leap year check',
        status: 'verified',
      };

      // 42 days after 2024-02-29 is 2024-04-11
      const on42Days = new Date('2024-04-11T00:00:00Z');
      expect(isDatasetStale(leapYearProv, PATCH_CYCLE_DAYS, on42Days)).toBe(false);

      // 43 days after 2024-02-29 is 2024-04-12
      const on43Days = new Date('2024-04-12T00:00:00Z');
      expect(isDatasetStale(leapYearProv, PATCH_CYCLE_DAYS, on43Days)).toBe(true);
    });

    it('returns true if verifiedAt is an invalid date string', () => {
      const invalidDate: DataProvenance = {
        datasetId: 'test_invalid_date',
        version: CURRENT_GAME_VERSION,
        verifiedAt: 'not-a-real-date',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        evidence: 'Invalid timestamp',
        status: 'verified',
      };

      expect(isDatasetStale(invalidDate, PATCH_CYCLE_DAYS, baseDate)).toBe(true);
    });
  });

  describe('getFreshnessInfo', () => {
    it('retrieves verified freshness info by registered datasetId', () => {
      const info = getFreshnessInfo('banner_7_2_phase_1', baseDate);

      expect(info.datasetId).toBe('banner_7_2_phase_1');
      expect(info.version).toBe(CURRENT_GAME_VERSION);
      expect(info.status).toBe('verified');
      expect(info.isStale).toBe(false);
      expect(info.badgeLabel).toBe(`Verified v${CURRENT_GAME_VERSION}`);
      expect(info.evidence).toContain('Starsealed Edict');
      expect(info.sourceUrl).toBe('https://genshin.hoyoverse.com/en/news');
    });

    it('retrieves verified freshness info for Abyss Floor 12 and Theater schedules', () => {
      const abyssInfo = getFreshnessInfo('cycle-7-2', baseDate);
      expect(abyssInfo.isStale).toBe(false);
      expect(abyssInfo.status).toBe('verified');

      const theaterInfo = getFreshnessInfo('season-7-2-hydro-electro-geo', baseDate);
      expect(theaterInfo.isStale).toBe(false);
      expect(theaterInfo.status).toBe('verified');
    });

    it('handles unregistered dataset IDs gracefully with provisional fallback', () => {
      const fallback = getFreshnessInfo('non_existent_dataset', baseDate);

      expect(fallback.datasetId).toBe('non_existent_dataset');
      expect(fallback.isStale).toBe(false);
      expect(fallback.status).toBe('provisional');
      expect(fallback.badgeLabel).toBe(`Active v${CURRENT_GAME_VERSION}`);
    });

    it('correctly labels stale datasets with age warning in badgeDescription', () => {
      const staleProv: DataProvenance = {
        datasetId: 'custom_stale_dataset',
        version: CURRENT_GAME_VERSION,
        verifiedAt: '2026-09-01', // >70 days old
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        evidence: 'Legacy lineup snapshot',
        status: 'verified',
      };

      const info = getFreshnessInfo(staleProv, baseDate);
      expect(info.isStale).toBe(true);
      expect(info.status).toBe('stale');
      expect(info.badgeLabel).toBe(`Stale v${CURRENT_GAME_VERSION}`);
      expect(info.badgeDescription).toContain('Lineups or mechanics may have shifted');
    });

    it('correctly formats provisional status when status is provisional and within threshold', () => {
      const prov: DataProvenance = {
        datasetId: 'custom_provisional',
        version: CURRENT_GAME_VERSION,
        verifiedAt: '2026-11-18',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        evidence: 'Preliminary beta trial data',
        status: 'provisional',
      };

      const info = getFreshnessInfo(prov, baseDate);
      expect(info.isStale).toBe(false);
      expect(info.status).toBe('provisional');
      expect(info.badgeLabel).toBe(`Provisional v${CURRENT_GAME_VERSION}`);
    });

    it('correctly labels historical registered schedules (cycle-5-3, cycle-7-1, banner_5_3_phase_1) as stale', () => {
      const abyss53 = getFreshnessInfo('cycle-5-3', baseDate);
      expect(abyss53.isStale).toBe(true);
      expect(abyss53.status).toBe('stale');
      expect(abyss53.version).toBe('5.3');
      expect(abyss53.badgeLabel).toBe('Stale v5.3');

      const abyss71 = getFreshnessInfo('cycle-7-1', baseDate);
      expect(abyss71.isStale).toBe(true);
      expect(abyss71.status).toBe('stale');
      expect(abyss71.version).toBe('7.1');
      expect(abyss71.badgeLabel).toBe('Stale v7.1');

      const banner53 = getFreshnessInfo('banner_5_3_phase_1', baseDate);
      expect(banner53.isStale).toBe(true);
      expect(banner53.status).toBe('stale');
      expect(banner53.version).toBe('5.3');
      expect(banner53.badgeLabel).toBe('Stale v5.3');
    });

    it('formats sandbox datasets cleanly with Sandbox Simulation label', () => {
      const sandboxInfo = getFreshnessInfo('custom-sandbox', baseDate);
      expect(sandboxInfo.isStale).toBe(false);
      expect(sandboxInfo.status).toBe('provisional');
      expect(sandboxInfo.badgeLabel).toBe('Sandbox Simulation');
    });

    it('infers version and marks stale for unregistered historical dataset IDs', () => {
      const unregStale = getFreshnessInfo('banner_5_0_phase_1', baseDate);
      expect(unregStale.isStale).toBe(true);
      expect(unregStale.status).toBe('stale');
      expect(unregStale.version).toBe('5.0');
      expect(unregStale.badgeLabel).toBe('Stale v5.0');
    });

    it('marks time-boxed schedules as stale/expired once effectiveEndDate has passed', () => {
      const expiringBanner: DataProvenance = {
        datasetId: 'banner_7_2_phase_1',
        version: CURRENT_GAME_VERSION,
        verifiedAt: '2026-11-16',
        effectiveEndDate: '2026-11-24',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        verificationMethod: 'official_notice',
        verifiedFields: ['characterBanners'],
        evidence: 'Version 7.2 Phase 1 Event Wish notice (ends 2026-11-24)',
        status: 'verified',
      };

      // Active on final day
      expect(isDatasetStale(expiringBanner, PATCH_CYCLE_DAYS, new Date('2026-11-24T12:00:00Z'))).toBe(false);

      // Expired the day after effectiveEndDate
      const afterEnd = getFreshnessInfo(expiringBanner, new Date('2026-11-25T12:00:00Z'));
      expect(afterEnd.isStale).toBe(true);
      expect(afterEnd.isExpired).toBe(true);
      expect(afterEnd.staleReason).toBe('expired_schedule');
      expect(afterEnd.badgeDescription).toContain('2026-11-24');
    });
  });
});
