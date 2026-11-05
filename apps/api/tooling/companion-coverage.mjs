import { reconcileRoster } from './roster-reconciliation.mjs';

/** Local capability inventory. Presence is never a claim of live-patch completeness. */
export function calculateCompanionCoverage({
  catalog,
  referenceStates,
  engine,
  roleProfiles,
  targetVersion,
  formMetadata = {},
  metadataSource = null,
  rosterEvidence = null,
  progressionStates = {},
  mechanicsStates = {},
  knowledgeSources = {},
}) {
  const identityEntries = Array.isArray(rosterEvidence?.identityEntries)
    ? rosterEvidence.identityEntries.filter(
        (entry) => entry && typeof entry === 'object' && !Array.isArray(entry),
      )
    : Array.isArray(rosterEvidence?.entries)
      ? rosterEvidence.entries.filter(
          (entry) => entry && typeof entry === 'object' && !Array.isArray(entry),
        )
      : [];
  const rosterById = new Map(identityEntries.map((entry) => [entry.gameId, entry]));
  const rosterIds = new Set(identityEntries.map((entry) => entry.gameId));
  const catalogEntries = Object.entries(catalog).filter(([key]) => !key.startsWith('_'));
  const invalidCatalogEntries = catalogEntries.filter(
    ([, character]) => !character || typeof character !== 'object' || Array.isArray(character),
  );
  const rows = catalogEntries
    .filter(
      ([, character]) => character && typeof character === 'object' && !Array.isArray(character),
    )
    .map(([key, character]) => {
      const gameId = character.gameId;
      if (!Number.isSafeInteger(gameId) || gameId <= 0)
        throw new Error(`Missing or invalid game identity for ${key}`);
      const profiles = roleProfiles.filter((profile) => profile.avatarId === gameId);
      const formCandidates = Object.entries(formMetadata)
        .filter(([form]) => Number(form.split(':')[0]) === gameId)
        .map(([formKey, metadata]) => {
          const [avatarId, depotId] = formKey.split(':').map(Number);
          const mechanics =
            Array.isArray(metadata.mechanics?.skillOrder) &&
            metadata.mechanics.skillOrder.length === 3
              ? 'partial'
              : 'unknown';
          const exact =
            Number.isSafeInteger(avatarId) &&
            Number.isSafeInteger(depotId) &&
            depotId > 0 &&
            metadata.element != null &&
            metadata.identitySource != null &&
            metadata.mechanicsSource != null &&
            mechanics !== 'unknown' &&
            metadata.element === character.element;
          return {
            formKey,
            avatarId,
            depotId,
            element: metadata.element ?? null,
            identitySource: metadata.identitySource ?? null,
            mechanicsSource: metadata.mechanicsSource ?? null,
            exact,
            mechanics,
            simulation: engine.characters[formKey] ? 'listed' : 'not_listed',
            reviewStatus: exact ? (mechanics === 'partial' ? 'partial' : 'unknown') : 'unknown',
            reviewedRoles: profiles
              .filter(
                (profile) =>
                  `${profile.avatarId}:${profile.skillDepotId}` === formKey &&
                  profile.sourceHashMatched,
              )
              .flatMap((profile) => profile.roles.map((role) => role.id))
              .sort(),
          };
        })
        .sort((a, b) => a.formKey.localeCompare(b.formKey, 'en'));
      const forms = formCandidates.filter((form) => form.exact);
      const description =
        referenceStates[key] === 'verified_snapshot'
          ? 'verified'
          : referenceStates[key] === 'missing'
            ? 'missing'
            : 'conflict';
      return {
        key,
        name: character.name,
        gameId,
        element: character.element,
        weaponType: character.weaponType,
        accountIdentity: [10000005, 10000007].includes(gameId) ? 'traveler' : `avatar:${gameId}`,
        descriptionReference: referenceStates[key] ?? 'missing',
        // Exact element/depot evidence; avatar-only matching cannot certify a Traveler form.
        forms,
        formCandidates,
        formIdentity: forms.length ? 'listed' : 'unresolved',
        simulationForms: forms
          .filter((form) => form.simulation === 'listed')
          .map((form) => form.formKey),
        reviewedRolePatterns: profiles
          .filter((profile) => profile.sourceHashMatched)
          .map((profile) => ({
            form: `${profile.avatarId}:${profile.skillDepotId}`,
            roles: profile.roles.map((role) => role.id).sort(),
            evidenceIds: [...profile.evidenceIds].sort(),
          })),
        blockedRoleForms: profiles
          .filter((profile) => !profile.sourceHashMatched)
          .map((profile) => `${profile.avatarId}:${profile.skillDepotId}`)
          .sort(),
        rosterStatus: rosterById.has(gameId) ? 'matched_unverified' : 'local_only',
        knowledge: {
          description,
          progression: progressionStates[key] ?? 'unknown',
          mechanics: mechanicsStates[key] ?? 'unknown',
          simulation: forms.some((form) => form.simulation === 'listed') ? 'partial' : 'missing',
          endgame: 'not_modeled',
        },
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key, 'en'));
  const keysWhere = (predicate) => rows.filter(predicate).map((row) => row.key);
  const localIds = new Set(rows.map((row) => row.gameId));
  const reconciliation = reconcileRoster(
    rows,
    { ...rosterEvidence, catalogIssues: invalidCatalogEntries.map(([key]) => key) },
    targetVersion,
  );
  const { identityReconciliation } = reconciliation;
  return {
    schemaVersion: 3,
    targetVersion,
    releaseCompleteness: reconciliation.releaseCompleteness,
    engine: { version: engine.version, revision: engine.revision },
    metadataSource,
    knowledgeSources,
    roster: {
      targetVersion: rosterEvidence?.targetVersion ?? targetVersion,
      source: rosterEvidence?.source ?? null,
      denominator: identityEntries.length,
      verifiedLocalIdentities: identityReconciliation.verifiedLocalIdentities,
      matchedLocalIdentities: identityReconciliation.matchedLocalIdentities,
      missingLocalIdentities: identityReconciliation.missingLocalIdentities,
      localOnlyIdentities: [...localIds].filter((id) => !rosterIds.has(id)).sort((a, b) => a - b),
      ...reconciliation,
    },
    summary: {
      catalogEntries: rows.length,
      accountIdentities: new Set(rows.map((row) => row.accountIdentity)).size,
      verifiedDescriptionReferences: rows.filter(
        (row) => row.descriptionReference === 'verified_snapshot',
      ).length,
      entriesWithSimulationForms: rows.filter((row) => row.simulationForms.length > 0).length,
      entriesWithReviewedRolePatterns: rows.filter((row) => row.reviewedRolePatterns.length > 0)
        .length,
      engineCharacterForms: Object.keys(engine.characters).length,
      engineWeapons: Object.keys(engine.weapons).length,
      engineArtifactSets: Object.keys(engine.sets).length,
      entriesWithUnresolvedFormIdentity: rows.filter((row) => row.formIdentity === 'unresolved')
        .length,
    },
    gaps: {
      descriptionReferences: keysWhere((row) => row.descriptionReference !== 'verified_snapshot'),
      simulation: keysWhere((row) => row.simulationForms.length === 0),
      reviewedRolePatterns: keysWhere((row) => row.reviewedRolePatterns.length === 0),
      blockedRoleSources: keysWhere((row) => row.blockedRoleForms.length > 0),
      formIdentity: keysWhere((row) => row.formIdentity === 'unresolved'),
    },
    rows,
  };
}
