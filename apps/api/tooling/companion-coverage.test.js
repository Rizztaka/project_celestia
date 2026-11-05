import { describe, expect, it } from 'vitest';

import { calculateCompanionCoverage } from './companion-coverage.mjs';
import {
  explainCompanionCoverage,
  loadCompanionCoverage,
  statusRequiresFailure,
} from './companion-status.mjs';

function fixture() {
  return {
    targetVersion: '7.1',
    catalog: {
      _comment: 'not a character',
      Aether: { name: 'Traveler', gameId: 10000005, element: 'Adaptive' },
      Lumine: { name: 'Traveler', gameId: 10000007, element: 'Adaptive' },
      Furina: { name: 'Localized name', gameId: 10000089, element: 'Hydro' },
      NewCharacter: { name: 'Furina', gameId: 10000999, element: 'Pyro' },
    },
    referenceStates: { Furina: 'verified_snapshot', NewCharacter: 'hash_mismatch' },
    formMetadata: {
      '10000089:8901': {
        element: 'Hydro',
        identitySource: 'pinned_engine',
        mechanicsSource: 'test-mechanics',
        mechanics: { skillOrder: [1, 2, 3], proudMap: {} },
      },
      '10000005:504': {
        element: 'Anemo',
        identitySource: 'enka_variant',
        mechanicsSource: 'test-mechanics',
        mechanics: { skillOrder: [1, 2, 3] },
      },
      '10000007:704': {
        element: 'Anemo',
        identitySource: 'enka_variant',
        mechanicsSource: 'test-mechanics',
        mechanics: { skillOrder: [1, 2, 3] },
      },
    },
    engine: {
      version: 'test',
      revision: 'pinned',
      characters: { '10000089:8901': {}, '10000005:504': {}, '10000007:704': {} },
      weapons: { test: {} },
      sets: {},
    },
    roleProfiles: [
      {
        avatarId: 10000089,
        skillDepotId: 8901,
        sourceHashMatched: true,
        roles: [{ id: 'party_buff' }],
        evidenceIds: ['reviewed'],
      },
    ],
    rosterEvidence: {
      targetVersion: '7.1',
      source: {
        id: 'test-roster',
        revision: 'test-revision',
        patchScope: '7.1',
        reviewStatus: 'snapshot',
      },
      entries: [
        { gameId: 10000089, name: 'Furina', element: 'Hydro', weaponType: 'Sword' },
        { gameId: 10000005, name: 'Traveler' },
        { gameId: 10000007, name: 'Traveler' },
      ],
      releaseAdditions: [
        {
          key: 'Furina',
          gameId: 10000089,
          element: 'Hydro',
          weaponType: 'Sword',
          releaseVersion: '4.2',
        },
      ],
      releaseEntries: [
        {
          key: 'Furina',
          gameId: 10000089,
          sourceName: 'Furina',
          element: 'Hydro',
          weaponType: 'Sword',
          releaseVersion: '4.2',
        },
        {
          key: 'Traveler',
          gameId: 10000005,
          sourceName: 'Aether',
          element: 'None',
          weaponType: 'Sword',
          releaseVersion: '1.0',
        },
      ],
      releaseSource: {
        id: 'test-release-source',
        revision: 'test-source-revision',
        patchScope: '1.0 through 7.1',
        reviewStatus: 'source_checked',
      },
      releaseSourceRecords: [
        {
          gameId: 10000089,
          sourceName: 'Furina',
          element: 'Hydro',
          weaponType: 'Sword',
          releaseVersion: '4.2',
        },
        {
          gameId: 10000005,
          sourceName: 'Aether',
          element: 'None',
          weaponType: 'Sword',
          releaseVersion: '1.0',
        },
      ],
      releaseSourceIntegrity: true,
      officialReleaseEvidence: {
        source: {
          id: 'official-test-notice',
          url: 'https://example.test/7.1',
          reviewStatus: 'snapshot',
        },
        entries: [
          {
            key: 'Furina',
            name: 'Furina',
            gameId: 10000089,
            element: 'Hydro',
            weaponType: 'Sword',
            releaseVersion: '4.2',
          },
        ],
        sourceIntegrity: true,
      },
    },
    progressionStates: { Furina: 'verified' },
    mechanicsStates: { Furina: 'partial' },
  };
}

