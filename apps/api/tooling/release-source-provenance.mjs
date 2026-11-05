import { createHash } from 'node:crypto';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

// Code-owned integrity pins, not caller-provided trust roots. Review is still
// missing: these reproducible bytes must not certify independent provenance.
export const releaseSourcePin = Object.freeze({
  version: '5.2.14',
  path: 'src/min/data.min.json',
  sha256: '948b4e005f9f23871a8045fc58a40fed63a2b473b402e42d33459a2ded9a4bbf',
  rosterSha256: '7cf3352e279f8d0cc0b58ce9f0a7b2f78e55443aa16a83d377e404962eb7c92e',
  revision: 'd158715a69615c9730d060fbf4bc2c75cc48166e',
  url: 'https://github.com/theBowja/genshin-db/tree/d158715a69615c9730d060fbf4bc2c75cc48166e',
  artifactUrl: 'https://registry.npmjs.org/genshin-db/-/genshin-db-5.2.14.tgz',
  upstreamIntegrity:
    'sha512-ynW5TYaEKJJOCUghETzv0CAe3OPUgtoKMWHxnpca9zyyrPmzEsYg4ATbplbdAh3ED0cc4fwLm83HxMquCGKX6w==',
});

export function verifyGenshinDbProvenance({
  installedVersion,
  installedSourcePath,
  sourceBytes,
  manifest,
  rosterBytes,
  rosterHash,
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
  return {
    ...result,
    byteIntegrity: result.sourceBytes,
    provenance: 'unverified',
    independentRosterAnchor: null,
    actualSourceSha256,
    actualRosterHash,
    status: Object.values(result).every((status) => status === 'verified')
      ? 'unverified'
      : 'invalid',
  };
}
