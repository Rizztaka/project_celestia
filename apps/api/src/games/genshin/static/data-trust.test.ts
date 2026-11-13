import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import type { CandidateEndgameTeamInput } from '@celestia/api-contracts';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  evaluateEncounterPackStatus,
  solveAbyssJoint,
} from '../intelligence/endgame-intelligence/abyss-joint.calculator.js';
import { explainAbyssJoint } from '../intelligence/endgame-intelligence/abyss-joint.explainer.js';
import { solveOnslaughtJoint } from '../intelligence/endgame-intelligence/onslaught-joint.calculator.js';
import { explainOnslaughtJoint } from '../intelligence/endgame-intelligence/onslaught-joint.explainer.js';
import {
  evaluateSeasonStatus,
  solveTheaterActPlan,
} from '../intelligence/endgame-intelligence/theater-act-planner.calculator.js';
import { explainTheaterActPlan } from '../intelligence/endgame-intelligence/theater-act-planner.explainer.js';
import { type ActiveBanner } from '../intelligence/pull-intelligence/pull-intelligence.calculator.js';
import { PullIntelligenceService } from '../intelligence/pull-intelligence/pull-intelligence.service.js';

const require = createRequire(import.meta.url);
const sourceBytes = readFileSync(require.resolve('genshin-db/src/min/data.min.json'));
const rosterBytes = readFileSync(new URL('./release-roster.json', import.meta.url));
const rosterHash = readFileSync(new URL('./release-roster.sha256', import.meta.url), 'utf8').trim();

interface ReviewAnchor {
  reviewedBy: string;
  reviewedOn: string;
  attestation: string;
}

let RELEASE_SOURCE_REVIEW_ANCHOR: ReviewAnchor;
let verifyGenshinDbProvenance: (params: Record<string, unknown>) => {
  status: string;
  provenance: string;
  independentRosterAnchor: unknown;
};

