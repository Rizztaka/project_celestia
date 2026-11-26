import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { OwnedWeapon } from '../types/genshin';
import { CHARACTERS } from '../data/characters';
import { rankWeaponsForCharacter } from '../engines/weapon-solver';
import { formatReliabilityPresentation } from '../services/reliability-presentation';
import { CharacterDetailModal } from './CharacterDetailModal';
import { RecommendationReliabilityBadge } from './RecommendationReliabilityBadge';
import { RecommendationReliabilityBanner } from './RecommendationReliabilityBanner';
import { ReliabilityDetailsPanel } from './ReliabilityDetailsPanel';

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
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
    // Exclude CharacterDetailModal tabpanel IDs
    if (!match[1].startsWith('char-panel-')) {
      ids.push(match[1]);
    }
  }
  return ids;
}

function assertAccessibilityInvariants(html: string, expectedTriggerCount: number): string {
  expect(hasNestedButtons(html)).toBe(false);

  // Reliability badge button must never be nested inside an <h3> heading
  for (const headingHtml of html.match(/<h3\b[^>]*>[\s\S]*?<\/h3>/g) ?? []) {
    expect(headingHtml).not.toContain('Toggle reliability details.');
  }

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

  const controlledIds = extractReliabilityAriaControls(html);
  expect(controlledIds).toHaveLength(expectedTriggerCount);
  const uniqueIds = new Set(controlledIds);
  expect(uniqueIds.size).toBe(1);

  const panelId = controlledIds[0];
  expect(html).toContain(`id="${panelId}"`);
  return panelId;
}

const huTao = CHARACTERS.find((c) => c.id === 'HuTao')!;
const nefer = CHARACTERS.find((c) => c.id === 'Nefer')!;
const travelerAnemo = CHARACTERS.find((c) => c.id === 'TravelerAnemo')!;
const travelerPyro = CHARACTERS.find((c) => c.id === 'TravelerPyro')!;

const sampleWeapons: OwnedWeapon[] = [
  {
    id: 'owned_homa_1',
    key: 'StaffOfHoma',
    name: 'Staff of Homa',
    level: 90,
    refinement: 1,
    rarity: 5,
    location: 'HuTao',
  },
  {
    id: 'owned_fav_sword_1',
    key: 'FavoniusSword',
    name: 'Favonius Sword',
    level: 90,
    refinement: 3,
    rarity: 4,
    location: '',
  },
];

