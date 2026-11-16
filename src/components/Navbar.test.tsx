import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Navbar } from './Navbar';

describe('Navbar Component', () => {
  const defaultProps = {
    activeTab: 'teams',
    setActiveTab: vi.fn(),
    uid: '800123456',
    setUid: vi.fn(),
    onSyncShowcase: vi.fn(),
    isSyncing: false,
    ownedCount: 42,
    weaponCount: 15,
  };

  it('renders all 5 core navigation tabs', () => {
    const html = renderToString(<Navbar {...defaultProps} />);
    expect(html).toContain('Best Teams');
    expect(html).toContain('Pull Advisor');
    expect(html).toContain('Endgame Helper');
    expect(html).toContain('Artifact Stop');
    expect(html).toContain('My Roster (42)');
  });

  it('does not display progress bar when isTabPending is false', () => {
    const html = renderToString(<Navbar {...defaultProps} isTabPending={false} />);
    expect(html).not.toContain('role="progressbar"');
  });

  it('displays progress bar when isTabPending is true', () => {
    const html = renderToString(<Navbar {...defaultProps} isTabPending={true} />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="Switching view"');
  });

  it('renders mobile navigation buttons with 44px minimum tap height', () => {
    const html = renderToString(<Navbar {...defaultProps} />);
    expect(html).toContain('min-h-[44px]');
  });
});
