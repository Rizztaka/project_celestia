import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { contextualKnowledgePack as pack } from '../src/games/genshin/intelligence/guide-knowledge/contextual.data.ts';
import { validateContextualPack } from '../src/games/genshin/intelligence/guide-knowledge/contextual.pack.ts';
import { digest } from '../src/games/genshin/intelligence/guide-knowledge/guide-knowledge.pack.ts';
import {
  retainedContextualSources,
  writeValidatedContextualPack,
} from './build-contextual-knowledge.mjs';

const sign = (value) => {
  const content = { ...value };
  delete content.contentHash;
  return { ...content, contentHash: digest(content) };
};
describe('K2 reviewed pack validation and atomic writer', () => {
  it('validates every retained dependency and flexible version/date without source execution', () => {
    expect(validateContextualPack(pack, retainedContextualSources())).toEqual(pack);
    const changed = structuredClone(pack);
    changed.version = 'k2-2';
    changed.claims[0].review.date = '2026-10-20';
    changed.limitations.push('globalThis.sourceRan=true; <script>throw new Error()</script>');
    expect(validateContextualPack(sign(changed)).version).toBe('k2-2');
    expect(globalThis.sourceRan).toBeUndefined();
  });
  it.each([
    [
      'schema',
      (p) => {
        p.schemaVersion = 1;
      },
    ],
    [
      'duplicate claim',
      (p) => {
        p.claims[1].id = p.claims[0].id;
      },
    ],
    [
      'missing id',
      (p) => {
        delete p.claims[0].id;
      },
    ],
    [
      'missing subject',
      (p) => {
        p.subjects.pop();
      },
    ],
    [
      'duplicate source',
      (p) => {
        p.sources[1].id = p.sources[0].id;
      },
    ],
    [
      'dangling source',
      (p) => {
        p.claims[0].sourceIds[0] = 'missing';
      },
    ],
    [
      'unreviewed active',
      (p) => {
        p.claims[0].review.state = 'candidate';
      },
    ],
    [
      'conflicted active',
      (p) => {
        p.claims[0].conflicted = true;
      },
    ],
    [
      'stale unsupported active',
      (p) => {
        p.claims[0].support = 'unsupported_scope';
      },
    ],
    [
      'bad source hash',
      (p) => {
        p.sources[0].sha256 = 'f'.repeat(64);
      },
    ],
    [
      'bad unit',
      (p) => {
        p.claims.find((entry) => entry.effect.kind === 'crit_rate').effect.unit = 'DPS';
      },
    ],
    [
      'invalid stack range',
      (p) => {
        p.claims.find((entry) => entry.effect.kind === 'crit_rate').effect.maxStacks = 4;
      },
    ],
    [
      'unbounded effect',
      (p) => {
        p.claims.find((entry) => entry.effect.kind === 'resistance_reduction').effect.amount = 999;
      },
    ],
    [
      'kind mismatch',
      (p) => {
        p.claims[0].kind = 'mechanical';
      },
    ],
    [
      'arbitrary code',
      (p) => {
        p.claims[0].condition = { op: 'eval', code: 'process.exit()' };
      },
    ],
    [
      'deep expression',
      (p) => {
        for (let i = 0; i < 20; i++)
          p.claims[0].condition = { op: 'not', arg: p.claims[0].condition };
      },
    ],
    [
      'large expression',
      (p) => {
        p.claims[0].condition = { op: 'all', args: Array(300).fill({ op: 'known', fact: 'role' }) };
      },
    ],
  ])('rejects %s even when its content digest is recomputed', (_name, mutate) => {
    const changed = structuredClone(pack);
    mutate(changed);
    expect(() => validateContextualPack(sign(changed))).toThrow();
  });
  it('rejects a bad content hash and retains the last valid file on candidate/source failure', () => {
    const directory = mkdtempSync(join(tmpdir(), 'celestia-k2-pack-'));
    const output = join(directory, 'pack.json');
    try {
      writeValidatedContextualPack(pack, output);
      const before = readFileSync(output);
      expect(() =>
        writeValidatedContextualPack({ ...pack, contentHash: '0'.repeat(64) }, output),
      ).toThrow('hash');
      expect(() =>
        writeValidatedContextualPack({ schemaVersion: 'research-draft-1' }, output),
      ).toThrow();
      const sources = retainedContextualSources();
      sources['go-goldentroupe'] = Buffer.from('globalThis.sourceRan=true');
      expect(() => writeValidatedContextualPack(pack, output, sources)).toThrow('byte hash');
      expect(readFileSync(output)).toEqual(before);
      expect(readdirSync(directory)).toEqual(['pack.json']);
      expect(globalThis.sourceRan).toBeUndefined();
    } finally {
      rmSync(directory, { recursive: true });
    }
  });
  it('retains explicitly excluded conflict evidence without turning it into a verdict', () => {
    const changed = structuredClone(pack);
    const excluded = changed.claims.at(-1);
    excluded.conflicted = true;
    excluded.review.state = 'conflicted';
    expect(validateContextualPack(sign(changed)).claims.at(-1).status).toBe('excluded');
  });
});
