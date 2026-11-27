import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { OwnedCharacterProfile, OwnedWeapon, PullBudgetState } from '../types/genshin';
import { BANNER_PHASES } from '../data/banners';
import { CHARACTERS } from '../data/characters';
import { WEAPONS_DATA } from '../data/weapons';
import { evaluateComprehensivePullROI } from '../engines/pull-advisor';
import { formatReliabilityPresentation } from '../services/reliability-presentation';
import { PullAdvisorView } from './PullAdvisorView';
import { RecommendationReliabilityBadge } from './RecommendationReliabilityBadge';
import { RecommendationReliabilityBanner } from './RecommendationReliabilityBanner';
import { ReliabilityDetailsPanel } from './ReliabilityDetailsPanel';

function decodeHtmlEntities(html: string): string {
  return html
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

function extractAriaControlsIds(html: string): string[] {
  const ids: string[] = [];
  const re = /aria-controls="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}

function assertAccessibilityInvariants(html: string): void {
  expect(hasNestedButtons(html)).toBe(false);

  // Verify reliability status/alert regions never wrap interactive buttons
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

  const controlledIds = extractAriaControlsIds(html);
  expect(controlledIds.length).toBeGreaterThanOrEqual(2);
  for (const id of controlledIds) {
    expect(html).toContain(`id="${id}"`);
  }
}

function expectPressedButton(decodedHtml: string, label: string, pressed: boolean): void {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<button[^>]*aria-pressed="${pressed}"[^>]*>${escaped}</button>`);
  expect(decodedHtml).toMatch(re);
}

const DEFAULT_TEST_BUDGET: PullBudgetState = {
  primogems: 1600,
  fates: 0,
  characterPity: 0,
  characterGuaranteed: false,
  weaponPity: 0,
  weaponFatePoints: 0,
};

describe('PullAdvisorView Component (M9 Phase 4 — Slice 3.1)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Date-deterministic default banner selection & reliability integration', () => {
    it('selects banner_7_2_phase_1 on 2026-11-23 and renders reliability badge, banner, and closed details panel', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));

      const html = renderToString(<PullAdvisorView ownedIds={[]} />);
      const decoded = decodeHtmlEntities(html);
      const expectedCollection = evaluateComprehensivePullROI(
        {},
        [],
        DEFAULT_TEST_BUDGET,
        'banner_7_2_phase_1',
        { evaluatedAt: '2026-11-23' },
      );
      const expectedModel = formatReliabilityPresentation(expectedCollection.reliability);

      expectPressedButton(decoded, '7.2 P1: Mitya & Furina', true);
      expectPressedButton(decoded, '7.2 P2: Zibai & Linnea', false);
      expect(decoded).toContain(expectedModel.badgeLabel);
      expect(decoded).toContain(expectedModel.actionabilityLabel);
      expect(decoded).toContain(`data-reliability-tone="${expectedModel.badgeTone}"`);
      expect(decoded).toContain('aria-label="Pull Advisor reliability context"');
      expect(decoded).toContain('aria-expanded="false"');
      expect(decoded).toContain('Pull Advisor — Reliability Details');
      expect(decoded).toContain('Evaluated UTC: 2026-11-23');

      // Legacy freshness UI is replaced in PullAdvisorView
      expect(decoded).not.toContain('Data Freshness Status:');
      expect(decoded).not.toContain('Outdated Banner Schedule Data');
      expect(decoded).not.toContain('Provisional Banner Schedule Data');

      assertAccessibilityInvariants(html);
    });

    it('selects active banner_7_2_phase_2 on 2026-11-25 instead of hardcoded Phase 1', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-25T12:00:00Z'));

      const html = renderToString(<PullAdvisorView ownedIds={[]} />);
      const decoded = decodeHtmlEntities(html);

      expectPressedButton(decoded, '7.2 P2: Zibai & Linnea', true);
      expectPressedButton(decoded, '7.2 P1: Mitya & Furina', false);
      expect(decoded).toContain('Zibai');
      expect(decoded).toContain('Linnea');
      expect(decoded).toContain('Evaluated UTC: 2026-11-25');
      expect(decoded).toContain('data-reliability-tone="qualified_info"');
      expect(decoded).toContain('Advisory-Only Recommendation');

      assertAccessibilityInvariants(html);
    });

    it('renders historical archive reliability state when all schedules are expired (2026-12-16)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-12-16T12:00:00Z'));

      const html = renderToString(<PullAdvisorView ownedIds={[]} />);
      const decoded = decodeHtmlEntities(html);

      expectPressedButton(decoded, '7.2 P2: Zibai & Linnea', true);
      expect(decoded).toContain('data-reliability-tone="historical"');
      expect(decoded).toContain('Historical');
      expect(decoded).toContain('Not Live-Actionable · Archive');
      expect(decoded).toContain('Historical Archive Simulation');
      expect(decoded).toContain('Evaluated UTC: 2026-12-16');

      assertAccessibilityInvariants(html);
    });

    it('renders planning preview reliability state for upcoming v7.2 schedule date (2026-11-01)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));

      const html = renderToString(<PullAdvisorView ownedIds={[]} />);
      const decoded = decodeHtmlEntities(html);

      expectPressedButton(decoded, '7.2 P1: Mitya & Furina', true);
      expect(decoded).toContain('data-reliability-tone="qualified_info"');
      expect(decoded).toContain('Preview');
      expect(decoded).toContain('Not Live-Actionable · Preview');
      expect(decoded).toContain('Planning Preview');
      expect(decoded).toContain('Evaluated UTC: 2026-11-01');

      assertAccessibilityInvariants(html);
    });
  });

  describe('Empty recommendation results & sandbox fallback visibility', () => {
    it('keeps reliability badge, banner, and details panel rendered when recommendations are empty', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-25T12:00:00Z'));

      const maxedProfiles: Record<string, OwnedCharacterProfile> = {};
      for (const char of CHARACTERS) {
        maxedProfiles[char.id] = {
          id: char.id,
          level: 90,
          constellation: 6,
        };
      }
      const allWeaponsOwned: OwnedWeapon[] = WEAPONS_DATA.map((w, idx) => ({
        id: `owned-${w.key}-${idx}`,
        key: w.key,
        name: w.name,
        level: 90,
        refinement: 1,
        location: '',
      }));

      // Temporarily empty BANNER_PHASES so selectDefaultBannerId() falls back to 'sandbox'
      // and evaluateComprehensivePullROI returns items: [] when every target is maxed.
      const savedPhases = BANNER_PHASES.splice(0, BANNER_PHASES.length);
      let html: string;
      try {
        html = renderToString(
          <PullAdvisorView
            ownedIds={Object.keys(maxedProfiles)}
            profiles={maxedProfiles}
            weapons={allWeaponsOwned}
          />,
        );
      } finally {
        BANNER_PHASES.push(...savedPhases);
      }

      const decoded = decodeHtmlEntities(html);

      expect(decoded).toContain('All targets in this banner phase are already maxed out!');
      expect(decoded).toContain('Open All-Target Sandbox');
      expect(decoded).toContain('data-reliability-tone="qualified_info"');
      expect(decoded).toContain('Sandbox');
      expect(decoded).toContain('Sandbox Simulation');
      expect(decoded).toContain('aria-label="Pull Advisor reliability context"');
      expect(decoded).toContain('Pull Advisor — Reliability Details');

      assertAccessibilityInvariants(html);
    });
  });

  describe('Disclosure accessibility & multi-mode envelope rendering', () => {
    it('links badge and banner aria-controls to mounted ReliabilityDetailsPanel and toggles open/closed semantics cleanly across modes', () => {
      const modes = [
        evaluateComprehensivePullROI({}, [], DEFAULT_TEST_BUDGET, 'banner_7_2_phase_2', {
          evaluatedAt: '2026-11-25',
        }).reliability,
        evaluateComprehensivePullROI({}, [], DEFAULT_TEST_BUDGET, 'sandbox', {
          evaluatedAt: '2026-11-25',
        }).reliability,
        evaluateComprehensivePullROI({}, [], DEFAULT_TEST_BUDGET, 'all', {
          evaluatedAt: '2026-11-25',
        }).reliability,
        evaluateComprehensivePullROI({}, [], DEFAULT_TEST_BUDGET, 'banner_7_2_phase_1', {
          evaluatedAt: '2026-11-25',
        }).reliability,
        evaluateComprehensivePullROI({}, [], DEFAULT_TEST_BUDGET, 'banner_unknown_phase', {
          evaluatedAt: '2026-11-25',
        }).reliability,
      ];

      for (const reliability of modes) {
        const panelId = `pull-advisor-panel-${reliability.mode}-${reliability.status}`;
        const model = formatReliabilityPresentation(reliability);

        const closedHtml = renderToString(
          <div>
            <RecommendationReliabilityBadge
              reliability={reliability}
              size="sm"
              detailsControlsId={panelId}
              isDetailsOpen={false}
              onToggleDetails={() => {}}
            />
            <RecommendationReliabilityBanner
              reliability={reliability}
              contextLabel="Pull Advisor"
              detailsControlsId={panelId}
              isDetailsOpen={false}
              onToggleDetails={() => {}}
            />
            <ReliabilityDetailsPanel
              id={panelId}
              reliability={reliability}
              isOpen={false}
              onClose={() => {}}
              contextLabel="Pull Advisor"
            />
          </div>,
        );

        expect(closedHtml).toContain('aria-expanded="false"');
        expect(closedHtml).toContain(`aria-controls="${panelId}"`);
        expect(decodeHtmlEntities(closedHtml)).toContain(model.badgeLabel);
        expect(closedHtml).toContain('hidden=""');
        expect(closedHtml).toContain('aria-hidden="true"');
        assertAccessibilityInvariants(closedHtml);

        const openHtml = renderToString(
          <div>
            <RecommendationReliabilityBadge
              reliability={reliability}
              size="sm"
              detailsControlsId={panelId}
              isDetailsOpen={true}
              onToggleDetails={() => {}}
            />
            <RecommendationReliabilityBanner
              reliability={reliability}
              contextLabel="Pull Advisor"
              detailsControlsId={panelId}
              isDetailsOpen={true}
              onToggleDetails={() => {}}
            />
            <ReliabilityDetailsPanel
              id={panelId}
              reliability={reliability}
              isOpen={true}
              onClose={() => {}}
              contextLabel="Pull Advisor"
            />
          </div>,
        );

        const decodedOpen = decodeHtmlEntities(openHtml);
        expect(openHtml).toContain('aria-expanded="true"');
        expect(openHtml).toContain('Hide Details');
        expect(decodedOpen).toContain('Pull Advisor — Reliability Details');
        expect(decodedOpen).toContain('Status');
        expect(decodedOpen).toContain('Mode');
        expect(decodedOpen).toContain('Verification');
        expect(decodedOpen).toContain('Temporal State');
        expect(decodedOpen).toContain('Actionability');
        expect(decodedOpen).toContain('Close');

        const openPanelTag = openHtml.match(new RegExp(`<div[^>]*id="${panelId}"[^>]*>`))?.[0];
        expect(openPanelTag).toBeDefined();
        expect(openPanelTag).not.toMatch(/\bhidden\b/);
        expect(openPanelTag).not.toContain('aria-hidden="true"');
        assertAccessibilityInvariants(openHtml);
      }
    });

    it('renders full banner provenance evidence inside open ReliabilityDetailsPanel for banner_7_2_phase_2', () => {
      const collection = evaluateComprehensivePullROI(
        {},
        [],
        DEFAULT_TEST_BUDGET,
        'banner_7_2_phase_2',
        { evaluatedAt: '2026-11-25' },
      );

      const openPanelHtml = renderToString(
        <ReliabilityDetailsPanel
          id="pull-advisor-details-open"
          reliability={collection.reliability}
          isOpen={true}
          onClose={() => {}}
          contextLabel="Pull Advisor"
        />,
      );
      const decoded = decodeHtmlEntities(openPanelHtml);

      expect(decoded).toContain('banner_7_2_phase_2');
      expect(decoded).toContain('Provenance Matched');
      expect(decoded).toContain('Version 7.2 Phase 2 Event Wish notice');
      expect(decoded).toContain('Reference Source');
      expect(openPanelHtml).toContain('href="https://genshin.hoyoverse.com/en/news"');
      expect(decoded).toContain('SIGNATURE_WEAPONS');
    });

    it('suppresses the maxed-out empty state banner when bannerFilter is unsupported', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));

      const maxedProfiles: Record<string, OwnedCharacterProfile> = {};
      for (const char of CHARACTERS) {
        maxedProfiles[char.id] = { id: char.id, level: 90, constellation: 6 };
      }
      const allWeaponsOwned: OwnedWeapon[] = WEAPONS_DATA.map((w, idx) => ({
        id: `owned-${w.key}-${idx}`,
        key: w.key,
        name: w.name,
        level: 90,
        refinement: 1,
        location: '',
      }));

      const savedPhases = BANNER_PHASES.splice(0, BANNER_PHASES.length);
      let html: string;
      try {
        BANNER_PHASES.push({
          ...savedPhases[0],
          id: 'banner_unknown_9_9',
          startDate: '2026-11-01',
          endDate: '2026-12-30',
        });
        html = renderToString(
          <PullAdvisorView
            ownedIds={Object.keys(maxedProfiles)}
            profiles={maxedProfiles}
            weapons={allWeaponsOwned}
          />,
        );
      } finally {
        BANNER_PHASES.splice(0, BANNER_PHASES.length, ...savedPhases);
      }

      const decoded = decodeHtmlEntities(html);
      expect(decoded).toContain('Unsupported Recommendation Context');
      expect(decoded).toContain('Reset Banner Filter');
      expect(decoded).not.toContain('All targets in this banner phase are already maxed out!');
      assertAccessibilityInvariants(html);
    });
  });
});
