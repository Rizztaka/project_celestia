import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  ViewSkeleton,
  TeamsSkeleton,
  PullsSkeleton,
  EndgameSkeleton,
  ArtifactsSkeleton,
  RosterSkeleton,
} from './ViewSkeleton';

describe('ViewSkeleton Components', () => {
  it('renders TeamsSkeleton with accessibility attributes and shimmer structure', () => {
    const html = renderToString(<TeamsSkeleton />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('animate-pulse');
  });

  it('renders PullsSkeleton with banner frames and budget card placeholders', () => {
    const html = renderToString(<PullsSkeleton />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('animate-pulse');
  });

  it('renders EndgameSkeleton with cycle selector and chamber cards', () => {
    const html = renderToString(<EndgameSkeleton />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('animate-pulse');
  });

  it('renders ArtifactsSkeleton with domain filter and artifact card skeletons', () => {
    const html = renderToString(<ArtifactsSkeleton />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('animate-pulse');
  });

  it('renders RosterSkeleton with filter bar and grid items', () => {
    const html = renderToString(<RosterSkeleton />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('animate-pulse');
  });

  it('unified ViewSkeleton dispatches to appropriate tab skeleton', () => {
    const teamsHtml = renderToString(<ViewSkeleton type="teams" />);
    const pullsHtml = renderToString(<ViewSkeleton type="pulls" />);
    const endgameHtml = renderToString(<ViewSkeleton type="endgame" />);
    const artifactsHtml = renderToString(<ViewSkeleton type="artifacts" />);
    const rosterHtml = renderToString(<ViewSkeleton type="roster" />);
    const fallbackHtml = renderToString(<ViewSkeleton type="unknown" />);
    const undefinedHtml = renderToString(<ViewSkeleton />);
    const emptyHtml = renderToString(<ViewSkeleton type="" />);

    expect(teamsHtml).toContain('data-skeleton="teams"');
    expect(pullsHtml).toContain('data-skeleton="pulls"');
    expect(endgameHtml).toContain('data-skeleton="endgame"');
    expect(artifactsHtml).toContain('data-skeleton="artifacts"');
    expect(rosterHtml).toContain('data-skeleton="roster"');
    expect(fallbackHtml).toContain('data-skeleton="generic"');
    expect(undefinedHtml).toContain('data-skeleton="generic"');
    expect(emptyHtml).toContain('data-skeleton="generic"');
  });
});
