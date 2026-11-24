import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateBestTeams } from './team-generator';
import { evaluateComprehensivePullROI, evaluatePullRecommendations } from './pull-advisor';
import { solveAbyssDualTeams, swapAbyssDualHalves } from './abyss-solver';
import {
  analyzeTheaterSeasonPlan,
  autoDraftTheaterSchedule,
  filterEligibleTheaterRoster,
  recommendSupportCastBorrow,
} from './theater-solver';
import { rankWeaponsForCharacter } from './weapon-solver';
import { analyzeEndgameReadiness } from './endgame-helper';
import { analyzeArtifactBuild, estimateBuildFromSliders } from './artifact-probability';
import { calculateArtifactStopPoint } from './artifact-stop';
import * as reliabilityService from '../services/recommendation-reliability';
import {
  resolveCanonicalScheduleMode,
  withTestProvenanceRegistry,
} from '../services/engine-reliability';
import { CHARACTERS } from '../data/characters';
import { ABYSS_CYCLES, createCustomSandboxCycle } from '../data/abyss-schedules';
import { THEATER_SEASONS, createCustomSeason } from '../data/theater-seasons';
import { DATA_PROVENANCE_REGISTRY } from '../data/provenance-registry';
import type {
  ArtifactPiece,
  ArtifactSlot,
  DataProvenance,
  OwnedWeapon,
  PullBudgetState,
  RecommendationExecutionContext,
  RecommendationReliability,
  ReliabilityDependencyDetail,
} from '../types/genshin';

