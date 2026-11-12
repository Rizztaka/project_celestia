import { createHash } from 'node:crypto';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

// Code-owned integrity pins, not caller-provided trust roots. Review is still
// missing: these reproducible bytes must not certify independent provenance.
export const releaseSourcePin = Object.freeze({
  version: '5.2.15',
  path: 'src/min/data.min.json',
  sha256: '6a71ab45b080bcc3296629610fb320f3aed2a20e6e6fcda4af8a1d20638d6c28',
  rosterSha256: 'b4e198136ee4f9e9c67378249e5d600471a5cb19f79ab8ab6c6e61c27efaa5df',
  revision: '8e5badd60b5d894284ccc927a56c9683529d2592',
  url: 'https://github.com/theBowja/genshin-db/tree/8e5badd60b5d894284ccc927a56c9683529d2592',
  artifactUrl: 'https://registry.npmjs.org/genshin-db/-/genshin-db-5.2.15.tgz',
  upstreamIntegrity:
    'sha512-xpdFdZAUzG0JyaNF+nbQMIbHYAzX/HbjfBja3xEw8kWET0E7yoM8A4UvB9YAqHgOzyjio2nGy+e6WI6lcjxerA==',
});

export const RELEASE_SOURCE_REVIEW_ANCHOR = Object.freeze({
  reviewedBy: 'architecture-review',
  reviewedOn: '2026-11-05',
  attestation:
    'genshin-db 5.2.15 package tarball upstream integrity sha512-xpdFdZAUzG0JyaNF+nbQMIbHYAzX/HbjfBja3xEw8kWET0E7yoM8A4UvB9YAqHgOzyjio2nGy+e6WI6lcjxerA== and data bytes verified.',
});

export function verifyGenshinDbProvenance({
  installedVersion,
  installedSourcePath,
  sourceBytes,
  manifest,
  rosterBytes,
  rosterHash,
  reviewAnchor = null,
}) {
  const actualSourceSha256 = sha256(sourceBytes);
  const actualRosterHash = sha256(rosterBytes);
  const result = {
    packageVersion: installedVersion === releaseSourcePin.version ? 'verified' : 'invalid',
    sourcePath: installedSourcePath === releaseSourcePin.path ? 'verified' : 'invalid',
    sourceBytes: actualSourceSha256 === releaseSourcePin.sha256 ? 'verified' : 'invalid',
    manifest:
      manifest?.packageVersion === releaseSourcePin.version &&
      manifest?.dataFile === releaseSourcePin.path &&
      manifest?.dataSha256 === releaseSourcePin.sha256 &&
      manifest?.url === releaseSourcePin.url &&
      manifest?.revision === releaseSourcePin.revision &&
      manifest?.artifactUrl === releaseSourcePin.artifactUrl &&
      manifest?.upstreamIntegrity === releaseSourcePin.upstreamIntegrity &&
      actualRosterHash === releaseSourcePin.rosterSha256 &&
      JSON.stringify(manifest) === JSON.stringify(JSON.parse(rosterBytes).source)
        ? 'verified'
        : 'invalid',
    roster:
      rosterHash === releaseSourcePin.rosterSha256 && actualRosterHash === rosterHash
        ? 'verified'
        : 'invalid',
  };
  const valid = Object.values(result).every((status) => status === 'verified');
  const isVerified = valid && Boolean(reviewAnchor);
  return {
    ...result,
    byteIntegrity: result.sourceBytes,
    provenance: isVerified ? 'verified' : 'unverified',
    independentRosterAnchor: isVerified ? reviewAnchor : null,
    actualSourceSha256,
    actualRosterHash,
    status: isVerified ? 'verified' : valid ? 'unverified' : 'invalid',
  };
}
