import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import { verifyGenshinDbProvenance } from './release-source-provenance.mjs';

const require = createRequire(import.meta.url);
const sourceBytes = readFileSync(require.resolve('genshin-db/src/min/data.min.json'));
const rosterBytes = readFileSync(
  new URL('../src/games/genshin/static/release-roster.json', import.meta.url),
);
const sourceHash = createHash('sha256').update(sourceBytes).digest('hex');
const rosterHash = createHash('sha256').update(rosterBytes).digest('hex');
const input = {
  installedVersion: '5.2.15',
  installedSourcePath: 'src/min/data.min.json',
  sourceBytes,
  expectedVersion: '5.2.15',
  expectedSourcePath: 'src/min/data.min.json',
  expectedSourceSha256: sourceHash,
  manifest: JSON.parse(rosterBytes).source,
  rosterBytes,
  rosterHash,
  expectedRosterHash: rosterHash,
};

describe('genshin-db release source provenance', () => {
  it('checks exact installed bytes while leaving independent provenance unverified', () => {
    expect(verifyGenshinDbProvenance(input)).toMatchObject({
      status: 'unverified',
      provenance: 'unverified',
      independentRosterAnchor: null,
      packageVersion: 'verified',
      sourcePath: 'verified',
      sourceBytes: 'verified',
      manifest: 'verified',
      roster: 'verified',
    });
  });

  it('rejects installed package-version drift', () => {
    expect(verifyGenshinDbProvenance({ ...input, installedVersion: '5.2.14' })).toMatchObject({
      status: 'invalid',
      packageVersion: 'invalid',
    });
  });

  it('rejects installed source-data drift', () => {
    expect(
      verifyGenshinDbProvenance({ ...input, sourceBytes: Buffer.from('altered source bytes') }),
    ).toMatchObject({ status: 'invalid', sourceBytes: 'invalid' });
  });

  it('rejects source bytes and manifest hash changed together', () => {
    const alteredSource = Buffer.from('altered source bytes');
    const alteredHash = createHash('sha256').update(alteredSource).digest('hex');
    expect(
      verifyGenshinDbProvenance({
        ...input,
        sourceBytes: alteredSource,
        manifest: { ...input.manifest, dataSha256: alteredHash },
      }),
    ).toMatchObject({ status: 'invalid', sourceBytes: 'invalid', manifest: 'invalid' });
  });

  it('rejects a source-path drift', () => {
    expect(
      verifyGenshinDbProvenance({ ...input, installedSourcePath: 'src/data.min.json' }),
    ).toMatchObject({ status: 'invalid', sourcePath: 'invalid' });
  });

  it('rejects a manifest and roster hash changed together', () => {
    const alteredRoster = Buffer.from('{"releaseEntries":[{"gameId":1}]}');
    const alteredHash = createHash('sha256').update(alteredRoster).digest('hex');
    expect(
      verifyGenshinDbProvenance({
        ...input,
        rosterBytes: alteredRoster,
        rosterHash: alteredHash,
      }),
    ).toMatchObject({ status: 'invalid', roster: 'invalid' });
  });
  it.each(['url', 'revision', 'upstreamIntegrity'])(
    'rejects refreshed %s provenance even when callers supply matching expectations',
    (field) => {
      const next = structuredClone(input.manifest);
      next[field] = 'attacker-controlled';
      expect(
        verifyGenshinDbProvenance({ ...input, manifest: next, expectedSource: next }),
      ).toMatchObject({ status: 'invalid', manifest: 'invalid' });
    },
  );
});