describe('CharacterDetailModal Component (M9 Phase 4 — Slice 3.3)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('1. Healthy reliability presentation', () => {
    it('renders Reliable badge, omits banner when healthy, and mounts a collapsed details panel', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));

      const html = renderToString(
        <CharacterDetailModal
          character={huTao}
          onClose={() => {}}
          isOwned={true}
          weapons={sampleWeapons}
        />,
      );
      const decoded = decodeHtmlEntities(html);
      const expected = rankWeaponsForCharacter(huTao, sampleWeapons, undefined, {
        evaluatedAt: '2026-11-23',
      });
      const expectedModel = formatReliabilityPresentation(expected.reliability);

      expect(decoded).toContain('Estimated Weapon Suitability (1)');
      expect(decoded).toContain(expectedModel.badgeLabel);
      expect(decoded).toContain(expectedModel.actionabilityLabel);
      expect(decoded).toContain(`data-reliability-tone="${expectedModel.badgeTone}"`);
      expect(decoded).toContain('data-reliability-status="reliable"');

      // Banner is intentionally omitted when healthy (containerKind === 'none')
      expect(decoded).not.toContain('data-reliability-container=');
      expect(decoded).not.toContain('aria-label="Weapon Suitability reliability context"');

      // Badge must be the sole disclosure trigger and point to the mounted collapsed panel
      const panelId = assertAccessibilityInvariants(html, 1);
      const panelTag = html.match(new RegExp(`<div[^>]*id="${panelId}"[^>]*>`))?.[0];
      expect(panelTag).toBeDefined();
      expect(panelTag).toContain('hidden=""');
      expect(panelTag).toContain('aria-hidden="true"');
      expect(decoded).toContain('Weapon Suitability — Reliability Details');
      expect(decoded).toContain('Evaluated UTC: 2026-11-23');
      expect(html).toContain('aria-expanded="false"');
    });
  });

  describe('2. Shared disclosure wiring across badge, banner, and details panel', () => {
    it('synchronizes aria-controls, aria-expanded, and open/close state across healthy and stale envelopes', () => {
      const envelopes = [
        rankWeaponsForCharacter(huTao, sampleWeapons, undefined, { evaluatedAt: '2026-11-23' })
          .reliability,
        rankWeaponsForCharacter(huTao, sampleWeapons, undefined, { evaluatedAt: '2027-01-10' })
          .reliability,
      ];

      for (const reliability of envelopes) {
        const panelId = `char-detail-panel-${reliability.status}`;
        const model = formatReliabilityPresentation(reliability);
        const expectedTriggers = model.containerKind === 'none' ? 1 : 2;

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
              contextLabel="Weapon Suitability"
              detailsControlsId={panelId}
              isDetailsOpen={false}
              onToggleDetails={() => {}}
            />
            <ReliabilityDetailsPanel
              id={panelId}
              reliability={reliability}
              isOpen={false}
              onClose={() => {}}
              contextLabel="Weapon Suitability"
            />
          </div>,
        );

        expect(closedHtml).toContain('aria-expanded="false"');
        expect(closedHtml).not.toContain('aria-expanded="true"');
        assertAccessibilityInvariants(closedHtml, expectedTriggers);
        const closedPanelTag = closedHtml.match(new RegExp(`<div[^>]*id="${panelId}"[^>]*>`))?.[0];
        expect(closedPanelTag).toContain('hidden=""');
        expect(closedPanelTag).toContain('aria-hidden="true"');

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
              contextLabel="Weapon Suitability"
              detailsControlsId={panelId}
              isDetailsOpen={true}
              onToggleDetails={() => {}}
            />
            <ReliabilityDetailsPanel
              id={panelId}
              reliability={reliability}
              isOpen={true}
              onClose={() => {}}
              contextLabel="Weapon Suitability"
            />
          </div>,
        );

        const decodedOpen = decodeHtmlEntities(openHtml);
        expect(openHtml).toContain('aria-expanded="true"');
        expect(openHtml).not.toContain('aria-expanded="false"');
        if (expectedTriggers === 2) {
          expect(decodedOpen).toContain('Hide Details');
        }
        assertAccessibilityInvariants(openHtml, expectedTriggers);
        const openPanelTag = openHtml.match(new RegExp(`<div[^>]*id="${panelId}"[^>]*>`))?.[0];
        expect(openPanelTag).toBeDefined();
        expect(openPanelTag).not.toMatch(/\bhidden\b/);
        expect(openPanelTag).not.toContain('aria-hidden="true"');
        expect(decodedOpen).toContain('Weapon Suitability — Reliability Details');
        expect(decodedOpen).toContain('Close');
        expect(decodedOpen).toContain('characters_v7_2_batch7');
        expect(decodedOpen).toContain('weapons_v7_2_signatures');
        expect(decodedOpen).toContain('artifact_weights_v7_2');
      }
    });
  });

  describe('3. Empty weapon inventory', () => {
    it('keeps reliability badge and mounted details panel available when weapons={[]}', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));

      const html = renderToString(
        <CharacterDetailModal
          character={huTao}
          onClose={() => {}}
          isOwned={false}
          weapons={[]}
        />,
      );
      const decoded = decodeHtmlEntities(html);

      expect(decoded).toContain('Estimated Weapon Suitability (0)');
      expect(decoded).toContain('No owned Polearm found in your armory.');
      expect(decoded).toContain('Reliable');
      expect(decoded).toContain('Live-Actionable');
      expect(decoded).toContain('data-reliability-tone="reliable"');
      expect(decoded).toContain('Weapon Suitability — Reliability Details');

      const panelId = assertAccessibilityInvariants(html, 1);
      const panelTag = html.match(new RegExp(`<div[^>]*id="${panelId}"[^>]*>`))?.[0];
      expect(panelTag).toContain('hidden=""');
      expect(panelTag).toContain('aria-hidden="true"');
    });
  });

  describe('4. Stale / degraded reliability presentation', () => {
    it('renders Qualified · Stale Dependency badge, status banner, shared aria-controls, and full provenance rows when artifact_weights_v7_2 exceeds 42 days', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2027-01-10T12:00:00Z'));

      const html = renderToString(
        <CharacterDetailModal
          character={huTao}
          onClose={() => {}}
          isOwned={true}
          weapons={sampleWeapons}
        />,
      );
      const decoded = decodeHtmlEntities(html);

      expect(decoded).toContain('Qualified · Stale Dependency');
      expect(decoded).toContain('Live-Actionable · Qualified');
      expect(decoded).toContain('data-reliability-tone="qualified_caution"');
      expect(decoded).toContain('data-reliability-container="status"');
      expect(decoded).toContain('Qualified Recommendation (Stale Dependency)');
      expect(decoded).toContain('artifact_weights_v7_2');
      expect(decoded).toContain('Details');

      // Both badge and banner Details triggers reference the same mounted panel ID
      const panelId = assertAccessibilityInvariants(html, 2);
      const panelTag = html.match(new RegExp(`<div[^>]*id="${panelId}"[^>]*>`))?.[0];
      expect(panelTag).toBeDefined();
      expect(panelTag).toContain('hidden=""');

      // Provenance details in the mounted panel reflect the actual weapon-solver envelope
      expect(decoded).toContain('Weapon Suitability — Reliability Details');
      expect(decoded).toContain('Evaluated UTC: 2027-01-10');
      expect(decoded).toContain('characters_v7_2_batch7');
      expect(decoded).toContain('weapons_v7_2_signatures');
      expect(decoded).toContain('Provenance Matched');
      expect(decoded).toContain('In-Game Verified');
      expect(decoded).toContain('Theorycraft Consensus');
      expect(html).toContain('href="https://genshin.hoyoverse.com/en/news"');
      expect(html).toContain('href="https://keqingmains.com/"');
    });
  });

  describe('5. Character switching baseline (SSR verification; interactive reset covered in Playwright)', () => {
    it('renders weapon-ranking reliability cleanly for Traveler variants and distinct characters', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));

      for (const char of [travelerAnemo, travelerPyro, nefer]) {
        const html = renderToString(
          <CharacterDetailModal
            character={char}
            onClose={() => {}}
            isOwned={true}
            weapons={sampleWeapons}
          />,
        );
        const decoded = decodeHtmlEntities(html);
        const expected = rankWeaponsForCharacter(char, sampleWeapons, undefined, {
          evaluatedAt: '2026-11-23',
        });
        const expectedModel = formatReliabilityPresentation(expected.reliability);

        expect(decoded).toContain(`${char.name}`);
        expect(decoded).toContain(expectedModel.badgeLabel);
        expect(decoded).toContain(expectedModel.actionabilityLabel);
        const panelId = assertAccessibilityInvariants(html, 1);
        const panelTag = html.match(new RegExp(`<div[^>]*id="${panelId}"[^>]*>`))?.[0];
        expect(panelTag).toContain('hidden=""');
      }
    });
  });
});
