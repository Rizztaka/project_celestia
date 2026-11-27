import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CHARACTERS } from '../data/characters';
import { THEATER_SEASONS } from '../data/theater-seasons';
import {
  autoDraftTheaterSchedule,
  filterEligibleTheaterRoster,
} from '../engines/theater-solver';
import {
  ImaginariumTheaterView,
  TheaterReliabilitySection,
  TheaterBorrowReliabilitySection,
  buildTheaterSolveInputKey,
  initialTheaterSolveState,
  theaterSolveReducer,
  startTheaterSolveRequest,
} from './ImaginariumTheaterView';

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

describe('ImaginariumTheaterView Component (M9 Phase 4 — Surfaces #7 & #8)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const sampleRoster = [
    'Columbina',
    'Clorinde',
    'Navia',
    'Furina',
    'Mitya',
    'Zhongli',
    'Mavuika',
    'Yelan',
  ];

  it('selects the active season by evaluatedAt (Nov vs Dec 2026) and keeps interactive buttons outside live regions on shortfall', () => {
    const novHtml = renderToString(
      <ImaginariumTheaterView ownedIds={sampleRoster} evaluatedAt="2026-11-23" />,
    );
    expect(novHtml).toContain('Version 7.2 · November 2026');
    expect(novHtml).toContain('Evaluating Reliability…');
    expect(novHtml).toContain('Support Cast Borrow Advisor');
    expect(novHtml).toContain('Qualified · Advisory Only');
    expect(hasNestedButtons(novHtml)).toBe(false);

    for (const content of extractElementInnerHtmlByAttr(novHtml, /\brole="status"/)) {
      expect(content).not.toMatch(/<button\b/i);
    }
    for (const content of extractElementInnerHtmlByAttr(novHtml, /\brole="alert"/)) {
      expect(content).not.toMatch(/<button\b/i);
    }

    const decHtml = renderToString(
      <ImaginariumTheaterView ownedIds={sampleRoster} evaluatedAt="2026-12-05" />,
    );
    expect(decHtml).toMatch(
      /<option\b[^>]*value="season-7-2-dec-pyro-hydro-geo"[^>]*selected=""/,
    );
  });

  it('handles async worker solve lifecycle, stale-request suppression, and split error recovery', async () => {
    const activeSeason = THEATER_SEASONS[0];
    const eligible = filterEligibleTheaterRoster(sampleRoster, activeSeason).eligible;
    const params = {
      effectiveEligible: eligible,
      difficulty: 'Normal' as const,
      activeSeason,
      evaluatedAt: '2026-11-23',
    };
    const key1 = buildTheaterSolveInputKey(params);
    const key2 = buildTheaterSolveInputKey({ ...params, difficulty: 'Visionary' });
    expect(key1).not.toBe(key2);

    const expectedResult = autoDraftTheaterSchedule(
      eligible,
      'Normal',
      activeSeason,
      undefined,
      undefined,
      { evaluatedAt: '2026-11-23' },
    );

    // 1. Rejection produces SOLVE_FAILED and split role="alert" + Retry
    let state = initialTheaterSolveState;
    const dispatch = (action: Parameters<typeof theaterSolveReducer>[1]) => {
      state = theaterSolveReducer(state, action);
    };

    const requestIdRef = { current: 0 };
    const isMountedRef = { current: true };
    const failingDispatch = vi.fn().mockRejectedValue(new Error('Theater worker offline'));

    startTheaterSolveRequest(params, undefined, new Set(), {
      requestIdRef,
      isMountedRef,
      dispatch,
      scheduleTransition: (cb) => cb(),
      dispatchSolveFn: failingDispatch,
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(state.isSolving).toBe(false);
    expect(state.solverError).toBe('Theater worker offline');

    const errorHtml = renderToString(
      <TheaterReliabilitySection
        reliability={null}
        detailsControlsId="theater-err-panel"
        isDetailsOpen={false}
        onToggleDetails={() => {}}
        onCloseDetails={() => {}}
        solverError={state.solverError}
        onRetry={() => {}}
      />,
    );
    expect(errorHtml).toContain('Imaginarium Theater Solver Error');
    expect(errorHtml).toContain('Theater worker offline');
    expect(errorHtml).toContain('Retry');
    for (const content of extractElementInnerHtmlByAttr(errorHtml, /\brole="alert"/)) {
      expect(content).not.toMatch(/<button\b/i);
    }

    // 2. Stale resolve after newer request is ignored
    let resolveStale!: (value: typeof expectedResult) => void;
    const stalePromise = new Promise<typeof expectedResult>((resolve) => {
      resolveStale = resolve;
    });
    startTheaterSolveRequest(params, undefined, new Set(), {
      requestIdRef,
      isMountedRef,
      dispatch,
      scheduleTransition: (cb) => cb(),
      dispatchSolveFn: () => stalePromise,
    });
    startTheaterSolveRequest(
      { ...params, difficulty: 'Visionary' },
      undefined,
      new Set(),
      {
        requestIdRef,
        isMountedRef,
        dispatch,
        scheduleTransition: (cb) => cb(),
        dispatchSolveFn: async () => expectedResult,
      },
    );
    resolveStale(expectedResult);
    await Promise.resolve();
    await Promise.resolve();

    expect(state.isSolving).toBe(false);
    expect(state.solverError).toBeNull();
    expect(state.resultInputKey).toBe(key2);

    const borrowHtml = renderToString(
      <TheaterBorrowReliabilitySection
        reliability={expectedResult.reliability}
        detailsControlsId="borrow-panel-test"
        isDetailsOpen={true}
        onToggleDetails={() => {}}
        onCloseDetails={() => {}}
      />,
    ).replace(/<!--\s*-->/g, '');
    expect(borrowHtml).toContain('Support Cast Borrow Advisor — Reliability Details');
    expect(borrowHtml).toContain('Data State: Estimated');
    expect(CHARACTERS.length).toBe(128);
  });
});
