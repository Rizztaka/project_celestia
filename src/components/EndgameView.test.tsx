import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

type HookRunner = {
  useState: <T>(initial: T | (() => T)) => [T, (next: T | ((prev: T) => T)) => void];
};

let activeHookRunner: HookRunner | null = null;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  const hooks = {
    useState: (<T,>(initial: T | (() => T)) =>
      activeHookRunner ? activeHookRunner.useState(initial) : actual.useState(initial)) as typeof actual.useState,
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

import { ABYSS_CYCLES, createCustomSandboxCycle } from '../data/abyss-schedules';
import { analyzeEndgameReadiness } from '../engines/endgame-helper';
import { EndgameView } from './EndgameView';

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

describe('EndgameView Component (M9 Phase 4 — Surface #6 Reliability Disclosure)', () => {
  afterEach(() => {
    activeHookRunner = null;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const sampleRoster = ['Nefer', 'Furina', 'Nahida', 'KukiShinobu', 'Mavuika', 'Bennett', 'Zhongli', 'Yelan'];

  it('mounts Abyss Chamber Reference reliability disclosure with valid aria-controls even while collapsed', () => {
    let stateCallIndex = 0;
    activeHookRunner = {
      useState: (<T,>(initial: T | (() => T)) => {
        const idx = stateCallIndex++;
        const resolved = typeof initial === 'function' ? (initial as () => T)() : initial;
        // EndgameView first useState is activeSubTab ('theater' -> override to 'abyss')
        if (idx === 0) {
          return ['abyss' as unknown as T, () => {}];
        }
        return [resolved, () => {}];
      }) as HookRunner['useState'],
    };

    const abyssHtml = renderToString(
      <EndgameView ownedIds={sampleRoster} evaluatedAt="2026-11-23" />,
    ).replace(/<!--\s*-->/g, '');

    expect(abyssHtml).toContain('Enemy Lineup, Resistances &amp; Positioning Reference Guide');
    expect(abyssHtml).toContain('aria-controls="abyss-chamber-reference"');
    expect(abyssHtml).toContain('id="abyss-chamber-reference"');
    expect(abyssHtml).toContain('Abyss Chamber Reference — Reliability Details');
    expect(abyssHtml).toContain('Data State: Verified');
    expect(hasNestedButtons(abyssHtml)).toBe(false);

    const controlledIds = [...abyssHtml.matchAll(/aria-controls="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((id) => id !== 'endgame-panel-theater' && id !== 'endgame-panel-abyss');
    expect(controlledIds).toContain('abyss-chamber-reference');
    for (const id of controlledIds) {
      expect(abyssHtml).toContain(`id="${id}"`);
    }
    for (const region of extractElementInnerHtmlByAttr(abyssHtml, /\brole="status"/)) {
      expect(region).not.toMatch(/<button\b/i);
    }
    for (const region of extractElementInnerHtmlByAttr(abyssHtml, /\brole="alert"/)) {
      expect(region).not.toMatch(/<button\b/i);
    }
  });

  it('evaluates analyzeEndgameReadiness identically for canonical active, historical, and custom sandbox cycles under pinned evaluatedAt', () => {
    const active = analyzeEndgameReadiness(sampleRoster, ABYSS_CYCLES[0], {
      evaluatedAt: '2026-11-23',
    });
    expect(active.reliability.status).toBe('reliable');
    expect(active.reliability.isActionable).toBe(true);
    expect(active.reliability.evaluatedAt).toBe('2026-11-23');

    const cycle53 = ABYSS_CYCLES.find((c) => c.id === 'cycle-5-3')!;
    const historical = analyzeEndgameReadiness(sampleRoster, cycle53, {
      evaluatedAt: '2026-11-23',
    });
    expect(historical.reliability.status).toBe('historical');
    expect(historical.reliability.isActionable).toBe(false);

    const custom = createCustomSandboxCycle();
    const sandbox = analyzeEndgameReadiness(sampleRoster, custom, {
      evaluatedAt: '2026-11-23',
    });
    expect(sandbox.reliability.status).toBe('qualified');
    expect(sandbox.reliability.mode).toBe('sandbox_simulation');
    expect(sandbox.reliability.isActionable).toBe(false);
  });
});
