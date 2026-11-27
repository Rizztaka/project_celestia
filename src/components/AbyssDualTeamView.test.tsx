import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { AbyssDualTeamPlan, OwnedCharacterProfile } from '../types/genshin';

type HookRunner = {
  useState: <T>(initial: T | (() => T)) => [T, (next: T | ((prev: T) => T)) => void];
  useReducer: <S, A, I = S>(
    reducer: (state: S, action: A) => S,
    initialArg: I,
    init?: (arg: I) => S,
  ) => [S, (action: A) => void];
  useEffect: (effect: () => void | (() => void), deps?: readonly unknown[]) => void;
  useMemo: <T>(factory: () => T, deps?: readonly unknown[]) => T;
  useRef: <T>(initial: T) => { current: T };
  useTransition: () => [boolean, (callback: () => void) => void];
  useId: () => string;
  useCallback: <T extends (...args: never[]) => unknown>(fn: T, deps?: readonly unknown[]) => T;
};

let activeHookRunner: HookRunner | null = null;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  const hooks = {
    useState: (<T,>(initial: T | (() => T)) =>
      activeHookRunner ? activeHookRunner.useState(initial) : actual.useState(initial)) as typeof actual.useState,
    useReducer: (<S, A, I = S>(
      reducer: (state: S, action: A) => S,
      initialArg: I,
      init?: (arg: I) => S,
    ) =>
      activeHookRunner
        ? activeHookRunner.useReducer(reducer, initialArg, init)
        : actual.useReducer(
            reducer as never,
            initialArg as never,
            init as never,
          )) as typeof actual.useReducer,
    useEffect: ((effect: () => void | (() => void), deps?: readonly unknown[]) => {
      if (activeHookRunner) {
        activeHookRunner.useEffect(effect, deps);
        return;
      }
      actual.useEffect(effect, deps);
    }) as typeof actual.useEffect,
    useMemo: (<T,>(factory: () => T, deps?: readonly unknown[]) =>
      activeHookRunner ? activeHookRunner.useMemo(factory, deps) : actual.useMemo(factory, deps as never)) as typeof actual.useMemo,
    useRef: (<T,>(initial: T) =>
      activeHookRunner ? activeHookRunner.useRef(initial) : actual.useRef(initial)) as typeof actual.useRef,
    useTransition: (() =>
      activeHookRunner ? activeHookRunner.useTransition() : actual.useTransition()) as typeof actual.useTransition,
    useId: (() =>
      activeHookRunner ? activeHookRunner.useId() : actual.useId()) as typeof actual.useId,
    useCallback: (<T extends (...args: never[]) => unknown>(fn: T, deps?: readonly unknown[]) =>
      activeHookRunner ? activeHookRunner.useCallback(fn, deps) : actual.useCallback(fn, deps as never)) as typeof actual.useCallback,
  };
  const actualDefault = (actual as { default?: Record<string, unknown> }).default;
  return {
    ...actual,
    ...hooks,
    default: {
      ...(actualDefault ?? actual),
      ...hooks,
    },
  };
});

vi.mock('../services/solver-dispatcher', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/solver-dispatcher')>();
  return {
    ...actual,
    dispatchSolveAbyss: vi.fn(actual.dispatchSolveAbyss),
  };
});

let swapHalvesOverride:
  | ((
      plan: AbyssDualTeamPlan,
      cycle?: import('../data/abyss-schedules').AbyssCycleConfig,
    ) => AbyssDualTeamPlan)
  | null = null;

vi.mock('../engines/abyss-solver', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../engines/abyss-solver')>();
  return {
    ...actual,
    swapAbyssDualHalves: (
      plan: AbyssDualTeamPlan,
      cycle?: import('../data/abyss-schedules').AbyssCycleConfig,
    ) => (swapHalvesOverride ? swapHalvesOverride(plan, cycle) : actual.swapAbyssDualHalves(plan, cycle)),
  };
});

import * as React from 'react';
import * as solverDispatcher from '../services/solver-dispatcher';
import * as abyssSolver from '../engines/abyss-solver';
import { ABYSS_CYCLES, createCustomSandboxCycle } from '../data/abyss-schedules';
import { formatReliabilityPresentation } from '../services/reliability-presentation';
import { RecommendationReliabilityBadge } from './RecommendationReliabilityBadge';
import { RecommendationReliabilityBanner } from './RecommendationReliabilityBanner';
import { ReliabilityDetailsPanel } from './ReliabilityDetailsPanel';
import {
  AbyssDualTeamView,
  AbyssReliabilitySection,
  AbyssTeamPlanResults,
  abyssDualTeamReducer,
  buildAbyssSolveInputKey,
  createAbyssSwapHandlers,
  deriveAbyssDualViewState,
  initialAbyssDualTeamState,
  startAbyssSolveRequest,
  type AbyssDualTeamAction,
  type AbyssDualTeamState,
} from './AbyssDualTeamView';

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/<!--\s*-->/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function extractElementInnerHtmlByAttr(html: string, attrPattern: RegExp): string[] {
  const results: string[] = [];
  const openTagRe = /<([a-zA-Z0-9-]+)([^>]*)>/g;
  let match: RegExpExecArray | null;

  while ((match = openTagRe.exec(html)) !== null) {
    const tagName = match[1];
    const attrs = match[2];
    if (!attrPattern.test(attrs)) continue;

    let depth = 1;
    const contentStart = openTagRe.lastIndex;
    const tagRe = new RegExp(`<(\\/)?${tagName}\\b([^>]*)>`, 'g');
    tagRe.lastIndex = contentStart;

    let innerMatch: RegExpExecArray | null;
    while ((innerMatch = tagRe.exec(html)) !== null) {
      const isClosing = Boolean(innerMatch[1]);
      const isSelfClosing = innerMatch[2].trimEnd().endsWith('/');
      if (isClosing) {
        depth -= 1;
        if (depth === 0) {
          results.push(html.slice(contentStart, innerMatch.index));
          break;
        }
      } else if (!isSelfClosing) {
        depth += 1;
      }
    }
  }

  return results;
}

function hasNestedButtons(html: string): boolean {
  const tokenRe = /<(\/)?button\b[^>]*>/g;
  let depth = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(html)) !== null) {
    if (match[1]) {
      depth -= 1;
    } else {
      depth += 1;
      if (depth > 1) return true;
    }
  }
  return false;
}