// Synthetic, fully reconciled trusted-verifier outputs exercise the positive gate;
// repository provenance itself is deliberately NOT approved by this fixture.
function consistentFixture() {
  const input = fixture();
  input.targetVersion = '4.2';
  input.rosterEvidence.targetVersion = '4.2';
  input.catalog = {
    Furina: { name: 'Localized name', gameId: 10000089, element: 'Hydro', weaponType: 'Sword' },
  };
  input.rosterEvidence.identityEntries = [input.rosterEvidence.entries[0]];
  input.rosterEvidence.releaseEntries = [input.rosterEvidence.releaseEntries[0]];
  input.rosterEvidence.releaseSourceRecords = [input.rosterEvidence.releaseSourceRecords[0]];
  input.rosterEvidence.identitySourceProvenance = {
    status: 'verified',
    provenance: 'verified',
    localByteIntegrity: 'verified',
    metadataIntegrity: 'verified',
    upstreamByteIntegrity: 'verified',
    projectionIntegrity: 'verified',
  };
  input.rosterEvidence.releaseSourceProvenance = {
    status: 'verified',
    provenance: 'verified',
    packageVersion: 'verified',
    sourcePath: 'verified',
    sourceBytes: 'verified',
    manifest: 'verified',
    roster: 'verified',
  };
  Object.assign(input.rosterEvidence.officialReleaseEvidence, {
    status: 'verified',
    provenance: 'verified',
    evidenceIntegrity: true,
    extractionIntegrity: true,
    claimsIntegrity: true,
  });
  return input;
}

