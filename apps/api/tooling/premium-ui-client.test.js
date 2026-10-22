import { createRequire } from 'node:module';

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ProfileReferenceService } from '../src/games/genshin/characters/profile-reference.service.ts';

const require = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement: h } = require('react');
const { renderToStaticMarkup: markup } = require('react-dom/server');
const { MemoryRouter } = require('react-router-dom');
const { QueryClient, QueryClientProvider } =
  await import('../../web/node_modules/@tanstack/react-query/build/modern/index.js');
let Catalog, SocialLogin, index;
const clients = [];
beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem() {}, removeItem() {} });
  Catalog = (await import('../../web/src/components/CharacterCatalog.tsx')).CharacterCatalog;
  SocialLogin = (await import('../../web/src/components/SocialLogin.tsx')).default;
  index = (await import('../../web/src/lib/artwork.ts')).referenceCharacters;
});
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

describe('premium UI usable destinations', () => {
  it('links every archive entry to a real canonical profile, preserving forms and exact names', () => {
    const service = new ProfileReferenceService();
    expect(Object.keys(index)).toHaveLength(129);
    for (const [key, item] of Object.entries(index)) {
      const ref = service.character(key);
      expect(item).toEqual({
        name: ref.name,
        rarity: ref.rarity,
        element: ref.element,
        weapon: ref.weaponType,
      });
    }
    const html = markup(h(MemoryRouter, null, h(Catalog)));
    expect(html.match(/href="\/characters\//g)).toHaveLength(129);
    expect(html).not.toContain('href="/characters/Traveler"');
    expect(html).not.toContain('href="/characters/Kukishinobu"');
    expect(html).toContain('href="/characters/KukiShinobu"');
    expect(html).toContain('href="/characters/TravelerDendro"');
  });
  it('uses the same search for canonical names and compact imported keys without advertising unavailable references', () => {
    const html = markup(h(MemoryRouter, null, h(Catalog, { search: 'kuki shinobu' })));
    expect(html.match(/href="\/characters\//g)).toHaveLength(1);
    expect(html).toContain('href="/characters/KukiShinobu"');
    expect(markup(h(MemoryRouter, null, h(Catalog, { search: 'does-not-exist' })))).toContain(
      'No archive entries match',
    );
  });
  it.each([
    [{ google: false, discord: false }, []],
    [{ google: true, discord: false }, ['Google']],
    [{ google: false, discord: true }, ['Discord']],
  ])('only offers configured social sign-in actions: %j', (providers, names) => {
    const client = new QueryClient();
    clients.push(client);
    client.setQueryData(['auth', 'providers'], providers);
    const html = markup(h(QueryClientProvider, { client }, h(SocialLogin)));
    for (const name of ['Google', 'Discord']) {
      if (names.includes(name)) expect(html).toContain('Continue with ' + name);
      else expect(html).not.toContain('Continue with ' + name);
    }
    expect(html).not.toContain('disabled=""');
    if (!names.length) expect(html).toBe('');
  });
});
