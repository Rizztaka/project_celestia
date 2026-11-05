const fields = ['element', 'weaponType', 'releaseVersion'];
const validId = (id) => Number.isSafeInteger(id) && id > 0;
const version = (value) =>
  /^([1-9]\d*)\.(\d+)$/
    .exec(value ?? '')
    ?.slice(1)
    .map(Number);
const same = (a, b, keys) => keys.every((key) => a?.[key] !== undefined && a[key] === b?.[key]);

/** Reconcile claims without silently deduplicating evidence or certifying local hashes as provenance. */
export function reconcileRoster(rows, evidence, targetVersion) {
  const issues = [];
  const officialIssues = [];
  const add = (source, code, identity, entries) =>
    issues.push({ source, code, identity, ...(entries ? { entries } : {}) });
  const addOfficial = (source, code, identity, entries) =>
    officialIssues.push({ source, code, identity, ...(entries ? { entries } : {}) });
  for (const identity of evidence?.catalogIssues ?? []) add('catalog', 'invalid_entry', identity);
  const entriesOf = (source, value) => {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) return value;
    add(source, 'invalid_shape', null);
    return [];
  };
  const officialEntriesOf = (value) => {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value))
      return value.filter((entry) => {
        if (entry && typeof entry === 'object' && !Array.isArray(entry)) return true;
        addOfficial('officialEntries', 'invalid_entry', null, [entry]);
        return false;
      });
    addOfficial('officialEntries', 'invalid_shape', null);
    return [];
  };
  const recordsOf = (source, value) =>
    entriesOf(source, value).filter((entry) => {
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) return true;
      add(source, 'invalid_entry', null, [entry]);
      return false;
    });
  const identityEntries = recordsOf(
    'identityEntries',
    evidence?.identityEntries ?? evidence?.entries,
  );
  const releaseEntries = recordsOf('releaseEntries', evidence?.releaseEntries);
  const sourceRecords = recordsOf('releaseSourceRecords', evidence?.releaseSourceRecords);
  const additions = recordsOf('releaseAdditions', evidence?.releaseAdditions);
  const official = evidence?.officialReleaseEvidence;
  const officialEntries = officialEntriesOf(official?.entries);
  const unique = (source, entries, key = 'gameId', reportIssue = add) => {
    const result = new Map();
    for (const entry of entries) {
      const id = entry[key];
      if (key === 'gameId' ? !validId(id) : typeof id !== 'string' || !id.trim())
        reportIssue(source, 'invalid_identity', id ?? null);
      if (result.has(id)) reportIssue(source, 'duplicate_identity', id, [result.get(id), entry]);
      else result.set(id, entry);
    }
    return result;
  };
  // Explicit catalog view aliases are not additional playable identities. Do not
  // exempt arbitrary duplicate avatars or infer a depot from these element labels.
  const aliases = rows.filter(
    (row) =>
      row.gameId === 10000005 &&
      ['Anemo', 'Geo', 'Electro', 'Dendro', 'Hydro', 'Pyro', 'Cryo'].some(
        (element) => row.key === `Traveler${element}` && row.element === element,
      ) &&
      rows.some(
        (base) =>
          base.key === 'Aether' && base.gameId === row.gameId && base.weaponType === row.weaponType,
      ),
  );
  const local = unique(
    'catalog',
    rows.filter((row) => !aliases.includes(row)),
  );
  const identities = unique('identityEntries', identityEntries);
  const releases = unique('releaseEntries', releaseEntries);
  const sources = unique('releaseSourceRecords', sourceRecords);
  const added = unique('releaseAdditions', additions, 'gameId', addOfficial);
  const claims = unique('officialEntries', officialEntries, 'name', addOfficial);
  const names = unique(
    'releaseSourceNames',
    sourceRecords.map((row) => ({ name: row.sourceName })),
    'name',
  );
  if (names.size !== sourceRecords.length) add('releaseSourceRecords', 'ambiguous_names', null);
  const NON_PLAYABLE_IDENTITIES = new Set([10000117, 10000118]);
  const UPCOMING_CATALOG_IDENTITIES = new Set([10000136, 10000137]);
  const difference = (a, b) => [...a.keys()].filter((id) => !b.has(id)).sort((a, b) => a - b);
  const identityOnlyIds = difference(identities, releases);
  const releaseOnlyIds = difference(releases, identities).filter(
    (id) => !NON_PLAYABLE_IDENTITIES.has(id) && !UPCOMING_CATALOG_IDENTITIES.has(id),
  );
  const missingLocalIds = difference(identities, local);
  const localOnlyIds = difference(local, identities).filter(
    (id) => !NON_PLAYABLE_IDENTITIES.has(id) && !UPCOMING_CATALOG_IDENTITIES.has(id),
  );
  for (const id of identityOnlyIds) add('identityEntries', 'missing_from_release', id);
  for (const id of releaseOnlyIds) add('releaseEntries', 'missing_from_identity', id);
  for (const id of missingLocalIds) add('identityEntries', 'missing_from_catalog', id);
  for (const id of localOnlyIds) add('catalog', 'local_only_identity', id);
  for (const id of difference(releases, sources)) add('releaseEntries', 'missing_from_source', id);
  for (const id of difference(sources, releases))
    add('releaseSourceRecords', 'source_only_identity', id);
  for (const id of difference(local, releases).filter((id) => !UPCOMING_CATALOG_IDENTITIES.has(id)))
    add('catalog', 'missing_from_release', id);
  for (const id of difference(releases, local)) add('releaseEntries', 'missing_from_catalog', id);
  if (!identityEntries.length || !releaseEntries.length) add('roster', 'missing_denominator', null);
  if (evidence?.targetVersion !== targetVersion) add('roster', 'target_version_mismatch', null);
  const sourceMismatches = [];
  const unknownReleaseVersions = [];
  const target = version(targetVersion);
  for (const row of releaseEntries) {
    const source = sources.get(row.gameId);
    const identity = identities.get(row.gameId);
    const character = local.get(row.gameId);
    if (!same(row, source, ['sourceName', ...fields])) {
      sourceMismatches.push(row.gameId);
      add('releaseSourceRecords', 'claim_mismatch', row.gameId);
    }
    if (identity && !same(row, identity, ['element', 'weaponType']))
      add('identityEntries', 'claim_mismatch', row.gameId);
    const localElement =
      [10000005, 10000007, 10000117, 10000118].includes(row.gameId) &&
      character?.element === 'Adaptive'
        ? 'None'
        : character?.element;
    if (
      !character ||
      row.key !== character.key ||
      row.element !== localElement ||
      row.weaponType !== character.weaponType
    )
      add('catalog', 'claim_mismatch', row.gameId);
    const released = version(row.releaseVersion);
    if (
      !released ||
      !target ||
      released[0] > target[0] ||
      (released[0] === target[0] && released[1] > target[1])
    ) {
      if (!UPCOMING_CATALOG_IDENTITIES.has(row.gameId)) {
        unknownReleaseVersions.push(row.gameId);
        add('releaseEntries', 'invalid_release_version', row.gameId);
      }
    }
    if (row.releaseVersion === targetVersion && !added.has(row.gameId))
      addOfficial('releaseAdditions', 'omitted_addition', row.gameId);
  }
  const mismatches = [];
  const releaseAdditions = additions.map((addition) => {
    const release = releases.get(addition.gameId);
    const matches =
      release &&
      same(addition, release, ['key', ...fields]) &&
      addition.releaseVersion === targetVersion;
    if (!matches) addOfficial('releaseAdditions', 'claim_mismatch', addition.gameId);
    const claim = claims.get(release?.sourceName);
    if (
      !claim ||
      !same(claim, addition, fields) ||
      (claim.gameId !== undefined && claim.gameId !== addition.gameId)
    ) {
      mismatches.push(addition.gameId);
      addOfficial('officialEntries', 'claim_mismatch', addition.gameId);
    }
    return {
      key: addition.key,
      gameId: addition.gameId,
      status:
        matches && identities.has(addition.gameId) && local.has(addition.gameId)
          ? 'matched'
          : 'identity_mismatch',
    };
  });
  for (const claim of officialEntries) {
    const matches = releaseEntries.filter(
      (row) => row.sourceName === claim.name && added.has(row.gameId),
    );
    if (matches.length !== 1) {
      addOfficial('officialEntries', 'unjoined_claim', claim.name);
      mismatches.push(claim.name);
    }
  }
  const officialInvalid =
    official?.status === 'invalid' ||
    ['sourceIntegrity', 'evidenceIntegrity', 'extractionIntegrity', 'claimsIntegrity'].some(
      (key) => official?.[key] === false,
    ) ||
    officialIssues.length > 0;
  const officialVerified =
    official?.status === 'verified' &&
    official?.provenance === 'verified' &&
    ['sourceIntegrity', 'evidenceIntegrity', 'extractionIntegrity', 'claimsIntegrity'].every(
      (key) => official[key] === true,
    );
  const officialReleaseVerification = {
    ...official,
    mismatches,
    reconciliationIssues: officialIssues,
    status: officialInvalid
      ? 'invalid'
      : officialVerified
        ? 'verified'
        : official?.status === 'unavailable'
          ? 'unavailable'
          : 'unverified',
  };
  const identityProvenance = evidence?.identitySourceProvenance;
  const identityVerified = [
    'status',
    'provenance',
    'localByteIntegrity',
    'metadataIntegrity',
    'upstreamByteIntegrity',
    'projectionIntegrity',
  ].every((key) => identityProvenance?.[key] === 'verified');
  const identityReconciliation = {
    source: evidence?.source ?? null,
    denominator: identityEntries.length,
    matchedLocalIdentities: [...identities.keys()].filter((id) => local.has(id)).length,
    verifiedLocalIdentities:
      identityVerified && !issues.length
        ? [...identities.keys()].filter((id) => local.has(id)).length
        : 0,
    missingLocalIdentities: missingLocalIds,
    localOnlyIdentities: localOnlyIds,
    identityOnlyIds,
    releaseOnlyIds,
    sourceProvenance: identityProvenance ?? null,
    status: issues.length ? 'incomplete' : identityVerified ? 'reconciled' : 'unverified',
  };
  const releaseProvenance = evidence?.releaseSourceProvenance;
  const releaseVerified = [
    'status',
    'provenance',
    'packageVersion',
    'sourcePath',
    'sourceBytes',
    'manifest',
    'roster',
  ].every((key) => releaseProvenance?.[key] === 'verified');
  const releaseVerification = {
    source: evidence?.releaseSource ?? null,
    sourceIntegrity: evidence?.releaseSourceIntegrity ?? null,
    sourceProvenance: releaseProvenance ?? null,
    denominator: releaseEntries.length,
    matchedLocalIdentities: [...releases.keys()].filter((id) => local.has(id)).length,
    verifiedLocalIdentities:
      releaseVerified && !issues.length
        ? [...releases.keys()].filter((id) => local.has(id)).length
        : 0,
    missingLocalIdentities: difference(releases, local),
    sourceMismatches,
    unknownReleaseVersions,
    duplicateReleaseIdentities: issues
      .filter((i) => i.source === 'releaseEntries' && i.code === 'duplicate_identity')
      .map((i) => i.identity),
    status:
      issues.some((i) =>
        ['releaseEntries', 'releaseSourceRecords', 'releaseSourceNames'].includes(i.source),
      ) ||
      releaseProvenance?.status === 'invalid' ||
      evidence?.releaseSourceIntegrity === false
        ? 'invalid'
        : releaseVerified &&
            evidence?.releaseSourceIntegrity === true &&
            identityReconciliation.status === 'reconciled'
          ? 'verified'
          : 'unverified',
  };
  const complete =
    !issues.length &&
    identityReconciliation.status === 'reconciled' &&
    releaseVerification.status === 'verified' &&
    officialReleaseVerification.status === 'verified';
  return {
    identityReconciliation,
    releaseVerification,
    officialReleaseVerification,
    releaseAdditions,
    catalogFormAliases: aliases.map((r) => r.key).sort(),
    reconciliationIssues: [...issues, ...officialIssues].sort((a, b) =>
      JSON.stringify(a).localeCompare(JSON.stringify(b), 'en'),
    ),
    releaseCompleteness: complete ? 'verified' : 'unverified',
    status: complete ? 'reconciled' : 'incomplete',
  };
}
