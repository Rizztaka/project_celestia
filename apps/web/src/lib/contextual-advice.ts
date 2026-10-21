import {
  type CharacterEquipmentResponse,
  contextualAdviceSchema,
  contextualEquipmentIdentity,
  contextualPackVersion,
  type ContextualScenario,
  contextualScenarioSchema,
  normalizeContextualScenario,
} from '@celestia/api-contracts';
import { hashKey, type QueryClient } from '@tanstack/react-query';

import { type AccountSession, assertCurrentSession } from './account-session';
import { fetchApi, type RosterCharacter } from './api';

export const defaultContextualScenario = () =>
  contextualScenarioSchema.parse({ contractVersion: '2' });
export const contextualSnapshotChangedMessage =
  'Relevant equipment/team records changed. Refresh records to reset assumptions.';
export class ContextualSnapshotChanged extends Error {
  constructor() {
    super(contextualSnapshotChangedMessage);
  }
}
export interface ContextualObservationDisposition {
  revision: number;
  alignedQueries: string[];
}
export function contextualObservationKey(
  equipment: CharacterEquipmentResponse,
  session: AccountSession,
  roster: Pick<RosterCharacter, 'characterKey' | 'ascension'>[],
) {
  return [
    'genshin',
    'guide-advice-v2-observation',
    contextualPackVersion,
    session.generation,
    contextualSnapshotKey(equipment, roster),
  ] as const;
}
export function contextualSnapshotKey(
  equipment: CharacterEquipmentResponse,
  roster: Pick<RosterCharacter, 'characterKey' | 'ascension'>[],
) {
  return JSON.stringify({
    current: contextualEquipmentIdentity(equipment),
    roster: roster
      .map(({ characterKey, ascension }) => ({ characterKey, ascension }))
      .sort((a, b) =>
        a.characterKey < b.characterKey ? -1 : a.characterKey > b.characterKey ? 1 : 0,
      ),
  });
}
export async function contextualHash(value: unknown) {
  const canonical = (item: unknown): unknown =>
    Array.isArray(item)
      ? item.map(canonical)
      : item && typeof item === 'object'
        ? Object.fromEntries(
            Object.entries(item)
              .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([key, child]) => [key, canonical(child)]),
          )
        : item;
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(canonical(value))),
  );
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
export function contextualQueryOptions(
  equipment: CharacterEquipmentResponse,
  rawScenario: ContextualScenario,
  session: AccountSession,
  roster: Pick<RosterCharacter, 'characterKey' | 'ascension'>[],
) {
  const scenario = normalizeContextualScenario(rawScenario);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(scenario))
    if (value !== undefined)
      params.set(key, key === 'team' ? JSON.stringify(value) : String(value));
  const ownedTeam = [
    { characterKey: equipment.character.characterKey, ascension: equipment.character.ascension },
    ...(scenario.team ?? [])
      .filter((entry) => entry.selection === 'owned')
      .map(({ characterKey }) => ({
        characterKey,
        ascension: roster.find((entry) => entry.characterKey === characterKey)?.ascension ?? null,
      })),
  ].sort((a, b) =>
    a.characterKey < b.characterKey ? -1 : a.characterKey > b.characterKey ? 1 : 0,
  );
  const queryKey = [
    'genshin',
    'guide-advice-v2',
    contextualPackVersion,
    session.generation,
    contextualSnapshotKey(equipment, roster),
    scenario,
  ] as const;
  const observationKey = contextualObservationKey(equipment, session, roster);
  const identity = hashKey(queryKey);
  return {
    queryKey,
    queryFn: async ({ signal, client }: { signal: AbortSignal; client?: QueryClient }) => {
      const revision =
        client?.getQueryData<ContextualObservationDisposition>(observationKey)?.revision ?? 0;
      const data = contextualAdviceSchema.parse(
        await fetchApi(
          `/games/genshin/characters/${encodeURIComponent(equipment.character.characterKey)}/guide-advice/v2?${params}`,
          { signal },
          session,
        ),
      );
      const expectedObservation = await contextualHash({
        current: contextualEquipmentIdentity(equipment),
        ownedTeam,
      });
      assertCurrentSession(session);
      signal.throwIfAborted();
      // A validation started before a rejection cannot reopen the rejected observation.
      const disposition = client?.getQueryData<ContextualObservationDisposition>(observationKey);
      if ((disposition?.revision ?? 0) !== revision) throw new ContextualSnapshotChanged();
      if (data.observationFingerprint !== expectedObservation) {
        client?.setQueryData<ContextualObservationDisposition>(observationKey, {
          revision: revision + 1,
          alignedQueries: [],
        });
        throw new ContextualSnapshotChanged();
      }
      // Recover only this freshly validated scenario. Other retained successes stay quarantined.
      if (disposition && !disposition.alignedQueries.includes(identity))
        client?.setQueryData<ContextualObservationDisposition>(observationKey, {
          ...disposition,
          alignedQueries: [...disposition.alignedQueries, identity],
        });
      return data;
    },
    retry: false,
  };
}