function extractReliabilityAriaControls(html: string): string[] {
  const ids: string[] = [];
  const re = /aria-controls="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    if (!match[1].startsWith('abyss-rotation-')) {
      ids.push(match[1]);
    }
  }
  return ids;
}

function assertAbyssAccessibilityInvariants(html: string, expectedTriggerCount: number): string | undefined {
  expect(hasNestedButtons(html)).toBe(false);

  const statusRegions = extractElementInnerHtmlByAttr(html, /\brole="status"/);
  for (const content of statusRegions) {
    expect(content).not.toMatch(/<button\b/i);
  }
  const alertRegions = extractElementInnerHtmlByAttr(html, /\brole="alert"/);
  for (const content of alertRegions) {
    expect(content).not.toMatch(/<button\b/i);
  }

  const controlledIds = extractReliabilityAriaControls(html);
  expect(controlledIds).toHaveLength(expectedTriggerCount);
  for (const id of controlledIds) {
    expect(id).toBe(controlledIds[0]);
    expect(html).toContain(`id="${id}"`);
  }
  return controlledIds[0];
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

const sampleRoster = [
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
];

const cycle72 = ABYSS_CYCLES.find((c) => c.id === 'cycle-7-2')!;
const cycle53 = ABYSS_CYCLES.find((c) => c.id === 'cycle-5-3')!;

describe('AbyssDualTeamView Component (M9 Phase 4 — Slice 4.2)', () => {
  afterEach(() => {
    activeHookRunner = null;
    swapHalvesOverride = null;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('1. Initial SSR loading & multi-state reliability presentation', () => {
    it('renders loading reliability indicator, persistent cycle selector, disabled Swap Halves, and no legacy freshness badges on initial SSR', () => {
      const html = renderToString(<AbyssDualTeamView ownedIds={[]} />);
      const decoded = decodeHtmlEntities(html);

      expect(decoded).toContain('Spiral Abyss Floor 12 Deployment');
      expect(decoded).toContain('Evaluating Reliability…');
      expect(decoded).toContain('Calculating optimal Spiral Abyss Floor 12 dual-half teams…');
      expect(decoded).toContain('id="abyss-cycle-select"');
      expect(decoded).toMatch(/<button[^>]*disabled=""[^>]*>.*Swap Halves/s);
      expect(decoded).not.toContain('Data Freshness Status:');
      expect(decoded).not.toContain('Outdated Spiral Abyss Data');
      assertAbyssAccessibilityInvariants(html, 0);
    });

    it('renders Reliable, Historical, Sandbox, Qualified Stale, and Unsupported states with synchronized ARIA controls', () => {
      const reliablePlan = abyssSolver.solveAbyssDualTeams(sampleRoster, undefined, cycle72, {
        evaluatedAt: '2026-11-23',
      });
      const reliableModel = formatReliabilityPresentation(reliablePlan.reliability);
      const reliablePanelId = 'abyss-reliable-panel';

      const reliableHtml = renderToString(
        <div>
          <RecommendationReliabilityBadge
            reliability={reliablePlan.reliability}
            size="sm"
            detailsControlsId={reliablePanelId}
            isDetailsOpen={false}
            onToggleDetails={() => {}}
          />
          <AbyssReliabilitySection
            reliability={reliablePlan.reliability}
            detailsControlsId={reliablePanelId}
            isDetailsOpen={false}
            onToggleDetails={() => {}}
            onCloseDetails={() => {}}
          />
        </div>,
      );
      const decodedReliable = decodeHtmlEntities(reliableHtml);
      expect(decodedReliable).toContain(reliableModel.badgeLabel);
      expect(decodedReliable).toContain(reliableModel.actionabilityLabel);
      expect(decodedReliable).not.toContain('data-reliability-container=');
      assertAbyssAccessibilityInvariants(reliableHtml, 1);
      const closedTag = reliableHtml.match(new RegExp(`<div[^>]*id="${reliablePanelId}"[^>]*>`))?.[0];
      expect(closedTag).toContain('hidden=""');
      expect(closedTag).toContain('aria-hidden="true"');

      // Open state checks 5 axes + Evaluated UTC
      const openReliableHtml = renderToString(
        <div>
          <RecommendationReliabilityBadge
            reliability={reliablePlan.reliability}
            size="sm"
            detailsControlsId={reliablePanelId}
            isDetailsOpen={true}
            onToggleDetails={() => {}}
          />
          <AbyssReliabilitySection
            reliability={reliablePlan.reliability}
            detailsControlsId={reliablePanelId}
            isDetailsOpen={true}
            onToggleDetails={() => {}}
            onCloseDetails={() => {}}
          />
        </div>,
      );
      const decodedOpen = decodeHtmlEntities(openReliableHtml);
      assertAbyssAccessibilityInvariants(openReliableHtml, 1);
      expect(decodedOpen).toContain('Spiral Abyss Floor 12 — Reliability Details');
      expect(decodedOpen).toContain('Evaluated UTC: 2026-11-23');
      expect(decodedOpen).toContain('cycle-7-2');

      // Historical (cycle-5-3)
      const historicalPlan = abyssSolver.solveAbyssDualTeams(sampleRoster, undefined, cycle53, {
        evaluatedAt: '2026-11-23',
      });
      const historicalHtml = renderToString(
        <div>
          <RecommendationReliabilityBadge
            reliability={historicalPlan.reliability}
            size="sm"
            detailsControlsId="abyss-historical-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
          />
          <AbyssReliabilitySection
            reliability={historicalPlan.reliability}
            detailsControlsId="abyss-historical-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
            onCloseDetails={() => {}}
          />
        </div>,
      );
      const decodedHist = decodeHtmlEntities(historicalHtml);
      expect(decodedHist).toContain('Historical');
      expect(decodedHist).toContain('data-reliability-container="context"');
      expect(decodedHist).toContain('aria-label="Spiral Abyss Floor 12 reliability context"');
      assertAbyssAccessibilityInvariants(historicalHtml, 2);

      // Sandbox (custom-sandbox)
      const sandboxCycle = createCustomSandboxCycle();
      const sandboxPlan = abyssSolver.solveAbyssDualTeams(sampleRoster, undefined, sandboxCycle, {
        evaluatedAt: '2026-11-23',
      });
      const sandboxHtml = renderToString(
        <div>
          <RecommendationReliabilityBadge
            reliability={sandboxPlan.reliability}
            size="sm"
            detailsControlsId="abyss-sandbox-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
          />
          <AbyssReliabilitySection
            reliability={sandboxPlan.reliability}
            detailsControlsId="abyss-sandbox-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
            onCloseDetails={() => {}}
          />
        </div>,
      );
      const decodedSandbox = decodeHtmlEntities(sandboxHtml);
      expect(decodedSandbox).toContain('Sandbox');
      expect(decodedSandbox).toContain('Not Live-Actionable · Simulation');
      expect(decodedSandbox).toContain('data-reliability-container="context"');
      assertAbyssAccessibilityInvariants(sandboxHtml, 2);

      // Qualified Stale Dependency (status banner)
      const staleQualifiedReliability = {
        ...reliablePlan.reliability,
        status: 'qualified' as const,
        verification: 'stale' as const,
        dependencies: reliablePlan.reliability.dependencies?.map((d) =>
          d.datasetId === 'rotations_v7_2_catalog'
            ? { ...d, verification: 'stale' as const, reason: 'age_exceeded' }
            : d,
        ),
        warnings: ['Required dataset "rotations_v7_2_catalog" exceeded 42-day review cadence.'],
      };
      const staleHtml = renderToString(
        <div>
          <RecommendationReliabilityBadge
            reliability={staleQualifiedReliability}
            size="sm"
            detailsControlsId="abyss-stale-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
          />
          <AbyssReliabilitySection
            reliability={staleQualifiedReliability}
            detailsControlsId="abyss-stale-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
            onCloseDetails={() => {}}
          />
        </div>,
      );
      const decodedStale = decodeHtmlEntities(staleHtml);
      expect(decodedStale).toContain('Qualified · Stale Dependency');
      expect(decodedStale).toContain('data-reliability-container="status"');
      assertAbyssAccessibilityInvariants(staleHtml, 2);

      // Unsupported (unknown cycle)
      const unknownCycle = { ...cycle72, id: 'cycle-9-9', isCustom: false };
      const unsupportedPlan = abyssSolver.solveAbyssDualTeams(sampleRoster, undefined, unknownCycle, {
        evaluatedAt: '2026-11-23',
      });
      const unsupportedHtml = renderToString(
        <div>
          <RecommendationReliabilityBadge
            reliability={unsupportedPlan.reliability}
            size="sm"
            detailsControlsId="abyss-unsupported-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
          />
          <AbyssReliabilitySection
            reliability={unsupportedPlan.reliability}
            detailsControlsId="abyss-unsupported-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
            onCloseDetails={() => {}}
          />
        </div>,
      );
      const decodedUnsupported = decodeHtmlEntities(unsupportedHtml);
      expect(decodedUnsupported).toContain('Unsupported');
      expect(decodedUnsupported).toContain('Blocked · Not Live-Actionable');
      expect(decodedUnsupported).toContain('data-reliability-container="alert"');
      assertAbyssAccessibilityInvariants(unsupportedHtml, 2);
    });
  });

  describe('2. Floor 12 pairing, Swap Halves & unsupported swap recovery', () => {
    it('evaluates all 4 swapIntroducedUnsupported boundary cases accurately', () => {
      const validPlan = abyssSolver.solveAbyssDualTeams(sampleRoster, undefined, cycle72, {
        evaluatedAt: '2026-11-23',
      });
      const unsupportedEnvelope = {
        ...validPlan.reliability,
        status: 'unsupported' as const,
        isActionable: false,
        verification: 'unregistered' as const,
        warnings: ['Corrupted swap envelope'],
      };

      // Case 1: valid pre-swap -> swapped unsupported => true, team cards suppressed
      const case1 = deriveAbyssDualViewState(
        { basePlan: validPlan, isSwapped: true, selectedPairIndex: 0 },
        cycle72,
        () => ({
          ...validPlan,
          allPairs: undefined,
          reliability: unsupportedEnvelope,
        }),
      );
      expect(case1.swapIntroducedUnsupported).toBe(true);
      expect(case1.shouldShowTeamCards).toBe(false);

      // Case 2: pre-swap already unsupported -> swapped unsupported => false
      const alreadyUnsupportedPlan: AbyssDualTeamPlan = {
        ...validPlan,
        allPairs: undefined,
        reliability: unsupportedEnvelope,
      };
      const case2 = deriveAbyssDualViewState(
        { basePlan: alreadyUnsupportedPlan, isSwapped: true, selectedPairIndex: 0 },
        cycle72,
        () => ({ ...alreadyUnsupportedPlan }),
      );
      expect(case2.swapIntroducedUnsupported).toBe(false);
      expect(case2.shouldShowTeamCards).toBe(true);

      // Case 3: missing preSwapPair (basePlan == null) => false
      const case3 = deriveAbyssDualViewState(
        { basePlan: null, isSwapped: true, selectedPairIndex: 0 },
        cycle72,
      );
      expect(case3.preSwapPair).toBeNull();
      expect(case3.swapIntroducedUnsupported).toBe(false);
      expect(case3.shouldShowTeamCards).toBe(false);

      // Case 4: valid pre-swap -> supported swap => false, team cards shown
      const case4 = deriveAbyssDualViewState(
        { basePlan: validPlan, isSwapped: true, selectedPairIndex: 0 },
        cycle72,
      );
      expect(case4.swapIntroducedUnsupported).toBe(false);
      expect(case4.shouldShowTeamCards).toBe(true);
      expect(case4.plan?.reliability).toEqual(validPlan.reliability);
    });

    it('Reset Swap restoration (State-Controller Integration Test + SSR renderToString verification)', () => {
      const basePlan = abyssSolver.solveAbyssDualTeams(sampleRoster, undefined, cycle72, {
        evaluatedAt: '2026-11-23',
      });
      const origFirstHalf = basePlan.firstHalfTeam;
      const origSecondHalf = basePlan.secondHalfTeam;
      const origOverallScore = basePlan.overallScore;
      const origMechanicScore = basePlan.mechanicCoverageScore;
      const origReliability = { ...basePlan.reliability };

      let state: AbyssDualTeamState = initialAbyssDualTeamState;
      const dispatch = (action: AbyssDualTeamAction) => {
        state = abyssDualTeamReducer(state, action);
      };
      const handlers = createAbyssSwapHandlers(dispatch);

      // 1. Solve succeeded with valid pre-swap plan
      dispatch({
        type: 'SOLVE_SUCCEEDED',
        plan: basePlan,
        cycleId: cycle72.id,
        inputKey: buildAbyssSolveInputKey({ ownedIds: sampleRoster, activeCycle: cycle72, evaluatedAt: '2026-11-23' }),
      });

      const initialDerived = deriveAbyssDualViewState(state, cycle72);
      expect(initialDerived.swapIntroducedUnsupported).toBe(false);
      expect(initialDerived.shouldShowTeamCards).toBe(true);

      const initialSsrHtml = renderToString(
        <div>
          <AbyssReliabilitySection
            reliability={initialDerived.plan?.reliability}
            detailsControlsId="abyss-reset-swap-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
            onCloseDetails={() => {}}
            swapIntroducedUnsupported={initialDerived.swapIntroducedUnsupported}
            onResetSwap={handlers.onResetSwap}
          />
          {initialDerived.shouldShowTeamCards && initialDerived.plan && (
            <AbyssTeamPlanResults
              plan={initialDerived.plan}
              activeCycle={cycle72}
              isSwapped={state.isSwapped}
            />
          )}
        </div>,
      );
      const decodedInitial = decodeHtmlEntities(initialSsrHtml);
      expect(decodedInitial).not.toContain('Reset Swap');
      expect(decodedInitial).toContain(origFirstHalf.name);
      expect(decodedInitial).toContain(origSecondHalf.name);

      // 2. Toggle swap with controlled spy returning an unsupported swapped plan & corrupted team markers
      const corruptedSwappedPlan: AbyssDualTeamPlan = {
        ...basePlan,
        allPairs: undefined,
        firstHalfTeam: { ...basePlan.secondHalfTeam, name: 'CORRUPTED_SWAPPED_FIRST' },
        secondHalfTeam: { ...basePlan.firstHalfTeam, name: 'CORRUPTED_SWAPPED_SECOND' },
        overallScore: 0,
        mechanicCoverageScore: 0,
        reliability: {
          status: 'unsupported',
          mode: 'current',
          isActionable: false,
          verification: 'unregistered',
          temporalState: 'not_applicable',
          provenanceIds: [],
          warnings: ['Original Abyss plan is missing valid or semantically consistent reliability metadata.'],
          dependencies: [],
        },
      };
      const swapSpy = vi.fn(() => corruptedSwappedPlan);

      handlers.onToggleSwap();
      expect(state.isSwapped).toBe(true);
      expect(state.basePlan).toBe(basePlan);

      const swappedDerived = deriveAbyssDualViewState(state, cycle72, swapSpy);
      expect(swapSpy).toHaveBeenCalledTimes(1);
      expect(swappedDerived.swapIntroducedUnsupported).toBe(true);
      expect(swappedDerived.shouldShowTeamCards).toBe(false);

      // 3. Verify Reset Swap renders outside [role="alert"] and corrupted swapped cards are suppressed in SSR
      const swappedSsrHtml = renderToString(
        <div>
          <AbyssReliabilitySection
            reliability={swappedDerived.plan?.reliability}
            detailsControlsId="abyss-reset-swap-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
            onCloseDetails={() => {}}
            swapIntroducedUnsupported={swappedDerived.swapIntroducedUnsupported}
            onResetSwap={handlers.onResetSwap}
          />
          {swappedDerived.shouldShowTeamCards && swappedDerived.plan && (
            <AbyssTeamPlanResults
              plan={swappedDerived.plan}
              activeCycle={cycle72}
              isSwapped={state.isSwapped}
            />
          )}
        </div>,
      );
      const decodedSwapped = decodeHtmlEntities(swappedSsrHtml);
      expect(decodedSwapped).toContain('Reset Swap');
      expect(decodedSwapped).toContain('data-reliability-container="alert"');
      expect(decodedSwapped).not.toContain('CORRUPTED_SWAPPED_FIRST');
      expect(decodedSwapped).not.toContain('CORRUPTED_SWAPPED_SECOND');
      assertAbyssAccessibilityInvariants(swappedSsrHtml, 1);

      // 4. Invoke Reset Swap through the exact same createAbyssSwapHandlers + abyssDualTeamReducer
      handlers.onResetSwap();
      expect(state.isSwapped).toBe(false);

      // 5. Verify exact restoration of teams, scores, and full reliability envelope
      const restoredDerived = deriveAbyssDualViewState(state, cycle72, swapSpy);
      expect(restoredDerived.swapIntroducedUnsupported).toBe(false);
      expect(restoredDerived.shouldShowTeamCards).toBe(true);
      expect(restoredDerived.plan?.firstHalfTeam).toEqual(origFirstHalf);
      expect(restoredDerived.plan?.secondHalfTeam).toEqual(origSecondHalf);
      expect(restoredDerived.plan?.overallScore).toBe(origOverallScore);
      expect(restoredDerived.plan?.mechanicCoverageScore).toBe(origMechanicScore);
      expect(restoredDerived.plan?.reliability.status).toBe(origReliability.status);
      expect(restoredDerived.plan?.reliability.isActionable).toBe(origReliability.isActionable);
      expect(restoredDerived.plan?.reliability.verification).toBe(origReliability.verification);
      expect(restoredDerived.plan?.reliability.temporalState).toBe(origReliability.temporalState);
      expect(restoredDerived.plan?.reliability.provenanceIds).toEqual(origReliability.provenanceIds);
      expect(restoredDerived.plan?.reliability.evaluatedAt).toBe(origReliability.evaluatedAt);
      expect(restoredDerived.plan?.reliability.dependencies).toEqual(origReliability.dependencies);
      expect(restoredDerived.plan?.reliability.warnings).toEqual(origReliability.warnings);

      // 6. Verify restored SSR output omits Reset Swap and alert banner while showing original cards
      const restoredSsrHtml = renderToString(
        <div>
          <AbyssReliabilitySection
            reliability={restoredDerived.plan?.reliability}
            detailsControlsId="abyss-reset-swap-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
            onCloseDetails={() => {}}
            swapIntroducedUnsupported={restoredDerived.swapIntroducedUnsupported}
            onResetSwap={handlers.onResetSwap}
          />
          {restoredDerived.shouldShowTeamCards && restoredDerived.plan && (
            <AbyssTeamPlanResults
              plan={restoredDerived.plan}
              activeCycle={cycle72}
              isSwapped={state.isSwapped}
            />
          )}
        </div>,
      );
      const decodedRestored = decodeHtmlEntities(restoredSsrHtml);
      expect(decodedRestored).not.toContain('Reset Swap');
      expect(decodedRestored).not.toContain('data-reliability-container="alert"');
      expect(decodedRestored).toContain(origFirstHalf.name);
      expect(decodedRestored).toContain(origSecondHalf.name);
      expect(decodedRestored).not.toContain('CORRUPTED_SWAPPED_FIRST');
      expect(decodedRestored).not.toContain('CORRUPTED_SWAPPED_SECOND');
    });

    it('supports Floor 12 pairing selection, preserves reliability across healthy swaps, and resets swap/pair on cycle change', () => {
      const basePlan = abyssSolver.solveAbyssDualTeams(sampleRoster, undefined, cycle72, {
        evaluatedAt: '2026-11-23',
      });
      expect((basePlan.allPairs?.length ?? 0)).toBeGreaterThan(1);

      let state: AbyssDualTeamState = abyssDualTeamReducer(initialAbyssDualTeamState, {
        type: 'SOLVE_SUCCEEDED',
        plan: basePlan,
        cycleId: cycle72.id,
        inputKey: 'k1',
      });
      const dispatch = (action: AbyssDualTeamAction) => {
        state = abyssDualTeamReducer(state, action);
      };
      const handlers = createAbyssSwapHandlers(dispatch);

      handlers.onSelectPair(1);
      expect(state.selectedPairIndex).toBe(1);
      const pair1 = deriveAbyssDualViewState(state, cycle72);
      expect(pair1.plan?.firstHalfTeam).toEqual(basePlan.allPairs![1].firstHalfTeam);

      handlers.onToggleSwap();
      expect(state.isSwapped).toBe(true);
      const swappedPair1 = deriveAbyssDualViewState(state, cycle72);
      expect(swappedPair1.plan?.firstHalfTeam.members.map((m) => m.id)).toEqual(
        basePlan.allPairs![1].secondHalfTeam.members.map((m) => m.id),
      );
      expect(swappedPair1.plan?.reliability).toEqual(basePlan.reliability);

      dispatch({ type: 'SELECT_CYCLE', cycleId: cycle53.id });
      expect(state.isSwapped).toBe(false);
      expect(state.selectedPairIndex).toBe(0);
      expect(state.basePlan).toBeNull();
      expect(state.isSolving).toBe(true);
    });
  });

  describe('3. Async worker lifecycle, strict input-key matching & component integration', () => {
    function createLifecycleHarness() {
      let state: AbyssDualTeamState = initialAbyssDualTeamState;
      const actions: AbyssDualTeamAction[] = [];
      const requestIdRef = { current: 0 };
      const isMountedRef = { current: true };
      const dispatch = (action: AbyssDualTeamAction) => {
        actions.push(action);
        state = abyssDualTeamReducer(state, action);
      };
      return {
        getState: () => state,
        actions,
        requestIdRef,
        isMountedRef,
        dispatch,
      };
    }

    it('prevents stale responses and stale rejections from overwriting newer requests and guards unmount', async () => {
      const harness = createLifecycleHarness();
      const firstDeferred = createDeferred<AbyssDualTeamPlan>();
      const secondDeferred = createDeferred<AbyssDualTeamPlan>();
      const dispatcher = vi
        .fn()
        .mockReturnValueOnce(firstDeferred.promise)
        .mockReturnValueOnce(secondDeferred.promise);

      const cleanupFirst = startAbyssSolveRequest(
        { ownedIds: sampleRoster, activeCycle: cycle72, evaluatedAt: '2026-11-23' },
        {
          requestIdRef: harness.requestIdRef,
          isMountedRef: harness.isMountedRef,
          dispatch: harness.dispatch,
          dispatcher,
        },
      );
      cleanupFirst();

      const cleanupSecond = startAbyssSolveRequest(
        { ownedIds: sampleRoster, activeCycle: cycle53, evaluatedAt: '2026-11-23' },
        {
          requestIdRef: harness.requestIdRef,
          isMountedRef: harness.isMountedRef,
          dispatch: harness.dispatch,
          dispatcher,
        },
      );

      // Stale rejection while second request is in flight -> ignored
      firstDeferred.reject(new Error('Stale request failure'));
      await flushMicrotasks();
      expect(harness.getState().isSolving).toBe(true);
      expect(harness.getState().solverError).toBeNull();

      const newerPlan = abyssSolver.solveAbyssDualTeams(sampleRoster, undefined, cycle53, {
        evaluatedAt: '2026-11-23',
      });
      secondDeferred.resolve(newerPlan);
      await flushMicrotasks();
      expect(harness.getState().basePlan).toBe(newerPlan);
      expect(harness.getState().solvedCycleId).toBe(cycle53.id);

      // Unmount suppresses late resolution & rejection
      cleanupSecond();
      harness.isMountedRef.current = false;
      const thirdDeferred = createDeferred<AbyssDualTeamPlan>();
      dispatcher.mockReturnValueOnce(thirdDeferred.promise);

      const actionsBefore = harness.actions.length;
      const cleanupThird = startAbyssSolveRequest(
        { ownedIds: sampleRoster, activeCycle: cycle72, evaluatedAt: '2026-11-23' },
        {
          requestIdRef: harness.requestIdRef,
          isMountedRef: harness.isMountedRef,
          dispatch: harness.dispatch,
          dispatcher,
        },
      );
      cleanupThird();
      thirdDeferred.resolve(newerPlan);
      await flushMicrotasks();
      expect(harness.actions).toHaveLength(actionsBefore + 1); // only SOLVE_STARTED before cleanup
    });

    it('builds deterministic input keys distinguishing roster, profiles, cycle/sandbox edits, and evaluatedAt', () => {
      const baseProfiles: Record<string, OwnedCharacterProfile> = {
        Nefer: { id: 'Nefer', level: 90, constellation: 1 },
        Furina: { id: 'Furina', level: 90, constellation: 2 },
      };
      const baseKey = buildAbyssSolveInputKey({
        ownedIds: sampleRoster,
        profiles: baseProfiles,
        activeCycle: cycle72,
        evaluatedAt: '2026-11-23',
      });
      const equivalentKey = buildAbyssSolveInputKey({
        ownedIds: [...sampleRoster].reverse(),
        profiles: {
          Furina: { constellation: 2, id: 'Furina', level: 90, ascension: undefined },
          Nefer: { level: 90, constellation: 1, id: 'Nefer' },
        },
        activeCycle: { ...cycle72 },
        evaluatedAt: '2026-11-23',
      });
      expect(equivalentKey).toBe(baseKey);

      expect(
        buildAbyssSolveInputKey({
          ownedIds: [...sampleRoster, 'Zhongli'],
          profiles: baseProfiles,
          activeCycle: cycle72,
          evaluatedAt: '2026-11-23',
        }),
      ).not.toBe(baseKey);

      expect(
        buildAbyssSolveInputKey({
          ownedIds: sampleRoster,
          profiles: { ...baseProfiles, Nefer: { id: 'Nefer', level: 90, constellation: 2 } },
          activeCycle: cycle72,
          evaluatedAt: '2026-11-23',
        }),
      ).not.toBe(baseKey);

      const editedSandbox = createCustomSandboxCycle();
      editedSandbox.chambers[0].firstHalf.enemies[0].name = 'Edited Enemy';
      expect(
        buildAbyssSolveInputKey({
          ownedIds: sampleRoster,
          profiles: baseProfiles,
          activeCycle: editedSandbox,
          evaluatedAt: '2026-11-23',
        }),
      ).not.toBe(
        buildAbyssSolveInputKey({
          ownedIds: sampleRoster,
          profiles: baseProfiles,
          activeCycle: createCustomSandboxCycle(),
          evaluatedAt: '2026-11-23',
        }),
      );

      expect(
        buildAbyssSolveInputKey({
          ownedIds: sampleRoster,
          profiles: baseProfiles,
          activeCycle: cycle72,
          evaluatedAt: '2026-12-20',
        }),
      ).not.toBe(baseKey);
    });

    function depsChanged(prev: readonly unknown[] | undefined, next: readonly unknown[] | undefined): boolean {
      if (!prev || !next) return true;
      if (prev.length !== next.length) return true;
      for (let i = 0; i < prev.length; i++) {
        if (!Object.is(prev[i], next[i])) return true;
      }
      return false;
    }

    function mountAbyssDualTeam(initialProps: React.ComponentProps<typeof AbyssDualTeamView>) {
      vi.stubGlobal('HTMLElement', class {});
      vi.stubGlobal('document', {
        activeElement: null,
        body: { style: { overflow: '' } },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      vi.stubGlobal('window', {
        requestAnimationFrame: vi.fn(() => 1),
        cancelAnimationFrame: vi.fn(),
      });

      const slots: unknown[] = [];
      const effectCleanups = new Map<number, (() => void) | void>();
      const effectDeps = new Map<number, readonly unknown[] | undefined>();
      let pendingEffects: Array<{ slot: number; effect: () => void | (() => void); deps?: readonly unknown[] }> = [];
      let queuedEffects: Array<{ slot: number; effect: () => void | (() => void); deps?: readonly unknown[] }> = [];
      let hookIdx = 0;
      let idSeq = 0;
      let currentProps = initialProps;
      let currentTree: React.ReactElement | null = null;
      let isRendering = false;
      let dirty = false;
      let capturedDispatch: ((action: AbyssDualTeamAction) => void) | null = null;

      const runner: HookRunner = {
        useState: <T,>(initial: T | (() => T)) => {
          const idx = hookIdx++;
          if (!(idx in slots)) {
            slots[idx] = typeof initial === 'function' ? (initial as () => T)() : initial;
          }
          const setState = (next: T | ((prev: T) => T)) => {
            const prev = slots[idx] as T;
            const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
            if (!Object.is(prev, resolved)) {
              slots[idx] = resolved;
              dirty = true;
            }
          };
          return [slots[idx] as T, setState];
        },
        useReducer: <S, A, I = S>(
          reducer: (state: S, action: A) => S,
          initialArg: I,
          init?: (arg: I) => S,
        ) => {
          const idx = hookIdx++;
          if (!(idx in slots)) {
            slots[idx] = init ? init(initialArg) : (initialArg as unknown as S);
          }
          const dispatch = (action: A) => {
            const prev = slots[idx] as S;
            const next = reducer(prev, action);
            if (!Object.is(prev, next)) {
              slots[idx] = next;
              dirty = true;
            }
          };
          capturedDispatch = dispatch as unknown as (action: AbyssDualTeamAction) => void;
          return [slots[idx] as S, dispatch];
        },
        useEffect: (effect, deps) => {
          const idx = hookIdx++;
          const prevDeps = effectDeps.get(idx);
          if (!effectDeps.has(idx) || depsChanged(prevDeps, deps)) {
            pendingEffects.push({ slot: idx, effect, deps });
          }
        },
        useMemo: <T,>(factory: () => T, deps?: readonly unknown[]) => {
          const idx = hookIdx++;
          const existing = slots[idx] as { value: T; deps?: readonly unknown[] } | undefined;
          if (!existing || depsChanged(existing.deps, deps)) {
            const value = factory();
            slots[idx] = { value, deps };
            return value;
          }
          return existing.value;
        },
        useRef: <T,>(initial: T) => {
          const idx = hookIdx++;
          if (!(idx in slots)) {
            slots[idx] = { current: initial };
          }
          return slots[idx] as { current: T };
        },
        useTransition: () => [false, (cb) => cb()],
        useId: () => {
          const idx = hookIdx++;
          if (!(idx in slots)) {
            slots[idx] = `:r${idSeq++}:`;
          }
          return slots[idx] as string;
        },
        useCallback: (fn) => fn,
      };

      const renderWithoutEffects = (nextProps?: React.ComponentProps<typeof AbyssDualTeamView>) => {
        if (nextProps !== undefined) {
          currentProps = nextProps;
        }
        dirty = false;
        hookIdx = 0;
        pendingEffects = [];
        activeHookRunner = runner;
        try {
          currentTree = AbyssDualTeamView(currentProps) as React.ReactElement;
        } finally {
          activeHookRunner = null;
        }
        queuedEffects = pendingEffects;
        pendingEffects = [];
      };

      const flushEffects = () => {
        if (isRendering) return;
        isRendering = true;
        try {
          for (let pass = 0; pass < 10; pass++) {
            const effectsToRun = queuedEffects;
            queuedEffects = [];
            for (const item of effectsToRun) {
              const prevCleanup = effectCleanups.get(item.slot);
              if (typeof prevCleanup === 'function') prevCleanup();
              effectDeps.set(item.slot, item.deps);
              effectCleanups.set(item.slot, item.effect());
            }
            if (!dirty) break;
            renderWithoutEffects();
          }
        } finally {
          isRendering = false;
        }
      };

      const renderCycle = () => {
        renderWithoutEffects();
        flushEffects();
      };

      const EXPANDABLE_COMPONENTS = new Set<unknown>([
        AbyssReliabilitySection,
        AbyssTeamPlanResults,
        RecommendationReliabilityBadge,
        RecommendationReliabilityBanner,
        ReliabilityDetailsPanel,
      ]);

      const findElements = (
        node: unknown,
        predicate: (el: React.ReactElement<Record<string, unknown>>) => boolean,
        out: Array<React.ReactElement<Record<string, unknown>>> = [],
      ): Array<React.ReactElement<Record<string, unknown>>> => {
        if (!node || typeof node !== 'object') return out;
        if (Array.isArray(node)) {
          for (const child of node) findElements(child, predicate, out);
          return out;
        }
        if (!React.isValidElement(node)) return out;
        const el = node as React.ReactElement<Record<string, unknown>>;
        if (predicate(el)) {
          out.push(el);
        }
        if (EXPANDABLE_COMPONENTS.has(el.type) && typeof el.type === 'function') {
          const rendered = (el.type as (p: Record<string, unknown>) => unknown)(el.props);
          findElements(rendered, predicate, out);
        }
        if (el.props && 'children' in el.props) {
          findElements(el.props.children, predicate, out);
        }
        return out;
      };

      const getText = (node: unknown): string => {
        if (typeof node === 'string' || typeof node === 'number') return String(node);
        if (!node || typeof node !== 'object') return '';
        if (Array.isArray(node)) return node.map(getText).join('');
        if (!React.isValidElement(node)) return '';
        const el = node as React.ReactElement<Record<string, unknown>>;
        return getText(el.props?.children);
      };

      const triggerButtonClick = (
        matcher: (el: React.ReactElement<Record<string, unknown>>, text: string) => boolean,
      ) => {
        const matches = findElements(
          currentTree,
          (el) => el.type === 'button' && matcher(el, getText(el)),
        );
        expect(matches.length).toBeGreaterThan(0);
        const onClick = matches[0].props.onClick as (() => void) | undefined;
        expect(typeof onClick).toBe('function');
        onClick!();
      };

      renderCycle();

      return {
        toHtml: () => {
          activeHookRunner = null;
          return renderToString(currentTree!);
        },
        sync: async () => {
          await flushMicrotasks();
          renderCycle();
        },
        rerenderWithoutEffects: (nextProps: React.ComponentProps<typeof AbyssDualTeamView>) => {
          renderWithoutEffects(nextProps);
        },
        flushEffects,
        dispatchActionWithoutEffects: (action: AbyssDualTeamAction) => {
          expect(capturedDispatch).not.toBeNull();
          capturedDispatch!(action);
          renderWithoutEffects();
        },
        findElements,
        findButtons: (matcher: (el: React.ReactElement<Record<string, unknown>>, text: string) => boolean) =>
          findElements(
            currentTree,
            (el) => el.type === 'button' && matcher(el, getText(el)),
          ),
        clickButton: async (
          matcher: (el: React.ReactElement<Record<string, unknown>>, text: string) => boolean,
        ) => {
          triggerButtonClick(matcher);
          renderCycle();
          await flushMicrotasks();
          renderCycle();
        },
        changeSelect: async (id: string, value: string) => {
          const selects = findElements(currentTree, (el) => el.type === 'select' && el.props.id === id);
          expect(selects.length).toBeGreaterThan(0);
          const onChange = selects[0].props.onChange as ((e: { target: { value: string } }) => void) | undefined;
          expect(typeof onChange).toBe('function');
          onChange!({ target: { value } });
          renderCycle();
          await flushMicrotasks();
          renderCycle();
        },
        changeInputByAriaLabel: (ariaLabel: string, value: string) => {
          const inputs = findElements(
            currentTree,
            (el) => el.type === 'input' && el.props['aria-label'] === ariaLabel,
          );
          expect(inputs.length).toBeGreaterThan(0);
          const onChange = inputs[0].props.onChange as ((e: { target: { value: string } }) => void) | undefined;
          expect(typeof onChange).toBe('function');
          onChange!({ target: { value } });
          renderCycle();
        },
        unmount: () => {
          for (const cleanup of effectCleanups.values()) {
            if (typeof cleanup === 'function') cleanup();
          }
          effectCleanups.clear();
        },
      };
    }

    it('handles worker error alert + Retry recovery and supports exiting an unsupported swap via Reset Swap and Swapped Halves', async () => {
      const firstDeferred = createDeferred<AbyssDualTeamPlan>();
      const secondDeferred = createDeferred<AbyssDualTeamPlan>();
      const mockDispatch = vi.mocked(solverDispatcher.dispatchSolveAbyss);
      mockDispatch
        .mockReset()
        .mockReturnValueOnce(firstDeferred.promise)
        .mockReturnValueOnce(secondDeferred.promise);

      const mounted = mountAbyssDualTeam({
        ownedIds: sampleRoster,
        evaluatedAt: '2026-11-23',
      });

      // Reject first solve -> split role="alert" + Retry
      firstDeferred.reject(new Error('Abyss worker transport failed'));
      await mounted.sync();

      const errorHtml = mounted.toHtml();
      const decodedError = decodeHtmlEntities(errorHtml);
      expect(decodedError).toContain('Spiral Abyss Solver Error');
      expect(decodedError).toContain('Abyss worker transport failed');
      expect(decodedError).toContain('>Retry<');
      expect(decodedError).toContain('id="abyss-cycle-select"');
      assertAbyssAccessibilityInvariants(errorHtml, 0);

      // Click Retry -> clears error and starts 2nd request
      await mounted.clickButton((_, text) => text.trim() === 'Retry');
      expect(mockDispatch).toHaveBeenCalledTimes(2);
      expect(decodeHtmlEntities(mounted.toHtml())).toContain('Evaluating Reliability…');

      const healthyPlan = abyssSolver.solveAbyssDualTeams(sampleRoster, undefined, cycle72, {
        evaluatedAt: '2026-11-23',
      });
      secondDeferred.resolve(healthyPlan);
      await mounted.sync();

      const settledHtml = decodeHtmlEntities(mounted.toHtml());
      expect(settledHtml).toContain('Reliable');
      expect(settledHtml).toContain(healthyPlan.firstHalfTeam.name);

      // Simulate swap returning unsupported reliability, then verify BOTH Swapped Halves toggle & Reset Swap recover
      swapHalvesOverride = () => ({
        ...healthyPlan,
        allPairs: undefined,
        firstHalfTeam: { ...healthyPlan.secondHalfTeam, name: 'CORRUPTED_SWAP_TEAM' },
        reliability: {
          status: 'unsupported',
          mode: 'current',
          isActionable: false,
          verification: 'unregistered',
          temporalState: 'not_applicable',
          provenanceIds: [],
          warnings: ['Corrupted swap reliability envelope'],
          dependencies: [],
        },
      });

      // Enter unsupported swap
      await mounted.clickButton((_, text) => text.includes('Swap Halves'));
      const unsupportedSwapHtml = mounted.toHtml();
      const decodedUnsupportedSwap = decodeHtmlEntities(unsupportedSwapHtml);
      expect(decodedUnsupportedSwap).toContain('Reset Swap');
      expect(decodedUnsupportedSwap).toContain('Swapped Halves');
      expect(decodedUnsupportedSwap).not.toContain('CORRUPTED_SWAP_TEAM');
      expect(decodedUnsupportedSwap).not.toContain('Floor 12 Chamber Clearance');
      assertAbyssAccessibilityInvariants(unsupportedSwapHtml, 2);

      // Exit via ordinary "Swapped Halves" control
      await mounted.clickButton((_, text) => text.includes('Swapped Halves'));
      const exitedViaToggle = decodeHtmlEntities(mounted.toHtml());
      expect(exitedViaToggle).not.toContain('Reset Swap');
      expect(exitedViaToggle).toContain('Swap Halves');
      expect(exitedViaToggle).toContain('Reliable');
      expect(exitedViaToggle).toContain(healthyPlan.firstHalfTeam.name);

      // Re-enter unsupported swap and exit via "Reset Swap" recovery button
      await mounted.clickButton((_, text) => text.includes('Swap Halves'));
      expect(decodeHtmlEntities(mounted.toHtml())).toContain('Reset Swap');
      await mounted.clickButton((_, text) => text.trim() === 'Reset Swap');
      const exitedViaReset = decodeHtmlEntities(mounted.toHtml());
      expect(exitedViaReset).not.toContain('Reset Swap');
      expect(exitedViaReset).toContain('Reliable');
      expect(exitedViaReset).toContain(healthyPlan.firstHalfTeam.name);

      mounted.unmount();
    });

    it('suppresses results with a missing input key (U7b), suppresses stale results before effect on input changes, and keeps Sandbox Editor mounted', async () => {
      const firstDeferred = createDeferred<AbyssDualTeamPlan>();
      const secondDeferred = createDeferred<AbyssDualTeamPlan>();
      const thirdDeferred = createDeferred<AbyssDualTeamPlan>();
      const mockDispatch = vi.mocked(solverDispatcher.dispatchSolveAbyss);
      mockDispatch
        .mockReset()
        .mockReturnValueOnce(firstDeferred.promise)
        .mockReturnValueOnce(secondDeferred.promise)
        .mockReturnValueOnce(thirdDeferred.promise);

      const mounted = mountAbyssDualTeam({
        ownedIds: sampleRoster,
        evaluatedAt: '2026-11-23',
      });

      const healthyPlan = abyssSolver.solveAbyssDualTeams(sampleRoster, undefined, cycle72, {
        evaluatedAt: '2026-11-23',
      });

      // U7b: Missing input key (resultInputKey === null) must suppress result
      mounted.dispatchActionWithoutEffects({
        type: 'SOLVE_SUCCEEDED',
        plan: healthyPlan,
        cycleId: cycle72.id,
      });
      const missingKeyHtml = decodeHtmlEntities(mounted.toHtml());
      expect(missingKeyHtml).toContain('Evaluating Reliability…');
      expect(missingKeyHtml).not.toContain('Live-Actionable');
      expect(missingKeyHtml).not.toContain(healthyPlan.firstHalfTeam.name);
      expect(missingKeyHtml).not.toContain('Chamber 12-1');

      // Resolve actual first request with valid matching input key
      firstDeferred.resolve(healthyPlan);
      await mounted.sync();
      expect(decodeHtmlEntities(mounted.toHtml())).toContain(healthyPlan.firstHalfTeam.name);
      expect(decodeHtmlEntities(mounted.toHtml())).toContain('Live-Actionable');

      // Equivalent prop array identity must NOT suppress settled result
      mounted.rerenderWithoutEffects({
        ownedIds: [...sampleRoster].reverse(),
        evaluatedAt: '2026-11-23',
      });
      expect(decodeHtmlEntities(mounted.toHtml())).toContain(healthyPlan.firstHalfTeam.name);

      // Material input change BEFORE useEffect fires -> stale plan & reliability suppressed immediately
      mounted.rerenderWithoutEffects({
        ownedIds: [...sampleRoster, 'Zhongli'],
        evaluatedAt: '2026-11-23',
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      const preEffectHtml = decodeHtmlEntities(mounted.toHtml());
      expect(preEffectHtml).toContain('Evaluating Reliability…');
      expect(preEffectHtml).not.toContain('Live-Actionable');
      expect(preEffectHtml).not.toContain(healthyPlan.firstHalfTeam.name);

      mounted.flushEffects();
      expect(mockDispatch).toHaveBeenCalledTimes(2);
      secondDeferred.resolve(healthyPlan);
      await mounted.sync();

      // Switch to custom-sandbox and edit enemy name -> Sandbox Editor stays mounted while recalculating
      await mounted.changeSelect('abyss-cycle-select', 'custom-sandbox');
      const sandboxPlan = abyssSolver.solveAbyssDualTeams(
        [...sampleRoster, 'Zhongli'],
        undefined,
        createCustomSandboxCycle(),
        { evaluatedAt: '2026-11-23' },
      );
      thirdDeferred.resolve(sandboxPlan);
      await mounted.sync();

      const beforeEditHtml = decodeHtmlEntities(mounted.toHtml());
      expect(beforeEditHtml).toContain('Interactive Sandbox Chamber Configurator');

      const fourthDeferred = createDeferred<AbyssDualTeamPlan>();
      mockDispatch.mockReturnValueOnce(fourthDeferred.promise);
      mounted.changeInputByAriaLabel('Chamber 12-1 first half enemy name', 'Custom Boss Test');

      const duringRecalcHtml = decodeHtmlEntities(mounted.toHtml());
      expect(duringRecalcHtml).toContain('Interactive Sandbox Chamber Configurator');
      expect(duringRecalcHtml).toContain('value="Custom Boss Test"');
      expect(duringRecalcHtml).toContain('Evaluating Reliability…');
      expect(duringRecalcHtml).not.toContain('Floor 12 Chamber Clearance');
      expect(duringRecalcHtml).not.toContain('First Half Vanguard');

      fourthDeferred.resolve(sandboxPlan);
      await mounted.sync();
      mounted.unmount();
    });
  });
});