describe('M9 Phase 3 — Engine Reliability Integration (All 10 Public Endpoints)', () => {
  const ACTIVE_DATE = '2026-11-23';
  const UPCOMING_BANNER_DATE = '2026-11-20';
  const EXPIRED_BANNER_DATE = '2026-11-25';
  const EXPIRED_THEATER_DATE = '2026-12-05';
  const STALE_CADENCE_DATE = '2027-01-10';

  const baseRoster = [
    'Nefer',
    'Furina',
    'Nahida',
    'KukiShinobu',
    'Mavuika',
    'Yelan',
    'KaedeharaKazuha',
    'Bennett',
    'Xilonen',
    'Citlali',
    'Chasca',
    'Arlecchino',
    'RaidenShogun',
    'Xingqiu',
    'Zhongli',
  ];

  const baseBudget: PullBudgetState = {
    primogems: 16000,
    fates: 20,
    characterPity: 15,
    characterGuaranteed: false,
    weaponPity: 10,
    weaponFatePoints: 0,
  };

  const sampleWeapons: OwnedWeapon[] = [
    {
      id: 'w_homa',
      key: 'StaffOfHoma',
      name: 'Staff of Homa',
      level: 90,
      refinement: 1,
      rarity: 5,
      location: 'HuTao',
    },
  ];

  const incompatibleSwordOnly: OwnedWeapon[] = [
    {
      id: 'w_fav_sword',
      key: 'FavoniusSword',
      name: 'Favonius Sword',
      level: 90,
      refinement: 5,
      rarity: 4,
      location: '',
    },
  ];

  const sampleArtifacts: Partial<Record<ArtifactSlot, ArtifactPiece>> = {
    flower: {
      slotKey: 'flower',
      setKey: 'Crimson Witch of Flames',
      rarity: 5,
      level: 20,
      mainStatKey: 'hp',
      substats: [
        { key: 'critRate_', value: 7.0 },
        { key: 'critDMG_', value: 14.0 },
        { key: 'hp_', value: 5.3 },
        { key: 'eleMas', value: 21 },
      ],
    },
  };

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function assertJsonSerializableReliability(reliability: RecommendationReliability) {
    expect(reliability).toBeDefined();
    const roundTripped = JSON.parse(JSON.stringify(reliability)) as RecommendationReliability;
    expect(roundTripped).toEqual(reliability);
    expect(structuredClone(reliability)).toEqual(reliability);
  }

  describe('Contract, empty/early-return, mode & serialization coverage across all 10 public endpoints', () => {
    it('enforces public RecommendationExecutionContext exposes only evaluatedAt (no mode or provenanceRegistry overrides)', () => {
      type Keys = keyof RecommendationExecutionContext;
      const isExactKey: Keys extends 'evaluatedAt' ? ('evaluatedAt' extends Keys ? true : false) : false = true;
      expect(isExactKey).toBe(true);
    });

    it('covers Team Generator (1/10): normal, empty, unowned focus, and sandbox_simulation theoretical fallback', () => {
      const normal = generateBestTeams(baseRoster, 'Nefer', undefined, undefined, false, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(normal.items.length).toBeGreaterThan(0);
      expect(normal.reliability.mode).toBe('current');
      expect(normal.reliability.status).toBe('reliable');
      expect(normal.reliability.isActionable).toBe(true);
      assertJsonSerializableReliability(normal.reliability);

      const empty = generateBestTeams([], undefined, undefined, undefined, false, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(empty.items).toEqual([]);
      expect(empty.reliability.status).toBe('reliable');
      expect(empty.reliability.evaluatedAt).toBe(ACTIVE_DATE);
      assertJsonSerializableReliability(empty.reliability);

      const unownedFocus = generateBestTeams(
        ['Furina', 'Neuvillette', 'KaedeharaKazuha', 'Zhongli'],
        'HuTao',
        undefined,
        undefined,
        false,
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(unownedFocus.items).toEqual([]);
      expect(unownedFocus.reliability.status).toBe('reliable');

      const theoretical = generateBestTeams(
        ['Furina'],
        undefined,
        undefined,
        undefined,
        true,
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(theoretical.items.length).toBeGreaterThan(0);
      expect(theoretical.items[0].isTheoretical).toBe(true);
      expect(theoretical.reliability.mode).toBe('sandbox_simulation');
      expect(theoretical.reliability.status).toBe('qualified');
      expect(theoretical.reliability.isActionable).toBe(false);
      expect(theoretical.reliability.verification).toBe('verified');
      assertJsonSerializableReliability(theoretical.reliability);
    });

    it('covers Pull Advisor (2/10): active (qualified due to unattested local ROI tables), upcoming, expired, broad planning (omitted/all), explicit sandbox, and unknown banner', () => {
      const activeNoOwned = evaluateComprehensivePullROI({}, [], baseBudget, 'banner_7_2_phase_1', {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(activeNoOwned.items.length).toBeGreaterThan(0);
      expect(activeNoOwned.reliability.mode).toBe('current');
      expect(activeNoOwned.reliability.status).toBe('qualified');
      expect(activeNoOwned.reliability.temporalState).toBe('active');
      expect(activeNoOwned.reliability.verification).toBe('verified');
      expect(activeNoOwned.reliability.isActionable).toBe(false);
      expect(
        activeNoOwned.reliability.warnings.some((w) => w.includes('SIGNATURE_WEAPONS')),
      ).toBe(true);
      expect(
        activeNoOwned.reliability.warnings.some((w) => w.includes('CONSTELLATION_SPIKES')),
      ).toBe(false);
      assertJsonSerializableReliability(activeNoOwned.reliability);

      const activeWithOwned = evaluateComprehensivePullROI(
        { Furina: { id: 'Furina', level: 90, constellation: 0 } },
        [],
        baseBudget,
        'banner_7_2_phase_1',
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(activeWithOwned.reliability.status).toBe('qualified');
      expect(activeWithOwned.reliability.isActionable).toBe(false);
      expect(
        activeWithOwned.reliability.warnings.some((w) => w.includes('CONSTELLATION_SPIKES')),
      ).toBe(true);

      const upcoming = evaluateComprehensivePullROI({}, [], baseBudget, 'banner_7_2_phase_2', {
        evaluatedAt: UPCOMING_BANNER_DATE,
      });
      expect(upcoming.reliability.mode).toBe('planning_preview');
      expect(upcoming.reliability.status).toBe('qualified');
      expect(upcoming.reliability.temporalState).toBe('upcoming');
      expect(upcoming.reliability.isActionable).toBe(false);

      const expired = evaluateComprehensivePullROI({}, [], baseBudget, 'banner_7_2_phase_1', {
        evaluatedAt: EXPIRED_BANNER_DATE,
      });
      expect(expired.reliability.mode).toBe('archive_simulation');
      expect(expired.reliability.status).toBe('historical');
      expect(expired.reliability.temporalState).toBe('expired');
      expect(expired.reliability.isActionable).toBe(false);

      const omittedFilter = evaluateComprehensivePullROI({}, [], baseBudget, undefined, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(omittedFilter.reliability.mode).toBe('planning_preview');
      expect(omittedFilter.reliability.status).toBe('qualified');
      expect(omittedFilter.reliability.temporalState).toBe('not_applicable');
      expect(omittedFilter.reliability.isActionable).toBe(false);
      expect(omittedFilter.reliability.provenanceIds).not.toContain('banner_7_2_phase_1');

      const allFilter = evaluateComprehensivePullROI({}, [], baseBudget, 'all', {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(allFilter.reliability).toEqual(omittedFilter.reliability);

      const sandboxFilter = evaluateComprehensivePullROI({}, [], baseBudget, 'sandbox', {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(sandboxFilter.reliability.mode).toBe('sandbox_simulation');
      expect(sandboxFilter.reliability.status).toBe('qualified');
      expect(sandboxFilter.reliability.temporalState).toBe('not_applicable');
      expect(sandboxFilter.reliability.isActionable).toBe(false);

      const unknown = evaluateComprehensivePullROI({}, [], baseBudget, 'banner_9_9_nonexistent', {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(unknown.items).toEqual([]);
      expect(unknown.reliability.status).toBe('unsupported');
      expect(unknown.reliability.isActionable).toBe(false);
      expect(unknown.reliability.verification).toBe('unregistered');
      assertJsonSerializableReliability(unknown.reliability);
    });

    it('covers Abyss Solver (3/10) + swapAbyssDualHalves: active, partial draft, archive, sandbox, and unknown cycle', () => {
      const normal = solveAbyssDualTeams(baseRoster, undefined, ABYSS_CYCLES[0], {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(normal.reliability.mode).toBe('current');
      expect(normal.reliability.status).toBe('reliable');
      expect(normal.reliability.isActionable).toBe(true);
      assertJsonSerializableReliability(normal.reliability);

      const partial = solveAbyssDualTeams(['Bennett'], undefined, ABYSS_CYCLES[0], {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(partial.warnings?.length).toBeGreaterThan(0);
      expect(partial.reliability.status).toBe('reliable');
      assertJsonSerializableReliability(partial.reliability);

      const cycle53 = ABYSS_CYCLES.find((c) => c.id === 'cycle-5-3')!;
      const archive = solveAbyssDualTeams(baseRoster, undefined, cycle53, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(archive.reliability.mode).toBe('archive_simulation');
      expect(archive.reliability.status).toBe('historical');
      expect(archive.reliability.temporalState).toBe('expired');
      expect(archive.reliability.isActionable).toBe(false);
      expect(archive.reliability.provenanceIds).toContain('cycle-5-3');
      assertJsonSerializableReliability(archive.reliability);

      const customAbyss = createCustomSandboxCycle();
      const sandbox = solveAbyssDualTeams(baseRoster, undefined, customAbyss, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(sandbox.reliability.mode).toBe('sandbox_simulation');
      expect(sandbox.reliability.status).toBe('qualified');
      expect(sandbox.reliability.isActionable).toBe(false);
      expect(sandbox.reliability.temporalState).toBe('not_applicable');
      expect(sandbox.reliability.provenanceIds).toContain('custom-sandbox');
      assertJsonSerializableReliability(sandbox.reliability);

      const unknownCycle = { ...ABYSS_CYCLES[0], id: 'cycle-9-9', isCustom: false };
      const unknownRes = solveAbyssDualTeams(baseRoster, undefined, unknownCycle, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(unknownRes.reliability.status).toBe('unsupported');
      expect(unknownRes.reliability.isActionable).toBe(false);
    });

    it('covers Theater endpoints (4, 5, 6/10): active, upcoming, archive (undated & expired), custom sandbox + borrow, shortfall/empty, and unknown season', () => {
      const activeSeason = THEATER_SEASONS[0];
      const eligible = filterEligibleTheaterRoster(baseRoster, activeSeason).eligible;

      const draft = autoDraftTheaterSchedule(
        eligible,
        'Normal',
        activeSeason,
        undefined,
        undefined,
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(draft.reliability.mode).toBe('current');
      expect(draft.reliability.status).toBe('qualified');
      expect(draft.reliability.temporalState).toBe('active');
      expect(draft.reliability.verification).toBe('verified');
      expect(draft.reliability.isActionable).toBe(false);
      expect(draft.reliability.warnings.some((w) => w.includes('THEATER_BOSS_INFO'))).toBe(true);
      expect(draft.reliability.warnings.some((w) => w.includes('THEATER_DIFFICULTIES'))).toBe(true);
      expect(draft.seasonAnalysis?.reliability).toEqual(draft.reliability);
      assertJsonSerializableReliability(draft.reliability);

      const shortfallDraft = autoDraftTheaterSchedule(
        eligible.slice(0, 6),
        'Visionary',
        activeSeason,
        undefined,
        undefined,
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(shortfallDraft.validationErrors.length).toBeGreaterThan(0);
      expect(shortfallDraft.reliability).toEqual(draft.reliability);

      const standalone = analyzeTheaterSeasonPlan(
        draft.acts,
        eligible,
        'Normal',
        activeSeason,
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(standalone.reliability).toEqual(draft.reliability);
      assertJsonSerializableReliability(standalone.reliability);

      const emptyActsPlan = analyzeTheaterSeasonPlan([], [], 'Normal', activeSeason, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(emptyActsPlan.apexBossReadiness).toBe('At Risk');
      expect(emptyActsPlan.reliability).toEqual(draft.reliability);

      const borrows = recommendSupportCastBorrow(eligible, activeSeason, baseRoster, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(borrows.items.length).toBeGreaterThan(0);
      expect(borrows.reliability.status).toBe('qualified');
      expect(borrows.reliability.isActionable).toBe(false);
      expect(borrows.reliability.warnings.some((w) => w.includes('THEATER_BOSS_INFO'))).toBe(true);
      expect(borrows.reliability.warnings.some((w) => w.includes('THEATER_DIFFICULTIES'))).toBe(false);
      assertJsonSerializableReliability(borrows.reliability);

      const emptyBorrows = recommendSupportCastBorrow(
        CHARACTERS,
        activeSeason,
        CHARACTERS.map((c) => c.id),
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(emptyBorrows.items).toEqual([]);
      expect(emptyBorrows.reliability).toEqual(borrows.reliability);

      // Theater upcoming mode
      const decSeason = THEATER_SEASONS.find((s) => s.id === 'season-7-2-dec-pyro-hydro-geo')!;
      const decEligible = filterEligibleTheaterRoster(baseRoster, decSeason).eligible;
      const upcomingDraft = autoDraftTheaterSchedule(
        decEligible,
        'Normal',
        decSeason,
        undefined,
        undefined,
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(upcomingDraft.reliability.mode).toBe('planning_preview');
      expect(upcomingDraft.reliability.status).toBe('qualified');
      expect(upcomingDraft.reliability.temporalState).toBe('upcoming');
      expect(upcomingDraft.reliability.isActionable).toBe(false);

      const upcomingPlan = analyzeTheaterSeasonPlan(
        upcomingDraft.acts,
        decEligible,
        'Normal',
        decSeason,
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(upcomingPlan.reliability).toEqual(upcomingDraft.reliability);

      const upcomingBorrow = recommendSupportCastBorrow(decEligible, decSeason, baseRoster, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(upcomingBorrow.reliability.mode).toBe('planning_preview');
      expect(upcomingBorrow.reliability.status).toBe('qualified');
      expect(upcomingBorrow.reliability.temporalState).toBe('upcoming');
      expect(upcomingBorrow.reliability.isActionable).toBe(false);

      // Theater archive modes (undated historical v5.2 & expired v7.2 Nov)
      const natlanSeason = THEATER_SEASONS.find((s) => s.id === 'season-natlan-pyro-hydro-anemo')!;
      const natlanEligible = filterEligibleTheaterRoster(baseRoster, natlanSeason).eligible;
      const archiveUndated = autoDraftTheaterSchedule(
        natlanEligible,
        'Normal',
        natlanSeason,
        undefined,
        undefined,
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(archiveUndated.reliability.mode).toBe('archive_simulation');
      expect(archiveUndated.reliability.status).toBe('historical');
      expect(archiveUndated.reliability.isActionable).toBe(false);

      const archiveExpired = autoDraftTheaterSchedule(
        eligible,
        'Normal',
        activeSeason,
        undefined,
        undefined,
        { evaluatedAt: EXPIRED_THEATER_DATE },
      );
      expect(archiveExpired.reliability.mode).toBe('archive_simulation');
      expect(archiveExpired.reliability.status).toBe('historical');
      expect(archiveExpired.reliability.temporalState).toBe('expired');
      expect(archiveExpired.reliability.isActionable).toBe(false);

      const archiveBorrow = recommendSupportCastBorrow(
        natlanEligible,
        natlanSeason,
        baseRoster,
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(archiveBorrow.reliability.mode).toBe('archive_simulation');
      expect(archiveBorrow.reliability.status).toBe('historical');
      expect(archiveBorrow.reliability.isActionable).toBe(false);

      // Custom Theater (draft + support-cast borrow)
      const customSeason = createCustomSeason(['Pyro', 'Hydro', 'Anemo']);
      const customEligible = filterEligibleTheaterRoster(baseRoster, customSeason).eligible;
      const customDraft = autoDraftTheaterSchedule(
        customEligible,
        'Normal',
        customSeason,
        undefined,
        undefined,
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(customDraft.reliability.mode).toBe('sandbox_simulation');
      expect(customDraft.reliability.status).toBe('qualified');
      expect(customDraft.reliability.verification).toBe('provisional');
      expect(customDraft.reliability.temporalState).toBe('not_applicable');
      expect(customDraft.reliability.isActionable).toBe(false);
      expect(customDraft.reliability.provenanceIds).toEqual([
        'characters_v7_2_batch7',
        'custom-theater-sandbox',
      ]);
      expect(customDraft.reliability.provenanceIds).not.toContain('custom-sandbox');
      expect(customDraft.reliability.provenanceIds).not.toContain(customSeason.id);
      expect(customDraft.seasonAnalysis?.reliability).toEqual(customDraft.reliability);

      const customBorrow = recommendSupportCastBorrow(customEligible, customSeason, baseRoster, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(customBorrow.items.length).toBeGreaterThan(0);
      expect(customBorrow.reliability.mode).toBe('sandbox_simulation');
      expect(customBorrow.reliability.status).toBe('qualified');
      expect(customBorrow.reliability.verification).toBe('provisional');
      expect(customBorrow.reliability.temporalState).toBe('not_applicable');
      expect(customBorrow.reliability.isActionable).toBe(false);
      expect(customBorrow.reliability.provenanceIds).toEqual([
        'characters_v7_2_batch7',
        'custom-theater-sandbox',
      ]);
      expect(customBorrow.reliability.provenanceIds).not.toContain('custom-sandbox');
      expect(customBorrow.reliability.provenanceIds).not.toContain(customSeason.id);
      assertJsonSerializableReliability(customBorrow.reliability);

      // Unknown non-custom Theater season ID -> unsupported across all 3 Theater APIs
      const unknownSeason = { ...activeSeason, id: 'season-9-9-nonexistent' };
      expect(
        autoDraftTheaterSchedule(eligible, 'Normal', unknownSeason, undefined, undefined, {
          evaluatedAt: ACTIVE_DATE,
        }).reliability.status,
      ).toBe('unsupported');
      expect(
        analyzeTheaterSeasonPlan([], eligible, 'Normal', unknownSeason, {
          evaluatedAt: ACTIVE_DATE,
        }).reliability.status,
      ).toBe('unsupported');
      expect(
        recommendSupportCastBorrow(eligible, unknownSeason, baseRoster, {
          evaluatedAt: ACTIVE_DATE,
        }).reliability.status,
      ).toBe('unsupported');
    });

    it('covers Weapon Solver (7/10), Endgame Helper (8/10), and Artifact Optimizer (9, 10/10)', () => {
      const huTao = CHARACTERS.find((c) => c.id === 'HuTao')!;

      const rankedNormal = rankWeaponsForCharacter(huTao, sampleWeapons, undefined, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(rankedNormal.items).toHaveLength(1);
      expect(rankedNormal.reliability.status).toBe('reliable');
      expect(rankedNormal.reliability.isActionable).toBe(true);
      assertJsonSerializableReliability(rankedNormal.reliability);

      const rankedEmpty = rankWeaponsForCharacter(huTao, [], undefined, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(rankedEmpty.items).toEqual([]);
      expect(rankedEmpty.reliability.status).toBe('reliable');

      const rankedIncompatible = rankWeaponsForCharacter(
        huTao,
        incompatibleSwordOnly,
        undefined,
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(rankedIncompatible.items).toEqual([]);
      expect(rankedIncompatible.reliability.status).toBe('reliable');
      expect(rankedIncompatible.reliability.isActionable).toBe(true);
      assertJsonSerializableReliability(rankedIncompatible.reliability);

      const readiness = analyzeEndgameReadiness(baseRoster, ABYSS_CYCLES[0], {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(readiness.items).toHaveLength(6);
      expect(readiness.reliability.status).toBe('reliable');
      expect(readiness.reliability.isActionable).toBe(true);
      assertJsonSerializableReliability(readiness.reliability);

      const readinessEmpty = analyzeEndgameReadiness([], ABYSS_CYCLES[0], {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(readinessEmpty.items).toHaveLength(6);
      expect(readinessEmpty.reliability.status).toBe('reliable');

      const readinessUnknown = analyzeEndgameReadiness(
        baseRoster,
        { ...ABYSS_CYCLES[0], id: 'cycle-9-9', isCustom: false },
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(readinessUnknown.reliability.status).toBe('unsupported');
      expect(readinessUnknown.reliability.isActionable).toBe(false);

      const artBuild = analyzeArtifactBuild('HuTao', sampleArtifacts, undefined, undefined, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(artBuild.reliability.mode).toBe('current');
      expect(artBuild.reliability.status).toBe('qualified');
      expect(artBuild.reliability.verification).toBe('verified');
      expect(artBuild.reliability.isActionable).toBe(false);
      expect(artBuild.reliability.warnings.some((w) => w.includes('DOMAIN_CONSTANTS'))).toBe(true);
      expect(artBuild.reliability.warnings.some((w) => w.includes('DOMAIN_PAIRS_REGISTRY'))).toBe(
        true,
      );
      expect(artBuild.reliability.warnings.some((w) => w.includes('STRONGBOX_SETS_SET'))).toBe(
        true,
      );
      assertJsonSerializableReliability(artBuild.reliability);

      const artEmpty = analyzeArtifactBuild('HuTao', {}, undefined, undefined, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(artEmpty.reliability.status).toBe('qualified');
      expect(artEmpty.reliability.isActionable).toBe(false);
      assertJsonSerializableReliability(artEmpty.reliability);

      const sliderBuild = estimateBuildFromSliders(
        'Hu Tao',
        65,
        150,
        100,
        false,
        undefined,
        undefined,
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(sliderBuild.reliability.mode).toBe('sandbox_simulation');
      expect(sliderBuild.reliability.status).toBe('qualified');
      expect(sliderBuild.reliability.isActionable).toBe(false);
      assertJsonSerializableReliability(sliderBuild.reliability);

      const sliderZero = estimateBuildFromSliders(
        'Hu Tao',
        0,
        0,
        0,
        false,
        undefined,
        undefined,
        { evaluatedAt: ACTIVE_DATE },
      );
      expect(sliderZero.reliability.mode).toBe('sandbox_simulation');
      expect(sliderZero.reliability.status).toBe('qualified');
      expect(sliderZero.reliability.isActionable).toBe(false);
    });
  });

  describe('Strict evaluatedAt validation, test override isolation & Phase 2 evaluator fidelity', () => {
    it('accepts valid YYYY-MM-DD, Z, and explicit-offset evaluatedAt timestamps, and uses system clock only when omitted', () => {
      const calendarDate = generateBestTeams(baseRoster, 'Nefer', undefined, undefined, false, {
        evaluatedAt: '2026-11-23',
      });
      expect(calendarDate.reliability.status).toBe('reliable');
      expect(calendarDate.reliability.evaluatedAt).toBe('2026-11-23');

      const utcTimestamp = analyzeEndgameReadiness(baseRoster, ABYSS_CYCLES[0], {
        evaluatedAt: '2026-11-23T18:30:00Z',
      });
      expect(utcTimestamp.reliability.status).toBe('reliable');
      expect(utcTimestamp.reliability.evaluatedAt).toBe('2026-11-23');

      const positiveOffset = analyzeEndgameReadiness(baseRoster, ABYSS_CYCLES[0], {
        evaluatedAt: '2026-11-24T01:00:00+05:30',
      });
      expect(positiveOffset.reliability.status).toBe('reliable');
      expect(positiveOffset.reliability.evaluatedAt).toBe('2026-11-23');

      const negativeOffset = analyzeEndgameReadiness(baseRoster, ABYSS_CYCLES[0], {
        evaluatedAt: '2026-11-23T22:00:00-05:00',
      });
      expect(negativeOffset.reliability.status).toBe('reliable');
      expect(negativeOffset.reliability.evaluatedAt).toBe('2026-11-24');

      // Omitted evaluatedAt uses system clock
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));
      const clockDefault = analyzeEndgameReadiness(baseRoster, ABYSS_CYCLES[0]);
      expect(clockDefault.reliability.status).toBe('reliable');
      expect(clockDefault.reliability.evaluatedAt).toBe('2026-11-23');
    });

    it('rejects empty, malformed, impossible-date, and timezone-less evaluatedAt as unsupported without substituting system clock', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));

      const invalidDates = [
        '',
        '   ',
        'not-a-date',
        '2026-02-30',
        '2026-02-30T12:00:00Z',
        '2026-11-23T12:00:00',
        '2026-11-23T25:00:00Z',
      ];
      const huTao = CHARACTERS.find((c) => c.id === 'HuTao')!;

      for (const badDate of invalidDates) {
        const ctx = { evaluatedAt: badDate };

        const teams = generateBestTeams(baseRoster, undefined, undefined, undefined, false, ctx);
        expect(teams.reliability.status).toBe('unsupported');
        expect(teams.reliability.isActionable).toBe(false);
        expect(teams.reliability.verification).toBe('unregistered');
        expect(teams.reliability.evaluatedAt).toBeUndefined();
        expect(teams.reliability.warnings[0]).toMatch(/Invalid evaluatedAt/i);

        const pull = evaluateComprehensivePullROI({}, [], baseBudget, 'banner_7_2_phase_1', ctx);
        expect(pull.reliability.status).toBe('unsupported');
        expect(pull.reliability.isActionable).toBe(false);

        const abyss = solveAbyssDualTeams(baseRoster, undefined, ABYSS_CYCLES[0], ctx);
        expect(abyss.reliability.status).toBe('unsupported');
        expect(abyss.reliability.isActionable).toBe(false);

        const weapons = rankWeaponsForCharacter(huTao, sampleWeapons, undefined, ctx);
        expect(weapons.reliability.status).toBe('unsupported');
        expect(weapons.reliability.isActionable).toBe(false);

        const endgame = analyzeEndgameReadiness(baseRoster, ABYSS_CYCLES[0], ctx);
        expect(endgame.reliability.status).toBe('unsupported');
        expect(endgame.reliability.isActionable).toBe(false);

        const artifact = analyzeArtifactBuild('HuTao', sampleArtifacts, undefined, undefined, ctx);
        expect(artifact.reliability.status).toBe('unsupported');
        expect(artifact.reliability.isActionable).toBe(false);
      }
    });

    it('resolveCanonicalScheduleMode never silently returns current for unknown schedules or invalid timestamps', () => {
      expect(
        resolveCanonicalScheduleMode({ type: 'abyss', entityId: 'cycle-9-9' }, ACTIVE_DATE),
      ).toEqual({ found: false, reason: 'unknown_schedule' });
      expect(
        resolveCanonicalScheduleMode({ type: 'banner', entityId: 'banner_9_9' }, ACTIVE_DATE),
      ).toEqual({ found: false, reason: 'unknown_schedule' });
      expect(
        resolveCanonicalScheduleMode({ type: 'theater', entityId: 'season-9-9' }, ACTIVE_DATE),
      ).toEqual({ found: false, reason: 'unknown_schedule' });
      expect(
        resolveCanonicalScheduleMode({ type: 'abyss', entityId: 'cycle-7-2' }, 'not-a-date'),
      ).toEqual({ found: false, reason: 'invalid_evaluated_at' });
    });

    it('restores authoritative registry after normal return, thrown error, and rejected thenable callbacks in withTestProvenanceRegistry', () => {
      const brokenRegistry: Record<string, DataProvenance> = {};

      const duringOverride = withTestProvenanceRegistry(brokenRegistry, () =>
        analyzeEndgameReadiness(baseRoster, ABYSS_CYCLES[0], { evaluatedAt: ACTIVE_DATE }),
      );
      expect(duringOverride.reliability.status).toBe('unsupported');

      const afterNormal = analyzeEndgameReadiness(baseRoster, ABYSS_CYCLES[0], {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(afterNormal.reliability.status).toBe('reliable');

      expect(() =>
        withTestProvenanceRegistry(brokenRegistry, () => {
          throw new Error('simulated test failure');
        }),
      ).toThrow('simulated test failure');

      const afterThrow = analyzeEndgameReadiness(baseRoster, ABYSS_CYCLES[0], {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(afterThrow.reliability.status).toBe('reliable');

      expect(() =>
        withTestProvenanceRegistry(
          brokenRegistry,
          (() => Promise.resolve('async-leak')) as unknown as () => never,
        ),
      ).toThrow(TypeError);

      const afterAsyncAttempt = analyzeEndgameReadiness(baseRoster, ABYSS_CYCLES[0], {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(afterAsyncAttempt.reliability.status).toBe('reliable');
    });

    it('propagates provisional, low-risk stale, high-risk stale, unregistered, and future-version states through real engines', () => {
      const provSeason = THEATER_SEASONS.find(
        (s) => s.id === 'season-7-snezhnaya-cryo-hydro-electro',
      )!;
      const provTheater = recommendSupportCastBorrow([], provSeason, [], {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(provTheater.reliability.verification).toBe('provisional');
      expect(provTheater.reliability.status).toBe('qualified');
      expect(provTheater.reliability.isActionable).toBe(false);

      const huTao = CHARACTERS.find((c) => c.id === 'HuTao')!;
      const lowRiskStaleWeapon = rankWeaponsForCharacter(huTao, sampleWeapons, undefined, {
        evaluatedAt: STALE_CADENCE_DATE,
      });
      expect(lowRiskStaleWeapon.reliability.status).toBe('qualified');
      expect(lowRiskStaleWeapon.reliability.verification).toBe('stale');
      expect(lowRiskStaleWeapon.reliability.isActionable).toBe(true);
      expect(
        lowRiskStaleWeapon.reliability.warnings.some((w) => w.includes('artifact_weights_v7_2')),
      ).toBe(true);

      const lowRiskStaleArt = analyzeArtifactBuild('HuTao', sampleArtifacts, undefined, undefined, {
        evaluatedAt: STALE_CADENCE_DATE,
      });
      expect(lowRiskStaleArt.reliability.status).toBe('qualified');
      expect(lowRiskStaleArt.reliability.verification).toBe('stale');
      expect(lowRiskStaleArt.reliability.isActionable).toBe(false);

      const staleWeapons: DataProvenance = {
        ...DATA_PROVENANCE_REGISTRY.weapons_v7_2_signatures,
        version: '7.1',
      };
      const highRiskRes = withTestProvenanceRegistry(
        { ...DATA_PROVENANCE_REGISTRY, weapons_v7_2_signatures: staleWeapons },
        () => rankWeaponsForCharacter(huTao, sampleWeapons, undefined, { evaluatedAt: ACTIVE_DATE }),
      );
      expect(highRiskRes.reliability.status).toBe('unsupported');
      expect(highRiskRes.reliability.isActionable).toBe(false);

      const withoutChars: Record<string, DataProvenance> = { ...DATA_PROVENANCE_REGISTRY };
      delete withoutChars.characters_v7_2_batch7;
      const unregRes = withTestProvenanceRegistry(withoutChars, () =>
        generateBestTeams(baseRoster, undefined, undefined, undefined, false, {
          evaluatedAt: ACTIVE_DATE,
        }),
      );
      expect(unregRes.reliability.status).toBe('unsupported');
      expect(unregRes.reliability.verification).toBe('unregistered');
      expect(unregRes.reliability.isActionable).toBe(false);

      const futureChars: DataProvenance = {
        ...DATA_PROVENANCE_REGISTRY.characters_v7_2_batch7,
        version: '8.0',
      };
      const futureRes = withTestProvenanceRegistry(
        { ...DATA_PROVENANCE_REGISTRY, characters_v7_2_batch7: futureChars },
        () => analyzeEndgameReadiness(baseRoster, ABYSS_CYCLES[0], { evaluatedAt: ACTIVE_DATE }),
      );
      expect(futureRes.reliability.status).toBe('unsupported');
      expect(futureRes.reliability.isActionable).toBe(false);
    });
  });

  describe('Dependency boundaries, nested execution, swap envelope validation & excluded helpers', () => {
    it('uses exact canonical IDs, excludes artifacts_v7_2_master from artifact optimizer, and keeps optional deps optional', () => {
      expect(DATA_PROVENANCE_REGISTRY.artifacts_v7_2_master).toBeDefined();
      expect('artifacts_master_v7_2' in DATA_PROVENANCE_REGISTRY).toBe(false);

      const art = analyzeArtifactBuild('HuTao', sampleArtifacts, undefined, undefined, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(art.reliability.provenanceIds).toEqual([
        'artifact_weights_v7_2',
        'characters_v7_2_batch7',
      ]);
      expect(art.reliability.provenanceIds).not.toContain('artifacts_v7_2_master');

      const teams = generateBestTeams(baseRoster, undefined, undefined, undefined, false, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(
        teams.reliability.dependencies?.find((d) => d.datasetId === 'artifact_weights_v7_2')
          ?.required,
      ).toBe(false);
    });

    it('prevents duplicate evaluator calls across nested Abyss, Artifact, and Theater boundaries and rejects missing, malformed, or semantically inconsistent Abyss swap reliability', () => {
      const spy = vi.spyOn(reliabilityService, 'evaluateRecommendationReliability');

      // Abyss -> Team Generator (1 evaluation) + swapAbyssDualHalves (0 extra evaluations)
      const abyssPlan = solveAbyssDualTeams(baseRoster, undefined, ABYSS_CYCLES[0], {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(spy).toHaveBeenCalledTimes(1);
      const swapped = swapAbyssDualHalves(abyssPlan, ABYSS_CYCLES[0]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(swapped.reliability).toEqual(abyssPlan.reliability);

      // 1. Missing reliability -> unsupported & non-actionable
      const missingReliabilityPlan = {
        ...abyssPlan,
        reliability: undefined as unknown as RecommendationReliability,
        allPairs: abyssPlan.allPairs?.map((p) => ({
          ...p,
          reliability: undefined as unknown as RecommendationReliability,
        })),
      };
      const swappedMissing = swapAbyssDualHalves(missingReliabilityPlan, ABYSS_CYCLES[0]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(swappedMissing.reliability.status).toBe('unsupported');
      expect(swappedMissing.reliability.isActionable).toBe(false);
      expect(swappedMissing.reliability.verification).toBe('unregistered');
      expect(swappedMissing.reliability.provenanceIds).toEqual([]);
      for (const pair of swappedMissing.allPairs ?? []) {
        expect(pair.reliability.status).toBe('unsupported');
        expect(pair.reliability.isActionable).toBe(false);
      }

      // 2. Malformed/incomplete reliability -> unsupported & non-actionable
      const malformedReliabilityPlan = {
        ...abyssPlan,
        reliability: { status: 'reliable' } as unknown as RecommendationReliability,
      };
      const swappedMalformed = swapAbyssDualHalves(malformedReliabilityPlan, ABYSS_CYCLES[0]);
      expect(swappedMalformed.reliability.status).toBe('unsupported');
      expect(swappedMalformed.reliability.isActionable).toBe(false);

      // 3. Structurally plausible but semantically inconsistent envelopes -> unsupported & non-actionable
      const contradictoryEnvelopes: RecommendationReliability[] = [
        // Sandbox + unregistered claiming reliable & actionable
        {
          status: 'reliable',
          mode: 'sandbox_simulation',
          isActionable: true,
          verification: 'unregistered',
          temporalState: 'not_applicable',
          provenanceIds: ['custom-sandbox'],
          dependencies: [
            {
              datasetId: 'custom-sandbox',
              required: true,
              verification: 'unregistered',
              policy: 'sandbox',
              riskTier: 'high',
            },
          ],
          warnings: [],
        },
        // Expired schedule claiming reliable & actionable
        {
          status: 'reliable',
          mode: 'current',
          isActionable: true,
          verification: 'verified',
          temporalState: 'expired',
          provenanceIds: ['cycle-5-3'],
          dependencies: [
            {
              datasetId: 'cycle-5-3',
              required: true,
              verification: 'verified',
              policy: 'schedule_window',
              riskTier: 'high',
            },
          ],
          warnings: [],
        },
        // Reliable with zero provenanceIds
        {
          status: 'reliable',
          mode: 'current',
          isActionable: true,
          verification: 'verified',
          temporalState: 'active',
          provenanceIds: [],
          dependencies: [
            {
              datasetId: 'cycle-7-2',
              required: true,
              verification: 'verified',
              policy: 'schedule_window',
              riskTier: 'high',
            },
          ],
          warnings: [],
        },
        // Unsupported claiming actionable
        {
          status: 'unsupported',
          mode: 'current',
          isActionable: true,
          verification: 'unregistered',
          temporalState: 'not_applicable',
          provenanceIds: [],
          dependencies: [],
          warnings: [],
        },
        // Missing required dependency provenance (inconsistent envelope)
        {
          status: 'reliable',
          mode: 'current',
          isActionable: true,
          verification: 'verified',
          temporalState: 'active',
          provenanceIds: ['cycle-7-2'],
          dependencies: [
            {
              datasetId: 'cycle-7-2',
              required: true,
              verification: 'verified',
              policy: 'schedule_window',
              riskTier: 'high',
            },
            {
              datasetId: 'characters_v7_2_batch7',
              required: true,
              verification: 'verified',
              policy: 'version_bound',
              riskTier: 'high',
            },
          ],
          warnings: [],
        },
        // Duplicate dependency IDs
        {
          status: 'reliable',
          mode: 'current',
          isActionable: true,
          verification: 'verified',
          temporalState: 'active',
          provenanceIds: ['cycle-7-2'],
          dependencies: [
            {
              datasetId: 'cycle-7-2',
              required: true,
              verification: 'verified',
              policy: 'schedule_window',
              riskTier: 'high',
            },
            {
              datasetId: 'cycle-7-2',
              required: true,
              verification: 'verified',
              policy: 'schedule_window',
              riskTier: 'high',
            },
          ],
          warnings: [],
        },
        // Empty dependencies on a reliable envelope
        {
          status: 'reliable',
          mode: 'current',
          isActionable: true,
          verification: 'verified',
          temporalState: 'active',
          provenanceIds: ['cycle-7-2'],
          dependencies: [],
          warnings: [],
        },
      ];

      for (const badEnvelope of contradictoryEnvelopes) {
        const swappedContradictory = swapAbyssDualHalves(
          { ...abyssPlan, reliability: badEnvelope },
          ABYSS_CYCLES[0],
        );
        expect(swappedContradictory.reliability.status).toBe('unsupported');
        expect(swappedContradictory.reliability.isActionable).toBe(false);
        expect(swappedContradictory.reliability.verification).toBe('unregistered');
      }

      // 4. Missing dependencies property -> unsupported & non-actionable
      const missingDepsEnvelope = { ...abyssPlan.reliability };
      delete (missingDepsEnvelope as Record<string, unknown>).dependencies;
      const swappedMissingDeps = swapAbyssDualHalves(
        { ...abyssPlan, reliability: missingDepsEnvelope as unknown as RecommendationReliability },
        ABYSS_CYCLES[0],
      );
      expect(swappedMissingDeps.reliability.status).toBe('unsupported');
      expect(swappedMissingDeps.reliability.isActionable).toBe(false);

      // 5. Dependencies set to null -> unsupported & non-actionable
      const nullDepsEnvelope = {
        ...abyssPlan.reliability,
        dependencies: null as unknown as ReliabilityDependencyDetail[],
      };
      const swappedNullDeps = swapAbyssDualHalves(
        { ...abyssPlan, reliability: nullDepsEnvelope },
        ABYSS_CYCLES[0],
      );
      expect(swappedNullDeps.reliability.status).toBe('unsupported');
      expect(swappedNullDeps.reliability.isActionable).toBe(false);

      // 6. Valid reliable envelope -> preserved
      const validReliableEnvelope: RecommendationReliability = {
        status: 'reliable',
        mode: 'current',
        isActionable: true,
        verification: 'verified',
        temporalState: 'active',
        provenanceIds: ['characters_v7_2_batch7', 'cycle-7-2'],
        dependencies: [
          {
            datasetId: 'characters_v7_2_batch7',
            required: true,
            verification: 'verified',
            policy: 'version_bound',
            riskTier: 'high',
          },
          {
            datasetId: 'cycle-7-2',
            required: true,
            verification: 'verified',
            policy: 'schedule_window',
            riskTier: 'high',
          },
        ],
        warnings: [],
      };
      const swappedValidReliable = swapAbyssDualHalves(
        { ...abyssPlan, reliability: validReliableEnvelope },
        ABYSS_CYCLES[0],
      );
      expect(swappedValidReliable.reliability.status).toBe('reliable');
      expect(swappedValidReliable.reliability.isActionable).toBe(true);
      expect(swappedValidReliable.reliability).toEqual(validReliableEnvelope);

      // 7. Valid qualified envelope -> preserved
      const validQualifiedEnvelope: RecommendationReliability = {
        status: 'qualified',
        mode: 'current',
        isActionable: false,
        verification: 'provisional',
        temporalState: 'active',
        provenanceIds: ['characters_v7_2_batch7', 'cycle-7-2'],
        dependencies: [
          {
            datasetId: 'characters_v7_2_batch7',
            required: true,
            verification: 'verified',
            policy: 'version_bound',
            riskTier: 'high',
          },
          {
            datasetId: 'cycle-7-2',
            required: true,
            verification: 'provisional',
            policy: 'schedule_window',
            riskTier: 'high',
          },
        ],
        warnings: ['Provisional schedule window verification.'],
      };
      const swappedValidQualified = swapAbyssDualHalves(
        { ...abyssPlan, reliability: validQualifiedEnvelope },
        ABYSS_CYCLES[0],
      );
      expect(swappedValidQualified.reliability.status).toBe('qualified');
      expect(swappedValidQualified.reliability.isActionable).toBe(false);
      expect(swappedValidQualified.reliability).toEqual(validQualifiedEnvelope);

      // 8. Valid historical envelope -> preserved
      const validHistoricalEnvelope: RecommendationReliability = {
        status: 'historical',
        mode: 'archive_simulation',
        isActionable: false,
        verification: 'verified',
        temporalState: 'expired',
        provenanceIds: ['characters_v7_2_batch7', 'cycle-5-3'],
        dependencies: [
          {
            datasetId: 'characters_v7_2_batch7',
            required: true,
            verification: 'verified',
            policy: 'version_bound',
            riskTier: 'high',
          },
          {
            datasetId: 'cycle-5-3',
            required: true,
            verification: 'verified',
            policy: 'schedule_window',
            riskTier: 'high',
          },
        ],
        warnings: ['Historical simulation: cycle-5-3 expired.'],
      };
      const swappedValidHistorical = swapAbyssDualHalves(
        { ...abyssPlan, reliability: validHistoricalEnvelope },
        ABYSS_CYCLES[0],
      );
      expect(swappedValidHistorical.reliability.status).toBe('historical');
      expect(swappedValidHistorical.reliability.isActionable).toBe(false);
      expect(swappedValidHistorical.reliability).toEqual(validHistoricalEnvelope);

      // --- Targeted Phase 3 Semantic Review Test Cases ---

      // 9. Required unregistered dependency with qualified/provisional envelope is rejected -> unsupported & non-actionable
      const requiredUnregisteredEnvelope: RecommendationReliability = {
        status: 'qualified',
        mode: 'current',
        isActionable: false,
        verification: 'provisional',
        temporalState: 'active',
        provenanceIds: ['cycle-7-2'],
        dependencies: [
          {
            datasetId: 'cycle-7-2',
            required: true,
            verification: 'provisional',
            policy: 'schedule_window',
            riskTier: 'high',
          },
          {
            datasetId: 'unregistered_char_dataset',
            required: true,
            verification: 'unregistered',
            policy: 'version_bound',
            riskTier: 'high',
          },
        ],
        warnings: ['Required dataset is unregistered.'],
      };
      const swappedRequiredUnregistered = swapAbyssDualHalves(
        { ...abyssPlan, reliability: requiredUnregisteredEnvelope },
        ABYSS_CYCLES[0],
      );
      expect(swappedRequiredUnregistered.reliability.status).toBe('unsupported');
      expect(swappedRequiredUnregistered.reliability.isActionable).toBe(false);
      expect(swappedRequiredUnregistered.reliability.verification).toBe('unregistered');

      // 10. Required provisional dependency with top-level verified is rejected -> unsupported & non-actionable
      const requiredProvisionalWithVerifiedTopEnvelope: RecommendationReliability = {
        status: 'qualified',
        mode: 'current',
        isActionable: false,
        verification: 'verified', // Contradiction: top-level verified while a required dep is provisional
        temporalState: 'active',
        provenanceIds: ['characters_v7_2_batch7', 'cycle-7-2'],
        dependencies: [
          {
            datasetId: 'characters_v7_2_batch7',
            required: true,
            verification: 'verified',
            policy: 'version_bound',
            riskTier: 'high',
          },
          {
            datasetId: 'cycle-7-2',
            required: true,
            verification: 'provisional',
            policy: 'schedule_window',
            riskTier: 'high',
          },
        ],
        warnings: [],
      };
      const swappedRequiredProvisionalWithVerified = swapAbyssDualHalves(
        { ...abyssPlan, reliability: requiredProvisionalWithVerifiedTopEnvelope },
        ABYSS_CYCLES[0],
      );
      expect(swappedRequiredProvisionalWithVerified.reliability.status).toBe('unsupported');
      expect(swappedRequiredProvisionalWithVerified.reliability.isActionable).toBe(false);
      expect(swappedRequiredProvisionalWithVerified.reliability.verification).toBe('unregistered');

      // 11. Required stale dependency with top-level verified is rejected -> unsupported & non-actionable
      const requiredStaleWithVerifiedTopEnvelope: RecommendationReliability = {
        status: 'qualified',
        mode: 'current',
        isActionable: false,
        verification: 'verified', // Contradiction: top-level verified while a required dep is stale
        temporalState: 'active',
        provenanceIds: ['characters_v7_2_batch7', 'cycle-7-2'],
        dependencies: [
          {
            datasetId: 'characters_v7_2_batch7',
            required: true,
            verification: 'verified',
            policy: 'version_bound',
            riskTier: 'high',
          },
          {
            datasetId: 'cycle-7-2',
            required: true,
            verification: 'stale',
            policy: 'schedule_window',
            riskTier: 'low',
          },
        ],
        warnings: [],
      };
      const swappedRequiredStaleWithVerified = swapAbyssDualHalves(
        { ...abyssPlan, reliability: requiredStaleWithVerifiedTopEnvelope },
        ABYSS_CYCLES[0],
      );
      expect(swappedRequiredStaleWithVerified.reliability.status).toBe('unsupported');
      expect(swappedRequiredStaleWithVerified.reliability.isActionable).toBe(false);
      expect(swappedRequiredStaleWithVerified.reliability.verification).toBe('unregistered');

      // 12. Optional unregistered dependency with otherwise valid required dependencies is preserved
      const optionalUnregisteredEnvelope: RecommendationReliability = {
        status: 'reliable',
        mode: 'current',
        isActionable: true,
        verification: 'verified',
        temporalState: 'active',
        provenanceIds: ['characters_v7_2_batch7', 'cycle-7-2'],
        dependencies: [
          {
            datasetId: 'characters_v7_2_batch7',
            required: true,
            verification: 'verified',
            policy: 'version_bound',
            riskTier: 'high',
          },
          {
            datasetId: 'cycle-7-2',
            required: true,
            verification: 'verified',
            policy: 'schedule_window',
            riskTier: 'high',
          },
          {
            datasetId: 'optional_unregistered_sandbox',
            required: false,
            verification: 'unregistered',
            policy: 'sandbox',
            riskTier: 'low',
          },
        ],
        warnings: ['Optional dataset "optional_unregistered_sandbox" is unregistered.'],
      };
      const swappedOptionalUnregistered = swapAbyssDualHalves(
        { ...abyssPlan, reliability: optionalUnregisteredEnvelope },
        ABYSS_CYCLES[0],
      );
      expect(swappedOptionalUnregistered.reliability.status).toBe('reliable');
      expect(swappedOptionalUnregistered.reliability.isActionable).toBe(true);
      expect(swappedOptionalUnregistered.reliability.verification).toBe('verified');
      expect(swappedOptionalUnregistered.reliability).toEqual(optionalUnregisteredEnvelope);

      // 13. Mixed required stale and provisional dependencies aggregate to stale; envelope claiming provisional is rejected
      const mixedStaleProvisionalClaimingProvisionalEnvelope: RecommendationReliability = {
        status: 'qualified',
        mode: 'current',
        isActionable: false,
        verification: 'provisional', // Contradiction: Phase 2 aggregate precedence mandates 'stale'
        temporalState: 'active',
        provenanceIds: ['characters_v7_2_batch7', 'cycle-7-2'],
        dependencies: [
          {
            datasetId: 'characters_v7_2_batch7',
            required: true,
            verification: 'provisional',
            policy: 'version_bound',
            riskTier: 'high',
          },
          {
            datasetId: 'cycle-7-2',
            required: true,
            verification: 'stale',
            policy: 'schedule_window',
            riskTier: 'low',
          },
        ],
        warnings: [],
      };
      const swappedMixedClaimingProvisional = swapAbyssDualHalves(
        { ...abyssPlan, reliability: mixedStaleProvisionalClaimingProvisionalEnvelope },
        ABYSS_CYCLES[0],
      );
      expect(swappedMixedClaimingProvisional.reliability.status).toBe('unsupported');
      expect(swappedMixedClaimingProvisional.reliability.isActionable).toBe(false);
      expect(swappedMixedClaimingProvisional.reliability.verification).toBe('unregistered');

      // 14. Positive mixed-dependency case confirming the correct stale aggregate is preserved
      const validMixedStaleProvisionalEnvelope: RecommendationReliability = {
        status: 'qualified',
        mode: 'current',
        isActionable: false,
        verification: 'stale', // Correct Phase 2 aggregate
        temporalState: 'active',
        provenanceIds: ['characters_v7_2_batch7', 'cycle-7-2'],
        dependencies: [
          {
            datasetId: 'characters_v7_2_batch7',
            required: true,
            verification: 'provisional',
            policy: 'version_bound',
            riskTier: 'high',
          },
          {
            datasetId: 'cycle-7-2',
            required: true,
            verification: 'stale',
            policy: 'schedule_window',
            riskTier: 'low',
          },
        ],
        warnings: ['Stale schedule dependency.'],
      };
      const swappedValidMixedStale = swapAbyssDualHalves(
        { ...abyssPlan, reliability: validMixedStaleProvisionalEnvelope },
        ABYSS_CYCLES[0],
      );
      expect(swappedValidMixedStale.reliability.status).toBe('qualified');
      expect(swappedValidMixedStale.reliability.isActionable).toBe(false);
      expect(swappedValidMixedStale.reliability.verification).toBe('stale');
      expect(swappedValidMixedStale.reliability).toEqual(validMixedStaleProvisionalEnvelope);

      // estimateBuildFromSliders -> internal computation (1 evaluation)
      spy.mockClear();
      estimateBuildFromSliders('Hu Tao', 70, 160, 120, false, undefined, undefined, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(spy).toHaveBeenCalledTimes(1);

      // autoDraftTheaterSchedule -> internal season analysis (1 evaluation)
      spy.mockClear();
      const activeSeason = THEATER_SEASONS[0];
      const eligible = filterEligibleTheaterRoster(baseRoster, activeSeason).eligible;
      autoDraftTheaterSchedule(eligible, 'Normal', activeSeason, undefined, undefined, {
        evaluatedAt: ACTIVE_DATE,
      });
      expect(spy).toHaveBeenCalledTimes(1);

      // Excluded calculateArtifactStopPoint invokes 0 reliability evaluations across all CV branches
      spy.mockClear();
      const stopHighCv = calculateArtifactStopPoint('Hu Tao', 75, 180);
      const stopMidCv = calculateArtifactStopPoint('Hu Tao', 60, 80); // cv = 200 (delegates to internal helper)
      const stopLowCv = calculateArtifactStopPoint('Hu Tao', 40, 60);
      expect(spy).toHaveBeenCalledTimes(0);
      expect('reliability' in stopHighCv).toBe(false);
      expect('reliability' in stopMidCv).toBe(false);
      expect('reliability' in stopLowCv).toBe(false);

      // Deprecated evaluatePullRecommendations invokes 0 reliability evaluations
      const legacyPull = evaluatePullRecommendations(['Furina']);
      expect(spy).toHaveBeenCalledTimes(0);
      expect(Array.isArray(legacyPull)).toBe(true);
      expect('reliability' in legacyPull).toBe(false);
    });
  });
});
