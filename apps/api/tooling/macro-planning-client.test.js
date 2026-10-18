import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import MaterialRow from '../../web/src/components/MaterialRow.tsx';

const webRequire = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement } = webRequire('react');
const { renderToStaticMarkup } = webRequire('react-dom/server');

describe('Goal-first material display', () => {
  it('shows the full requirement without requiring inventory input', () => {
    const html = renderToStaticMarkup(
      createElement(MaterialRow, {
        itemKey: 'GoldInscribedSecretSourceCore',
        needed: 20,
        inventory: null,
        delta: null,
      }),
    );
    expect(html).toContain('Gold-Inscribed Secret Source Core');
    expect(html).toContain('Plan 20');
    expect(html).toContain('no unrecorded stock credited');
    expect(html).not.toContain('Deficit unknown');
    expect(html).not.toContain('<input');
  });
  it('shows the planning remainder after known crafting credit without pretending stock was observed', () => {
    const html = renderToStaticMarkup(
      createElement(MaterialRow, {
        itemKey: 'PhilosophiesOfContention',
        needed: 5,
        inventory: null,
        delta: null,
        planningDelta: 2,
      }),
    );
    expect(html).toContain('Plan 2');
    expect(html).toContain('Unknown');
  });
});
