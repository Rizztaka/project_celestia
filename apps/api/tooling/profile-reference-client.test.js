import { createRequire } from 'node:module';

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ProfileReferenceService } from '../src/games/genshin/characters/profile-reference.service.ts';

const require = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement: h } = require('react');
const { renderToStaticMarkup: render } = require('react-dom/server');
const { QueryClient, QueryClientProvider } =
  await import('../../web/node_modules/@tanstack/react-query/build/modern/index.js');
const { MemoryRouter } = await import('../../web/node_modules/react-router-dom/dist/index.mjs');
const references = new ProfileReferenceService();
let ui, helpers, items, api, store, sessions;
beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem() {}, removeItem() {} });
  ui = await import('../../web/src/components/CharacterProfile.tsx');
  helpers = await import('../../web/src/lib/profile-presentation.ts');
  items = await import('../../web/src/components/EquipmentReference.tsx');
  api = await import('../../web/src/lib/profile-reference.ts');
  store = (await import('../../web/src/stores/auth.store.ts')).useAuthStore;
  sessions = await import('../../web/src/lib/account-session.ts');
});
afterEach(() => vi.unstubAllGlobals());
const data = (constellation) => ({
  character: {
    characterKey: 'Keqing',
    level: 80,
    ascension: 6,
    constellation,
    talents: { normal: 9, skill: 10, burst: 13 },
    talentBasis: 'stored_convention_unknown',
  },
  artifactRelationsConsistent: true,
  artifacts: {
    flower: { state: 'recorded_assigned' },
    plume: { state: 'recorded_assigned' },
    sands: { state: 'unknown' },
    goblet: { state: 'unrecorded' },
    circlet: { state: 'unknown' },
  },
});
describe('profile presentation and account boundary', () => {
  it.each([0, 1, 6, undefined])(
    'renders C%s honestly with all six readable descriptions',
    (count) => {
      const ref = references.character('Keqing');
      const html = render(
        h(ui.CharacterProfileKit, {
          reference: ref,
          data: count === undefined ? undefined : data(count),
        }),
      );
      expect(html.match(/Unlocked · Recorded/g) || []).toHaveLength(count ?? 0);
      expect(html.match(/Locked · Recorded C-count/g) || []).toHaveLength(
        count === undefined ? 0 : 6 - count,
      );
      for (const entry of ref.constellations)
        expect(html).toContain(entry.name.replaceAll('&', '&amp;'));
      expect(html).toContain('Thundering Might');
      expect(html).toContain('When Keqing&#x27;s Normal and Charged Attacks');
      expect(html).not.toMatch(/disabled|pointer-events-none|opacity-/);
      expect((html.match(/<summary/g) || []).length).toBeGreaterThanOrEqual(12);
    },
  );
  it('rejects invalid progression instead of rendering a fictitious C0', () => {
    for (const count of [-1, 7, NaN]) expect(helpers.constellationState(count, 1)).toBe('unknown');
    expect(helpers.constellationState(0, 1)).toBe('dark');
    expect(helpers.constellationState(1, 1)).toBe('bright');
  });
  it('keeps talent conventions and every passive/special ability explicit', () => {
    const ref = references.character('KamisatoAyaka');
    const html = render(h(ui.CharacterProfileKit, { reference: ref, data: data(6) }));
    expect(html).toContain('Kamisato Art: Senho');
    expect(html).toContain('Unlock unknown');
    expect(html).toContain('Recorded level 13');
    expect(html).not.toContain('Recorded level 16');
    const header = render(
      h(ui.CharacterProfileHeader, { characterKey: ref.key, reference: ref, data: data(6) }),
    );
    expect(header).toContain('no bonuses have been added');
  });
  it('shows reference identity with no invented level, talent or C-count for unowned/failure states', () => {
    const ref = references.character('Nahida');
    const html = render(h(ui.CharacterProfileHeader, { characterKey: ref.key, reference: ref }));
    expect(html.match(/Not recorded/g) || []).toHaveLength(4);
    expect(html).not.toContain('C0');
    expect(html).toContain(ref.description);
    const traveler = render(
      h(
        MemoryRouter,
        {},
        h(ui.CharacterProfileHeader, {
          characterKey: 'Aether',
          reference: references.character('Aether'),
        }),
      ),
    );
    expect(traveler).toContain('Traveler form unresolved');
    expect(traveler).toContain('/characters/TravelerDendro');
    expect(
      render(h(ui.CharacterProfileHeader, { characterKey: 'Keqing', data: data(1) })),
    ).toContain('C1');
  });
  it('keeps failed and loading owned reads unknown instead of asserting absent records', () => {
    const ref = references.character('Keqing');
    for (const recordsStatus of ['loading', 'unavailable']) {
      const html = render(
        h(ui.CharacterProfileHeader, { characterKey: ref.key, reference: ref, recordsStatus }),
      );
      expect(html).not.toContain('Not recorded');
      expect(html).not.toContain('C0');
      expect(html).toContain(recordsStatus === 'loading' ? 'Loading' : 'Unknown');
    }
    const html = render(
      h(ui.CharacterProfileKit, { reference: references.character('Aloy'), data: data(6) }),
    );
    expect(html).not.toContain('Unlocked · Recorded');
  });
  it('preserves partial/inconsistent equipment uncertainty and conditional eligibility', () => {
    expect(helpers.setEligibility(2, 4, data(0))).toBe('unknown');
    expect(helpers.setEligibility(4, 4, data(0))).toBe('bright');
    expect(helpers.setEligibility(4, 4, { ...data(0), artifactRelationsConsistent: false })).toBe(
      'unknown',
    );
    const full = {
      ...data(0),
      artifacts: Object.fromEntries(
        ['flower', 'plume', 'sands', 'goblet', 'circlet'].map((s) => [
          s,
          { state: 'recorded_assigned' },
        ]),
      ),
    };
    expect(helpers.setEligibility(2, 4, full)).toBe('dark');
    expect(helpers.statLabel('critRate_')).toBe('CRIT Rate');
    expect(helpers.statValue('critRate_', 3.9)).toBe('3.9%');
    expect(helpers.statValue('opaque_', 3.9)).toBe('3.9');
  });
  it('renders exact refinement and conditional set text without any mutation request', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(
      ['genshin', 'weapon-reference', 'HarbingerOfDawn'],
      references.weapon('HarbingerOfDawn'),
    );
    client.setQueryData(
      ['genshin', 'artifact-reference', 'GoldenTroupe'],
      references.artifact('GoldenTroupe'),
    );
    const html = render(
      h(
        QueryClientProvider,
        { client },
        h(
          'div',
          {},
          h(items.WeaponReference, { itemKey: 'HarbingerOfDawn', refinement: 5 }),
          h(items.ArtifactReference, { itemKey: 'GoldenTroupe', count: 4, data: data(0) }),
        ),
      ),
    );
    expect(html).toContain('Refinement 5');
    expect(html).toContain('28%');
    expect(html).toContain('cleared 2s after taking the field');
    expect(html).toContain('does not establish activation');
    expect(fetch).not.toHaveBeenCalled();
    client.clear();
  });
  it('renders hostile source strings as inert text', () => {
    const ref = references.character('Keqing');
    ref.talents[0].description = '<img src=x onerror=alert(1)>\n\nConditional text';
    const html = render(h(ui.CharacterProfileKit, { reference: ref }));
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img src="x"');
  });
  it.each(['reference', 'equipment'])(
    'rejects delayed %s responses after an account change',
    async (kind) => {
      store.setState({ token: 'synthetic-a', sessionEpoch: 20 });
      const session = sessions.captureSession();
      let deliver;
      vi.stubGlobal(
        'fetch',
        vi.fn(
          () =>
            new Promise((resolve) => {
              deliver = resolve;
            }),
        ),
      );
      const pending =
        kind === 'reference'
          ? api.fetchProfileReference('Keqing', undefined, session)
          : (await import('../../web/src/lib/api.ts')).fetchCharacterEquipment('Keqing');
      store.setState({ token: 'synthetic-b', sessionEpoch: 21 });
      deliver({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: references.character('Keqing') }),
      });
      await expect(pending).rejects.toThrow();
    },
  );
});
