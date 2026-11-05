import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  extractOfficialReleasePayload,
  OFFICIAL_7_1_EVIDENCE_SHA256,
  OFFICIAL_7_1_SOURCE_METADATA,
  verifyOfficialReleaseEvidence,
} from './official-release-evidence.mjs';

const root = new URL('../src/games/genshin/static/', import.meta.url);
const sourceBytes = readFileSync(new URL('official-7.1-source.json', root));
const evidenceBytes = readFileSync(new URL('official-7.1-evidence.json', root));
const evidence = JSON.parse(evidenceBytes);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const claims = [
  { name: 'Vesna', element: 'Anemo', weaponType: 'Sword', releaseVersion: '7.1' },
  { name: 'Vodyanitsa', element: 'Hydro', weaponType: 'Catalyst', releaseVersion: '7.1' },
];
function verify(overrides = {}) {
  const next = overrides.evidence ?? evidence;
  const bytes = overrides.evidence ? Buffer.from(JSON.stringify(next)) : evidenceBytes;
  return verifyOfficialReleaseEvidence({
    evidence: next,
    evidenceBytes: bytes,
    evidenceHash: hash(bytes),
    sourceBytes,
    ...overrides,
  });
}

describe('official release evidence provenance', () => {
  it('pins artifact bytes without mistaking those pins for independent source approval', () => {
    expect(sourceBytes.length).toBe(OFFICIAL_7_1_SOURCE_METADATA.byteLength);
    expect(hash(sourceBytes)).toBe(OFFICIAL_7_1_SOURCE_METADATA.sha256);
    expect(hash(evidenceBytes)).toBe(OFFICIAL_7_1_EVIDENCE_SHA256);
    expect(extractOfficialReleasePayload(sourceBytes)).toMatchObject({
      status: 'parsed',
      publishedOn: '2026-09-23',
      entries: claims,
    });
  });
  it('separates extracted name/type claims from independently joined game IDs', () => {
    expect(verify()).toMatchObject({
      status: 'unverified',
      provenance: 'unverified',
      reviewAnchor: null,
      sourceIntegrity: true,
      evidenceIntegrity: true,
      extractionIntegrity: true,
      claimsIntegrity: true,
      mismatches: [],
      entries: claims,
    });
  });
  it('rejects altered source bytes even with a refreshed caller hash', () => {
    const bytes = Buffer.from(`${sourceBytes}tampered`);
    expect(
      verify({
        sourceBytes: bytes,
        expectedSource: { artifact: { sha256: hash(bytes), byteLength: bytes.length } },
      }),
    ).toMatchObject({ status: 'invalid', sourceIntegrity: false });
  });
  it('rejects omitted extracted claims with refreshed evidence metadata', () => {
    const next = structuredClone(evidence);
    next.extraction.entries.pop();
    expect(verify({ evidence: next })).toMatchObject({
      status: 'invalid',
      extractionIntegrity: false,
    });
  });
  it('rejects changed source and claims together even if all caller-provided hashes are refreshed', () => {
    const payload = JSON.parse(sourceBytes);
    payload.data.sContent = payload.data.sContent.replaceAll('Vesna', 'Different Character');
    const bytes = Buffer.from(JSON.stringify(payload));
    const next = structuredClone(evidence);
    next.source.artifact.sha256 = hash(bytes);
    next.source.artifact.byteLength = bytes.length;
    next.extraction = extractOfficialReleasePayload(bytes);
    expect(
      verify({
        sourceBytes: bytes,
        evidence: next,
        expectedSource: next.source,
        expectedEvidenceHash: hash(Buffer.from(JSON.stringify(next))),
      }),
    ).toMatchObject({ status: 'invalid', sourceIntegrity: false, claimsIntegrity: false });
  });
  it('rejects a wrong URL and mutable provenance replacement', () => {
    const next = structuredClone(evidence);
    next.source.url = 'https://example.test/wrong';
    expect(verify({ evidence: next })).toMatchObject({ status: 'invalid', sourceIntegrity: false });
  });
  it('rejects a wrong publication date', () => {
    const next = structuredClone(evidence);
    next.extraction.publishedOn = '2026-09-24';
    expect(verify({ evidence: next })).toMatchObject({
      status: 'invalid',
      extractionIntegrity: false,
    });
  });
  it.each(['Vesna', 'Vodyanitsa'])('rejects mismatched %s claims', (name) => {
    const next = structuredClone(evidence);
    next.extraction.entries.find((e) => e.name === name).element = 'Pyro';
    expect(verify({ evidence: next })).toMatchObject({
      status: 'invalid',
      extractionIntegrity: false,
      claimsIntegrity: false,
    });
  });
  it('reports a bootstrap shell as unavailable', () => {
    expect(
      extractOfficialReleasePayload(
        Buffer.from('<html><script>window.__NUXT__={}</script></html>'),
      ),
    ).toMatchObject({ status: 'unavailable', entries: [] });
  });
  it('rejects detached evidence objects even if the supplied original bytes have the correct digest', () => {
    const next = structuredClone(evidence);
    next.source.retrievalTimestamp = '2099-01-01T00:00:00Z';
    expect(
      verifyOfficialReleaseEvidence({
        evidence: next,
        evidenceBytes,
        evidenceHash: hash(evidenceBytes),
        sourceBytes,
      }),
    ).toMatchObject({ status: 'invalid', evidenceIntegrity: false });
  });
  it('returns invalid instead of throwing when stored extraction evidence is malformed', () => {
    const next = structuredClone(evidence);
    next.extraction = {};
    expect(
      verifyOfficialReleaseEvidence({
        evidence: next,
        evidenceBytes: Buffer.from(JSON.stringify(next)),
        evidenceHash: hash(Buffer.from(JSON.stringify(next))),
        sourceBytes,
      }),
    ).toMatchObject({ status: 'invalid', extractionIntegrity: false, claimsIntegrity: false });
  });
  it('rejects a character heading with no meaningful name or descriptive paragraphs', () => {
    const blankName = structuredClone(JSON.parse(sourceBytes));
    blankName.data.sContent = blankName.data.sContent.replace('Vesna (Anemo)', '  (Anemo)');
    expect(extractOfficialReleasePayload(Buffer.from(JSON.stringify(blankName))).status).toBe(
      'invalid',
    );
    const missingDescription = structuredClone(JSON.parse(sourceBytes));
    missingDescription.data.sContent = missingDescription.data.sContent.replace(
      '◆ Vesna is an Anemo DMG dealer who enables her party to trigger Stellar Swirl reactions and, under certain conditions, can also deal Stellar Swirl DMG herself.',
      '',
    );
    expect(
      extractOfficialReleasePayload(Buffer.from(JSON.stringify(missingDescription))).status,
    ).toBe('invalid');
    const missingSummary = structuredClone(JSON.parse(sourceBytes));
    missingSummary.data.sContent = missingSummary.data.sContent.replace(
      "◇ Commander of the Druzhna and the Tsaritsa's keen blade.",
      '',
    );
    expect(extractOfficialReleasePayload(Buffer.from(JSON.stringify(missingSummary))).status).toBe(
      'invalid',
    );
  });
});
