import {
  showcaseCharacterSchema,
  type ShowcaseResult,
  showcaseUidSchema,
} from '@celestia/api-contracts';
import { z } from 'zod';

const observationSchema = z
  .object({
    uid: showcaseUidSchema,
    character: showcaseCharacterSchema,
    observedAt: z.string().datetime(),
  })
  .strict();
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
    request.onerror = () => reject(request.error);
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
): CharacterObservation[] {
  if (
    !result?.snapshot ||
    result.snapshot.uid !== uid ||
    result.issue ||
    !result.fetchedAt ||
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
) {
  const merged = new Map(previous.map((record) => [record.character.key, record]));
  for (const record of incoming) {
    const existing = merged.get(record.character.key);
    if (!existing || Date.parse(record.observedAt) >= Date.parse(existing.observedAt))
      merged.set(record.character.key, record);
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
        const parsed = observationSchema.safeParse(item);
        if (parsed.success && parsed.data.uid === uid) records.push(parsed.data);
        else invalid = true;
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
): Promise<ObservedRoster> {
  showcaseUidSchema.parse(uid);
  const incoming = observationsFromResult(uid, result);
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
            const existing = observationSchema.safeParse(request.result);
            // Preserve unreadable records instead of silently overwriting potentially older data.
            if (
              existing.success &&
              Date.parse(record.observedAt) >= Date.parse(existing.data.observedAt)
            )
              store.put(record);
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