describe('M7 Data Trust & Provenance Reconciliation (Task 1)', () => {
  beforeAll(async () => {
    const mod = (await import('../../../../tooling/release-source-provenance.mjs' as string)) as {
      RELEASE_SOURCE_REVIEW_ANCHOR: ReviewAnchor;
      verifyGenshinDbProvenance: typeof verifyGenshinDbProvenance;
    };
    RELEASE_SOURCE_REVIEW_ANCHOR = mod.RELEASE_SOURCE_REVIEW_ANCHOR;
    verifyGenshinDbProvenance = mod.verifyGenshinDbProvenance;
  });

  describe('a) genshin-db release provenance verification', () => {
    it('returns status: verified and provenance: verified with independent review anchor', () => {
      const manifest = JSON.parse(rosterBytes.toString('utf8')).source;
      const result = verifyGenshinDbProvenance({
        installedVersion: '5.2.15',
        installedSourcePath: 'src/min/data.min.json',
        sourceBytes,
        manifest,
        rosterBytes,
        rosterHash,
        reviewAnchor: RELEASE_SOURCE_REVIEW_ANCHOR,
      });

      expect(result.status).toBe('verified');
      expect(result.provenance).toBe('verified');
      expect(result.independentRosterAnchor).toEqual(RELEASE_SOURCE_REVIEW_ANCHOR);
    });
  });

  describe('b) release-roster.json review anchor integrity', () => {
    it('contains reviewStatus: verified and matching independentReview anchor', () => {
      const roster = JSON.parse(rosterBytes.toString('utf8'));
      expect(roster.source.reviewStatus).toBe('verified');
      expect(roster.source.independentReview).toEqual(RELEASE_SOURCE_REVIEW_ANCHOR);

      const actualHash = createHash('sha256').update(rosterBytes).digest('hex');
      expect(rosterHash).toBe(actualHash);
    });
  });

  describe('c) endgame-encounters.json source metadata and expiry guards', () => {
    it('contains valid source property with verified: true', () => {
      const encounters = JSON.parse(
        readFileSync(new URL('./endgame-encounters.json', import.meta.url), 'utf8'),
      );
      expect(encounters.source).toBeDefined();
      expect(encounters.source.verified).toBe(true);
      expect(encounters.source.id).toBe('official-genshin-5.2');
    });

    it('evaluates isExpired: true and emits historical caveats across Abyss, Onslaught, and Theater joint evaluators when expiryDate is in the past', () => {
      const expiredDate = new Date('2028-01-01T00:00:00Z');

      // 1. Spiral Abyss
      const abyssPackStatus = evaluateEncounterPackStatus('5.2-1', expiredDate);
      expect(abyssPackStatus.isExpired).toBe(true);
      expect(abyssPackStatus.isCurrentCycle).toBe(false);
      expect(abyssPackStatus.expirationNote).toMatch(/expired/i);

      const candidateTeams: CandidateEndgameTeamInput[] = [
        {
          id: 'team_1',
          name: 'HuTao Vaporize',
          memberKeys: ['HuTao', 'Yelan', 'Xingqiu', 'Zhongli'],
          baseDps: 70000,
          comfortScore: 85,
        },
        {
          id: 'team_2',
          name: 'Raiden National',
          memberKeys: ['RaidenShogun', 'Xiangling', 'Bennett', 'KaedeharaKazuha'],
          baseDps: 68000,
          comfortScore: 80,
        },
        {
          id: 'team_3',
          name: 'Neuvillette Hyper',
          memberKeys: ['Neuvillette', 'Furina', 'Baizhu', 'Fischl'],
          baseDps: 72000,
          comfortScore: 90,
        },
      ];

      const abyssResult = solveAbyssJoint(
        {
          cycleId: '5.2-1',
          floor: 12,
          chamber: 1,
          candidateTeams: candidateTeams.slice(0, 2),
        },
        expiredDate,
      );
      expect(abyssResult.isExpired).toBe(true);
      expect(abyssResult.isCurrentCycle).toBe(false);
      const abyssExplanations = explainAbyssJoint(abyssResult);
      expect(abyssExplanations.some((e) => e.includes('ARCHIVED / HISTORICAL CYCLE'))).toBe(true);

      // 2. Stygian Onslaught
      const onslaughtResult = solveOnslaughtJoint(
        {
          cycleId: '5.2-1',
          candidateTeams,
        },
        expiredDate,
      );
      expect(onslaughtResult.isExpired).toBe(true);
      expect(onslaughtResult.isCurrentCycle).toBe(false);
      const onslaughtExplanations = explainOnslaughtJoint(onslaughtResult);
      expect(onslaughtExplanations.some((e) => e.includes('ARCHIVED / HISTORICAL CYCLE'))).toBe(
        true,
      );

      // 3. Imaginarium Theater
      const theaterSeasonStatus = evaluateSeasonStatus('2026-11-01', expiredDate);
      expect(theaterSeasonStatus.isExpired).toBe(true);
      expect(theaterSeasonStatus.isCurrentSeason).toBe(false);

      const theaterResult = solveTheaterActPlan(
        {
          seasonId: '2026-11-01',
          difficulty: 'VISIONARY',
          castKeys: [
            'Bennett',
            'Xiangling',
            'Xingqiu',
            'Yelan',
            'Fischl',
            'KaedeharaKazuha',
            'Furina',
            'Nahida',
            'Zhongli',
            'RaidenShogun',
            'HuTao',
            'Arlecchino',
            'Keqing',
            'Diluc',
            'Yoimiya',
            'Kachina',
            'Diona',
            'Sayu',
            'Collei',
            'Chevreuse',
            'Mika',
            'Layla',
          ],
          currentAct: 1,
          remainingVigor: {
            Bennett: 2,
            Xiangling: 2,
            Xingqiu: 2,
            Yelan: 2,
            Fischl: 2,
            KaedeharaKazuha: 2,
            Furina: 2,
            Nahida: 2,
            Zhongli: 2,
            RaidenShogun: 2,
            HuTao: 2,
            Arlecchino: 2,
            Keqing: 2,
            Diluc: 2,
            Yoimiya: 2,
            Kachina: 2,
            Diona: 2,
            Sayu: 2,
            Collei: 2,
            Chevreuse: 2,
            Mika: 2,
            Layla: 2,
          },
          completedActs: [],
        },
        expiredDate,
      );
      expect(theaterResult.isExpired).toBe(true);
      expect(theaterResult.isCurrentSeason).toBe(false);
      const theaterExplanations = explainTheaterActPlan(theaterResult);
      expect(theaterExplanations.some((e) => e.includes('ARCHIVED / HISTORICAL SEASON'))).toBe(
        true,
      );
    });
  });

  describe('d) active-banners.json source verification and PullIntelligenceService degradation', () => {
    it('active banners have verified source metadata', () => {
      const bannersData = JSON.parse(
        readFileSync(new URL('./active-banners.json', import.meta.url), 'utf8'),
      );
      const activeBanners = bannersData.banners.filter(
        (b: { historical?: boolean; simulation?: boolean; source?: { verified?: boolean } }) =>
          !b.historical && !b.simulation,
      );
      expect(activeBanners.length).toBeGreaterThan(0);
      for (const b of activeBanners) {
        expect(b.source).toBeDefined();
        expect(b.source.verified).toBe(true);
      }
    });

    it('degrades recommendations for unverified or expired banners to CONDITIONAL_DATA_GAP', () => {
      const service = new PullIntelligenceService();

      const unverifiedBanner: ActiveBanner = {
        bannerId: 'test_unverified',
        name: 'Unverified Test Banner',
        type: 'CHARACTER',
        fiveStarKey: 'Mavuika',
        fourStarKeys: [],
        startDate: '2026-01-01',
        endDate: '2029-12-31',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news/detail/127690',
        source: {
          id: 'unverified-source',
          verified: false,
        },
      };

      const expiredBanner: ActiveBanner = {
        bannerId: 'test_expired',
        name: 'Expired Test Banner',
        type: 'CHARACTER',
        fiveStarKey: 'Mavuika',
        fourStarKeys: [],
        startDate: '2024-01-01',
        endDate: '2024-01-21',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news/detail/127690',
        source: {
          id: 'official-genshin-old',
          verified: true,
        },
      };

      const unverifiedRec = service.evaluateBannerRecommendation(unverifiedBanner, {
        referenceDate: new Date('2026-06-01'),
      });
      expect(unverifiedRec.strategicRecommendation).toBe('CONDITIONAL_DATA_GAP');
      expect(unverifiedRec.strategicRecommendation).not.toBe('HIGH_ACCOUNT_VALUE');
      expect(
        unverifiedRec.missingDataNotes.some((n) => /unverified/i.test(n)) ||
          unverifiedRec.provenanceNotices?.some((n) => /unverified/i.test(n)),
      ).toBe(true);

      const expiredRec = service.evaluateBannerRecommendation(expiredBanner, {
        referenceDate: new Date('2026-06-01'),
      });
      expect(expiredRec.strategicRecommendation).toBe('CONDITIONAL_DATA_GAP');
      expect(expiredRec.strategicRecommendation).not.toBe('HIGH_ACCOUNT_VALUE');
      expect(
        expiredRec.missingDataNotes.some((n) => /expired/i.test(n)) ||
          expiredRec.provenanceNotices?.some((n) => /expired/i.test(n)),
      ).toBe(true);
    });
  });
});
