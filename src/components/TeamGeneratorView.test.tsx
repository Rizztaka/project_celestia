import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import type {
  OwnedWeapon,
  RecommendationCollection,
  TeamRecommendation,
} from '../types/genshin';

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
    dispatchGenerateBestTeams: vi.fn(actual.dispatchGenerateBestTeams),
  };
});

import * as React from 'react';
import * as solverDispatcher from '../services/solver-dispatcher';
import { CHARACTERS } from '../data/characters';
import { generateBestTeams } from '../engines/team-generator';
import { rankWeaponsForCharacter } from '../engines/weapon-solver';
import { formatReliabilityPresentation } from '../services/reliability-presentation';
import { RecommendationReliabilityBadge } from './RecommendationReliabilityBadge';
import { RecommendationReliabilityBanner } from './RecommendationReliabilityBanner';
import { ReliabilityDetailsPanel } from './ReliabilityDetailsPanel';
import {
  TeamGeneratorView,
  TeamGeneratorReliabilitySection,
  QuickSwapReliabilitySection,
  buildTeamGenerationInputKey,
  createInitialTeamGeneratorSolveState,
  teamGeneratorSolveReducer,
  startTeamGenerationRequest,
  initialQuickSwapModalState,
  quickSwapModalReducer,
  type TeamGeneratorSolveAction,
  type TeamGeneratorSolveState,
  type QuickSwapTarget,
} from './TeamGeneratorView';

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

