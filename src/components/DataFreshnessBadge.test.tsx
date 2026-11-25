import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DataFreshnessBadge } from './DataFreshnessBadge';
import type { DataProvenance } from '../types/genshin';
import { CURRENT_GAME_VERSION } from '../data/game-version';

describe('DataFreshnessBadge Component', () => {
  const verifiedProvenance: DataProvenance = {
    datasetId: 'test_verified_prov',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-16',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Official test evidence line for 7.2',
    status: 'verified',
  };

  const staleProvenance: DataProvenance = {
    datasetId: 'test_stale_prov',
    version: '5.3',
    verifiedAt: '2025-01-01',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Historical 5.3 cycle evidence',
    status: 'stale',
  };

  const provisionalProvenance: DataProvenance = {
    datasetId: 'test_provisional_prov',
    version: CURRENT_GAME_VERSION,
    verifiedAt: '2026-11-18',
    sourceUrl: 'https://genshin.hoyoverse.com/en/news',
    evidence: 'Provisional evidence line',
    status: 'provisional',
  };

  it('renders verified dataset badge correctly with default label and emerald styling', () => {
    const html = renderToString(<DataFreshnessBadge provenance={verifiedProvenance} />);

    expect(html).toContain(`Verified v${CURRENT_GAME_VERSION}`);
    expect(html).toContain('bg-emerald-950/60');
    expect(html).toContain('text-emerald-300');
    expect(html).toContain('aria-label="Data Freshness Status: verified');
  });

  it('renders stale dataset badge with amber warning and version label', () => {
    const html = renderToString(<DataFreshnessBadge provenance={staleProvenance} />);

    expect(html).toContain('Stale v5.3');
    expect(html).toContain('bg-amber-950/60');
    expect(html).toContain('text-amber-300');
    expect(html).toContain('aria-label="Data Freshness Status: stale');
  });

  it('renders provisional dataset badge with sky styling', () => {
    const html = renderToString(<DataFreshnessBadge provenance={provisionalProvenance} />);

    expect(html).toContain(`Provisional v${CURRENT_GAME_VERSION}`);
    expect(html).toContain('bg-sky-950/60');
    expect(html).toContain('text-sky-300');
    expect(html).toContain('aria-label="Data Freshness Status: provisional');
  });

  it('supports custom label override', () => {
    const html = renderToString(
      <DataFreshnessBadge
        provenance={verifiedProvenance}
        labelOverride="Custom Active Schedule"
      />,
    );

    expect(html).toContain('Custom Active Schedule');
  });

  it('retrieves registered dataset by datasetId prop', () => {
    const html = renderToString(<DataFreshnessBadge datasetId="cycle-7-2" />);

    expect(html).toContain(`Verified v${CURRENT_GAME_VERSION}`);
  });

  it('renders historical datasetId as stale with amber warning', () => {
    const html = renderToString(<DataFreshnessBadge datasetId="cycle-5-3" />);

    expect(html).toContain('Stale v5.3');
    expect(html).toContain('bg-amber-950/60');
    expect(html).toContain('text-amber-300');
  });

  it('renders sandbox dataset with provisional styling and Sandbox Simulation label', () => {
    const html = renderToString(<DataFreshnessBadge datasetId="custom-sandbox" />);

    expect(html).toContain('Sandbox Simulation');
    expect(html).toContain('bg-sky-950/60');
  });

  it('applies custom className cleanly', () => {
    const html = renderToString(
      <DataFreshnessBadge datasetId="cycle-7-2" className="custom-test-class" />,
    );

    expect(html).toContain('custom-test-class');
  });

  it('renders unregistered dataset with distinct Rose styling and avoids vunknown metadata', () => {
    const html = renderToString(<DataFreshnessBadge datasetId="unknown_unregistered_dataset" />);

    expect(html).toContain('Unregistered');
    expect(html).toContain('bg-rose-950/85');
    expect(html).toContain('text-rose-100');
    expect(html).toContain('aria-label="Data Freshness Status: unregistered, Unregistered"');
    expect(html).not.toContain('bg-amber-950');
    expect(html).not.toContain('vunknown');
    expect(html).not.toContain('Verified: Unregistered');
    expect(html).toContain('Unregistered Dataset');
  });

  it('fails closed for auxiliary provenance metadata when given an unregistered DataProvenance object', () => {
    const unregisteredProvenance = {
      datasetId: 'unregistered_provenance_fixture',
      version: CURRENT_GAME_VERSION,
      verifiedAt: '2026-11-16',
      sourceUrl: 'https://genshin.hoyoverse.com/en/news/detail/unregistered-fixture',
      verificationMethod: 'official_notice',
      verifiedFields: ['characterBanners', 'weaponBanner', 'featured4StarIds'],
      evidence: 'DISTINCTIVE_UNREGISTERED_EVIDENCE_DO_NOT_RENDER',
      status: 'unregistered',
    } as unknown as DataProvenance;

    const html = renderToString(<DataFreshnessBadge provenance={unregisteredProvenance} />);

    expect(html).toContain('Unregistered');
    expect(html).toContain('Unregistered Dataset');
    expect(html).toContain('bg-rose-950/85');
    expect(html).toContain('text-rose-100');
    expect(html).toContain('aria-label="Data Freshness Status: unregistered, Unregistered"');
    expect(html).toContain('no registered provenance record');

    expect(html).not.toContain(
      'https://genshin.hoyoverse.com/en/news/detail/unregistered-fixture',
    );
    expect(html).not.toContain('View Reference Source');
    expect(html).not.toMatch(/<a\b/i);
    expect(html).not.toContain('Official Notice');
    expect(html).not.toContain('official_notice');
    expect(html).not.toContain('Audited fields:');
    expect(html).not.toContain('characterBanners');
    expect(html).not.toContain('weaponBanner');
    expect(html).not.toContain('featured4StarIds');
    expect(html).not.toContain('DISTINCTIVE_UNREGISTERED_EVIDENCE_DO_NOT_RENDER');
    expect(html).not.toContain(`v${CURRENT_GAME_VERSION}`);
    expect(html).not.toContain('2026-11-16');
  });

  it('uses accessible disclosure trigger with linked aria-controls and role="region" instead of role="tooltip"', () => {
    const html = renderToString(<DataFreshnessBadge provenance={verifiedProvenance} />);

    const controlsMatch = html.match(/aria-controls="([^"]+)"/);
    expect(controlsMatch).not.toBeNull();
    const controlledId = controlsMatch![1];

    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain(`id="${controlledId}"`);
    expect(html).toContain('role="region"');
    expect(html).not.toContain('role="tooltip"');
    expect(html).toContain('href="https://genshin.hoyoverse.com/en/news"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('omits aria-controls and disclosure region when showTooltip is false', () => {
    const html = renderToString(
      <DataFreshnessBadge provenance={verifiedProvenance} showTooltip={false} />,
    );

    expect(html).not.toContain('aria-controls');
    expect(html).not.toContain('aria-expanded');
    expect(html).not.toContain('role="region"');
    expect(html).not.toContain('role="tooltip"');
  });

  it.each([
    'http://genshin.hoyoverse.com/en/news',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'not-a-valid-url',
  ])('does not render invalid or non-HTTPS sourceUrl (%s)', (unsafeUrl) => {
    const html = renderToString(
      <DataFreshnessBadge
        provenance={{
          ...verifiedProvenance,
          sourceUrl: unsafeUrl,
        }}
      />,
    );

    expect(html).not.toContain('View Reference Source');
    expect(html).not.toContain(unsafeUrl);
    expect(html).not.toMatch(/<a\b/i);
  });
});
