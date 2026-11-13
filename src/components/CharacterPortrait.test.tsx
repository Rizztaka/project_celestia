import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CharacterPortrait } from './CharacterPortrait';

describe('CharacterPortrait Component', () => {
  it('renders image element when src is provided', () => {
    const html = renderToString(
      <CharacterPortrait
        src="https://enka.network/ui/UI_AvatarIcon_Furina.png"
        name="Furina"
        rarity={5}
        showRarity={true}
      />
    );
    expect(html).toContain('img');
    expect(html).toContain('https://enka.network/ui/UI_AvatarIcon_Furina.png');
    expect(html).toContain('alt="Furina"');
    expect(html).toContain('★★★★★');
  });

  it('renders fallback initials when src is undefined', () => {
    const html = renderToString(
      <CharacterPortrait
        name="Kaedehara Kazuha"
        element="Anemo"
        rarity={5}
      />
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('KK');
    expect(html).toContain('text-teal-400');
  });

  it('renders single-word name initials correctly', () => {
    const html = renderToString(
      <CharacterPortrait
        name="Furina"
        element="Hydro"
      />
    );
    expect(html).toContain('FU');
    expect(html).toContain('text-sky-400');
  });
});
