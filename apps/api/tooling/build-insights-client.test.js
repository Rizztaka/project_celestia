import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { beforeAll, describe, expect, it, vi } from 'vitest';

const require = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement } = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let Cards;
beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem() {}, removeItem() {} });
  Cards = (await import('../../web/src/components/BuildInsights.tsx')).InsightCards;
});
describe('deterministic build presentation', () => {
  it('removes every retired runtime file while retaining its exact historical bytes', () => {
    const root = new URL('../../../', import.meta.url);
    const dir = new URL('docs/plans/deterministic-build-insights/', root);
    const manifest = JSON.parse(readFileSync(new URL('retired-manifest.json', dir)));
    for (const entry of manifest.files) {
      expect(existsSync(new URL(entry.path, root))).toBe(false);
      expect(
        createHash('sha256')
          .update(readFileSync(new URL('retired/' + entry.path + '.raw', dir)))
          .digest('hex'),
      ).toBe(entry.sha256);
    }
  });
  it('shows explicit conditional state and complete source conditions with an accessible disclosure', () => {
    const html = renderToStaticMarkup(
      createElement(Cards, {
        cards: [
          {
            id: 'deepwood-4',
            title: 'Deepwood Memories · 4-piece',
            state: 'conditional',
            basis: 'recorded',
            explanations: ['Four pieces do not establish activation.'],
            conditions: [],
            sourceText:
              'After Elemental Skills or Bursts hit opponents, the targets’ Dendro RES decreases for 8s.',
            source: {
              url: 'https://example.com/source',
              revision: 'pinned',
              sha256: 'a'.repeat(64),
              license: 'MIT',
            },
          },
        ],
      }),
    );
    expect(html).toContain('Conditional');
    expect(html).toContain('hit opponents');
    expect(html).toContain('<summary');
    expect(html).not.toContain('Ask Celestia');
  });
  it('both character and team flows have no chat entry; character detail mounts automatic insights', () => {
    const detail = readFileSync(
      new URL('../../web/src/pages/CharacterDetailPage.tsx', import.meta.url),
      'utf8',
    );
    const team = readFileSync(
      new URL('../../web/src/components/TeamBuilder.tsx', import.meta.url),
      'utf8',
    );
    expect(detail).toContain('<BuildInsights');
    expect(detail + team).not.toContain('AskCelestia');
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
    expect(pkg.dependencies).not.toHaveProperty('openai');
  });
});
