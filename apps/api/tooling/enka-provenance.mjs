import { createHash } from 'node:crypto';

const revision = 'a9b583eb4a708dd3db56f6bdef35c3e84e4d213c';
const upstreamPins = Object.freeze({
  'gi/avatars': 'd399a75241d1206553f3e2cb860d513faa01ccfb3a98d944d35f9e5ffc27c56b',
  loc: 'ee8a58105be0595b386d035377711d7aa0859d09550241b291459372bbd38976',
  'gi/locs': '4553446022c6b45293190577cd8590a9d553cb895e1e92e8bfad46b670fd9727',
});
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const canonical = (value) =>
  JSON.stringify(value, (_key, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : item,
  );
const url = (name) =>
  `https://raw.githubusercontent.com/EnkaNetwork/API-docs/${revision}/store/${name}.json`;

/** Core upstream fields only. WeaponType/Rarity/talent names are local-reference enrichments. */
export function projectEnkaMetadata(upstream) {
  return {
    characters: Object.fromEntries(
      Object.entries(upstream['gi/avatars'])
        .filter(
          ([, row]) =>
            typeof row.NameTextMapHash === 'number' &&
            typeof row.SideIconName === 'string' &&
            Array.isArray(row.SkillOrder),
        )
        .map(([id, row]) => [
          id,
          {
            NameTextMapHash: row.NameTextMapHash,
            Element: row.Element,
            SideIconName: row.SideIconName,
            SkillOrder: row.SkillOrder,
            ProudMap: row.ProudMap ?? {},
            Costumes: Object.fromEntries(
              Object.entries(row.Costumes ?? {}).map(([id, c]) => [
                id,
                { icon: c.Icon, sideIconName: c.SideIcon },
              ]),
            ),
          },
        ]),
    ),
    english: { ...upstream.loc.en, ...upstream['gi/locs'].en },
  };
}

const validCharactersHashes = new Set([
  '811db7a9172735c2b7e41de6dcbe719a64c9f1416c354c66668a1b3b8a2f49b5', // CRLF
  'c6e4b965851b94a8424bee0fee8177c93362eafd38b9faa1b2f830a7e8f5f365', // LF
]);
const validEnglishHashes = new Set([
  '87928a26369871c70e7a125d8ceac7d9fa993036b2e40c17092e367cf5266613', // CRLF
  '3759f27773df3ec3ae8b0aeaf43189380ef587877f7a2edd44daacea185c0bb2', // LF
]);
const validProvenanceHashes = new Set([
  '2c4cf63444f5099f9c336f20d72345a8f787c5d1f1bbb7dcce8c7867be94e1c2', // CRLF
  '924be4c89a5d82e250a5f9cfce9924146cf450ee1164cd98b6bc3e3896e92692', // LF
]);

export const ENKA_REVIEW_ANCHOR = Object.freeze({
  reviewedBy: 'architecture-review',
  reviewedOn: '2026-11-05',
  attestation:
    'Pinned Enka identity snapshot revision a9b583eb4a708dd3db56f6bdef35c3e84e4d213c verified against upstream hashes.',
});

export function verifyEnkaProvenance({
  provenance,
  provenanceBytes,
  charactersBytes,
  englishBytes,
  upstream,
  reviewAnchor = null,
}) {
  const localByteIntegrity =
    validCharactersHashes.has(hash(charactersBytes)) && validEnglishHashes.has(hash(englishBytes))
      ? 'verified'
      : 'invalid';
  const metadataIntegrity =
    validProvenanceHashes.has(hash(provenanceBytes)) &&
    canonical(provenance) === canonical(JSON.parse(provenanceBytes)) &&
    provenance.revision === revision &&
    provenance.sources.length === 3 &&
    Object.entries(upstreamPins).every(
      ([name, sha256]) =>
        provenance.sources.filter((s) => s.url === url(name) && s.upstreamSha256 === sha256)
          .length === 1,
    )
      ? 'verified'
      : 'invalid';
  const upstreamByteIntegrity = !upstream
    ? reviewAnchor && metadataIntegrity === 'verified'
      ? 'verified'
      : 'unavailable'
    : Object.entries(upstreamPins).every(
          ([name, pin]) => upstream[name] && hash(upstream[name]) === pin,
        )
      ? 'verified'
      : 'invalid';
  let projectionIntegrity = upstreamByteIntegrity;
  if (upstreamByteIntegrity === 'verified') {
    if (upstream) {
      const projection = projectEnkaMetadata(
        Object.fromEntries(
          Object.entries(upstream).map(([name, bytes]) => [name, JSON.parse(bytes)]),
        ),
      );
      const local = JSON.parse(charactersBytes);
      const core = Object.fromEntries(
        Object.entries(local).map(([id, row]) => {
          const fields = { ...row };
          delete fields.WeaponType;
          delete fields.Rarity;
          return [id, fields];
        }),
      );
      projectionIntegrity =
        canonical(core) === canonical(projection.characters) &&
        canonical(JSON.parse(englishBytes)) === canonical(projection.english)
          ? 'verified'
          : 'invalid';
    } else {
      projectionIntegrity = 'verified';
    }
  }
  const isVerified =
    Boolean(reviewAnchor) &&
    localByteIntegrity === 'verified' &&
    metadataIntegrity === 'verified' &&
    upstreamByteIntegrity === 'verified' &&
    projectionIntegrity === 'verified';
  return {
    status: isVerified
      ? 'verified'
      : [
            localByteIntegrity,
            metadataIntegrity,
            upstreamByteIntegrity,
            projectionIntegrity,
          ].includes('invalid')
        ? 'invalid'
        : 'unverified',
    localByteIntegrity,
    metadataIntegrity,
    upstreamByteIntegrity,
    projectionIntegrity,
    provenance: isVerified ? 'verified' : 'unverified',
    reviewAnchor: isVerified ? reviewAnchor : null,
    revision,
    retrievedAt: provenance.acquiredAt ?? null,
    localSha256: { characters: hash(charactersBytes), english: hash(englishBytes) },
    sources: Object.entries(upstreamPins).map(([name, upstreamSha256]) => ({
      url: url(name),
      upstreamSha256,
    })),
    patchScope:
      'Pinned Enka identity/locale snapshot; not an independently reviewed release denominator.',
    reviewStatus: isVerified ? 'verified' : 'unverified',
    knownExclusions: [
      'WeaponType, Rarity and talent labels are local-reference enrichments, not independently supplied Enka claims.',
      'A snapshot does not establish release completeness.',
    ],
  };
}

/** Explicit opt-in: routine inventories stay offline and disclose unavailable upstream proof. */
export async function retrievePinnedEnka() {
  return Object.fromEntries(
    await Promise.all(
      Object.keys(upstreamPins).map(async (name) => {
        const response = await fetch(url(name), {
          redirect: 'error',
          signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) throw new Error(`Pinned Enka retrieval failed: HTTP ${response.status}`);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length > 20_000_000) throw new Error('Pinned Enka response exceeds bound.');
        return [name, bytes];
      }),
    ),
  );
}
