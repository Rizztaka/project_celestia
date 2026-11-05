import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  extractOfficialReleasePayload,
  verifyOfficialReleaseEvidence,
} from './official-release-evidence.mjs';
import { verifyGenshinDbProvenance } from './release-source-provenance.mjs';

const root = new URL('../src/games/genshin/static/', import.meta.url);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sourceBytes = readFileSync(new URL('official-7.1-source.json', root));
const original = JSON.parse(sourceBytes);
const evidenceBytes = readFileSync(new URL('official-7.1-evidence.json', root));
const evidence = JSON.parse(evidenceBytes);
function official(overrides = {}) {
  return verifyOfficialReleaseEvidence({
    sourceBytes,
    evidence,
    evidenceBytes,
    evidenceHash: hash(evidenceBytes),
    expectedSource: { url: evidence.source.url, artifact: evidence.source.artifact },
    expectedEvidenceHash: hash(evidenceBytes),
    ...overrides,
  });
}
function extract(change) {
  const payload = structuredClone(original);
  change(payload);
  return extractOfficialReleasePayload(Buffer.from(JSON.stringify(payload)));
}

describe('independent provenance boundaries', () => {
  it('does not treat a matching local official artifact and claim manifest as independent approval', () => {
    expect(official()).toMatchObject({
      status: 'unverified',
      sourceIntegrity: true,
      provenance: 'unverified',
    });
    expect(official().entries.every((entry) => !Object.hasOwn(entry, 'gameId'))).toBe(true);
  });
  it('cannot replace source, manifest, expected source and expected evidence hash together', () => {
    const changed = Buffer.from(`${sourceBytes}\n`);
    const next = structuredClone(evidence);
    next.source.artifact.sha256 = hash(changed);
    next.source.artifact.byteLength = changed.length;
    const nextBytes = Buffer.from(JSON.stringify(next));
    expect(
      official({
        sourceBytes: changed,
        evidence: next,
        evidenceBytes: nextBytes,
        evidenceHash: hash(nextBytes),
        expectedSource: { url: next.source.url, artifact: next.source.artifact },
        expectedEvidenceHash: hash(nextBytes),
      }),
    ).toMatchObject({ status: 'invalid', sourceIntegrity: false });
  });
  it('does not authenticate arbitrary package bytes with caller-supplied trust roots', () => {
    const sourceBytes = Buffer.from('fake package');
    const rosterBytes = Buffer.from('{}');
    expect(
      verifyGenshinDbProvenance({
        installedVersion: '5.2.14',
        expectedVersion: '5.2.14',
        installedSourcePath: 'src/min/data.min.json',
        expectedSourcePath: 'src/min/data.min.json',
        sourceBytes,
        expectedSourceSha256: hash(sourceBytes),
        rosterBytes,
        rosterHash: hash(rosterBytes),
        expectedRosterHash: hash(rosterBytes),
        manifest: {
          packageVersion: '5.2.14',
          dataFile: 'src/min/data.min.json',
          dataSha256: hash(sourceBytes),
        },
      }).status,
    ).toBe('invalid');
  });
});

describe('bounded official section extraction', () => {
  it('parses 4-star entries instead of silently skipping them', () => {
    const result = extract((p) => {
      p.data.sContent = p.data.sContent.replace(
        'II. New Equipment',
        '"New Title" Test Character (Pyro) (4-Star)</p><p>◇ Vision: Pyro</p><p>◇ Weapon: Bow</p><p>II. New Equipment',
      );
    });
    expect(result.entries).toContainEqual({
      name: 'Test Character',
      element: 'Pyro',
      weaponType: 'Bow',
      releaseVersion: '7.1',
    });
    expect(result.status).not.toBe('verified');
  });
  it.each([
    [
      'missing start',
      (p) => {
        p.data.sContent = p.data.sContent.replace('I. New Characters', 'Characters');
      },
    ],
    [
      'missing end',
      (p) => {
        p.data.sContent = p.data.sContent.replace('II. New Equipment', 'Equipment');
      },
    ],
    [
      'duplicate section',
      (p) => {
        p.data.sContent += '<p>I. New Characters</p>';
      },
    ],
    [
      'malformed extra entry',
      (p) => {
        p.data.sContent = p.data.sContent.replace(
          'II. New Equipment',
          '"Broken" Third (4-Star)</p><p>◇ Weapon: Bow</p><p>II. New Equipment',
        );
      },
    ],
    [
      'unknown paragraph',
      (p) => {
        p.data.sContent = p.data.sContent.replace(
          'II. New Equipment',
          'Unexpected character data</p><p>II. New Equipment',
        );
      },
    ],
    [
      'error envelope',
      (p) => {
        p.retcode = -1;
      },
    ],
    [
      'wrong article',
      (p) => {
        p.data.iInfoId = 1;
      },
    ],
    [
      'wrong date',
      (p) => {
        p.data.dtStartTime = '2026-09-23garbage';
      },
    ],
    [
      'duplicate claim',
      (p) => {
        p.data.sContent = p.data.sContent.replaceAll('Vodyanitsa', 'Vesna');
      },
    ],
  ])('fails closed for %s', (_name, change) => {
    expect(extract(change).status).toBe('invalid');
  });
});
