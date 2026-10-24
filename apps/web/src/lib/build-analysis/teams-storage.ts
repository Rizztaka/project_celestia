import { showcaseUidSchema } from '@celestia/api-contracts';
import { z } from 'zod';

import { formIdentity } from './identity';
import { validRole } from './team.calculator';
import type { BuildRoleId } from './types';

const member = z
  .object({
    characterKey: z.string().regex(/^[1-9]\d{7}:(?:[1-9]\d{0,7}|unknown)$/),
    roleId: z
      .string()
      .refine((v) =>
        [
          'unspecified',
          'on_field_damage',
          'off_field_damage',
          'reaction_trigger',
          'party_buff',
          'resistance_shred',
          'healing_support',
          'shield_support',
        ].includes(v),
      )
      .transform((v) => v as BuildRoleId),
  })
  .strict()
  .refine((v) => validRole(v.characterKey, v.roleId), 'Unsupported role for this character.');
const members = z
  .array(member)
  .length(4)
  .refine(
    (v) =>
      new Set(v.map((m) => formIdentity({ avatarId: Number(m.characterKey.split(':')[0]) })))
        .size === 4,
    'Choose distinct playable characters.',
  );
export const savedTeamSchema = z
  .object({
    version: z.literal(1),
    uid: showcaseUidSchema,
    id: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),
    name: z.string().trim().min(1).max(80),
    members,
  })
  .strict();
export type SavedUidTeam = z.infer<typeof savedTeamSchema>;
const MAX_TEAMS = 100;
const databaseName = 'celestia-public-teams-v1';
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined')
      return reject(new Error('Team storage is unavailable in this browser.'));
    const request = indexedDB.open(databaseName, 1);
    let blocked = false;
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore('teams', { keyPath: ['uid', 'id'] });
      store.createIndex('uid', 'uid');
    };
    request.onerror = () =>
      reject(new Error('Team storage could not open. Existing records were preserved.'));
    request.onblocked = () => {
      blocked = true;
      reject(new Error('Team storage is blocked by another tab. Existing records were preserved.'));
    };
    request.onsuccess = () => {
      if (blocked) request.result.close();
      else {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      }
    };
  });
}
function validateRecords(uid: string, rows: unknown[]) {
  const teams = z.array(savedTeamSchema).max(MAX_TEAMS).parse(rows);
  if (teams.some((t) => t.uid !== uid)) throw new Error('Team UID mismatch.');
  return teams.sort((a, b) => a.name.localeCompare(b.name, 'en') || a.id.localeCompare(b.id, 'en'));
}
export async function readUidTeams(uid: string): Promise<SavedUidTeam[]> {
  showcaseUidSchema.parse(uid);
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('teams', 'readonly');
    const request = tx.objectStore('teams').index('uid').getAll(uid);
    tx.oncomplete = () => {
      db.close();
      try {
        resolve(validateRecords(uid, request.result));
      } catch {
        reject(
          new Error(
            'Some saved teams are unreadable. Existing records were preserved; saving is disabled.',
          ),
        );
      }
    };
    tx.onabort = () => {
      db.close();
      reject(new Error('Could not read saved teams.'));
    };
  });
}
export async function writeUidTeams(
  uid: string,
  incoming: SavedUidTeam[],
  deleteId?: string,
  importing = false,
): Promise<void> {
  showcaseUidSchema.parse(uid);
  const safe = validateRecords(uid, incoming);
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('teams', 'readwrite');
    const store = tx.objectStore('teams');
    const request = store.index('uid').getAll(uid);
    let issue = '';
    request.onsuccess = () => {
      try {
        const previous = validateRecords(uid, request.result);
        if (
          importing &&
          safe.some((t) =>
            previous.some((p) => p.id === t.id && JSON.stringify(p) !== JSON.stringify(t)),
          )
        )
          throw new Error(
            'An imported team ID conflicts with a saved team. Existing teams were preserved.',
          );
        if (
          new Set([
            ...previous.filter((t) => t.id !== deleteId).map((t) => t.id),
            ...safe.map((t) => t.id),
          ]).size > MAX_TEAMS
        )
          throw new Error('Up to 100 teams can be saved for each UID.');
        if (deleteId) store.delete([uid, deleteId]);
        for (const team of safe) store.put(team);
      } catch (error) {
        issue =
          error instanceof z.ZodError
            ? 'Unreadable team data. Existing records were preserved.'
            : error instanceof Error
              ? error.message
              : 'Invalid team data.';
        tx.abort();
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onabort = () => {
      db.close();
      reject(new Error(issue || 'Could not save teams. Existing records were preserved.'));
    };
  });
}
export function parseUidTeamFile(uid: string, raw: string): SavedUidTeam[] {
  if (new TextEncoder().encode(raw).byteLength > 200_000)
    throw new Error('Team file exceeds 200 KB.');
  const file = z
    .object({
      version: z.literal(1),
      uid: showcaseUidSchema,
      teams: z.array(savedTeamSchema).max(MAX_TEAMS),
    })
    .strict()
    .parse(JSON.parse(raw));
  if (file.uid !== uid || file.teams.some((t) => t.uid !== uid))
    throw new Error('This file belongs to a different UID. Switch to that UID before importing.');
  if (new Set(file.teams.map((t) => t.id)).size !== file.teams.length)
    throw new Error('Duplicate team IDs in file.');
  return validateRecords(uid, file.teams);
}
export function serializeUidTeams(uid: string, teams: SavedUidTeam[]) {
  return JSON.stringify({ version: 1, uid, teams: validateRecords(uid, teams) }, null, 2);
}
