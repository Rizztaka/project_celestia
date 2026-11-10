/* global document */
import { createRequire } from 'node:module';

import { JSDOM } from 'jsdom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(new URL('../../web/package.json', import.meta.url));
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000/' });

function installDom() {
  for (const name of [
    'window',
    'document',
    'navigator',
    'HTMLElement',
    'Event',
    'HTMLButtonElement',
  ])
    vi.stubGlobal(name, dom.window[name]);
}
installDom();

const { createElement: h, act } = require('react');
const { createRoot } = require('react-dom/client');

let CharacterGuideCard, reviewedProfiles, root;

beforeAll(async () => {
  ({ CharacterGuideCard } = await import('../../web/src/components/CharacterGuideCard.tsx'));
  ({ reviewedProfiles } = await import('../../web/src/lib/build-analysis/identity.ts'));
});

beforeEach(() => {
  installDom();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root'));
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

afterAll(() => dom.window.close());

async function renderCard(avatarId, currentRoleId) {
  const profile = reviewedProfiles.find((p) => p.avatarId === avatarId);
  expect(profile).toBeDefined();
  await act(async () => root.render(h(CharacterGuideCard, { profile, currentRoleId })));
  return profile;
}

describe('CharacterGuideCard UI/UX Audit & Visual Verification', () => {
  describe('Archetype 1: Classic Hypercarries (Hu Tao & Raiden Shogun)', () => {
    it('Hu Tao (10000046) renders on-field damage build, Staff of Homa BiS, and Jump/Dash cancels', async () => {
      await renderCard(10000046, 'on_field_damage');

      // Header & metadata
      expect(document.body.textContent).toContain('Hu Tao Build Guide');
      expect(document.body.textContent).toContain('KQM Theorycrafting');

      // Artifact Sets
      expect(document.body.textContent).toContain('Tier 1 · BiS');
      expect(document.body.textContent).toContain('Crimson Witch Of Flames');
      expect(document.body.textContent).toContain('Marechaussee Hunter');

      // Weapons
      expect(document.body.textContent).toContain('Staff of Homa');
      expect(document.body.textContent).toContain('★★★★★');
      expect(document.body.textContent).toContain('BiS');

      // Combat tips
      expect(document.body.textContent).toContain('Jump-canceling at C0');
      expect(document.body.textContent).toContain('Dash-canceling at C1');
    });

    it('Raiden Shogun (10000052) renders multi-role support with on-field and off-field tabs', async () => {
      await renderCard(10000052, 'on_field_damage');

      // Role switcher
      expect(document.body.textContent).toContain('Reviewed Build Roles (3)');
      expect(document.body.textContent).toContain('On-field damage');
      expect(document.body.textContent).toContain('Off-field damage');
      expect(document.body.textContent).toContain('Party support');

      // Initial on-field role sets
      expect(document.body.textContent).toContain('Emblem Of Severed Fate');

      // Initial weapons
      expect(document.body.textContent).toContain('Engulfing Lightning');
      expect(document.body.textContent).toContain('The Catch');
      expect(document.body.textContent).toContain('★★★★');

      // Switching role preview to off-field damage
      const buttons = Array.from(document.querySelectorAll('button'));
      const offFieldBtn = buttons.find((b) => b.textContent.includes('Off-field damage'));
      expect(offFieldBtn).toBeDefined();

      await act(async () => {
        offFieldBtn.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
      });

      // Now artifact sets reflect Hyperbloom / off-field build
      expect(document.body.textContent).toContain('Flower Of Paradise Lost');
      expect(document.body.textContent).toContain('Gilded Dreams');
    });
  });

  describe('Archetype 2: Modern Reaction Cores (Sandrone, Odette, Vesna, Vodyanitsa)', () => {
    it('Sandrone (10000133) displays ATK% Goblet over Cryo DMG% invariant and Fagio tips', async () => {
      await renderCard(10000133, 'on_field_damage');

      expect(document.body.textContent).toContain('Sandrone Build Guide');
      expect(document.body.textContent).toContain('Disenchantment In Deep Shadow');
      expect(document.body.textContent).toContain('Fagio');
      expect(document.body.textContent).toContain('ATK% Goblet Over Cryo DMG%');
    });

    it('Odette (10000150) displays Skip-Burst invariant and Marvelous Splendor stacking', async () => {
      await renderCard(10000150, 'off_field_damage');

      expect(document.body.textContent).toContain('Odette Build Guide');
      expect(document.body.textContent).toContain('Marvelous Splendor');
      expect(document.body.textContent).toContain('Skip Burst Invariant');
    });

    it('Vodyanitsa (10000140) and Vesna (10000143) highlight Anemo RES shred and battery thresholds', async () => {
      await renderCard(10000140, 'healing_support');
      expect(document.body.textContent).toContain('Vodyanitsa Build Guide');
      expect(document.body.textContent).toContain('shreds Anemo RES by 35%');
      expect(document.body.textContent).toContain('Thrilling Tales of Dragon Slayers');
      expect(document.body.textContent).toContain('★★★');

      await renderCard(10000143, 'on_field_damage');
      expect(document.body.textContent).toContain('Vesna Build Guide');
      expect(document.body.textContent).toContain('Beyond the Chrysalis');
      expect(document.body.textContent).toContain('Zero ER Invariant Without Battery Core');
    });
  });

  describe('Archetype 3: Dedicated / Niche Supports (Chevreuse & Gorou)', () => {
    it('Chevreuse (10000090) displays Overload team restriction and Black Tassel F2P BiS', async () => {
      await renderCard(10000090, 'resistance_shred');

      expect(document.body.textContent).toContain('Chevreuse Build Guide');
      expect(document.body.textContent).toContain('40,000 Max HP Cap Rule');
      expect(document.body.textContent).toContain('Black Tassel');
      expect(document.body.textContent).toContain('F2P');
      expect(document.body.textContent).toContain('★★★');
    });

    it('Gorou (10000055) displays Geo DEF scaling and Favonius Bow battery priority', async () => {
      await renderCard(10000055, 'party_buff');

      expect(document.body.textContent).toContain('Gorou Build Guide');
      expect(document.body.textContent).toContain('Favonius Warbow');
      expect(document.body.textContent).toContain('Energy Recharge Context');
    });
  });

  describe('UI/UX, Accessibility and Micro-Interactions', () => {
    it('renders accessible link to full KQM guide with new-tab indicators', async () => {
      const profile = await renderCard(10000046, 'on_field_damage');
      const link = document.querySelector('a');

      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe(profile.guide.sourceUrl);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noreferrer');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('aria-label')).toContain('KeqingMains');
    });

    it('allows collapsing and expanding weapon tier accordions', async () => {
      await renderCard(10000046, 'on_field_damage');

      // Find accordion button for Tier 1
      const tier1Btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Tier 1 · Best-in-Slot'),
      );
      expect(tier1Btn).toBeDefined();
      expect(tier1Btn.getAttribute('aria-expanded')).toBe('true');
      expect(document.body.textContent).toContain('Staff of Homa');

      // Click to collapse
      await act(async () => {
        tier1Btn.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
      });
      expect(tier1Btn.getAttribute('aria-expanded')).toBe('false');
      expect(document.body.textContent).not.toContain('Staff of Homa');

      // Click to expand again
      await act(async () => {
        tier1Btn.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
      });
      expect(tier1Btn.getAttribute('aria-expanded')).toBe('true');
      expect(document.body.textContent).toContain('Staff of Homa');
    });

    it('allows expanding combat tips when more than 3 tips are available', async () => {
      await renderCard(10000046, 'on_field_damage');

      const viewAllBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('View All'),
      );
      expect(viewAllBtn).toBeDefined();

      await act(async () => {
        viewAllBtn.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
      });

      expect(viewAllBtn.textContent).toBe('Show Less');
      expect(document.body.textContent).toContain('Flutter By');
    });
  });
});
