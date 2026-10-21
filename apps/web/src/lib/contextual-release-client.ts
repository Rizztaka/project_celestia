import {
  type CharacterEquipmentResponse,
  contextualEquipmentIdentity,
  contextualReleaseAdviceSchema,
  type ContextualReleaseIdentity,
  contextualReleaseMetadataSchema,
  type ContextualScenario,
  normalizeContextualScenario,
} from '@celestia/api-contracts';
import { hashKey, type QueryClient } from '@tanstack/react-query';

import { type AccountSession, assertCurrentSession } from './account-session';
import { fetchApi, type RosterCharacter } from './api';
import {
  contextualHash,
  type ContextualObservationDisposition,
  ContextualSnapshotChanged,
  contextualSnapshotKey,
} from './contextual-advice';

export { ContextualSnapshotChanged, defaultContextualScenario } from './contextual-advice';
export const releaseChangedMessage =
  'The loaded knowledge release changed. Refresh release information and retry guidance.';
export class ContextualReleaseChanged extends Error {
  constructor() {
    super(releaseChangedMessage);
  }
}
export interface ContextualReleaseSelection {
  release: ContextualReleaseIdentity;
  revision: number;
  rejected: boolean;
  refreshAttempted: boolean;
  alignedQueries: string[];
}
export const contextualReleaseKey = (session: AccountSession) =>
  ['genshin', 'contextual-release', session.generation] as const;
export const contextualSelectionKey = (session: AccountSession) =>
  ['genshin', 'contextual-release-selection', session.generation] as const;
