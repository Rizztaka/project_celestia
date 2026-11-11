import { createHash } from 'node:crypto';

import {
  type AccountCharacterContext,
  type AccountContext,
  type ImportedAccountContext,
  importedAccountContextSchema,
  type ImportedAccountEvidence,
  showcaseUidSchema,
} from '@celestia/api-contracts';
import { z } from 'zod';

import { importedCharacterIdentity, importedIdentitySource } from './imported-account.identity.js';
import type { ImportSnapshot } from './importer.repository.js';

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const byId = <T extends { id: string }>(rows: T[]) => [...rows].sort((a, b) => compare(a.id, b.id));
const subStatsSchema = z.array(z.object({ key: z.string(), value: z.number().finite() }).strict());
function digest(value: unknown): string {
  return createHash('sha256')
    .update(
      JSON.stringify(value, (_key, item) =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
          ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => compare(a, b)))
          : item,
      ),
    )
    .digest('hex');
}
function date(value: Date | undefined): string | null {
  return value instanceof Date && Number.isFinite(value.getTime()) ? value.toISOString() : null;
}
const number = (value: number | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;
const emptyTimestamps = () => ({
  observedAt: null,
  importedAt: null,
  databaseUpdatedAt: null,
  sourceUpdatedAt: null,
  retrievedAt: null,
});

/** Project one owner-scoped MVCC snapshot. No defaults, observation clock or history join. */
export function importedAccountContext(state: ImportSnapshot): ImportedAccountContext {
  const rows = [
    ...(state?.characters ?? []),
    ...(state?.weapons ?? []),
    ...(state?.artifacts ?? []),
    ...(state?.importStates ?? []),
  ];
  if (state && rows.some((row) => row.accountId !== state.id))
    throw new Error('Stored account evidence is outside the selected account.');

  const issues: ImportedAccountEvidence['issues'] = [];
  const characters = byId(state?.characters ?? []).map((row) => {
    const identity = importedCharacterIdentity(row.characterKey);
    if (!identity) issues.push({ code: 'unresolved_identity', recordId: row.id });
    return {
      id: row.id,
      characterKey: row.characterKey,
      formKey: identity?.formKey ?? null,
      level: number(row.level),
      ascension: number(row.ascension),
      constellation: number(row.constellation),
      talentNormal: number(row.talentNormal),
      talentSkill: number(row.talentSkill),
      talentBurst: number(row.talentBurst),
      talentBasis: 'stored_convention_unknown' as const,
      equippedWeaponId: row.equippedWeaponId ?? null,
      createdAt: date(row.createdAt),
      updatedAt: date(row.updatedAt),
    };
  });
  const weapons = byId(state?.weapons ?? []).map((row) => ({
    id: row.id,
    weaponKey: row.weaponKey,
    level: number(row.level),
    ascension: number(row.ascension),
    refinement: number(row.refinement),
    locked: row.locked ?? null,
    createdAt: date(row.createdAt),
    updatedAt: date(row.updatedAt),
  }));
  const artifacts = byId(state?.artifacts ?? []).map((row) => {
    const stats = subStatsSchema.safeParse(row.subStats);
    if (!stats.success) issues.push({ code: 'invalid_substats', recordId: row.id });
    return {
      id: row.id,
      setKey: row.setKey,
      slotKey: row.slotKey,
      level: number(row.level),
      rarity: number(row.rarity),
      mainStatKey: row.mainStatKey,
      mainStatValue: null,
      subStats: stats.success ? stats.data : null,
      locked: row.locked ?? null,
      equippedCharacterId: row.equippedCharacterId ?? null,
      createdAt: date(row.createdAt),
      updatedAt: date(row.updatedAt),
    };
  });
  const receipts: ImportedAccountEvidence['receipts'] = (state?.importStates ?? [])
    .filter((row) => row.section !== 'materials')
    .map((row) => ({
      section: row.section as 'characters' | 'weapons' | 'artifacts',
      source: row.source,
      importedAt: date(row.importedAt),
      entryCount: row.entryCount,
      scope:
        row.section === 'characters'
          ? ('merged_entries' as const)
          : ('replacement_section' as const),
    }))
    .sort((a, b) => compare(a.section, b.section));

  const conflicts = new Set<string>();
  for (const artifact of artifacts) {
    if (!subStatsSchema.safeParse(artifact.subStats).success) {
      if (artifact.equippedCharacterId) conflicts.add(artifact.equippedCharacterId);
    }
  }
  for (const character of characters) {
    const weaponId = character.equippedWeaponId;
    const assigned = artifacts.filter((item) => item.equippedCharacterId === character.id);
    if (
      (weaponId &&
        (!weapons.some((item) => item.id === weaponId) ||
          characters.some(
            (other) => other.id !== character.id && other.equippedWeaponId === weaponId,
          ))) ||
      new Set(assigned.map((item) => item.slotKey)).size !== assigned.length
    ) {
      conflicts.add(character.id);
      issues.push({ code: 'inconsistent_assignment', recordId: character.id });
    }
  }
  for (const artifact of artifacts) {
    if (
      artifact.equippedCharacterId &&
      !characters.some((c) => c.id === artifact.equippedCharacterId)
    ) {
      issues.push({ code: 'inconsistent_assignment', recordId: artifact.id });
    }
  }
  const groups = new Map<string, typeof characters>();
  for (const character of characters) {
    if (character.formKey)
      groups.set(character.formKey, [...(groups.get(character.formKey) ?? []), character]);
  }
  const contexts: AccountCharacterContext[] = [];
  const contextIssues: AccountContext['issues'] = [];
  for (const [formKey, entries] of [...groups].sort(([a], [b]) => compare(a, b))) {
    const conflict = entries.length > 1 || entries.some((entry) => conflicts.has(entry.id));
    if (conflict) {
      contextIssues.push({ code: 'conflicting_builds', formKey });
      for (const entry of entries) issues.push({ code: 'conflicting_builds', recordId: entry.id });
    }
    const assigned = artifacts.filter((item) =>
      entries.some((entry) => entry.id === item.equippedCharacterId),
    );
    const equippedWeapons = weapons.filter((item) =>
      entries.some((entry) => entry.equippedWeaponId === item.id),
    );
    // Only the sections this character actually references belong in its fingerprint,
    // so an unrelated weapon-only or artifact-only import cannot change it.
    const characterReceipts = receipts.filter(
      (receipt) =>
        receipt.section === 'characters' ||
        (receipt.section === 'weapons' && equippedWeapons.length > 0) ||
        (receipt.section === 'artifacts' && assigned.length > 0),
    );
    const timestamps = {
      ...emptyTimestamps(),
      // Section receipts are account-level. Storage keeps no per-row import origin,
      // so a later partial import must not re-date preserved character rows.
      importedAt: null,
      databaseUpdatedAt:
        entries
          .map((entry) => entry.updatedAt)
          .filter((value): value is string => value !== null)
          .sort((a, b) => a.localeCompare(b))
          .at(-1) ?? null,
    };
    contexts.push({
      formKey,
      avatarId: Number(formKey.split(':')[0]),
      skillDepotId: null,
      // Row presence is not an explicit ownership declaration. Legacy/manual rows and
      // optimizer scenarios cannot be distinguished retroactively by section receipts.
      ownership: 'unknown',
      buildState: conflict ? 'conflicted' : 'stored',
      buildFingerprint: conflict
        ? null
        : digest({
            characters: entries,
            weapons: equippedWeapons,
            artifacts: assigned,
            receipts: characterReceipts,
          }),
      observedAt: null,
      freshness: 'unknown',
      sources: ['stored_account'],
      // Same namespace as the public adapter so protected gear can join by identity.
      equipmentInstanceIds: [
        ...equippedWeapons.map((item) => `weapon:${item.id}`),
        ...assigned.map((artifact) => `artifact:${artifact.id}`),
      ],
      timestamps,
      missingData: [
        {
          dimension: 'observation',
          status: 'unknown',
          reason: 'import_has_no_game_observation_time',
        },
        {
          dimension: 'freshness',
          status: 'unknown',
          reason: 'freshness_requires_observation_time',
        },
        { dimension: 'depots', status: 'unknown', reason: 'import_does_not_store_skill_depots' },
        {
          dimension: 'stats',
          status: 'not_modeled',
          reason: 'import_does_not_store_character_stats',
        },
        { dimension: 'mechanics', status: 'not_modeled', reason: 'mechanics_are_not_in_import' },
        ...(entries.some((entry) => entry.equippedWeaponId === null)
          ? [
              {
                dimension: 'gear' as const,
                status: 'omitted' as const,
                reason: 'weapon_is_not_recorded_for_this_character',
              },
            ]
          : []),
        ...(conflict
          ? [
              {
                dimension: 'gear' as const,
                status: 'conflicted' as const,
                reason: 'equipment_assignments_conflict',
              },
            ]
          : []),
      ],
    });
  }
  const evidence: ImportedAccountEvidence = {
    identitySource: importedIdentitySource,
    characters,
    weapons,
    artifacts,
    receipts,
    issues: issues.sort((a, b) => compare(a.recordId, b.recordId) || compare(a.code, b.code)),
  };
  const uid = showcaseUidSchema.safeParse(state?.uid);
  const context = {
    version: 1 as const,
    scope: 'private_authenticated' as const,
    uid: uid.success ? uid.data : null,
    accountId: state?.id ?? null,
    rosterScope:
      characters.length || receipts.some((r) => r.section === 'characters')
        ? ('partial' as const)
        : ('unknown' as const),
    completenessEvidence: null,
    absentCharacterOwnership: 'unknown' as const,
    sources: receipts.length
      ? ['stored_account' as const, 'good_import' as const]
      : ['stored_account' as const],
    oldestObservationAt: null,
    newestObservationAt: null,
    mixedObservationTimes: false,
    equipmentExclusivity: 'unverified' as const,
    rejectedRecordCount: characters.filter((c) => c.formKey === null).length,
    // Same product policy as public evidence. No known game observation exists to apply it to.
    freshnessPolicy: { maxAgeMs: 7 * 24 * 60 * 60 * 1000, futureToleranceMs: 5 * 60 * 1000 },
    sourceTimestamps: [
      {
        source: 'stored_account',
        freshness: 'unknown' as const,
        ...emptyTimestamps(),
        databaseUpdatedAt:
          characters
            .map((character) => character.updatedAt)
            .filter((value): value is string => value !== null)
            .sort((a, b) => a.localeCompare(b))
            .at(-1) ?? null,
      },
      ...receipts.map((receipt) => ({
        source: 'good_import' as const,
        freshness: 'unknown' as const,
        observedAt: null,
        importedAt: receipt.importedAt,
        databaseUpdatedAt: null,
        sourceUpdatedAt: null,
        retrievedAt: null,
      })),
    ],
    missingData: [
      {
        dimension: 'roster',
        status:
          characters.length || receipts.some((r) => r.section === 'characters')
            ? 'unknown'
            : 'unavailable',
        reason:
          characters.length || receipts.some((r) => r.section === 'characters')
            ? 'import_does_not_prove_a_complete_roster'
            : 'no_roster_import_receipt',
      },
      {
        dimension: 'ownership',
        status: 'unknown',
        reason: 'stored_rows_have_no_ownership_declaration',
      },
      {
        dimension: 'observation',
        status: 'unknown',
        reason: 'import_receipts_are_not_game_observations',
      },
      { dimension: 'freshness', status: 'unknown', reason: 'freshness_requires_observation_time' },
      { dimension: 'mechanics', status: 'not_modeled', reason: 'mechanics_are_not_in_import' },
    ],
    characters: contexts,
    issues: contextIssues,
  };
  return importedAccountContextSchema.parse({
    context: { ...context, fingerprint: digest({ context, evidence }) },
    evidence,
  });
}
