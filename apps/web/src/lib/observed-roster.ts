import {
  showcaseCharacterSchema,
  type ShowcaseResult,
  showcaseUidSchema,
} from '@celestia/api-contracts';
import { z } from 'zod';

import { PUBLIC_BUILD_FRESHNESS } from './account-context.policy';
import { signature } from './build-analysis/signature';

const observationSchema = z
  .object({
    uid: showcaseUidSchema,
    character: showcaseCharacterSchema,
    observedAt: z.string().datetime(),
    retrievedAt: z.string().datetime().nullable().optional(),
    conflicted: z.boolean().optional(),
  })
  .strict();
const storedObservationSchema = observationSchema
  .extend({
    conflictingCharacter: showcaseCharacterSchema.optional(),
  })
  .superRefine((record, context) => {
    if (record.conflictingCharacter && record.conflictingCharacter.key !== record.character.key)
      context.addIssue({
        code: 'custom',
        message: 'Conflicting observation identity does not match.',
      });
  });
export type CharacterObservation = z.infer<typeof observationSchema>;
export type ObservedRoster = { records: CharacterObservation[]; issue: string | null };
export const observedRosterKey = (uid: string) => ['observed-roster', uid] as const;
const databaseName = 'celestia-public-roster-v1';
const storeName = 'characters';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Browser storage unavailable.'));
      return;
    }
    const request = indexedDB.open(databaseName, 1);
    let blocked = false;
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(storeName, {
        keyPath: ['uid', 'character.key'],
      });
      store.createIndex('uid', 'uid');
    };
    request.onerror = () => reject(request.error ?? new Error('Failed to open roster database.'));
    request.onblocked = () => {
      blocked = true;
      reject(new Error('Browser roster storage is blocked.'));
    };
    request.onsuccess = () => {
      if (blocked) {
        request.result.close();
        return;
      }
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
  });
}

export function observationsFromResult(
  uid: string,
  result?: ShowcaseResult,
  nowMs = Date.now(),
): CharacterObservation[] {
  if (
    !result?.snapshot ||
    result.snapshot.uid !== uid ||
    result.issue ||
    !result.fetchedAt ||
    Date.parse(result.fetchedAt) > nowMs + PUBLIC_BUILD_FRESHNESS.futureToleranceMs ||
    (result.delivery !== 'cached' && result.delivery !== 'fetched')
  )
    return [];
  return result.snapshot.characters.map((character) =>
    observationSchema.parse({ uid, character, observedAt: result.fetchedAt }),
  );
}

export function mergeObservations(
  previous: CharacterObservation[],
  incoming: CharacterObservation[],
  nowMs = Date.now(),
) {
  const merged = new Map<string, CharacterObservation>();
  for (const record of [...previous, ...incoming]) {
    const key = `${record.uid}:${record.character.key}`;
    const existing = merged.get(key);
    const incomingTime = Date.parse(record.observedAt);
    const existingTime = existing ? Date.parse(existing.observedAt) : null;
    const reliable = (time: number | null) =>
      time !== null &&
      Number.isFinite(time) &&
      time <= nowMs + PUBLIC_BUILD_FRESHNESS.futureToleranceMs;
    if (
      !existing ||
      (reliable(incomingTime) && (!reliable(existingTime) || incomingTime > existingTime!))
    )
      merged.set(key, record);
    else if (
      Date.parse(record.observedAt) === Date.parse(existing.observedAt) &&
      (record.conflicted ||
        existing.conflicted ||
        signature(record.character) !== signature(existing.character))
    )
      merged.set(key, { ...existing, conflicted: true });
  }
  return [...merged.values()];
}

export async function readObservedRoster(uid: string): Promise<ObservedRoster> {
  showcaseUidSchema.parse(uid);
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const request = transaction.objectStore(storeName).index('uid').getAll(uid);
    transaction.oncomplete = () => {
      db.close();
      const records: CharacterObservation[] = [];
      let invalid = false;
      for (const item of request.result) {
        const parsed = storedObservationSchema.safeParse(item);
        if (parsed.success && parsed.data.uid === uid) {
          const { conflictingCharacter, ...record } = parsed.data;
          records.push(conflictingCharacter ? { ...record, conflicted: true } : record);
        } else invalid = true;
      }
      resolve({
        records,
        issue: invalid
          ? 'Some saved observations could not be read. Existing browser records have been preserved.'
          : null,
      });
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error ?? new Error('Could not read roster.'));
    };
  });
}

/** One read/write transaction serializes competing refreshes and never clears or deletes records. */
export async function recordObservedRoster(
  uid: string,
  result: ShowcaseResult,
  nowMs = Date.now(),
): Promise<ObservedRoster> {
  showcaseUidSchema.parse(uid);
  const incoming = observationsFromResult(uid, result, nowMs);
  if (incoming.length) {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      for (const record of incoming) {
        const request = store.get([uid, record.character.key]);
        request.onsuccess = () => {
          if (request.result === undefined) store.put(record);
          else {
            const existing = storedObservationSchema.safeParse(request.result);
            // Preserve unreadable records instead of silently overwriting potentially older data.
            if (
              existing.success &&
              (Date.parse(record.observedAt) > Date.parse(existing.data.observedAt) ||
                Date.parse(existing.data.observedAt) >
                  nowMs + PUBLIC_BUILD_FRESHNESS.futureToleranceMs)
            )
              store.put(record);
            else if (
              existing.success &&
              Date.parse(record.observedAt) === Date.parse(existing.data.observedAt) &&
              signature(record.character) !== signature(existing.data.character)
            )
              store.put({ ...existing.data, conflictingCharacter: record.character });
          }
        };
      }
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onabort = () => {
        db.close();
        reject(transaction.error ?? new Error('Could not save roster.'));
      };
    });
  }
  return readObservedRoster(uid);
}