const same = (a: unknown, b: unknown) => hashKey([a]) === hashKey([b]);
export function contextualReleaseQueryOptions(session: AccountSession) {
  return {
    queryKey: contextualReleaseKey(session),
    queryFn: async ({ signal, client }: { signal: AbortSignal; client?: QueryClient }) => {
      const data = contextualReleaseMetadataSchema.parse(
        await fetchApi(
          '/games/genshin/guide-knowledge/release',
          { signal, cache: 'no-store' },
          session,
        ),
      );
      assertCurrentSession(session);
      signal.throwIfAborted();
      const key = contextualSelectionKey(session);
      const prior = client?.getQueryData<ContextualReleaseSelection>(key);
      if (!prior || !same(prior.release, data.release))
        client?.setQueryData<ContextualReleaseSelection>(key, {
          release: data.release,
          revision: (prior?.revision ?? 0) + 1,
          rejected: false,
          refreshAttempted: false,
          alignedQueries: [],
        });
      return data;
    },
    retry: false,
  };
}
// Release-partitioned observation evidence, plus a release-independent quarantine.
// Fetching metadata, switching release or resetting assumptions cannot erase a known bad record.
export function contextualRecordGuardKey(
  equipment: CharacterEquipmentResponse,
  session: AccountSession,
  roster: Pick<RosterCharacter, 'characterKey' | 'ascension'>[],
) {
  return [
    'genshin',
    'contextual-record-guard',
    session.generation,
    contextualSnapshotKey(equipment, roster),
  ] as const;
}
export function releaseObservationKey(
  equipment: CharacterEquipmentResponse,
  session: AccountSession,
  roster: Pick<RosterCharacter, 'characterKey' | 'ascension'>[],
  release: ContextualReleaseIdentity | undefined,
) {
  return [
    'genshin',
    'guide-advice-v3-observation',
    release ?? null,
    session.generation,
    contextualSnapshotKey(equipment, roster),
  ] as const;
}
export function contextualQueryOptions(
  equipment: CharacterEquipmentResponse,
  rawScenario: ContextualScenario,
  session: AccountSession,
  roster: Pick<RosterCharacter, 'characterKey' | 'ascension'>[],
  release: ContextualReleaseIdentity | undefined,
  revision: number,
) {
  const scenario = normalizeContextualScenario(rawScenario);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(scenario))
    if (value !== undefined)
      params.set(key, key === 'team' ? JSON.stringify(value) : String(value));
  const queryKey = [
    'genshin',
    'guide-advice-v3',
    release ?? null,
    revision,
    session.generation,
    contextualSnapshotKey(equipment, roster),
    scenario,
  ] as const;
  const observationKey = releaseObservationKey(equipment, session, roster, release);
  const guardKey = contextualRecordGuardKey(equipment, session, roster);
  const identity = hashKey(queryKey);
  return {
    queryKey,
    enabled: Boolean(release && revision),
    retry: false,
    queryFn: async ({ signal, client }: { signal: AbortSignal; client?: QueryClient }) => {
      if (!release || !revision) throw new ContextualReleaseChanged();
      const recordRevision =
        client?.getQueryData<ContextualObservationDisposition>(guardKey)?.revision ?? 0;
      const data = contextualReleaseAdviceSchema.parse(
        await fetchApi(
          `/games/genshin/characters/${encodeURIComponent(equipment.character.characterKey)}/guide-advice/v3?${params}`,
          { signal, cache: 'no-store' },
          session,
        ),
      );
      const ownedTeam = [
        {
          characterKey: equipment.character.characterKey,
          ascension: equipment.character.ascension,
        },
        ...(scenario.team ?? [])
          .filter((entry) => entry.selection === 'owned')
          .map(({ characterKey }) => ({
            characterKey,
            ascension:
              roster.find((entry) => entry.characterKey === characterKey)?.ascension ?? null,
          })),
      ].sort((a, b) =>
        a.characterKey < b.characterKey ? -1 : a.characterKey > b.characterKey ? 1 : 0,
      );
      const observation = await contextualHash({
        current: contextualEquipmentIdentity(equipment),
        ownedTeam,
      });
      assertCurrentSession(session);
      signal.throwIfAborted();
      const fingerprint = await contextualHash({
        pack: data.release.packHash,
        release: data.release.digest,
        observationFingerprint: data.advice.observationFingerprint,
        scenario,
      });
      assertCurrentSession(session);
      signal.throwIfAborted();
      const guard = client?.getQueryData<ContextualObservationDisposition>(guardKey);
      if ((guard?.revision ?? 0) !== recordRevision) throw new ContextualSnapshotChanged();
      // Check record coherence even when release metadata is racing; release recovery is not record recovery.
      if (data.advice.observationFingerprint !== observation) {
        const rejected = { revision: recordRevision + 1, alignedQueries: [] };
        client?.setQueryData(guardKey, rejected);
        client?.setQueryData(observationKey, rejected);
        throw new ContextualSnapshotChanged();
      }
      const selectionKey = contextualSelectionKey(session);
      const selection = client?.getQueryData<ContextualReleaseSelection>(selectionKey);
      if (!selection || selection.revision !== revision || !same(selection.release, release))
        throw new ContextualReleaseChanged();
      if (
        !same(data.release, release) ||
        data.advice.fingerprint !== fingerprint ||
        !same(data.advice.scenario, scenario) ||
        data.advice.characterKey !== equipment.character.characterKey
      ) {
        client?.setQueryData<ContextualReleaseSelection>(selectionKey, {
          ...selection,
          rejected: true,
          refreshAttempted: true,
          alignedQueries: [],
        });
        // At most one automatic metadata recovery per selection epoch. Further retries are explicit.
        if (!selection.refreshAttempted && client) {
          try {
            await client.fetchQuery(contextualReleaseQueryOptions(session));
          } catch {
            /* sticky rejection survives transport failure */
          }
        }
        assertCurrentSession(session);
        signal.throwIfAborted();
        throw new ContextualReleaseChanged();
      }
      if (guard && !guard.alignedQueries.includes(identity))
        client?.setQueryData<ContextualObservationDisposition>(guardKey, {
          ...guard,
          alignedQueries: [...guard.alignedQueries, identity],
        });
      const local = client?.getQueryData<ContextualObservationDisposition>(observationKey);
      if (local && !local.alignedQueries.includes(identity))
        client?.setQueryData(observationKey, {
          ...local,
          alignedQueries: [...local.alignedQueries, identity],
        });
      if (selection.rejected && !selection.alignedQueries.includes(identity))
        client?.setQueryData<ContextualReleaseSelection>(selectionKey, {
          ...selection,
          alignedQueries: [...selection.alignedQueries, identity],
        });
      return data;
    },
  };
}