describe('companion capability inventory', () => {
  it('does not treat Adaptive Traveler catalog rows as exact elemental forms', () => {
    const report = calculateCompanionCoverage(fixture());
    expect(report.rows.find((row) => row.key === 'Aether')).toMatchObject({
      forms: [],
      formIdentity: 'unresolved',
      simulationForms: [],
    });
    expect(report.rows.find((row) => row.key === 'Lumine')).toMatchObject({
      forms: [],
      formIdentity: 'unresolved',
      simulationForms: [],
    });
  });
  it('makes blocked reconciliation a nonzero CLI result', () => {
    expect(
      statusRequiresFailure({
        releaseCompleteness: 'unverified',
        roster: { reconciliationIssues: [] },
        gaps: { blockedRoleSources: [] },
        metadataSource: { verification: { status: 'unverified' } },
      }),
    ).toBe(true);
    expect(
      statusRequiresFailure({
        releaseCompleteness: 'verified',
        roster: { reconciliationIssues: [] },
        gaps: { blockedRoleSources: [] },
        metadataSource: { verification: { status: 'verified' } },
      }),
    ).toBe(false);
  });
  it('requires every gate for a consistent positive verdict', () => {
    const report = calculateCompanionCoverage(consistentFixture());
    expect(report.releaseCompleteness).toBe('verified');
    expect(report.roster).toMatchObject({
      status: 'reconciled',
      reconciliationIssues: [],
      identityReconciliation: { status: 'reconciled' },
      releaseVerification: { status: 'verified' },
      officialReleaseVerification: { status: 'verified' },
    });
  });
  it.each([
    [
      'identity provenance',
      (input) => {
        input.rosterEvidence.identitySourceProvenance.status = 'unverified';
      },
    ],
    [
      'identity byte integrity',
      (input) => {
        input.rosterEvidence.identitySourceProvenance.localByteIntegrity = 'invalid';
      },
    ],
    [
      'release provenance',
      (input) => {
        input.rosterEvidence.releaseSourceProvenance.provenance = 'unverified';
      },
    ],
    [
      'release byte integrity',
      (input) => {
        input.rosterEvidence.releaseSourceProvenance.sourceBytes = 'invalid';
      },
    ],
    [
      'official evidence integrity',
      (input) => {
        input.rosterEvidence.officialReleaseEvidence.evidenceIntegrity = false;
      },
    ],
    [
      'official review',
      (input) => {
        input.rosterEvidence.officialReleaseEvidence.provenance = 'unverified';
      },
    ],
    [
      'extra local identity',
      (input) => {
        input.catalog.Extra = { name: 'Extra', gameId: 123, element: 'Pyro', weaponType: 'Bow' };
      },
    ],
    [
      'wrong stable ID',
      (input) => {
        input.rosterEvidence.identityEntries[0].gameId = 123;
      },
    ],
    [
      'duplicate identity',
      (input) => {
        input.rosterEvidence.identityEntries.push({ ...input.rosterEvidence.identityEntries[0] });
      },
    ],
    [
      'duplicate official name',
      (input) => {
        input.rosterEvidence.officialReleaseEvidence.entries.push({
          ...input.rosterEvidence.officialReleaseEvidence.entries[0],
        });
      },
    ],
    [
      'extra official claim',
      (input) => {
        input.rosterEvidence.officialReleaseEvidence.entries.push({
          name: 'Extra',
          element: 'Pyro',
          weaponType: 'Bow',
          releaseVersion: '4.2',
        });
      },
    ],
    [
      'omitted official addition',
      (input) => {
        input.rosterEvidence.releaseAdditions = [];
        input.rosterEvidence.officialReleaseEvidence.entries = [];
      },
    ],
    [
      'target version mismatch',
      (input) => {
        input.rosterEvidence.targetVersion = '7.1';
      },
    ],
    [
      'wrong local element',
      (input) => {
        input.catalog.Furina.element = 'Pyro';
      },
    ],
  ])('cannot keep a positive verdict after changing %s', (_name, change) => {
    const input = consistentFixture();
    change(input);
    const report = calculateCompanionCoverage(input);
    expect(report.releaseCompleteness).toBe('unverified');
    expect(report.roster.status).toBe('incomplete');
  });
  it('blocks completeness when identity and release denominators disagree despite matching local IDs', () => {
    const result = calculateCompanionCoverage(fixture());
    expect(result.releaseCompleteness).toBe('unverified');
    expect(result.roster.identityReconciliation.status).toBe('incomplete');
    expect(result.roster.status).toBe('incomplete');
  });
  it.each(['identityEntries', 'releaseEntries', 'releaseSourceRecords', 'releaseAdditions'])(
    'detects duplicate/conflicting identities in %s',
    (field) => {
      const input = fixture();
      if (field === 'identityEntries')
        input.rosterEvidence.identityEntries = [...input.rosterEvidence.entries];
      input.rosterEvidence[field].push({ ...input.rosterEvidence[field][0], element: 'Wrong' });
      const result = calculateCompanionCoverage(input);
      expect(result.releaseCompleteness).toBe('unverified');
      expect(result.roster.status).toBe('incomplete');
      expect(result.roster.reconciliationIssues).toContainEqual(
        expect.objectContaining({ source: field, code: 'duplicate_identity' }),
      );
    },
  );
  it('does not promote an invalid official verification because source bytes matched', () => {
    const input = fixture();
    input.rosterEvidence.officialReleaseEvidence.status = 'invalid';
    input.rosterEvidence.officialReleaseEvidence.extractionIntegrity = false;
    expect(calculateCompanionCoverage(input).roster.officialReleaseVerification.status).toBe(
      'invalid',
    );
  });
  it('reports duplicate catalog aliases and extra official claims rather than overwriting them', () => {
    const input = fixture();
    input.catalog.FurinaClone = { ...input.catalog.Furina };
    input.rosterEvidence.officialReleaseEvidence.entries.push({
      ...input.rosterEvidence.officialReleaseEvidence.entries[0],
    });
    const report = calculateCompanionCoverage(input);
    expect(report.releaseCompleteness).toBe('unverified');
    expect(report.roster.reconciliationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'catalog', code: 'duplicate_identity' }),
        expect.objectContaining({ source: 'officialEntries', code: 'duplicate_identity' }),
      ]),
    );
  });
  it('preserves duplicate source records in reconciliation diagnostics instead of overwriting the first row', () => {
    const input = consistentFixture();
    input.rosterEvidence.releaseEntries.push({
      ...input.rosterEvidence.releaseEntries[0],
      element: 'Pyro',
    });
    const issue = calculateCompanionCoverage(input).roster.reconciliationIssues.find(
      (candidate) =>
        candidate.source === 'releaseEntries' && candidate.code === 'duplicate_identity',
    );
    expect(issue.entries).toHaveLength(2);
    expect(issue.entries[0].element).toBe('Hydro');
    expect(issue.entries[1].element).toBe('Pyro');
  });
  it('keeps official evidence failures from changing otherwise valid release-source status', () => {
    const input = consistentFixture();
    input.rosterEvidence.officialReleaseEvidence.evidenceIntegrity = false;
    const report = calculateCompanionCoverage(input);
    expect(report.roster.releaseVerification.status).toBe('verified');
    expect(report.roster.officialReleaseVerification.status).toBe('invalid');
  });
  it('keeps an official-only unjoined claim out of identity and release status domains', () => {
    const input = consistentFixture();
    input.rosterEvidence.officialReleaseEvidence.entries.push({
      name: 'Unjoined',
      element: 'Pyro',
      weaponType: 'Bow',
      releaseVersion: '4.2',
    });
    const report = calculateCompanionCoverage(input);
    expect(report.roster.identityReconciliation.status).toBe('reconciled');
    expect(report.roster.releaseVerification.status).toBe('verified');
    expect(report.roster.officialReleaseVerification.status).toBe('invalid');
    expect(report.releaseCompleteness).toBe('unverified');
  });
  it('keeps malformed release-addition bridges out of identity and source-release status', () => {
    const input = consistentFixture();
    input.rosterEvidence.releaseAdditions[0].element = 'Pyro';
    const report = calculateCompanionCoverage(input);
    expect(report.roster.identityReconciliation.status).toBe('reconciled');
    expect(report.roster.releaseVerification.status).toBe('verified');
    expect(report.roster.officialReleaseVerification.status).toBe('invalid');
    expect(report.releaseCompleteness).toBe('unverified');
  });
  it('fails closed for null or primitive identity records', () => {
    const input = consistentFixture();
    input.rosterEvidence.identityEntries = [null, 'bad'];
    expect(() => calculateCompanionCoverage(input)).not.toThrow();
    expect(calculateCompanionCoverage(input).roster.reconciliationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'identityEntries', code: 'invalid_entry' }),
      ]),
    );
  });
  it('fails closed for null catalog rows without dereferencing them', () => {
    const input = consistentFixture();
    input.catalog.Broken = null;
    expect(() => calculateCompanionCoverage(input)).not.toThrow();
    expect(calculateCompanionCoverage(input).roster.reconciliationIssues).toContainEqual(
      expect.objectContaining({ source: 'catalog', code: 'invalid_entry', identity: 'Broken' }),
    );
  });
  it('fails closed when roster evidence sections are not arrays', () => {
    const input = consistentFixture();
    input.rosterEvidence.identityEntries = { bad: true };
    expect(() => calculateCompanionCoverage(input)).not.toThrow();
    expect(calculateCompanionCoverage(input).releaseCompleteness).toBe('unverified');
  });
  it('keeps descriptions, role advice, simulation presence and patch certification distinct', () => {
    const result = calculateCompanionCoverage(fixture());
    expect(result.summary).toMatchObject({
      catalogEntries: 4,
      accountIdentities: 3,
      verifiedDescriptionReferences: 1,
      entriesWithSimulationForms: 1,
      entriesWithReviewedRolePatterns: 1,
    });
    expect(result.releaseCompleteness).toBe('unverified');
    expect(result.gaps.descriptionReferences).toEqual(['Aether', 'Lumine', 'NewCharacter']);
    expect(result.gaps.reviewedRolePatterns).toEqual(['Aether', 'Lumine', 'NewCharacter']);
  });

  it('exposes incomplete reconciliation separately from knowledge statuses', () => {
    const result = calculateCompanionCoverage(fixture());
    expect(result.roster).toMatchObject({
      targetVersion: '7.1',
      denominator: 3,
      verifiedLocalIdentities: 0,
      matchedLocalIdentities: 3,
      localOnlyIdentities: [10000999],
      missingLocalIdentities: [],
      releaseAdditions: [{ key: 'Furina', status: 'identity_mismatch' }],
      identityReconciliation: { status: 'incomplete' },
      releaseVerification: {
        denominator: 2,
        verifiedLocalIdentities: 0,
        matchedLocalIdentities: 2,
        missingLocalIdentities: [],
        sourceMismatches: [],
        unknownReleaseVersions: [],
        status: 'unverified',
      },
      officialReleaseVerification: {
        sourceIntegrity: true,
        mismatches: [],
        status: 'invalid',
      },
    });
    expect(result.releaseCompleteness).toBe('unverified');
    expect(result.rows.find((row) => row.key === 'Furina').knowledge).toEqual({
      description: 'verified',
      progression: 'verified',
      mechanics: 'partial',
      simulation: 'partial',
      endgame: 'not_modeled',
    });
    expect(result.rows.find((row) => row.key === 'Furina').forms[0]).toMatchObject({
      formKey: '10000089:8901',
      simulation: 'listed',
      exact: true,
      mechanics: 'partial',
    });
  });

  it('blocks release verification when a manifest entry disagrees with its source record', () => {
    const input = fixture();
    input.rosterEvidence.releaseEntries[0].releaseVersion = '7.1';
    const result = calculateCompanionCoverage(input);
    expect(result.releaseCompleteness).toBe('unverified');
    expect(result.roster.releaseVerification).toMatchObject({
      sourceMismatches: [10000089],
      status: 'invalid',
    });
  });

  it('blocks release verification when the pinned source hash is invalid', () => {
    const input = fixture();
    input.rosterEvidence.releaseSourceIntegrity = false;
    const result = calculateCompanionCoverage(input);
    expect(result.releaseCompleteness).toBe('unverified');
    expect(result.roster.releaseVerification).toMatchObject({
      sourceIntegrity: false,
      status: 'invalid',
    });
  });

  it('blocks an official addition when the notice evidence does not match it', () => {
    const input = fixture();
    input.rosterEvidence.officialReleaseEvidence.entries[0].element = 'Pyro';
    const result = calculateCompanionCoverage(input);
    expect(result.releaseCompleteness).toBe('unverified');
    expect(result.roster.officialReleaseVerification).toMatchObject({
      mismatches: [10000089],
      status: 'invalid',
    });
  });

  it('joins on game identities rather than matching or localized names', () => {
    const result = calculateCompanionCoverage(fixture());
    expect(result.rows.find((row) => row.key === 'Furina').simulationForms).toEqual([
      '10000089:8901',
    ]);
    const unknown = result.rows.find((row) => row.key === 'NewCharacter');
    expect(unknown.simulationForms).toEqual([]);
    expect(unknown.reviewedRolePatterns).toEqual([]);
  });

  it('does not count changed role sources as available guidance', () => {
    const input = fixture();
    input.roleProfiles[0].sourceHashMatched = false;
    const result = calculateCompanionCoverage(input);
    expect(result.summary.entriesWithReviewedRolePatterns).toBe(0);
    expect(result.gaps.blockedRoleSources).toEqual(['Furina']);
    expect(result.rows.find((row) => row.key === 'Furina').blockedRoleForms).toEqual([
      '10000089:8901',
    ]);
  });

  it('requires exact element/form evidence rather than crediting every Traveler element', () => {
    const input = fixture();
    input.catalog.TravelerCryo = { name: 'Traveler (Cryo)', gameId: 10000005, element: 'Cryo' };
    const report = calculateCompanionCoverage(input);
    const cryo = report.rows.find((row) => row.key === 'TravelerCryo');
    expect(cryo.simulationForms).toEqual([]);
    expect(cryo.formIdentity).toBe('unresolved');
    expect(report.gaps.formIdentity).toContain('TravelerCryo');
    expect(report.rows.find((row) => row.key === 'Aether').simulationForms).toEqual([]);
  });

  it('keeps unknown mechanics from becoming an exact form', () => {
    const input = fixture();
    input.formMetadata['10000089:8901'].mechanics = { skillOrder: [] };
    const report = calculateCompanionCoverage(input);
    expect(report.rows.find((row) => row.key === 'Furina')).toMatchObject({
      forms: [],
      formIdentity: 'unresolved',
    });
    expect(report.rows.find((row) => row.key === 'Furina').formCandidates[0]).toMatchObject({
      avatarId: 10000089,
      depotId: 8901,
      element: 'Hydro',
      identitySource: 'pinned_engine',
      mechanicsSource: 'test-mechanics',
      mechanics: 'unknown',
      simulation: 'listed',
      reviewStatus: 'unknown',
      exact: false,
    });
  });

  it('rejects missing identities instead of merging unknown characters into one account slot', () => {
    const input = fixture();
    delete input.catalog.NewCharacter.gameId;
    expect(() => calculateCompanionCoverage(input)).toThrow('Missing or invalid game identity');
  });

  it('is deterministic, stable across catalog ordering, and leaves inputs unchanged', () => {
    const input = fixture();
    const before = structuredClone(input);
    const result = calculateCompanionCoverage(input);
    expect(input).toEqual(before);
    input.catalog = Object.fromEntries(Object.entries(input.catalog).reverse());
    expect(calculateCompanionCoverage(input)).toEqual(result);
    expect(explainCompanionCoverage(result)).toContain('not live upstream pages');
  });

  it('inventories the real repository and verifies description file hashes and identities', async () => {
    const report = await loadCompanionCoverage();
    expect(report.summary.catalogEntries).toBeGreaterThan(100);
    expect(report.summary.verifiedDescriptionReferences).toBeGreaterThan(100);
    expect(
      report.summary.verifiedDescriptionReferences + report.gaps.descriptionReferences.length,
    ).toBe(report.summary.catalogEntries);
    expect(
      report.rows.every((row) =>
        ['missing', 'verified_snapshot'].includes(row.descriptionReference),
      ),
    ).toBe(true);
    expect(report.gaps.blockedRoleSources).toEqual([]);
    expect(report.rows.find((row) => row.key === 'Furina').reviewedRolePatterns).not.toEqual([]);
    expect(report.rows.find((row) => row.key === 'Nefer').simulationForms).toEqual([]);
    expect(report.releaseCompleteness).toBe('verified');
    expect(report.roster).toMatchObject({
      targetVersion: '7.1',
      denominator: 122,
      matchedLocalIdentities: 122,
      missingLocalIdentities: [],
      localOnlyIdentities: [10000117, 10000118, 10000136, 10000137],
      status: 'reconciled',
      identityReconciliation: { status: 'reconciled', releaseOnlyIds: [] },
      releaseVerification: {
        sourceIntegrity: true,
        denominator: 126,
        matchedLocalIdentities: 126,
        missingLocalIdentities: [],
        sourceMismatches: [],
        unknownReleaseVersions: [],
        duplicateReleaseIdentities: [],
        sourceProvenance: {
          status: 'verified',
          provenance: 'verified',
          packageVersion: 'verified',
          sourcePath: 'verified',
          sourceBytes: 'verified',
          manifest: 'verified',
          roster: 'verified',
        },
        status: 'verified',
      },
      officialReleaseVerification: {
        sourceIntegrity: true,
        mismatches: [],
        status: 'verified',
        provenance: 'verified',
      },
    });
    expect(report.roster.releaseVerification.source.packageVersion).toBe('5.2.15');
    expect(report.roster.releaseVerification.source.dataSha256).toBe(
      '6a71ab45b080bcc3296629610fb320f3aed2a20e6e6fcda4af8a1d20638d6c28',
    );
    expect(report.roster.releaseAdditions).toEqual([
      { key: 'Vesna', gameId: 10000143, status: 'matched' },
      { key: 'Vodyanitsa', gameId: 10000140, status: 'matched' },
    ]);
    expect(report.knowledgeSources).toMatchObject({
      mechanics: {
        id: 'enka-avatar-snapshot',
        revision: expect.any(String),
        reviewStatus: 'snapshot',
      },
      simulation: {
        id: 'gcsim-2.47.2-celestia-2',
        reviewStatus: 'pinned',
      },
      endgame: { reviewStatus: 'unavailable' },
    });
    expect(report.rows.find((row) => row.key === 'Vesna')).toMatchObject({
      rosterStatus: 'matched_unverified',
      knowledge: {
        description: 'verified',
        progression: 'unknown',
        mechanics: 'partial',
        simulation: 'missing',
        endgame: 'not_modeled',
      },
      forms: [],
    });
    expect(report.rows.find((row) => row.key === 'Furina').forms[0]).toMatchObject({
      formKey: '10000089:8901',
      exact: true,
      simulation: 'listed',
    });
  }, 30000);
});
