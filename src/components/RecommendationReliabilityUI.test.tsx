import { describe, it, expect, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import type {
  DataProvenance,
  RecommendationReliability,
  ReliabilityDependencyDetail,
} from '../types/genshin';
import { DATA_PROVENANCE_REGISTRY } from '../data/provenance-registry';
import { formatReliabilityPresentation } from '../services/reliability-presentation';
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

function buildEnvelope(
  overrides: Partial<RecommendationReliability> = {},
): RecommendationReliability {
  return {
    status: 'reliable',
    mode: 'current',
    isActionable: true,
    verification: 'verified',
    temporalState: 'active',
    provenanceIds: [],
    warnings: [],
    dependencies: [],
    evaluatedAt: '2026-11-23',
    ...overrides,
  };
}

function makeDepFromRecord(
  record: DataProvenance,
  overrides: Partial<ReliabilityDependencyDetail> = {},
): ReliabilityDependencyDetail {
  return {
    datasetId: record.datasetId,
    required: true,
    verification: record.status,
    policy: 'version_bound',
    riskTier: 'high',
    version: record.version,
    verifiedAt: record.verifiedAt,
    ...overrides,
  };
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

function assertStructuralGuarantees(html: string): void {
  expect(html).not.toMatch(/<article\b/i);
  expect(hasNestedButtons(html)).toBe(false);

  const statusRegions = extractElementInnerHtmlByAttr(html, /\brole="status"/);
  for (const content of statusRegions) {
    expect(content).not.toMatch(/<button\b/i);
  }

  const alertRegions = extractElementInnerHtmlByAttr(html, /\brole="alert"/);
  for (const content of alertRegions) {
    expect(content).not.toMatch(/<button\b/i);
  }

  const controlledIds = extractAriaControlsIds(html);
  for (const id of controlledIds) {
    expect(html).toContain(`id="${id}"`);
  }
}

describe('Shared Recommendation Reliability UI Components (M9 Phase 4 — Slice 2)', () => {
  const temporaryRegistryKeys: string[] = [];

  function registerTempProvenance(key: string, record: DataProvenance): void {
    temporaryRegistryKeys.push(key);
    DATA_PROVENANCE_REGISTRY[key] = record;
  }

  afterEach(() => {
    while (temporaryRegistryKeys.length > 0) {
      const key = temporaryRegistryKeys.pop();
      if (key !== undefined) {
        delete DATA_PROVENANCE_REGISTRY[key];
      }
    }
  });

  describe('A. Reliable state', () => {
    const verifiedRec = DATA_PROVENANCE_REGISTRY.characters_v7_2_batch7;
    const reliableEnvelope = buildEnvelope({
      status: 'reliable',
      mode: 'current',
      isActionable: true,
      verification: 'verified',
      temporalState: 'active',
      provenanceIds: [verifiedRec.datasetId],
      dependencies: [makeDepFromRecord(verifiedRec)],
      warnings: [],
    });

    it('renders reliable badge label/tone, interactive ARIA trigger, omits banner, and keeps details panel mounted while closed', () => {
      const panelId = 'reliable-details-panel';
      const noop = () => {};

      const combinedClosed = renderToString(
        <div>
          <RecommendationReliabilityBadge
            reliability={reliableEnvelope}
            detailsControlsId={panelId}
            isDetailsOpen={false}
            onToggleDetails={noop}
          />
          <RecommendationReliabilityBanner
            reliability={reliableEnvelope}
            contextLabel="Team Synergy Solver"
            detailsControlsId={panelId}
            isDetailsOpen={false}
            onToggleDetails={noop}
          />
          <ReliabilityDetailsPanel
            id={panelId}
            reliability={reliableEnvelope}
            isOpen={false}
            contextLabel="Team Synergy Solver"
          />
        </div>,
      );

      expect(combinedClosed).toContain('Reliable');
      expect(combinedClosed).toContain('Live-Actionable');
      expect(combinedClosed).toContain('data-reliability-tone="reliable"');
      expect(combinedClosed).toContain('aria-expanded="false"');
      expect(combinedClosed).toContain(`aria-controls="${panelId}"`);

      // Banner is omitted for containerKind === 'none'
      const bannerOnly = renderToString(
        <RecommendationReliabilityBanner
          reliability={reliableEnvelope}
          contextLabel="Team Synergy Solver"
          detailsControlsId={panelId}
          onToggleDetails={noop}
        />,
      );
      expect(bannerOnly).toBe('');

      // Closed panel stays in DOM with hidden and aria-hidden="true"
      const closedPanelTag = combinedClosed.match(
        new RegExp(`<div[^>]*id="${panelId}"[^>]*>`),
      )?.[0];
      expect(closedPanelTag).toBeDefined();
      expect(closedPanelTag).toContain('hidden');
      expect(closedPanelTag).toContain('aria-hidden="true"');

      assertStructuralGuarantees(combinedClosed);
    });

    it('renders open details panel without closed-state attributes and displays all five axes and Close button', () => {
      const panelId = 'reliable-details-open';
      const noop = () => {};

      const openHtml = renderToString(
        <ReliabilityDetailsPanel
          id={panelId}
          reliability={reliableEnvelope}
          isOpen={true}
          onClose={noop}
          contextLabel="Team Synergy Solver"
        />,
      );

      const openPanelTag = openHtml.match(new RegExp(`<div[^>]*id="${panelId}"[^>]*>`))?.[0];
      expect(openPanelTag).toBeDefined();
      expect(openPanelTag).not.toMatch(/\bhidden\b/);
      expect(openPanelTag).not.toContain('aria-hidden="true"');

      expect(openHtml).toContain('Status');
      expect(openHtml).toContain('Mode');
      expect(openHtml).toContain('Verification');
      expect(openHtml).toContain('Temporal State');
      expect(openHtml).toContain('Actionability');
      expect(openHtml).toContain('Evaluated UTC: 2026-11-23');
      expect(openHtml).toContain('Close');
      expect(openHtml).not.toMatch(/<article\b/i);
    });
  });

  describe('B. Qualified state (actionable status & passive context)', () => {
    it('renders actionable status banner with isolated [role="status"] text and sibling controls referencing panel ID', () => {
      const cadenceRec = DATA_PROVENANCE_REGISTRY.rotations_v7_2_catalog;
      const staleWarning = 'Required dataset "rotations_v7_2_catalog" exceeded 42-day cadence.';
      const qualifiedStatusEnvelope = buildEnvelope({
        status: 'qualified',
        mode: 'current',
        isActionable: true,
        verification: 'stale',
        temporalState: 'not_applicable',
        provenanceIds: [cadenceRec.datasetId],
        dependencies: [
          makeDepFromRecord(cadenceRec, {
            verification: 'stale',
            policy: 'patch_cadence',
            riskTier: 'low',
            reason: 'age_exceeded',
          }),
        ],
        warnings: [staleWarning],
      });

      const panelId = 'qualified-status-details';
      const noop = () => {};

      const html = renderToString(
        <div>
          <RecommendationReliabilityBanner
            reliability={qualifiedStatusEnvelope}
            contextLabel="Artifact Stop Optimizer"
            detailsControlsId={panelId}
            isDetailsOpen={false}
            onToggleDetails={noop}
            secondaryAction={{ label: 'View Methodology', onClick: noop }}
          />
          <ReliabilityDetailsPanel
            id={panelId}
            reliability={qualifiedStatusEnvelope}
            isOpen={false}
            contextLabel="Artifact Stop Optimizer"
          />
        </div>,
      );

      const statusRegions = extractElementInnerHtmlByAttr(html, /\brole="status"/);
      expect(statusRegions).toHaveLength(1);
      expect(statusRegions[0]).toContain('Qualified Recommendation (Stale Dependency)');
      expect(statusRegions[0]).not.toMatch(/<button\b/i);

      expect(html).toContain('shrink-0 flex flex-wrap items-center gap-2');
      expect(html).toContain(`aria-controls="${panelId}"`);
      expect(html).toContain('Details');
      expect(html).toContain('View Methodology');

      assertStructuralGuarantees(html);
    });

    it('renders passive context banner as <section> with accessible label and no status or alert role', () => {
      const coreRec = DATA_PROVENANCE_REGISTRY.characters_v7_2_batch7;
      const advisoryWarning =
        'Unattested local table "SIGNATURE_WEAPONS" lacks a provenance record.';
      const qualifiedContextEnvelope = buildEnvelope({
        status: 'qualified',
        mode: 'current',
        isActionable: false,
        verification: 'verified',
        temporalState: 'not_applicable',
        provenanceIds: [coreRec.datasetId],
        dependencies: [makeDepFromRecord(coreRec, { verification: 'verified' })],
        warnings: [advisoryWarning],
      });

      const panelId = 'qualified-context-details';
      const noop = () => {};

      const html = renderToString(
        <div>
          <RecommendationReliabilityBanner
            reliability={qualifiedContextEnvelope}
            contextLabel="Pull Advisor"
            detailsControlsId={panelId}
            isDetailsOpen={false}
            onToggleDetails={noop}
          />
          <ReliabilityDetailsPanel
            id={panelId}
            reliability={qualifiedContextEnvelope}
            isOpen={false}
          />
        </div>,
      );

      expect(html).toContain('<section aria-label="Pull Advisor reliability context"');
      expect(html).not.toContain('role="status"');
      expect(html).not.toContain('role="alert"');

      // Warning already embedded in bannerSummary must not be duplicated in the banner
      const bannerOnly = decodeHtmlEntities(
        renderToString(
          <RecommendationReliabilityBanner
            reliability={qualifiedContextEnvelope}
            contextLabel="Pull Advisor"
          />,
        ),
      );
      expect(bannerOnly.split(advisoryWarning).length - 1).toBe(1);

      assertStructuralGuarantees(html);
    });
  });

  describe('C. Unsupported state', () => {
    it('renders [role="alert"][aria-live="assertive"] with zero buttons inside and keeps recovery/details controls outside', () => {
      const blockingWarning = 'Unknown abyss schedule entity "cycle-unknown".';
      const unsupportedEnvelope = buildEnvelope({
        status: 'unsupported',
        mode: 'current',
        isActionable: false,
        verification: 'unregistered',
        temporalState: 'not_applicable',
        provenanceIds: [],
        warnings: [blockingWarning],
        dependencies: [
          {
            datasetId: 'cycle-unknown',
            required: true,
            verification: 'unregistered',
            policy: 'schedule_window',
            riskTier: 'high',
            reason: 'missing_provenance',
          },
        ],
      });

      const panelId = 'unsupported-details-panel';
      const noop = () => {};

      const html = renderToString(
        <div>
          <RecommendationReliabilityBanner
            reliability={unsupportedEnvelope}
            contextLabel="Spiral Abyss Floor 12"
            detailsControlsId={panelId}
            isDetailsOpen={false}
            onToggleDetails={noop}
            primaryAction={{ label: 'Reset Swap', onClick: noop, variant: 'recovery' }}
            secondaryAction={{ label: 'Switch Schedule', onClick: noop }}
          />
          <ReliabilityDetailsPanel
            id={panelId}
            reliability={unsupportedEnvelope}
            isOpen={false}
          />
        </div>,
      );

      const alertRegions = extractElementInnerHtmlByAttr(
        html,
        /\brole="alert"[^>]*\baria-live="assertive"|\baria-live="assertive"[^>]*\brole="alert"/,
      );
      expect(alertRegions).toHaveLength(1);
      expect(decodeHtmlEntities(alertRegions[0])).toContain('Unsupported Recommendation Context');
      expect(decodeHtmlEntities(alertRegions[0])).toContain(blockingWarning);
      expect(alertRegions[0]).not.toMatch(/<button\b/i);

      // Recovery and details controls exist outside [role="alert"]
      expect(html).toContain('Reset Swap');
      expect(html).toContain('Switch Schedule');
      expect(html).toContain('Details');

      // Primary warning is rendered once in the banner, not duplicated
      const bannerOnly = decodeHtmlEntities(
        renderToString(
          <RecommendationReliabilityBanner
            reliability={unsupportedEnvelope}
            contextLabel="Spiral Abyss Floor 12"
          />,
        ),
      );
      expect(bannerOnly.split(blockingWarning).length - 1).toBe(1);

      assertStructuralGuarantees(html);
    });
  });

  describe('D. Historical, planning preview, and sandbox states', () => {
    it.each([
      {
        name: 'historical',
        contextLabel: 'Spiral Abyss Floor 12',
        envelope: buildEnvelope({
          status: 'historical',
          mode: 'archive_simulation',
          isActionable: false,
          verification: 'stale',
          temporalState: 'expired',
          warnings: ['Historical archive simulation for abyss "cycle-5-3".'],
        }),
      },
      {
        name: 'planning_preview',
        contextLabel: 'Pull Advisor',
        envelope: buildEnvelope({
          status: 'qualified',
          mode: 'planning_preview',
          isActionable: false,
          verification: 'verified',
          temporalState: 'upcoming',
          warnings: ['Planning preview: banner schedule is upcoming.'],
        }),
      },
      {
        name: 'sandbox_simulation',
        contextLabel: 'Imaginarium Theater',
        envelope: buildEnvelope({
          status: 'qualified',
          mode: 'sandbox_simulation',
          isActionable: false,
          verification: 'provisional',
          temporalState: 'not_applicable',
          warnings: ['Sandbox simulation uses experimental parameters.'],
        }),
      },
    ])(
      'matches formatter labels/tones and renders passive context section for $name',
      ({ contextLabel, envelope }) => {
        const expected = formatReliabilityPresentation(envelope);
        const panelId = `panel-${expected.mode}`;
        const noop = () => {};

        const html = renderToString(
          <div>
            <RecommendationReliabilityBadge
              reliability={envelope}
              detailsControlsId={panelId}
              onToggleDetails={noop}
            />
            <RecommendationReliabilityBanner
              reliability={envelope}
              contextLabel={contextLabel}
              detailsControlsId={panelId}
              onToggleDetails={noop}
            />
            <ReliabilityDetailsPanel id={panelId} reliability={envelope} isOpen={false} />
          </div>,
        );

        expect(html).toContain(expected.badgeLabel);
        expect(html).toContain(`data-reliability-tone="${expected.badgeTone}"`);
        expect(html).toContain(`<section aria-label="${contextLabel} reliability context"`);
        expect(html).not.toContain('role="status"');
        expect(html).not.toContain('role="alert"');

        assertStructuralGuarantees(html);
      },
    );
  });

  describe('E. Loading and null guards', () => {
    it('renders non-interactive loading badge with motion-reduce:animate-none and no aria-controls', () => {
      const html = renderToString(
        <RecommendationReliabilityBadge
          isLoading={true}
          detailsControlsId="ignored-while-loading"
          onToggleDetails={() => {}}
        />,
      );

      expect(html).toContain('Evaluating Reliability…');
      expect(html).toContain('motion-reduce:animate-none');
      expect(html).not.toMatch(/<button\b/i);
      expect(html).not.toContain('aria-controls');
    });

    it('handles empty badge states and null guards for banner and details panel', () => {
      const emptyNull = renderToString(
        <RecommendationReliabilityBadge
          reliability={null}
          detailsControlsId="ignored-when-empty"
          onToggleDetails={() => {}}
        />,
      );
      expect(emptyNull).toBe('');

      const emptyLabeled = renderToString(
        <RecommendationReliabilityBadge
          reliability={undefined}
          emptyLabel="Awaiting 4+ Roster"
          detailsControlsId="ignored-when-empty"
          onToggleDetails={() => {}}
        />,
      );
      expect(emptyLabeled).toContain('Awaiting 4+ Roster');
      expect(emptyLabeled).not.toMatch(/<button\b/i);
      expect(emptyLabeled).not.toContain('aria-controls');
      expect(emptyLabeled).not.toContain('animate-pulse');

      expect(
        renderToString(
          <RecommendationReliabilityBanner reliability={null} contextLabel="Team Builder" />,
        ),
      ).toBe('');
      expect(
        renderToString(
          <RecommendationReliabilityBanner reliability={undefined} contextLabel="Team Builder" />,
        ),
      ).toBe('');

      expect(
        renderToString(
          <ReliabilityDetailsPanel id="missing-panel" reliability={null} isOpen={true} />,
        ),
      ).toBe('');
      expect(
        renderToString(
          <ReliabilityDetailsPanel id="missing-panel" reliability={undefined} isOpen={true} />,
        ),
      ).toBe('');
    });
  });

  describe('F. Provenance fail-closed rendering', () => {
    const verifiedRec = DATA_PROVENANCE_REGISTRY.characters_v7_2_batch7;
    const weaponsRec = DATA_PROVENANCE_REGISTRY.weapons_v7_2_signatures;
    const artifactsRec = DATA_PROVENANCE_REGISTRY.artifacts_v7_2_master;

    it('withholds all evidence and links for unmatched and ambiguous dependencies while rendering matched HTTPS provenance', () => {
      const matchedDep = makeDepFromRecord(verifiedRec, { required: true });
      const unmatchedDep = makeDepFromRecord(weaponsRec, {
        required: true,
        version: '6.0', // intentional version mismatch
      });
      const dupOne = makeDepFromRecord(artifactsRec, {
        required: true,
      });
      const dupTwo = makeDepFromRecord(artifactsRec, {
        required: false,
      });

      const envelope = buildEnvelope({
        status: 'qualified',
        mode: 'current',
        isActionable: false,
        verification: 'verified',
        provenanceIds: [
          verifiedRec.datasetId,
          weaponsRec.datasetId,
          artifactsRec.datasetId,
        ],
        dependencies: [matchedDep, unmatchedDep, dupOne, dupTwo],
        warnings: ['Inspect dependency provenance state.'],
      });

      const html = renderToString(
        <ReliabilityDetailsPanel id="fail-closed-panel" reliability={envelope} isOpen={true} />,
      );
      const decoded = decodeHtmlEntities(html);

      // Matched HTTPS record renders its evidence and link
      expect(decoded).toContain('Provenance Matched');
      expect(decoded).toContain(verifiedRec.evidence);
      expect(html).toContain(`href="${verifiedRec.sourceUrl}"`);

      // Unmatched record exposes notice and ZERO evidence from weaponsRec
      expect(decoded).toContain('Unmatched Provenance');
      expect(decoded).toContain('Unmatched Provenance Notice:');
      expect(decoded).not.toContain(weaponsRec.evidence);

      // Ambiguous duplicate exposes notice and ZERO evidence from artifactsRec
      expect(decoded).toContain('Ambiguous Provenance');
      expect(decoded).toContain('Ambiguous Provenance Notice:');
      expect(decoded).not.toContain(artifactsRec.evidence);

      assertStructuralGuarantees(html);
    });

    it('never renders untrusted non-HTTPS source links even when provenance matches', () => {
      const tempKey = 'ui_test_unsafe_url_dataset';
      registerTempProvenance(tempKey, {
        datasetId: tempKey,
        version: '7.2',
        verifiedAt: '2026-11-16',
        sourceUrl: 'javascript:alert(1)',
        verificationMethod: 'official_notice',
        verifiedFields: ['id'],
        evidence: 'Matched evidence with unsafe scheme test fixture.',
        status: 'verified',
      });

      const envelope = buildEnvelope({
        provenanceIds: [tempKey],
        dependencies: [
          {
            datasetId: tempKey,
            required: true,
            verification: 'verified',
            policy: 'version_bound',
            riskTier: 'high',
            version: '7.2',
            verifiedAt: '2026-11-16',
          },
        ],
      });

      const html = renderToString(
        <ReliabilityDetailsPanel id="unsafe-url-panel" reliability={envelope} isOpen={true} />,
      );

      expect(html).toContain('Matched evidence with unsafe scheme test fixture.');
      expect(html).not.toContain('javascript:alert(1)');
      expect(html).not.toMatch(/<a\b/i);
    });
  });

  describe('G. Non-interactive badge fallback and size options', () => {
    it('renders non-interactive span when interactive is false or callback/ID is missing', () => {
      const envelope = buildEnvelope();

      const nonInteractiveHtml = renderToString(
        <RecommendationReliabilityBadge
          reliability={envelope}
          size="sm"
          showActionability={false}
          interactive={false}
          detailsControlsId="should-not-attach"
          onToggleDetails={() => {}}
        />,
      );

      expect(nonInteractiveHtml).toContain('Reliable');
      expect(nonInteractiveHtml).not.toContain('Live-Actionable');
      expect(nonInteractiveHtml).not.toMatch(/<button\b/i);
      expect(nonInteractiveHtml).not.toContain('aria-controls');
    });
  });
});
