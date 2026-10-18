import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import { AccessibleTabs, TabPanel } from '../../web/src/components/AccessibleTabs.tsx';
import { GenshinAvatar } from '../../web/src/components/GenshinAvatar.tsx';
import { GenshinWeaponIcon } from '../../web/src/components/GenshinWeaponIcon.tsx';
import { characterMetadata, weaponMetadata } from '../../web/src/lib/artwork.ts';
import { ASSET_MAPPING } from '../../web/src/lib/asset-mapping.ts';
import { getElementTheme } from '../../web/src/lib/element-colors.ts';
import targets from '../../web/src/lib/progression-targets.json';
import { describeRemaining } from '../../web/src/lib/resin.ts';

const webRequire = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement: h } = webRequire('react');
const { renderToStaticMarkup: render } = webRequire('react-dom/server');

describe('Section 4 catalog artwork and accessible presentation', () => {
  it('covers every supported progression character and weapon with authentic safe filenames and rarity', () => {
    for (const kind of ['characters', 'weapons']) {
      const metadata = kind === 'characters' ? characterMetadata : weaponMetadata;
      for (const { key } of targets[kind]) {
        expect(ASSET_MAPPING[kind][key], key).toMatch(/^[A-Za-z0-9_]+$/);
        expect(metadata[key]?.rarity, key).toBeGreaterThanOrEqual(1);
        expect(metadata[key]?.name, key).toBeTruthy();
      }
    }
    expect(ASSET_MAPPING.characters.Amber).toBe('Ambor');
    expect(ASSET_MAPPING.characters.Jean).toBe('Qin');
    expect(ASSET_MAPPING.characters.Noelle).toBe('Noel');
    expect(ASSET_MAPPING.characters.TravelerGeo).toBe('PlayerBoy');
    expect(ASSET_MAPPING.characters.LumineHydro).toBe('PlayerGirl');
    expect(ASSET_MAPPING.weapons.TheCatch).toBe('Pole_Mori');
  });
  it('uses verified element/rarity metadata and preserves unknown characters without guessing', () => {
    expect(getElementTheme('Bennett').element).toBe('Pyro');
    expect(getElementTheme('Neuvillette').element).toBe('Hydro');
    expect(getElementTheme('TravelerGeo').element).toBe('Geo');
    expect(getElementTheme('UnknownCharacter').element).toBe('Unknown');
    expect(characterMetadata.Bennett.rarity).toBe(4);
    expect(characterMetadata.Navia.rarity).toBe(5);
  });
  it('renders named lazy artwork over a local crest, including constellation zero', () => {
    const html = render(h(GenshinAvatar, { characterKey: 'HuTao', constellation: 0 }));
    expect(html).toContain('UI_AvatarIcon_Hutao.png');
    expect(html).toContain('alt="Hu Tao avatar, Pyro, Constellation 0"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('Constellation 0');
    expect(html).toContain('<svg');
    const unknown = render(h(GenshinAvatar, { characterKey: 'Opaque / 字' }));
    expect(unknown).not.toContain('<img');
    expect(unknown).toContain('aria-label="Opaque / 字 avatar"');
    expect(unknown).toContain('<svg');
  });
  it('styles weapons by rarity rather than refinement and supplies a local fallback', () => {
    const html = render(h(GenshinWeaponIcon, { weaponKey: 'StaffOfHoma' }));
    expect(html).toContain('border-amber-400/60');
    expect(html).toContain('Staff of Homa weapon icon');
    expect(html).toContain('5 star');
    const unknown = render(h(GenshinWeaponIcon, { weaponKey: 'UnknownWeapon' }));
    expect(unknown).not.toContain('<img');
    expect(unknown).toContain('<svg');
    expect(unknown).not.toContain('5 star');
  });
  it('links tabs to stable panels, with one keyboard entry point and hidden inactive content', () => {
    const tabs = render(
      h(AccessibleTabs, {
        label: 'Planner',
        prefix: 'test',
        active: 'daily',
        onChange() {},
        tabs: [
          { id: 'daily', label: 'Daily' },
          { id: 'weekly', label: 'Weekly' },
        ],
      }),
    );
    expect(tabs).toContain('role="tablist"');
    expect(tabs).toContain('aria-selected="true" aria-controls="test-panel-daily" tabindex="0"');
    expect(tabs).toContain('aria-selected="false" aria-controls="test-panel-weekly" tabindex="-1"');
    const panel = render(
      h(TabPanel, { prefix: 'test', id: 'weekly', active: 'daily' }, 'Inactive content'),
    );
    expect(panel).toContain('role="tabpanel"');
    expect(panel).toContain('aria-labelledby="test-tab-weekly"');
    expect(panel).toContain('hidden=""');
    expect(panel).not.toContain('Inactive content');
  });
  it('gives timers human-readable, minute-granularity announcements', () => {
    const now = Date.parse('2026-10-18T00:00:00Z');
    expect(describeRemaining('2026-10-18T03:15:00Z', now)).toBe('3 hours and 15 minutes');
    expect(describeRemaining('2026-10-18T01:01:00Z', now)).toBe('1 hour and 1 minute');
    expect(describeRemaining('2026-10-17T00:00:00Z', now)).toBe('0 hours and 0 minutes');
  });
});
