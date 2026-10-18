import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import { GenshinArtifactIcon } from '../../web/src/components/GenshinArtifactIcon.tsx';
import { GenshinBossIcon } from '../../web/src/components/GenshinBossIcon.tsx';
import { GenshinMaterialIcon } from '../../web/src/components/GenshinMaterialIcon.tsx';
import {
  artifactSlotIds,
  artworkInitials,
  resolveCdnSources,
  visualAssets,
} from '../../web/src/lib/cdn-resolver.ts';
import catalog from '../src/games/genshin/static/progression-catalog.json';
const require = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement: h } = require('react');
const { renderToStaticMarkup: render } = require('react-dom/server');
describe('Unified artwork source integrity', () => {
  it('tries Enka, official BBS, then the verified mirror with safe canonical filenames', () => {
    expect(resolveCdnSources('UI_ItemIcon_104347', 'material')).toEqual([
      'https://enka.network/ui/UI_ItemIcon_104347.png',
      'https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_ItemIcon_104347.png',
      'https://gi.yatta.moe/assets/UI/UI_ItemIcon_104347.png',
    ]);
    expect(resolveCdnSources('UI_MonsterIcon_Nihil', 'boss')[2]).toBe(
      'https://gi.yatta.moe/assets/UI/monster/UI_MonsterIcon_Nihil.png',
    );
    expect(resolveCdnSources('../../other', 'character')).toEqual([]);
    expect(
      resolveCdnSources('UI_ItemIcon_1', 'material', 'https://evil.invalid/item.png')[1],
    ).toContain('upload-os-bbs.mihoyo.com');
  });
  it('covers every catalog material and artifact slot without inventing game item IDs', () => {
    for (const [key, material] of Object.entries(catalog.materials)) {
      expect(visualAssets.materials[key].gameItemId).toBe(material.gameItemId);
      // The pinned image index reuses the Spring Dewleaf icon for Winter Icelea.
      expect(visualAssets.materials[key].file).toBe(
        key === 'WinterIcelea' ? 'UI_ItemIcon_101266' : `UI_ItemIcon_${material.gameItemId}`,
      );
    }
    for (const [slot, id] of Object.entries(artifactSlotIds))
      expect(visualAssets.artifacts.ObsidianCodex.slots[slot].file).toBe(
        `UI_RelicIcon_15038_${id}`,
      );
    expect(Object.keys(visualAssets.artifacts)).toHaveLength(63);
    expect(Object.keys(visualAssets.bosses)).toHaveLength(62);
  });
  it('renders actual material tiers, artifact pieces and a source-backed Knave portrait', () => {
    const material = render(h(GenshinMaterialIcon, { itemKey: 'GuideToContention' }));
    expect(material).toContain('UI_ItemIcon_104348');
    expect(material).toContain('border-sky-400/60');
    const artifact = render(h(GenshinArtifactIcon, { setKey: 'ObsidianCodex', slotKey: 'goblet' }));
    expect(artifact).toContain('UI_RelicIcon_15038_1');
    expect(artifact).toContain('5 star');
    const key = Object.keys(visualAssets.bosses).find(
      (key) => visualAssets.bosses[key].name === 'The Knave',
    );
    expect(render(h(GenshinBossIcon, { bossKey: key }))).toContain('UI_MonsterIcon_Nihil');
  });
  it('preserves readable styled initials for unknown images and does not guess rarity', () => {
    const html = render(h(GenshinMaterialIcon, { itemKey: 'UnknownItem' }));
    expect(html).not.toContain('<img');
    expect(html).not.toContain('5 star');
    expect(html).toContain('UI');
    expect(artworkInitials('Scroll of the Hero')).toBe('SO');
  });
});
