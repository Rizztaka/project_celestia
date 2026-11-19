import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { RosterView } from './RosterView';
import type { OwnedCharacterProfile } from '../types/genshin';

describe('RosterView Component', () => {
  const defaultProps = {
    ownedIds: [] as string[],
    profiles: {} as Record<string, OwnedCharacterProfile>,
    weapons: [],
    isDemoMode: false,
    onToggleOwned: vi.fn(),
    onSetRoster: vi.fn(),
    onUpdateProfile: vi.fn(),
    onUpdateProfiles: vi.fn(),
    onUpdateWeapons: vi.fn(),
    onOpenArmory: vi.fn(),
    onToggleDemoMode: vi.fn(),
    onResetAccount: vi.fn(),
    onImportProfiles: vi.fn(),
    onRestoreAccount: vi.fn(),
  };

  it('renders initial empty roster view and onboarding banner cleanly', () => {
    const html = renderToString(<RosterView {...defaultProps} />);
    expect(html).toContain('My Owned Roster');
    expect(html).toContain('Welcome to Project Celestia!');
    expect(html).toContain('Turn on Demo Mode');
    expect(html).toContain('Import / Export (GOOD)');
    expect(html).toContain('Account Backup');
    expect(html).toContain('Search by character name...');
  });

  it('renders owned roster with active demo mode and character cards', () => {
    const ownedProfiles: Record<string, OwnedCharacterProfile> = {
      Furina: { id: 'Furina', level: 90, constellation: 2 },
      Nefer: { id: 'Nefer', level: 90, constellation: 0 },
    };

    const html = renderToString(
      <RosterView
        {...defaultProps}
        ownedIds={['Furina', 'Nefer']}
        profiles={ownedProfiles}
        isDemoMode={true}
      />,
    );

    expect(html).toContain('Demo Mode Active');
    expect(html).not.toContain('Welcome to Project Celestia!');
    expect(html).toContain('Furina');
    expect(html).toContain('Nefer');
    expect(html).toContain('C<!-- -->2');
    expect(html).toContain('Decrease constellation');
    expect(html).toContain('Increase constellation');
  });

  it('renders all 8 nation region filter pills and element pills', () => {
    const html = renderToString(<RosterView {...defaultProps} />);
    expect(html).toContain('Mondstadt');
    expect(html).toContain('Liyue');
    expect(html).toContain('Inazuma');
    expect(html).toContain('Sumeru');
    expect(html).toContain('Fontaine');
    expect(html).toContain('Natlan');
    expect(html).toContain('Nod-Krai');
    expect(html).toContain('Snezhnaya');
    expect(html).toContain('Hydro');
    expect(html).toContain('Pyro');
    expect(html).toContain('Cryo');
  });
});