function extractDisclosureAriaControls(html: string): string[] {
  const ids: string[] = [];
  const re = /aria-controls="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}

function assertReliabilityAccessibility(html: string, expectedTriggerCount: number): string {
  expect(hasNestedButtons(html)).toBe(false);

  const reliabilityContainers = extractElementInnerHtmlByAttr(
    html,
    /\bdata-reliability-container="(?:status|alert)"/,
  );
  for (const containerHtml of reliabilityContainers) {
    const statusRegions = extractElementInnerHtmlByAttr(containerHtml, /\brole="status"/);
    for (const content of statusRegions) {
      expect(content).not.toMatch(/<button\b/i);
    }
    const alertRegions = extractElementInnerHtmlByAttr(containerHtml, /\brole="alert"/);
    for (const content of alertRegions) {
      expect(content).not.toMatch(/<button\b/i);
    }
  }

  const controlledIds = extractDisclosureAriaControls(html);
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

const sampleRoster = ['Nefer', 'Furina', 'Nahida', 'KukiShinobu'];

const nefer = CHARACTERS.find((c) => c.id === 'Nefer')!;
const furina = CHARACTERS.find((c) => c.id === 'Furina')!;

const sampleWeapons: OwnedWeapon[] = [
  {
    id: 'w_cat',
    key: 'ReliquaryOfTruth',
    name: 'Reliquary of Truth',
    level: 90,
    refinement: 1,
    rarity: 5,
    location: 'Nefer',
  },
  {
    id: 'w_sword',
    key: 'SplendorOfTranquilWaters',
    name: 'Splendor of Tranquil Waters',
    level: 90,
    refinement: 1,
    rarity: 5,
    location: 'Furina',
  },
];

describe('TeamGeneratorView Component (M9 Phase 4 — Slice 4.1)', () => {
  afterEach(() => {
    activeHookRunner = null;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('1. Main Best Teams reliability badge, banner & details disclosure', () => {
    it('renders Awaiting 4+ Roster empty badge and removes legacy DataFreshnessBadge when roster < 4', () => {
      const html = renderToString(<TeamGeneratorView ownedIds={[]} />);
      const decoded = decodeHtmlEntities(html);

      expect(decoded).toContain('Best Team Recommendations');
      expect(decoded).toContain('Awaiting 4+ Roster');
      expect(decoded).not.toContain('Data Freshness Status:');
      expect(hasNestedButtons(html)).toBe(false);
    });

    it('renders loading reliability indicator on initial SSR pass with 4+ owned characters', () => {
      const html = renderToString(<TeamGeneratorView ownedIds={sampleRoster} weapons={sampleWeapons} />);
      const decoded = decodeHtmlEntities(html);

      expect(decoded).toContain('Evaluating Reliability…');
      expect(decoded).not.toContain('Data Freshness Status:');
      expect(hasNestedButtons(html)).toBe(false);
    });

    it('renders Reliable badge, omits banner when healthy, and toggles details panel cleanly', () => {
      const collection = generateBestTeams(sampleRoster, undefined, undefined, sampleWeapons, false, {
        evaluatedAt: '2026-11-23',
      });
      const model = formatReliabilityPresentation(collection.reliability);
      const panelId = 'team-main-details-healthy';

      const closedHtml = renderToString(
        <div>
          <RecommendationReliabilityBadge
            reliability={collection.reliability}
            size="sm"
            detailsControlsId={panelId}
            isDetailsOpen={false}
            onToggleDetails={() => {}}
          />
          <TeamGeneratorReliabilitySection
            reliability={collection.reliability}
            detailsControlsId={panelId}
            isDetailsOpen={false}
            onToggleDetails={() => {}}
            onCloseDetails={() => {}}
          />
        </div>,
      );
      const decodedClosed = decodeHtmlEntities(closedHtml);

      expect(decodedClosed).toContain(model.badgeLabel);
      expect(decodedClosed).toContain(model.actionabilityLabel);
      expect(decodedClosed).toContain('data-reliability-status="reliable"');
      expect(decodedClosed).not.toContain('data-reliability-container=');
      assertReliabilityAccessibility(closedHtml, 1);

      const closedTag = closedHtml.match(new RegExp(`<div[^>]*id="${panelId}"[^>]*>`))?.[0];
      expect(closedTag).toContain('hidden=""');
      expect(closedTag).toContain('aria-hidden="true"');
      expect(closedHtml).toContain('aria-expanded="false"');

      const openHtml = renderToString(
        <div>
          <RecommendationReliabilityBadge
            reliability={collection.reliability}
            size="sm"
            detailsControlsId={panelId}
            isDetailsOpen={true}
            onToggleDetails={() => {}}
          />
          <TeamGeneratorReliabilitySection
            reliability={collection.reliability}
            detailsControlsId={panelId}
            isDetailsOpen={true}
            onToggleDetails={() => {}}
            onCloseDetails={() => {}}
          />
        </div>,
      );
      const decodedOpen = decodeHtmlEntities(openHtml);

      assertReliabilityAccessibility(openHtml, 1);
      const openTag = openHtml.match(new RegExp(`<div[^>]*id="${panelId}"[^>]*>`))?.[0];
      expect(openTag).toBeDefined();
      expect(openTag).not.toContain('hidden=""');
      expect(openTag).not.toContain('aria-hidden="true"');
      expect(openHtml).toContain('aria-expanded="true"');
      expect(decodedOpen).toContain('Team Synergy Solver — Reliability Details');
      expect(decodedOpen).toContain('team_archetypes_v7_2');
      expect(decodedOpen).toContain('Evaluated UTC: 2026-11-23');
    });

    it('renders Sandbox context banner for theoretical catalog fallback and status banner when stale', () => {
      const sandboxCollection = generateBestTeams([], undefined, undefined, [], true, {
        evaluatedAt: '2026-11-23',
      });
      const sandboxHtml = renderToString(
        <div>
          <RecommendationReliabilityBadge
            reliability={sandboxCollection.reliability}
            size="sm"
            detailsControlsId="team-sandbox-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
          />
          <TeamGeneratorReliabilitySection
            reliability={sandboxCollection.reliability}
            detailsControlsId="team-sandbox-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
            onCloseDetails={() => {}}
          />
        </div>,
      );
      const decodedSandbox = decodeHtmlEntities(sandboxHtml);
      expect(decodedSandbox).toContain('Sandbox');
      expect(decodedSandbox).toContain('aria-label="Team Synergy Solver reliability context"');
      expect(decodedSandbox).toContain('data-reliability-container="context"');
      assertReliabilityAccessibility(sandboxHtml, 2);

      const staleCollection = generateBestTeams(sampleRoster, undefined, undefined, sampleWeapons, false, {
        evaluatedAt: '2027-01-10',
      });
      const staleHtml = renderToString(
        <div>
          <RecommendationReliabilityBadge
            reliability={staleCollection.reliability}
            size="sm"
            detailsControlsId="team-stale-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
          />
          <TeamGeneratorReliabilitySection
            reliability={staleCollection.reliability}
            detailsControlsId="team-stale-panel"
            isDetailsOpen={false}
            onToggleDetails={() => {}}
            onCloseDetails={() => {}}
          />
        </div>,
      );
      const decodedStale = decodeHtmlEntities(staleHtml);
      expect(decodedStale).toContain('data-reliability-container="status"');
      expect(decodedStale).toContain('Qualified · Stale Dependency');
      assertReliabilityAccessibility(staleHtml, 2);
    });
  });

  describe('2. Quick Swap Weapon Modal reliability presentation & disclosure reset', () => {
    it('renders reliability badge, banner when stale, and collapsed/expanded details panel', () => {
      const healthyRanking = rankWeaponsForCharacter(nefer, sampleWeapons, [nefer, furina], {
        evaluatedAt: '2026-11-23',
      });
      const healthyHtml = renderToString(
        <QuickSwapReliabilitySection
          reliability={healthyRanking.reliability}
          detailsControlsId="quick-swap-panel-healthy"
          isDetailsOpen={false}
          onToggleDetails={() => {}}
          onCloseDetails={() => {}}
        />,
      );
      const decodedHealthy = decodeHtmlEntities(healthyHtml);
      expect(decodedHealthy).toContain('Reliable');
      expect(decodedHealthy).toContain('Live-Actionable');
      expect(decodedHealthy).not.toContain('data-reliability-container=');
      assertReliabilityAccessibility(healthyHtml, 1);

      const staleRanking = rankWeaponsForCharacter(furina, sampleWeapons, [nefer, furina], {
        evaluatedAt: '2027-01-10',
      });
      const openStaleHtml = renderToString(
        <QuickSwapReliabilitySection
          reliability={staleRanking.reliability}
          detailsControlsId="quick-swap-panel-stale"
          isDetailsOpen={true}
          onToggleDetails={() => {}}
          onCloseDetails={() => {}}
        />,
      );
      const decodedStale = decodeHtmlEntities(openStaleHtml);
      expect(decodedStale).toContain('data-reliability-container="status"');
      expect(decodedStale).toContain('Quick Swap Weapon Ranking — Reliability Details');
      expect(decodedStale).toContain('weapons_v7_2_signatures');
      assertReliabilityAccessibility(openStaleHtml, 2);
      const openTag = openStaleHtml.match(/<div[^>]*id="quick-swap-panel-stale"[^>]*>/)?.[0];
      expect(openTag).toBeDefined();
      expect(openTag).not.toContain('hidden=""');
      expect(openTag).not.toContain('aria-hidden="true"');
      expect(openStaleHtml).toContain('aria-expanded="true"');
    });

    it('resets Quick Swap disclosure state when the modal closes', () => {
      const targetA: QuickSwapTarget = {
        teamId: 'team-1',
        character: nefer,
        teamMembers: [nefer, furina],
      };

      let state = quickSwapModalReducer(initialQuickSwapModalState, {
        type: 'OPEN_TARGET',
        target: targetA,
      });
      expect(state.target).toBe(targetA);
      expect(state.isDetailsOpen).toBe(false);

      state = quickSwapModalReducer(state, { type: 'TOGGLE_DETAILS' });
      expect(state.isDetailsOpen).toBe(true);

      state = quickSwapModalReducer(state, { type: 'CLOSE' });
      expect(state.target).toBeNull();
      expect(state.isDetailsOpen).toBe(false);
    });

    it('resets Quick Swap disclosure state when the target changes', () => {
      const targetA: QuickSwapTarget = {
        teamId: 'team-1',
        character: nefer,
        teamMembers: [nefer, furina],
      };
      const targetB: QuickSwapTarget = {
        teamId: 'team-1',
        character: furina,
        teamMembers: [nefer, furina],
      };

      let state = quickSwapModalReducer(initialQuickSwapModalState, {
        type: 'OPEN_TARGET',
        target: targetA,
      });
      state = quickSwapModalReducer(state, { type: 'TOGGLE_DETAILS' });
      expect(state.isDetailsOpen).toBe(true);

      state = quickSwapModalReducer(state, { type: 'OPEN_TARGET', target: targetB });
      expect(state.target).toBe(targetB);
      expect(state.isDetailsOpen).toBe(false);

      const rankingB = rankWeaponsForCharacter(furina, sampleWeapons, [nefer, furina], {
        evaluatedAt: '2026-11-23',
      });
      const html = renderToString(
        <QuickSwapReliabilitySection
          reliability={rankingB.reliability}
          detailsControlsId="quick-swap-reset-panel"
          isDetailsOpen={state.isDetailsOpen}
          onToggleDetails={() => {}}
          onCloseDetails={() => {}}
        />,
      );
      const panelTag = html.match(/<div[^>]*id="quick-swap-reset-panel"[^>]*>/)?.[0];
      expect(panelTag).toContain('hidden=""');
      expect(panelTag).toContain('aria-hidden="true"');
      expect(html).toContain('aria-expanded="false"');
    });
  });

  describe('3. Worker lifecycle, error alert, Retry, stale guards & unmount protection', () => {
    function createHarness() {
      let state: TeamGeneratorSolveState = createInitialTeamGeneratorSolveState({
        ownedCount: sampleRoster.length,
        showCatalogFallback: false,
      });
      const actions: TeamGeneratorSolveAction[] = [];
      const requestIdRef = { current: 0 };
      const isMountedRef = { current: true };
      const dispatch = (action: TeamGeneratorSolveAction) => {
        actions.push(action);
        state = teamGeneratorSolveReducer(state, action);
      };

      return {
        getState: () => state,
        actions,
        requestIdRef,
        isMountedRef,
        dispatch,
      };
    }

    it('displays accessible split error alert on worker rejection and retries with a fresh request', async () => {
      const harness = createHarness();
      const firstDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const secondDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const dispatcher = vi
        .fn()
        .mockReturnValueOnce(firstDeferred.promise)
        .mockReturnValueOnce(secondDeferred.promise);

      const cleanupFirst = startTeamGenerationRequest(
        {
          ownedIds: sampleRoster,
          weaponBag: sampleWeapons,
          showCatalogFallback: false,
        },
        {
          requestIdRef: harness.requestIdRef,
          isMountedRef: harness.isMountedRef,
          dispatch: harness.dispatch,
          dispatcher,
        },
      );

      expect(harness.getState().isSolving).toBe(true);
      expect(harness.getState().solverError).toBeNull();

      firstDeferred.reject(new Error('Solver worker transport failed'));
      await flushMicrotasks();

      expect(harness.getState().isSolving).toBe(false);
      expect(harness.getState().teamResult).toBeNull();
      expect(harness.getState().solverError).toBe('Solver worker transport failed');

      const errorHtml = renderToString(
        <TeamGeneratorReliabilitySection
          reliability={harness.getState().teamResult?.reliability}
          detailsControlsId="team-error-panel"
          isDetailsOpen={false}
          onToggleDetails={() => {}}
          onCloseDetails={() => {}}
          solverError={harness.getState().solverError}
          onRetry={() => {}}
        />,
      );
      const decodedError = decodeHtmlEntities(errorHtml);
      expect(decodedError).toContain('Team Synergy Solver Error');
      expect(decodedError).toContain('Solver worker transport failed');
      expect(decodedError).toContain('>Retry<');
      assertReliabilityAccessibility(errorHtml, 0);

      // Retry initiates a fresh request and clears prior error immediately
      cleanupFirst();
      const cleanupRetry = startTeamGenerationRequest(
        {
          ownedIds: sampleRoster,
          weaponBag: sampleWeapons,
          showCatalogFallback: false,
        },
        {
          requestIdRef: harness.requestIdRef,
          isMountedRef: harness.isMountedRef,
          dispatch: harness.dispatch,
          dispatcher,
        },
      );

      expect(dispatcher).toHaveBeenCalledTimes(2);
      expect(harness.getState().isSolving).toBe(true);
      expect(harness.getState().solverError).toBeNull();

      const recovered = generateBestTeams(sampleRoster, undefined, undefined, sampleWeapons, false, {
        evaluatedAt: '2026-11-23',
      });
      secondDeferred.resolve(recovered);
      await flushMicrotasks();

      expect(harness.getState().isSolving).toBe(false);
      expect(harness.getState().solverError).toBeNull();
      expect(harness.getState().teamResult).toBe(recovered);
      cleanupRetry();
    });

    it('prevents a stale response from overwriting a newer response', async () => {
      const harness = createHarness();
      const firstDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const secondDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const dispatcher = vi
        .fn()
        .mockReturnValueOnce(firstDeferred.promise)
        .mockReturnValueOnce(secondDeferred.promise);

      const cleanupFirst = startTeamGenerationRequest(
        {
          ownedIds: sampleRoster,
          focusId: 'Nefer',
          weaponBag: sampleWeapons,
          showCatalogFallback: false,
        },
        {
          requestIdRef: harness.requestIdRef,
          isMountedRef: harness.isMountedRef,
          dispatch: harness.dispatch,
          dispatcher,
        },
      );

      cleanupFirst();
      const cleanupSecond = startTeamGenerationRequest(
        {
          ownedIds: sampleRoster,
          focusId: 'Furina',
          weaponBag: sampleWeapons,
          showCatalogFallback: false,
        },
        {
          requestIdRef: harness.requestIdRef,
          isMountedRef: harness.isMountedRef,
          dispatch: harness.dispatch,
          dispatcher,
        },
      );

      const newerResult = generateBestTeams(sampleRoster, 'Furina', undefined, sampleWeapons, false, {
        evaluatedAt: '2026-11-23',
      });
      const staleResult = generateBestTeams(sampleRoster, 'Nefer', undefined, sampleWeapons, false, {
        evaluatedAt: '2026-11-23',
      });

      secondDeferred.resolve(newerResult);
      await flushMicrotasks();
      expect(harness.getState().teamResult).toBe(newerResult);
      expect(harness.getState().isSolving).toBe(false);

      // Stale response resolves after newer response -> must be discarded
      firstDeferred.resolve(staleResult);
      await flushMicrotasks();

      expect(harness.getState().teamResult).toBe(newerResult);
      expect(harness.getState().solverError).toBeNull();
      cleanupSecond();
    });

    it('prevents a stale rejection from replacing the current request state', async () => {
      const harness = createHarness();
      const firstDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const secondDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const dispatcher = vi
        .fn()
        .mockReturnValueOnce(firstDeferred.promise)
        .mockReturnValueOnce(secondDeferred.promise);

      const cleanupFirst = startTeamGenerationRequest(
        {
          ownedIds: sampleRoster,
          focusId: 'Nefer',
          weaponBag: sampleWeapons,
          showCatalogFallback: false,
        },
        {
          requestIdRef: harness.requestIdRef,
          isMountedRef: harness.isMountedRef,
          dispatch: harness.dispatch,
          dispatcher,
        },
      );

      cleanupFirst();
      const cleanupSecond = startTeamGenerationRequest(
        {
          ownedIds: sampleRoster,
          focusId: 'Furina',
          weaponBag: sampleWeapons,
          showCatalogFallback: false,
        },
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

      const newerResult = generateBestTeams(sampleRoster, 'Furina', undefined, sampleWeapons, false, {
        evaluatedAt: '2026-11-23',
      });
      secondDeferred.resolve(newerResult);
      await flushMicrotasks();

      expect(harness.getState().isSolving).toBe(false);
      expect(harness.getState().solverError).toBeNull();
      expect(harness.getState().teamResult).toBe(newerResult);
      cleanupSecond();
    });

    it('prevents asynchronous state updates after unmount cleanup', async () => {
      const harness = createHarness();
      const pendingResolve = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const pendingReject = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const dispatcher = vi
        .fn()
        .mockReturnValueOnce(pendingResolve.promise)
        .mockReturnValueOnce(pendingReject.promise);

      const cleanupResolve = startTeamGenerationRequest(
        {
          ownedIds: sampleRoster,
          weaponBag: sampleWeapons,
          showCatalogFallback: false,
        },
        {
          requestIdRef: harness.requestIdRef,
          isMountedRef: harness.isMountedRef,
          dispatch: harness.dispatch,
          dispatcher,
        },
      );

      const actionsBeforeUnmount = harness.actions.length;
      expect(actionsBeforeUnmount).toBe(1); // SOLVE_STARTED

      // Unmount invalidates both effect cleanup and mount ref
      cleanupResolve();
      harness.isMountedRef.current = false;

      const resolvedPayload = generateBestTeams(
        sampleRoster,
        undefined,
        undefined,
        sampleWeapons,
        false,
        { evaluatedAt: '2026-11-23' },
      );
      pendingResolve.resolve(resolvedPayload);
      await flushMicrotasks();

      expect(harness.actions).toHaveLength(actionsBeforeUnmount);
      expect(harness.getState().teamResult).toBeNull();

      // Also verify unmount suppresses late rejections
      const harnessReject = createHarness();
      const cleanupReject = startTeamGenerationRequest(
        {
          ownedIds: sampleRoster,
          weaponBag: sampleWeapons,
          showCatalogFallback: false,
        },
        {
          requestIdRef: harnessReject.requestIdRef,
          isMountedRef: harnessReject.isMountedRef,
          dispatch: harnessReject.dispatch,
          dispatcher,
        },
      );
      cleanupReject();
      harnessReject.isMountedRef.current = false;

      pendingReject.reject(new Error('Late error after unmount'));
      await flushMicrotasks();

      expect(harnessReject.actions).toHaveLength(1);
      expect(harnessReject.getState().solverError).toBeNull();
    });

    it('clears previous teamResult and reliability on SOLVE_STARTED when inputs change or retry runs', async () => {
      const harness = createHarness();
      const firstDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const secondDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const dispatcher = vi
        .fn()
        .mockReturnValueOnce(firstDeferred.promise)
        .mockReturnValueOnce(secondDeferred.promise);

      const cleanupFirst = startTeamGenerationRequest(
        {
          ownedIds: sampleRoster,
          focusId: 'Nefer',
          weaponBag: sampleWeapons,
          showCatalogFallback: false,
        },
        {
          requestIdRef: harness.requestIdRef,
          isMountedRef: harness.isMountedRef,
          dispatch: harness.dispatch,
          dispatcher,
        },
      );

      const firstResult = generateBestTeams(sampleRoster, 'Nefer', undefined, sampleWeapons, false, {
        evaluatedAt: '2026-11-23',
      });
      firstDeferred.resolve(firstResult);
      await flushMicrotasks();

      expect(harness.getState().teamResult).toBe(firstResult);
      expect(harness.getState().isSolving).toBe(false);

      // New request starts (e.g. focus/roster/profile/weapon/catalog-fallback/retry change)
      cleanupFirst();
      const cleanupSecond = startTeamGenerationRequest(
        {
          ownedIds: sampleRoster,
          focusId: 'Furina',
          weaponBag: sampleWeapons,
          showCatalogFallback: false,
        },
        {
          requestIdRef: harness.requestIdRef,
          isMountedRef: harness.isMountedRef,
          dispatch: harness.dispatch,
          dispatcher,
        },
      );

      expect(harness.getState().isSolving).toBe(true);
      expect(harness.getState().solverError).toBeNull();
      expect(harness.getState().teamResult).toBeNull();

      cleanupSecond();
    });

    it('catches synchronous dispatcher exceptions into SOLVE_FAILED and allows Retry', async () => {
      const harness = createHarness();
      const recoveryDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const dispatcher = vi
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('Synchronous dispatch failure');
        })
        .mockReturnValueOnce(recoveryDeferred.promise);

      let cleanupFirst: (() => void) | undefined;
      expect(() => {
        cleanupFirst = startTeamGenerationRequest(
          {
            ownedIds: sampleRoster,
            weaponBag: sampleWeapons,
            showCatalogFallback: false,
          },
          {
            requestIdRef: harness.requestIdRef,
            isMountedRef: harness.isMountedRef,
            dispatch: harness.dispatch,
            dispatcher,
          },
        );
      }).not.toThrow();

      expect(harness.getState().isSolving).toBe(false);
      expect(harness.getState().teamResult).toBeNull();
      expect(harness.getState().solverError).toBe('Synchronous dispatch failure');

      cleanupFirst?.();
      const cleanupRetry = startTeamGenerationRequest(
        {
          ownedIds: sampleRoster,
          weaponBag: sampleWeapons,
          showCatalogFallback: false,
        },
        {
          requestIdRef: harness.requestIdRef,
          isMountedRef: harness.isMountedRef,
          dispatch: harness.dispatch,
          dispatcher,
        },
      );

      expect(harness.getState().isSolving).toBe(true);
      expect(harness.getState().solverError).toBeNull();

      const recovered = generateBestTeams(sampleRoster, undefined, undefined, sampleWeapons, false, {
        evaluatedAt: '2026-11-23',
      });
      recoveryDeferred.resolve(recovered);
      await flushMicrotasks();

      expect(harness.getState().isSolving).toBe(false);
      expect(harness.getState().solverError).toBeNull();
      expect(harness.getState().teamResult).toBe(recovered);
      cleanupRetry();
    });

    it('builds deterministic input snapshot keys ignoring object identity while distinguishing all material solve inputs', () => {
      const baseKey = buildTeamGenerationInputKey({
        ownedIds: sampleRoster,
        focusId: undefined,
        profiles: {
          Nefer: {
            id: 'Nefer',
            level: 90,
            constellation: 1,
            talents: { auto: 9, skill: 10, burst: 9 },
          },
          Furina: { id: 'Furina', level: 90, constellation: 2 },
        },
        weaponBag: sampleWeapons,
        showCatalogFallback: false,
      });

      const equivalentKey = buildTeamGenerationInputKey({
        ownedIds: [...sampleRoster].reverse(),
        focusId: '',
        profiles: {
          Furina: { constellation: 2, id: 'Furina', level: 90, ascension: undefined },
          Nefer: {
            constellation: 1,
            talents: { burst: 9, auto: 9, skill: 10 },
            level: 90,
            id: 'Nefer',
          },
        },
        weaponBag: sampleWeapons.map((w) => ({ ...w })),
        showCatalogFallback: false,
      });

      expect(equivalentKey).toBe(baseKey);

      // Varying each material solve input individually must change the snapshot key
      expect(
        buildTeamGenerationInputKey({
          ownedIds: [...sampleRoster, 'Zhongli'],
          focusId: undefined,
          profiles: {
            Nefer: {
              id: 'Nefer',
              level: 90,
              constellation: 1,
              talents: { auto: 9, skill: 10, burst: 9 },
            },
            Furina: { id: 'Furina', level: 90, constellation: 2 },
          },
          weaponBag: sampleWeapons,
          showCatalogFallback: false,
        }),
      ).not.toBe(baseKey);

      expect(
        buildTeamGenerationInputKey({
          ownedIds: sampleRoster,
          focusId: 'Nefer',
          profiles: {
            Nefer: {
              id: 'Nefer',
              level: 90,
              constellation: 1,
              talents: { auto: 9, skill: 10, burst: 9 },
            },
            Furina: { id: 'Furina', level: 90, constellation: 2 },
          },
          weaponBag: sampleWeapons,
          showCatalogFallback: false,
        }),
      ).not.toBe(baseKey);

      expect(
        buildTeamGenerationInputKey({
          ownedIds: sampleRoster,
          focusId: undefined,
          profiles: {
            Nefer: {
              id: 'Nefer',
              level: 90,
              constellation: 2,
              talents: { auto: 9, skill: 10, burst: 9 },
            },
            Furina: { id: 'Furina', level: 90, constellation: 2 },
          },
          weaponBag: sampleWeapons,
          showCatalogFallback: false,
        }),
      ).not.toBe(baseKey);

      expect(
        buildTeamGenerationInputKey({
          ownedIds: sampleRoster,
          focusId: undefined,
          profiles: {
            Nefer: {
              id: 'Nefer',
              level: 90,
              constellation: 1,
              talents: { auto: 9, skill: 10, burst: 9 },
            },
            Furina: { id: 'Furina', level: 90, constellation: 2 },
          },
          weaponBag: sampleWeapons.map((w, i) => (i === 0 ? { ...w, refinement: 5 } : { ...w })),
          showCatalogFallback: false,
        }),
      ).not.toBe(baseKey);

      expect(
        buildTeamGenerationInputKey({
          ownedIds: sampleRoster,
          focusId: undefined,
          profiles: {
            Nefer: {
              id: 'Nefer',
              level: 90,
              constellation: 1,
              talents: { auto: 9, skill: 10, burst: 9 },
            },
            Furina: { id: 'Furina', level: 90, constellation: 2 },
          },
          weaponBag: sampleWeapons,
          showCatalogFallback: true,
        }),
      ).not.toBe(baseKey);
    });
  });

  describe('4. Component-level TeamGeneratorView integration', () => {
    function depsChanged(prev: readonly unknown[] | undefined, next: readonly unknown[] | undefined): boolean {
      if (!prev || !next) return true;
      if (prev.length !== next.length) return true;
      for (let i = 0; i < prev.length; i++) {
        if (!Object.is(prev[i], next[i])) return true;
      }
      return false;
    }

    function mountTeamGenerator(initialProps: React.ComponentProps<typeof TeamGeneratorView>) {
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

      const renderWithoutEffects = (nextProps?: React.ComponentProps<typeof TeamGeneratorView>) => {
        if (nextProps !== undefined) {
          currentProps = nextProps;
        }
        dirty = false;
        hookIdx = 0;
        pendingEffects = [];
        activeHookRunner = runner;
        try {
          currentTree = TeamGeneratorView(currentProps) as React.ReactElement;
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
        TeamGeneratorReliabilitySection,
        QuickSwapReliabilitySection,
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
        rerenderWithoutEffects: (nextProps: React.ComponentProps<typeof TeamGeneratorView>) => {
          renderWithoutEffects(nextProps);
        },
        flushEffects,
        findButtons: (matcher: (el: React.ReactElement<Record<string, unknown>>, text: string) => boolean) =>
          findElements(
            currentTree,
            (el) => el.type === 'button' && matcher(el, getText(el)),
          ),
        clickButtonWithoutEffects: (
          matcher: (el: React.ReactElement<Record<string, unknown>>, text: string) => boolean,
        ) => {
          triggerButtonClick(matcher);
          renderWithoutEffects();
        },
        clickButton: async (
          matcher: (el: React.ReactElement<Record<string, unknown>>, text: string) => boolean,
        ) => {
          triggerButtonClick(matcher);
          renderCycle();
          await flushMicrotasks();
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

    it('shares a matching disclosure ID between Main Best Teams badge and details panel, uses a distinct independent ID/state for Quick Swap, and clears old results while re-solving', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));

      const componentWeapons: OwnedWeapon[] = [
        ...sampleWeapons,
        {
          id: 'w_fav_sword',
          key: 'FavoniusSword',
          name: 'Favonius Sword',
          level: 90,
          refinement: 5,
          rarity: 4,
          location: 'KukiShinobu',
        },
      ];

      const firstDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const secondDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const mockDispatch = vi.mocked(solverDispatcher.dispatchGenerateBestTeams);
      mockDispatch
        .mockReset()
        .mockReturnValueOnce(firstDeferred.promise)
        .mockReturnValueOnce(secondDeferred.promise);

      const mounted = mountTeamGenerator({ ownedIds: sampleRoster, weapons: componentWeapons });

      // Pending initial load shows loading indicator and zero team cards
      expect(decodeHtmlEntities(mounted.toHtml())).toContain('Evaluating Reliability…');

      const initialResult = generateBestTeams(
        sampleRoster,
        undefined,
        undefined,
        componentWeapons,
        false,
        { evaluatedAt: '2026-11-23' },
      );
      firstDeferred.resolve(initialResult);
      await mounted.sync();

      // 1. Main Best Teams badge and details panel share the same disclosure ID
      const mainCollapsedHtml = mounted.toHtml();
      const mainBadgeBtn = mounted.findButtons((el) =>
        String(el.props['aria-label'] ?? '').includes('Toggle reliability details'),
      )[0];
      expect(mainBadgeBtn).toBeDefined();
      const mainPanelId = String(mainBadgeBtn.props['aria-controls']);
      expect(mainPanelId.length).toBeGreaterThan(0);
      expect(mainCollapsedHtml).toContain(`id="${mainPanelId}"`);
      const mainClosedTag = mainCollapsedHtml.match(new RegExp(`<div[^>]*id="${mainPanelId}"[^>]*>`))?.[0];
      expect(mainClosedTag).toContain('hidden=""');

      // Open Main Best Teams details panel via its badge
      await mounted.clickButton((el) =>
        String(el.props['aria-label'] ?? '').includes('Toggle reliability details'),
      );
      const mainOpenHtml = mounted.toHtml();
      const mainOpenTag = mainOpenHtml.match(new RegExp(`<div[^>]*id="${mainPanelId}"[^>]*>`))?.[0];
      expect(mainOpenTag).not.toContain('hidden=""');
      expect(decodeHtmlEntities(mainOpenHtml)).toContain('Team Synergy Solver — Reliability Details');

      // 2 & 3. Open Quick Swap modal for Nefer -> appears for active weapon ranking with distinct ID & independent state
      await mounted.clickButton((el) =>
        String(el.props['aria-label'] ?? '').startsWith('Swap weapon for Nefer:'),
      );
      const modalClosedDetailsHtml = mounted.toHtml();
      const decodedModalClosed = decodeHtmlEntities(modalClosedDetailsHtml);
      expect(decodedModalClosed).toContain('Swap Weapon: Nefer');
      expect(decodedModalClosed).toContain('Reliquary of Truth');

      const allDisclosureBadges = mounted.findButtons((el) =>
        String(el.props['aria-label'] ?? '').includes('Toggle reliability details'),
      );
      expect(allDisclosureBadges).toHaveLength(2);
      const quickSwapBadge = allDisclosureBadges[1];
      const swapPanelId = String(quickSwapBadge.props['aria-controls']);
      expect(swapPanelId).not.toBe(mainPanelId);
      expect(quickSwapBadge.props['aria-expanded']).toBe(false);
      expect(allDisclosureBadges[0].props['aria-expanded']).toBe(true); // Main remains open

      const swapClosedTag = modalClosedDetailsHtml.match(
        new RegExp(`<div[^>]*id="${swapPanelId}"[^>]*>`),
      )?.[0];
      expect(swapClosedTag).toContain('hidden=""');

      // Toggle Quick Swap details open independently
      await mounted.clickButton(
        (el) => el.props['aria-controls'] === swapPanelId,
      );
      const modalOpenDetailsHtml = mounted.toHtml();
      const swapOpenTag = modalOpenDetailsHtml.match(
        new RegExp(`<div[^>]*id="${swapPanelId}"[^>]*>`),
      )?.[0];
      expect(swapOpenTag).not.toContain('hidden=""');
      expect(decodeHtmlEntities(modalOpenDetailsHtml)).toContain(
        'Quick Swap Weapon Ranking — Reliability Details',
      );

      // Close Quick Swap modal and reopen on another character -> Quick Swap disclosure resets while Main stays open
      await mounted.clickButton((el) => el.props['aria-label'] === 'Close weapon swap modal');
      await mounted.clickButton((el) =>
        String(el.props['aria-label'] ?? '').startsWith('Swap weapon for Furina:'),
      );
      const reopenedModalHtml = mounted.toHtml();
      const reopenedBadges = mounted.findButtons((el) =>
        String(el.props['aria-label'] ?? '').includes('Toggle reliability details'),
      );
      expect(reopenedBadges[0].props['aria-expanded']).toBe(true);
      expect(reopenedBadges[1].props['aria-expanded']).toBe(false);
      expect(
        reopenedModalHtml.match(new RegExp(`<div[^>]*id="${swapPanelId}"[^>]*>`))?.[0],
      ).toContain('hidden=""');

      // Close modal then trigger re-evaluation via Focus Carry button -> previous recommendations are cleared while solving
      await mounted.clickButton((el) => el.props['aria-label'] === 'Close weapon swap modal');
      await mounted.clickButton((_, text) => text.trim() === 'Nefer');
      const reevaluatingHtml = decodeHtmlEntities(mounted.toHtml());
      expect(reevaluatingHtml).toContain('Evaluating Reliability…');
      expect(reevaluatingHtml).toContain('Calculating optimal team recommendations…');
      expect(reevaluatingHtml).not.toContain('Rank #1');
      expect(reevaluatingHtml).not.toContain('Team Synergy Solver — Reliability Details');

      const neferResult = generateBestTeams(
        sampleRoster,
        'Nefer',
        undefined,
        componentWeapons,
        false,
        { evaluatedAt: '2026-11-23' },
      );
      secondDeferred.resolve(neferResult);
      await mounted.sync();
      expect(decodeHtmlEntities(mounted.toHtml())).toContain('Rank #1');

      mounted.unmount();
    });

    it('initiates a fresh solve request and clears the previous error when Retry is clicked on the component', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));

      const firstDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const secondDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const mockDispatch = vi.mocked(solverDispatcher.dispatchGenerateBestTeams);
      mockDispatch
        .mockReset()
        .mockReturnValueOnce(firstDeferred.promise)
        .mockReturnValueOnce(secondDeferred.promise);

      const mounted = mountTeamGenerator({ ownedIds: sampleRoster, weapons: sampleWeapons });

      firstDeferred.reject(new Error('Component worker failure'));
      await mounted.sync();

      const errorHtml = decodeHtmlEntities(mounted.toHtml());
      expect(errorHtml).toContain('Team Synergy Solver Error');
      expect(errorHtml).toContain('Component worker failure');
      expect(errorHtml).not.toContain('No Matching Teams Found');

      // Click the rendered Retry button
      await mounted.clickButton((_, text) => text.trim() === 'Retry');
      expect(mockDispatch).toHaveBeenCalledTimes(2);

      const retryingHtml = decodeHtmlEntities(mounted.toHtml());
      expect(retryingHtml).not.toContain('Team Synergy Solver Error');
      expect(retryingHtml).not.toContain('Component worker failure');
      expect(retryingHtml).toContain('Evaluating Reliability…');

      const recovered = generateBestTeams(sampleRoster, undefined, undefined, sampleWeapons, false, {
        evaluatedAt: '2026-11-23',
      });
      secondDeferred.resolve(recovered);
      await mounted.sync();

      const recoveredHtml = decodeHtmlEntities(mounted.toHtml());
      expect(recoveredHtml).toContain('Reliable');
      expect(recoveredHtml).toContain('Rank #1');
      expect(recoveredHtml).not.toContain('Team Synergy Solver Error');

      mounted.unmount();
    });

    it('suppresses old recommendations and reliability presentation immediately when solve inputs change, even before useEffect runs SOLVE_STARTED', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));

      const firstDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const secondDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const thirdDeferred = createDeferred<RecommendationCollection<TeamRecommendation>>();
      const mockDispatch = vi.mocked(solverDispatcher.dispatchGenerateBestTeams);
      mockDispatch
        .mockReset()
        .mockReturnValueOnce(firstDeferred.promise)
        .mockReturnValueOnce(secondDeferred.promise)
        .mockReturnValueOnce(thirdDeferred.promise);

      const initialProfiles = {
        Nefer: { id: 'Nefer', level: 90, constellation: 0 },
      };

      const mounted = mountTeamGenerator({
        ownedIds: sampleRoster,
        weapons: sampleWeapons,
        profiles: initialProfiles,
      });

      const initialResult = generateBestTeams(
        sampleRoster,
        undefined,
        initialProfiles,
        sampleWeapons,
        false,
        { evaluatedAt: '2026-11-23' },
      );
      firstDeferred.resolve(initialResult);
      await mounted.sync();

      // Open details panel so old banner/details suppression is also verified
      await mounted.clickButton((el) =>
        String(el.props['aria-label'] ?? '').includes('Toggle reliability details'),
      );
      const settledHtml = decodeHtmlEntities(mounted.toHtml());
      expect(settledHtml).toContain('Rank #1');
      expect(settledHtml).toContain('data-reliability-status="reliable"');
      expect(settledHtml).toContain('Live-Actionable');
      expect(settledHtml).toContain('Team Synergy Solver — Reliability Details');
      expect(mockDispatch).toHaveBeenCalledTimes(1);

      // Re-rendering with equivalent inputs (new array/object identities only) must NOT suppress current recommendations
      mounted.rerenderWithoutEffects({
        ownedIds: [...sampleRoster].reverse(),
        weapons: sampleWeapons.map((w) => ({ ...w })),
        profiles: {
          Nefer: { constellation: 0, level: 90, id: 'Nefer', ascension: undefined },
        },
      });
      const equivalentRenderHtml = decodeHtmlEntities(mounted.toHtml());
      expect(equivalentRenderHtml).toContain('Rank #1');
      expect(equivalentRenderHtml).toContain('data-reliability-status="reliable"');

      // 1. Prop input change BEFORE useEffect runs SOLVE_STARTED
      const updatedProfiles = {
        Nefer: { id: 'Nefer', level: 90, constellation: 2 },
      };
      mounted.rerenderWithoutEffects({
        ownedIds: sampleRoster,
        weapons: sampleWeapons,
        profiles: updatedProfiles,
      });

      // Effect has NOT fired yet; dispatch count is still 1, yet old recommendations must already be hidden
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      const preEffectPropChangeHtml = decodeHtmlEntities(mounted.toHtml());
      expect(preEffectPropChangeHtml).not.toContain('Rank #1');
      expect(preEffectPropChangeHtml).not.toContain('data-reliability-status=');
      expect(preEffectPropChangeHtml).not.toContain('Live-Actionable');
      expect(preEffectPropChangeHtml).not.toContain('Team Synergy Solver — Reliability Details');
      expect(preEffectPropChangeHtml).not.toContain('No Matching Teams Found');
      expect(preEffectPropChangeHtml).toContain('Evaluating Reliability…');
      expect(preEffectPropChangeHtml).toContain('Calculating optimal team recommendations…');

      // Flush effects -> SOLVE_STARTED runs and starts the 2nd request (still pending)
      mounted.flushEffects();
      expect(mockDispatch).toHaveBeenCalledTimes(2);
      const pendingSecondHtml = decodeHtmlEntities(mounted.toHtml());
      expect(pendingSecondHtml).not.toContain('Rank #1');
      expect(pendingSecondHtml).not.toContain('data-reliability-status=');
      expect(pendingSecondHtml).toContain('Evaluating Reliability…');

      const secondResult = generateBestTeams(
        sampleRoster,
        undefined,
        updatedProfiles,
        sampleWeapons,
        false,
        { evaluatedAt: '2026-11-23' },
      );
      secondDeferred.resolve(secondResult);
      await mounted.sync();

      const secondSettledHtml = decodeHtmlEntities(mounted.toHtml());
      expect(secondSettledHtml).toContain('Rank #1');
      expect(secondSettledHtml).toContain('data-reliability-status="reliable"');

      // 2. State input change (Focus Carry click) BEFORE useEffect runs SOLVE_STARTED
      mounted.clickButtonWithoutEffects((_, text) => text.trim() === 'Nefer');
      expect(mockDispatch).toHaveBeenCalledTimes(2);
      const preEffectFocusHtml = decodeHtmlEntities(mounted.toHtml());
      expect(preEffectFocusHtml).not.toContain('Rank #1');
      expect(preEffectFocusHtml).not.toContain('data-reliability-status=');
      expect(preEffectFocusHtml).not.toContain('Live-Actionable');
      expect(preEffectFocusHtml).not.toContain('Team Synergy Solver — Reliability Details');
      expect(preEffectFocusHtml).toContain('Evaluating Reliability…');

      mounted.flushEffects();
      expect(mockDispatch).toHaveBeenCalledTimes(3);

      const thirdResult = generateBestTeams(
        sampleRoster,
        'Nefer',
        updatedProfiles,
        sampleWeapons,
        false,
        { evaluatedAt: '2026-11-23' },
      );
      thirdDeferred.resolve(thirdResult);
      await mounted.sync();

      const thirdSettledHtml = decodeHtmlEntities(mounted.toHtml());
      expect(thirdSettledHtml).toContain('Rank #1');
      expect(thirdSettledHtml).toContain('data-reliability-status="reliable"');

      mounted.unmount();
    });
  });
});
