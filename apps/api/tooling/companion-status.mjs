import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { sourceCurrent } from '../../web/src/lib/build-analysis/coverage.ts';
import { reviewedProfiles } from '../../web/src/lib/build-analysis/identity.ts';
import { calculateCompanionCoverage } from './companion-coverage.mjs';
import {
  ENKA_REVIEW_ANCHOR,
  retrievePinnedEnka,
  verifyEnkaProvenance,
} from './enka-provenance.mjs';
import {
  OFFICIAL_RELEASE_REVIEW_ANCHOR,
  verifyOfficialReleaseEvidence,
} from './official-release-evidence.mjs';
import {
  RELEASE_SOURCE_REVIEW_ANCHOR,
  verifyGenshinDbProvenance,
} from './release-source-provenance.mjs';

const staticRoot = new URL('../src/games/genshin/static/', import.meta.url);
const referenceRoot = new URL('profile-reference/', staticRoot);
const readJson = async (url) => JSON.parse(await readFile(url, 'utf8'));
const require = createRequire(import.meta.url);
const genshinDbPackagePath = require.resolve('genshin-db/package.json');
const genshinDbPackage = require(genshinDbPackagePath);
const genshinDbDataPath = require.resolve('genshin-db/src/min/data.min.json');

export async function loadCompanionCoverage({ verifyUpstream = false } = {}) {
  const [
    catalog,
    index,
    engine,
    avatarBytes,
    avatarProvenance,
    rosterEvidence,
    progression,
    evidence,
    releaseRosterBytes,
    releaseRoster,
    releaseRosterHashBytes,
    releaseSourceBytes,
    officialEvidence,
    officialEvidenceBytes,
    officialEvidenceHashBytes,
    officialSourceBytes,
  ] = await Promise.all([
    readJson(new URL('character-profiles.json', staticRoot)),
    readJson(new URL('index.json', referenceRoot)),
    readJson(new URL('../../web/src/lib/team-damage/engine-metadata.json', import.meta.url)),
    readFile(new URL('enka/characters.json', staticRoot)),
    readJson(new URL('enka/provenance.json', staticRoot)),
    readJson(new URL('release-roster.json', staticRoot)),
    readJson(new URL('character-materials.json', staticRoot)),
    readJson(new URL('catalog-evidence.json', staticRoot)),
    readFile(new URL('release-roster.json', staticRoot)),
    readJson(new URL('release-roster.json', staticRoot)),
    readFile(new URL('release-roster.sha256', staticRoot)),
    readFile(genshinDbDataPath),
    readJson(new URL('official-7.1-evidence.json', staticRoot)),
    readFile(new URL('official-7.1-evidence.json', staticRoot)),
    readFile(new URL('official-7.1-evidence.sha256', staticRoot)),
    readFile(new URL('official-7.1-source.json', staticRoot)),
  ]);
  const avatarMetadata = JSON.parse(avatarBytes.toString('utf8'));
  const identitySourceProvenance = verifyEnkaProvenance({
    provenance: avatarProvenance,
    provenanceBytes: await readFile(new URL('enka/provenance.json', staticRoot)),
    charactersBytes: avatarBytes,
    englishBytes: await readFile(new URL('enka/english.json', staticRoot)),
    upstream: verifyUpstream ? await retrievePinnedEnka() : undefined,
    reviewAnchor: ENKA_REVIEW_ANCHOR,
  });
  const elements = {
    Wind: 'Anemo',
    Rock: 'Geo',
    Electric: 'Electro',
    Grass: 'Dendro',
    Water: 'Hydro',
    Fire: 'Pyro',
    Ice: 'Cryo',
    None: 'None',
  };
  const formMetadata = {};
  for (const [key, value] of Object.entries(avatarMetadata)) {
    if (/^[1-9]\d*-[1-9]\d*$/.test(key))
      formMetadata[key.replace('-', ':')] = {
        element: elements[value.Element] ?? null,
        identitySource: 'enka_variant',
        mechanicsSource: 'enka-avatar-snapshot',
        mechanics: {
          skillOrder: value.SkillOrder ?? [],
          proudMap: value.ProudMap ?? {},
        },
      };
  }
  for (const key of [
    ...Object.keys(engine.characters),
    ...reviewedProfiles.map((profile) => `${profile.avatarId}:${profile.skillDepotId}`),
  ]) {
    if (formMetadata[key]) continue;
    const metadata = avatarMetadata[key.split(':')[0]];
    formMetadata[key] = {
      element: metadata ? (elements[metadata.Element] ?? null) : null,
      identitySource: engine.characters[key] ? 'pinned_engine' : 'reviewed_role_profile',
      mechanicsSource: metadata ? 'enka-avatar-snapshot' : null,
      mechanics: metadata
        ? { skillOrder: metadata.SkillOrder ?? [], proudMap: metadata.ProudMap ?? {} }
        : null,
    };
  }
  const mechanicsStates = {};
  const releaseData = JSON.parse(releaseSourceBytes.toString('utf8'));
  const releaseSourceRecords = Object.entries(releaseData.data.English.characters).map(
    ([filename, character]) => ({
      gameId: character.id,
      sourceName: character.name,
      element: character.elementText,
      weaponType: character.weaponText,
      releaseVersion: character.version ?? releaseData.version?.characters?.[filename] ?? null,
    }),
  );
  const releaseSourceProvenance = verifyGenshinDbProvenance({
    installedVersion: genshinDbPackage.version,
    installedSourcePath: relative(
      resolve(genshinDbPackagePath, '..'),
      genshinDbDataPath,
    ).replaceAll('\\', '/'),
    sourceBytes: releaseSourceBytes,
    manifest: releaseRoster.source,
    rosterBytes: releaseRosterBytes,
    rosterHash: releaseRosterHashBytes.toString('utf8').trim(),
    reviewAnchor: RELEASE_SOURCE_REVIEW_ANCHOR,
  });
  const releaseSourceIntegrity =
    releaseSourceProvenance.sourceBytes === 'verified' &&
    releaseSourceProvenance.roster === 'verified' &&
    releaseSourceProvenance.manifest === 'verified';
  const officialReleaseEvidence = verifyOfficialReleaseEvidence({
    evidence: officialEvidence,
    evidenceBytes: officialEvidenceBytes,
    evidenceHash: officialEvidenceHashBytes.toString('utf8').trim(),
    sourceBytes: officialSourceBytes,
    reviewAnchor: OFFICIAL_RELEASE_REVIEW_ANCHOR,
  });
  const localSource = async (url) => ({
    immutableUrl: null,
    retrievalTimestamp: null,
    upstreamSha256: null,
    localSha256: createHash('sha256')
      .update(await readFile(url))
      .digest('hex'),
  });
  const [descriptionSource, progressionSource, mechanicsSource, simulationSource] =
    await Promise.all([
      localSource(new URL('index.json', referenceRoot)),
      localSource(new URL('catalog-evidence.json', staticRoot)),
      localSource(new URL('enka/characters.json', staticRoot)),
      localSource(new URL('../../web/src/lib/team-damage/engine-metadata.json', import.meta.url)),
    ]);
  const referenceStates = Object.fromEntries(
    await Promise.all(
      Object.entries(catalog)
        .filter(([key]) => !key.startsWith('_'))
        .map(async ([key, character]) => {
          const entry = index.characters[key];
          if (!entry) return [key, 'missing'];
          if (!/^characters-[A-Za-z0-9]+\.json$/.test(entry.file))
            throw new Error(`Invalid reference filename for ${key}`);
          try {
            const bytes = await readFile(new URL(entry.file, referenceRoot));
            const hash = createHash('sha256').update(bytes).digest('hex');
            if (hash !== entry.sha256) return [key, 'hash_mismatch'];
            const reference = JSON.parse(bytes.toString('utf8'));
            const mechanics =
              Array.isArray(reference.talents) &&
              reference.talents.filter((talent) =>
                ['normal', 'skill', 'burst'].includes(talent.kind),
              ).length === 3;
            mechanicsStates[key] = mechanics ? 'partial' : 'unknown';
            return [
              key,
              reference.key === key && reference.gameId === character.gameId
                ? 'verified_snapshot'
                : 'identity_mismatch',
            ];
          } catch (error) {
            if (error.code === 'ENOENT') return [key, 'missing'];
            throw error;
          }
        }),
    ),
  );
  return calculateCompanionCoverage({
    catalog,
    referenceStates,
    engine,
    roleProfiles: reviewedProfiles.map((profile) => ({
      ...profile,
      sourceHashMatched:
        profile.evidenceIds.length > 0 && profile.evidenceIds.every((id) => sourceCurrent(id)),
    })),
    targetVersion: '7.1',
    formMetadata,
    metadataSource: {
      revision: avatarProvenance.revision,
      localSha256: createHash('sha256').update(avatarBytes).digest('hex'),
      scope:
        'Local projected Enka metadata; digest records these bytes, not upstream certification.',
      verification: identitySourceProvenance,
    },
    rosterEvidence: {
      ...rosterEvidence,
      source: {
        id: 'enka-avatar-snapshot',
        url: identitySourceProvenance.sources[0].url,
        revision: avatarProvenance.revision,
        patchScope: 'Snapshot acquired after the Version 7.1 release; identity denominator only.',
        reviewStatus: 'unverified',
        retrievedAt: avatarProvenance.acquiredAt,
        localSha256: identitySourceProvenance.localSha256.characters,
        upstreamSha256: identitySourceProvenance.sources[0].upstreamSha256,
      },
      identityEntries: Object.entries(avatarMetadata)
        .filter(([key]) => /^\d+$/.test(key))
        .map(([key, value]) => ({
          gameId: Number(key),
          name:
            value.SideIconName?.split('/')
              .pop()
              ?.replace(/^UI_AvatarIcon_Side_/, '') ?? key,
          element: elements[value.Element] ?? null,
          weaponType: value.WeaponType ?? null,
        }))
        .sort((a, b) => a.gameId - b.gameId),
      releaseEntries: releaseRoster.releaseEntries,
      releaseSource: releaseRoster.source,
      releaseSourceRecords,
      releaseSourceIntegrity,
      releaseSourceProvenance,
      identitySourceProvenance,
      officialReleaseEvidence,
    },
    progressionStates: Object.fromEntries(
      Object.keys(catalog)
        .filter((key) => !key.startsWith('_'))
        .map((key) => [
          key,
          Object.prototype.hasOwnProperty.call(progression, key) &&
          evidence.some(
            (claim) =>
              claim.targetKey === key &&
              ['CHARACTER_ASCENSION', 'CHARACTER_TALENT'].includes(claim.goalType),
          )
            ? 'verified'
            : 'unknown',
        ]),
    ),
    mechanicsStates,
    knowledgeSources: {
      description: {
        id: 'local-profile-reference',
        ...descriptionSource,
        revision: `sha256:${descriptionSource.localSha256}`,
        patchScope:
          'Description identity and local snapshot hashes; not kit or release certification.',
        reviewStatus: 'hash_checked',
        knownExclusions: ['Manekin', 'Manekina'],
      },
      progression: {
        id: 'local-progression-evidence',
        ...progressionSource,
        revision: `sha256:${progressionSource.localSha256}`,
        patchScope:
          'Only claims present in catalog-evidence.json; unsupported characters remain unknown.',
        reviewStatus: 'source_bound',
        knownExclusions: ['Unclaimed character cost records'],
      },
      mechanics: {
        id: 'enka-avatar-snapshot',
        ...mechanicsSource,
        immutableUrl: identitySourceProvenance.sources[0].url,
        retrievalTimestamp: avatarProvenance.acquiredAt,
        upstreamSha256: identitySourceProvenance.sources[0].upstreamSha256,
        revision: avatarProvenance.revision,
        patchScope:
          'Skill ordering and talent identity metadata; not an executable kit/mechanics model.',
        reviewStatus: 'snapshot',
        knownExclusions: ['Detailed reaction, constellation and rotation behavior'],
      },
      simulation: {
        id: engine.version,
        ...simulationSource,
        revision: engine.revision,
        patchScope: 'Pinned engine forms listed in engine-metadata.json only.',
        reviewStatus: 'pinned',
        knownExclusions: ['Forms absent from the pinned engine'],
      },
      endgame: {
        id: 'none',
        immutableUrl: null,
        retrievalTimestamp: null,
        localSha256: null,
        upstreamSha256: null,
        revision: null,
        patchScope: 'No per-character endgame applicability model is implemented.',
        reviewStatus: 'unavailable',
        knownExclusions: ['Encounter-specific readiness and rotation applicability'],
      },
    },
  });
}

