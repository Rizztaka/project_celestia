import { afterEach, describe, expect, it, vi } from 'vitest';

const origin = vi.hoisted(() => ({ eol: null }));
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    cpSync(from, to, ...options) {
      actual.cpSync(from, to, ...options);
      if (
        origin.eol &&
        String(from).replaceAll('\\', '/').endsWith('/guide-knowledge/contextual.release.ts')
      ) {
        const lf = actual.readFileSync(to, 'utf8').replace(/\r\n/g, '\n');
        actual.writeFileSync(to, origin.eol === 'crlf' ? lf.replace(/\n/g, '\r\n') : lf);
      }
    },
  };
});

import { knowledgeGitRoundTrip } from './contextual-git-roundtrip.mjs';

afterEach(() => {
  origin.eol = null;
});

describe('K3 project Git byte preservation', () => {
  it.each([true, false])(
    'preserves exact approved release and pinned builder inputs with core.autocrlf=%s',
    (autocrlf) => {
      const result = knowledgeGitRoundTrip(autocrlf);
      expect(result.temporaryRemoved).toBe(true);
      expect(result.mismatches).toEqual([]);
      expect(result.failure).toBeNull();
      expect(result.afterIdentity).toEqual(result.beforeIdentity);
      expect(result.beforeIdentity.release.id).toBe('k3-approved-k2-baseline');
      expect(result.recordedInputs).toHaveLength(19);
      expect(result.recordedInputs.every((input) => input.sha256 === input.after)).toBe(true);
      expect(result.ordinarySourceAttribute).toMatch(/text: unspecified$/);
      expect(result.ordinaryCheckoutHasCrlf).toBe(autocrlf);
    },
    30000,
  );
  it.each([
    [true, 'lf'],
    [false, 'lf'],
    [true, 'crlf'],
    [false, 'crlf'],
  ])(
    'preserves pinned knowledge with autocrlf=%s and %s-origin ordinary source',
    (autocrlf, eol) => {
      origin.eol = eol;
      const result = knowledgeGitRoundTrip(autocrlf);
      expect(result.temporaryRemoved).toBe(true);
      expect(result.mismatches).toEqual([]);
      expect(result.failure).toBeNull();
      expect(result.afterIdentity).toEqual(result.beforeIdentity);
      expect(result.recordedInputs.every((input) => input.sha256 === input.after)).toBe(true);
      expect(result.ordinarySourceAttribute).toMatch(/text: unspecified$/);
      expect(result.ordinaryOriginHasCrlf).toBe(eol === 'crlf');
      expect(result.ordinaryStagedHasCrlf).toBe(false);
      expect(result.ordinaryCheckoutHasCrlf).toBe(autocrlf);
    },
    30000,
  );
});
