import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ArtifactStopView } from './ArtifactStopView';

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

function extractDisclosureAriaControls(html: string): string[] {
  const ids: string[] = [];
  const re = /aria-controls="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    // Only collect reliability panel controls (exclude tablist panel aria-controls)
    if (!match[1].startsWith('artifact-panel-')) {
      ids.push(match[1]);
    }
  }
  return ids;
}

describe('ArtifactStopView Component (M9 Phase 4 — Slice 3.2)', () => {
  it('renders Sandbox reliability badge and banner by default with no saved artifacts', () => {
    const html = renderToString(<ArtifactStopView />);
    const decoded = decodeHtmlEntities(html);

    expect(decoded).toContain('When Is Artifact Farming No Longer Worth Your Resin?');
    expect(decoded).toContain('Showing baseline 5-piece estimation.');
    expect(decoded).toContain('data-reliability-tone="qualified_info"');
    expect(decoded).toContain('Sandbox');
    expect(decoded).toContain('Not Live-Actionable · Simulation');
    expect(decoded).toContain('aria-label="Artifact Stop Optimizer reliability context"');
    expect(decoded).toContain('Sandbox Simulation');

    // Legacy DataFreshnessBadge is replaced
    expect(decoded).not.toContain('Data Freshness Status:');
  });

  it('links badge and banner disclosure controls to the same mounted closed details panel', () => {
    const html = renderToString(<ArtifactStopView />);
    const controlledIds = extractDisclosureAriaControls(html);

    expect(controlledIds).toHaveLength(2);
    expect(controlledIds[0]).toBe(controlledIds[1]);
    const panelId = controlledIds[0];

    expect(html).toContain(`id="${panelId}"`);

    const panelTag = html.match(new RegExp(`<div[^>]*id="${panelId}"[^>]*>`))?.[0];
    expect(panelTag).toBeDefined();
    expect(panelTag).toContain('hidden=""');
    expect(panelTag).toContain('aria-hidden="true"');

    // Both badge and banner disclosure triggers start collapsed
    const expandedMatches = html.match(/aria-expanded="false"/g) ?? [];
    expect(expandedMatches.length).toBeGreaterThanOrEqual(2);
    expect(html).not.toMatch(/aria-controls="[^"]*"[^>]*aria-expanded="true"/);
  });

  it('includes full legacy provenance metadata and unattested dependency warnings in the mounted details panel', () => {
    const html = renderToString(<ArtifactStopView />);
    const decoded = decodeHtmlEntities(html);

    expect(decoded).toContain('Artifact Stop Optimizer — Reliability Details');
    expect(decoded).toContain('artifact_weights_v7_2');
    expect(decoded).toContain('characters_v7_2_batch7');
    expect(decoded).toContain('Provenance Matched');
    expect(decoded).toContain('Theorycraft Consensus');
    expect(decoded).toContain('2026-11-16');
    expect(decoded).toContain('statWeights, substatRollValues, mainStatTargets, setEffects');
    expect(decoded).toContain(
      'Version 7.2 substat roll tiers, marginal roll value weights, and 2pc/4pc combat set effect modifiers',
    );
    expect(html).toContain('href="https://keqingmains.com/"');
    expect(decoded).toContain('DOMAIN_CONSTANTS');
    expect(decoded).toContain('DOMAIN_PAIRS_REGISTRY');
    expect(decoded).toContain('STRONGBOX_SETS_SET');
  });

  it('maintains valid disclosure structure with zero nested buttons or interactive controls inside status/alert regions', () => {
    const html = renderToString(<ArtifactStopView />);

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
  });
});