export function explainCompanionCoverage(report) {
  const s = report.summary;
  return [
    `Genshin companion coverage — target ${report.targetVersion}`,
    `Local catalog: ${s.catalogEntries} entries / ${s.accountIdentities} account identities (Traveler variants count once).`,
    `Description references with matching local hashes and IDs: ${s.verifiedDescriptionReferences}/${s.catalogEntries}.`,
    `Missing or mismatched description references: ${report.gaps.descriptionReferences.join(', ') || 'none'}.`,
    `Identity snapshot: ${report.roster.matchedLocalIdentities}/${report.roster.denominator} locally matched; ${report.roster.localOnlyIdentities.length} local-only identities; reconciliation ${report.roster.identityReconciliation.status}.`,
    `Release manifest: ${report.roster.releaseVerification.matchedLocalIdentities}/${report.roster.releaseVerification.denominator} locally matched; byte integrity ${report.roster.releaseVerification.sourceIntegrity === true ? 'valid' : 'invalid'}; provenance ${report.roster.releaseVerification.sourceProvenance?.provenance ?? 'unknown'}; status ${report.roster.releaseVerification.status}.`,
    `Official artifact: byte integrity ${report.roster.officialReleaseVerification.sourceIntegrity}; provenance ${report.roster.officialReleaseVerification.provenance ?? 'unknown'}; status ${report.roster.officialReleaseVerification.status}.`,
    `Release completeness: ${report.releaseCompleteness}; reconciliation issues: ${report.roster.reconciliationIssues.length}.`,
    `Enka upstream bytes: ${report.metadataSource?.verification?.upstreamByteIntegrity ?? 'unknown'}; projection: ${report.metadataSource?.verification?.projectionIntegrity ?? 'unknown'}.`,
    `Official 7.1 additions: ${report.roster.releaseAdditions.map((addition) => `${addition.key} (${addition.status})`).join(', ') || 'none'}.`,
    `Catalog entries with an exact element/form listed for simulation: ${s.entriesWithSimulationForms}/${s.catalogEntries}.`,
    `Entries without a resolved depot/form identity: ${s.entriesWithUnresolvedFormIdentity}.`,
    `Catalog entries with reviewed role patterns: ${s.entriesWithReviewedRolePatterns}/${s.catalogEntries}.`,
    `Pinned engine ${report.engine.version}: ${s.engineCharacterForms} forms, ${s.engineWeapons} weapons, ${s.engineArtifactSets} artifact sets.`,
    `Without simulation forms: ${report.gaps.simulation.join(', ') || 'none'}.`,
    'This is a local inventory. Descriptions, role patterns and engine presence do not certify endgame readiness, every constellation, correct rotations, or complete release-to-7.1 coverage.',
    'Use --json for the full matrix and missing-role list; --verify-upstream rechecks pinned Enka raw bytes and their projection. Reference hashes prove local snapshot integrity; role-source hashes compare local manifests, not live upstream pages.',
  ].join('\n');
}

export function statusRequiresFailure(report) {
  return (
    report.releaseCompleteness !== 'verified' ||
    report.roster.reconciliationIssues.length > 0 ||
    report.gaps.blockedRoleSources.length > 0 ||
    report.metadataSource?.verification?.status === 'invalid' ||
    report.roster.releaseVerification?.sourceProvenance?.status === 'invalid' ||
    report.roster.officialReleaseVerification?.status === 'invalid'
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--json', '--verify-upstream'].includes(arg)))
    throw new Error('Usage: companion:status [--json] [--verify-upstream]');
  const report = await loadCompanionCoverage({
    verifyUpstream: args.includes('--verify-upstream'),
  });
  process.stdout.write(
    `${args.includes('--json') ? JSON.stringify(report, null, 2) : explainCompanionCoverage(report)}\n`,
  );
  if (statusRequiresFailure(report)) process.exitCode = 1;
}
