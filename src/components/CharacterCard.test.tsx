import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CharacterCard } from './CharacterCard';
import type { Character, OwnedCharacterProfile } from '../types/genshin';

const MOCK_CHAR: Character = {
  id: 'Furina',
  name: 'Furina',
  element: 'Hydro',
  weapon: 'Sword',
  rarity: 5,
  roles: ['Buffer/Shred', 'Off-Field DPS'],
  tags: ['Hydro', 'Sword'],
  icon: 'https://enka.network/ui/UI_AvatarIcon_Furina.png',
};

const MOCK_TRAVELER: Character = {
  id: 'TravelerHydro',
  name: 'Traveler (Hydro)',
  element: 'Hydro',
  weapon: 'Sword',
  rarity: 5,
  roles: ['Off-Field DPS'],
  tags: ['Hydro', 'Sword'],
  icon: 'https://enka.network/ui/UI_AvatarIcon_PlayerBoy.png',
};

describe('CharacterCard Component', () => {
  const defaultProps = {
    char: MOCK_CHAR,
    isOwned: false,
    constellation: 0,
    onToggleOwned: vi.fn(),
    onStepConstellation: vi.fn(),
    onSelectCharacter: vi.fn(),
    onPrefetch: vi.fn(),
  };

  it('renders unowned character card with name, element, and weapon type', () => {
    const html = renderToString(<CharacterCard {...defaultProps} />);
    expect(html).toContain('Furina');
    expect(html).toContain('Hydro');
    expect(html).toContain('Sword');
    expect(html).toContain('Buffer/Shred');
    expect(html).not.toContain('C0');
  });

  it('renders owned character card with constellation stepper', () => {
    const html = renderToString(
      <CharacterCard {...defaultProps} isOwned={true} constellation={2} />,
    );
    expect(html).toContain('Furina');
    expect(html).toContain('C<!-- -->2');
    expect(html).toContain('Decrease constellation');
    expect(html).toContain('Increase constellation');
  });

  it('renders equipped weapon name when profile includes a weapon', () => {
    const profile: OwnedCharacterProfile = {
      id: 'Furina',
      level: 90,
      constellation: 2,
      weapon: {
        key: 'SplendorOfTranquilWaters',
        name: 'Splendor of Tranquil Waters',
        level: 90,
        refinement: 1,
        rarity: 5,
      },
    };

    const html = renderToString(
      <CharacterCard {...defaultProps} isOwned={true} constellation={2} profile={profile} />,
    );
    expect(html).toContain('Splendor of Tranquil Waters');
  });

  it('renders Traveler quick-switch tags when character is Traveler', () => {
    const html = renderToString(
      <CharacterCard
        {...defaultProps}
        char={MOCK_TRAVELER}
        allCharacters={[MOCK_TRAVELER, MOCK_CHAR]}
      />,
    );
    expect(html).toContain('Traveler (Hydro)');
    expect(html).toContain('Quick-switch to Traveler');
  });
});
