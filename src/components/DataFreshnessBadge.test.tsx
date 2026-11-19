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

  it('applies custom className cleanly', () => {
    const html = renderToString(
      <DataFreshnessBadge datasetId="cycle-7-2" className="custom-test-class" />,
    );

    expect(html).toContain('custom-test-class');
  });
});
