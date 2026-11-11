import {
  type AccountCharacterContext,
  type AccountContext,
  accountContextSchema,
  showcaseUidSchema,
} from '@celestia/api-contracts';

import { PUBLIC_BUILD_FRESHNESS } from './account-context.policy';
import { signature } from './build-analysis/signature';
import type { CharacterObservation } from './observed-roster';

export { PUBLIC_BUILD_FRESHNESS } from './account-context.policy';

export function publicAccountContext(
  uid: string,
  records: CharacterObservation[],
  nowMsOrClock: number | (() => number) = Date.now,
  freshnessPolicy = PUBLIC_BUILD_FRESHNESS,
): { context: AccountContext; records: CharacterObservation[] } {
  showcaseUidSchema.parse(uid);
  const nowMs = typeof nowMsOrClock === 'function' ? nowMsOrClock() : nowMsOrClock;
  if (
    !Number.isFinite(nowMs) ||
    !Number.isSafeInteger(freshnessPolicy.maxAgeMs) ||
    freshnessPolicy.maxAgeMs <= 0 ||
    !Number.isSafeInteger(freshnessPolicy.futureToleranceMs) ||
    freshnessPolicy.futureToleranceMs < 0
  )
    throw new Error('INVALID_ACCOUNT_CLOCK_POLICY');
  const groups = new Map<string, CharacterObservation[]>();
  const issues: AccountContext['issues'] = [];
  let rejectedRecordCount = 0;
  let hasFutureObservation = false;
  for (const record of records.filter((entry) => entry.uid === uid)) {
    const character = record.character;
    if (
      !Number.isSafeInteger(character.id) ||
      character.id <= 0 ||
      (character.skillDepotId !== null &&
        (!Number.isSafeInteger(character.skillDepotId) || character.skillDepotId <= 0)) ||
      character.key !== `${character.id}:${character.skillDepotId ?? 'unknown'}`
    ) {
      // Invalid keys cannot enter the shared contract or masquerade as another form.
      rejectedRecordCount += 1;
      if (/^[1-9]\d*:(?:[1-9]\d*|unknown)$/.test(character.key))
        issues.push({ code: 'invalid_identity', formKey: character.key });
      continue;
    }
    groups.set(character.key, [...(groups.get(character.key) ?? []), record]);
  }
  const selected: CharacterObservation[] = [];
  const characters: AccountCharacterContext[] = [];
  for (const [key, entries] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'en'))) {
    const valid = entries.filter((entry) => {
      const time = Date.parse(entry.observedAt);
      if (!Number.isFinite(time)) {
        issues.push({ code: 'undated_observation', formKey: key });
        return false;
      }
      if (time > nowMs + freshnessPolicy.futureToleranceMs) {
        hasFutureObservation = true;
        issues.push({ code: 'future_observation', formKey: key });
        return false;
      }
      return true;
    });
    const latestTime = valid.length
      ? Math.max(...valid.map((entry) => Date.parse(entry.observedAt)))
      : null;
    const newest = valid.filter((entry) => Date.parse(entry.observedAt) === latestTime);
    const fingerprints = new Set(newest.map((entry) => signature(entry.character)));
    const conflict = fingerprints.size > 1 || newest.some((entry) => entry.conflicted === true);
    const observation = newest[0] ?? null;
    const observedAt = latestTime === null ? null : new Date(latestTime).toISOString();
    if (conflict) issues.push({ code: 'conflicting_builds', formKey: key });
    if (observation && !conflict) selected.push(observation);
    const character = entries[0].character;
    const timestamps = {
      observedAt,
      importedAt: null,
      databaseUpdatedAt: null,
      sourceUpdatedAt: null,
      retrievedAt: observation?.retrievedAt ?? null,
    } as const;
    const missingData: AccountCharacterContext['missingData'] = [
      { dimension: 'mechanics', status: 'not_modeled', reason: 'mechanics_are_not_in_context' },
      {
        dimension: 'stats',
        status: character.stats.length ? 'unknown' : 'omitted',
        reason: character.stats.length ? 'stats_are_not_complete' : 'showcase_did_not_report_stats',
      },
      {
        dimension: 'talents',
        status: character.talents.length ? 'unknown' : 'omitted',
        reason: character.talents.length
          ? 'talent_completeness_is_not_verified'
          : 'showcase_did_not_report_talents',
      },
      {
        dimension: 'gear',
        status: character.weapon || character.artifacts.length ? 'unknown' : 'omitted',
        reason:
          character.weapon || character.artifacts.length
            ? 'equipment_completeness_is_not_verified'
            : 'showcase_did_not_report_equipment',
      },
      {
        dimension: 'depots',
        status: 'unknown',
        reason:
          character.skillDepotId === null
            ? 'skill_depot_is_unknown'
            : 'form_support_is_not_verified',
      },
    ];
    if (conflict)
      missingData.push({
        dimension: 'gear',
        status: 'conflicted',
        reason: 'equal_time_builds_conflict',
      });
    if (latestTime === null)
      missingData.push({
        dimension: 'observation',
        status: 'unavailable',
        reason: 'no_valid_observation_time',
      });
    else if (nowMs - latestTime > freshnessPolicy.maxAgeMs)
      missingData.push({
        dimension: 'freshness',
        status: 'stale',
        reason: 'observation_exceeded_policy',
      });
    characters.push({
      formKey: key,
      avatarId: character.id,
      skillDepotId: character.skillDepotId,
      ownership: valid.length ? 'observed_owned' : 'unknown',
      buildState: conflict ? 'conflicted' : observation ? 'observed' : 'missing',
      buildFingerprint: observation && !conflict ? signature(observation.character) : null,
      observedAt,
      freshness:
        latestTime === null
          ? entries.some(
              (entry) => Date.parse(entry.observedAt) > nowMs + freshnessPolicy.futureToleranceMs,
            )
            ? 'future_invalid'
            : 'unknown'
          : nowMs - latestTime > freshnessPolicy.maxAgeMs
            ? 'stale'
            : 'fresh',
      sources: ['public_showcase'],
      equipmentInstanceIds: [
        ...(observation?.character.weapon?.id === undefined
          ? []
          : [`weapon:${observation.character.weapon.id}`]),
        ...(observation?.character.artifacts ?? []).map((artifact) => `artifact:${artifact.id}`),
      ],
      timestamps,
      missingData,
    });
  }
  const observedTimes = characters
    .flatMap((character) => (character.observedAt ? [character.observedAt] : []))
    .sort((a, b) => a.localeCompare(b));
  const retrievedTimes = selected
    .map((entry) => entry.retrievedAt)
    .filter((value): value is string => !!value && Number.isFinite(Date.parse(value)))
    .sort((a, b) => a.localeCompare(b));
  const uniqueIssues = [
    ...new Map(issues.map((issue) => [`${issue.formKey}:${issue.code}`, issue])).values(),
  ].sort((a, b) => a.formKey.localeCompare(b.formKey, 'en') || a.code.localeCompare(b.code, 'en'));
  const data: Omit<AccountContext, 'fingerprint'> = {
    version: 1 as const,
    scope: 'public_uid' as const,
    uid,
    rosterScope: 'partial' as const,
    completenessEvidence: null,
    absentCharacterOwnership: 'unknown' as const,
    sources: ['public_showcase' as const],
    oldestObservationAt: observedTimes[0] ?? null,
    newestObservationAt: observedTimes.at(-1) ?? null,
    mixedObservationTimes: new Set(observedTimes).size > 1,
    equipmentExclusivity: 'unverified' as const,
    rejectedRecordCount,
    freshnessPolicy: { ...freshnessPolicy },
    sourceTimestamps: [
      {
        source: 'public_showcase',
        freshness: observedTimes.length
          ? characters.some((character) => character.freshness === 'stale')
            ? 'stale'
            : 'fresh'
          : hasFutureObservation
            ? 'future_invalid'
            : 'unavailable',
        observedAt: observedTimes[0] ?? null,
        importedAt: null,
        databaseUpdatedAt: null,
        sourceUpdatedAt: null,
        retrievedAt: retrievedTimes.at(-1) ?? null,
      },
    ],
    missingData: [
      { dimension: 'roster', status: 'unknown', reason: 'public_showcase_is_partial' },
      { dimension: 'ownership', status: 'unknown', reason: 'absence_is_not_ownership_evidence' },
      {
        dimension: 'equipment_exclusivity',
        status: 'unknown',
        reason: 'public_snapshot_is_not_exclusive',
      },
    ],
    characters,
    issues: uniqueIssues,
  };
  return {
    context: accountContextSchema.parse({ ...data, fingerprint: signature(data) }),
    records: selected,
  };
}
