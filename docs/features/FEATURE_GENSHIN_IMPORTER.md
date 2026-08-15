# Feature Specification: Genshin Account Import Parser (Milestone 2B)

**Feature ID:** FEAT-003  
**Priority:** P0  
**Status:** Designing  
**Phase:** 2B — Account Import Parser  
**Last Updated:** 2026-08-07

---

## Feature Name

Genshin Impact Account Import — GOOD Format Parser

---

## Objective

Allow a user to upload their Genshin Impact account data in the GOOD (Genshin
Open Object Description) format, and have it parsed, validated, and saved into
the database as their roster (characters), inventory (weapons, artifacts), and
account metadata.

This is the primary data entry path for Phase 2. Every subsequent Phase 2
feature (character management UI, inventory views) depends on this import
existing first.

---

## What is GOOD Format?

GOOD (Genshin Open Object Description) is a community-standard JSON format
produced by tools like Genshin Optimizer and Inventory Kamera. Players export
their account data from these tools and paste or upload the JSON to third-party
platforms like Project Celestia.

**A minimal GOOD payload looks like this:**

```json
{
  "format": "GOOD",
  "version": 2,
  "source": "Genshin Optimizer",
  "characters": [
    {
      "key": "HuTao",
      "level": 90,
      "constellation": 1,
      "ascension": 6,
      "talent": { "auto": 6, "skill": 9, "burst": 9 }
    }
  ],
  "weapons": [
    {
      "key": "StaffOfHoma",
      "level": 90,
      "ascension": 6,
      "refinement": 1,
      "location": "HuTao",
      "lock": false
    }
  ],
  "artifacts": [
    {
      "setKey": "ShimenawasReminiscence",
      "slotKey": "goblet",
      "level": 20,
      "rarity": 5,
      "mainStatKey": "pyro_dmg_",
      "lock": false,
      "location": "HuTao",
      "substats": [
        { "key": "critRate_", "value": 6.6 },
        { "key": "critDMG_", "value": 13.2 }
      ]
    }
  ]
}
```

**Key observations:**

- `location` on weapons and artifacts is the character `key` they are equipped on,
  or an empty string `""` if unequipped.
- There are no stable IDs for weapons or artifacts — two copies of the same
  weapon are identical objects.
- GOOD field names differ from our database field names (mapped in the spec below).

---

## Target Users

All Project Celestia users who have used Genshin Optimizer, Inventory Kamera,
or any other GOOD-compatible tool to export their account data.

---

## User Stories

- As a player, I want to paste my GOOD export JSON so that my full roster and
  inventory is saved to Project Celestia instantly.
- As a player, I want to re-upload my GOOD export after I pull new characters
  or upgrade artifacts, and have the database update to reflect my current state.
- As a developer, I want the import to be atomic: if anything fails mid-import,
  I must be able to guarantee zero partial data is written to the database.

---

## Functional Requirements

- Accept a raw GOOD-format JSON string as input.
- Validate the JSON strictly against a Zod schema before touching the database.
- Create a `GenshinAccount` if one does not already exist for the user.
- Upsert all characters (create new, update existing).
- Replace the full weapon inventory (delete all, re-insert from GOOD).
- Replace the full artifact inventory (delete all, re-insert from GOOD).
- Resolve equipment relationships (`equippedWeaponId` on characters and
  `equippedCharacterId` on artifacts) from GOOD `location` fields.
- Run the entire database operation inside a single Prisma interactive transaction.
- Return a summary of what was imported (character count, weapon count, artifact count).

---

## Non-Functional Requirements

- The import must be fully atomic: any failure rolls back the entire operation.
- The import service must be independently unit-testable by mocking Prisma.
- Validation errors must return user-friendly messages (e.g., "Invalid GOOD format").
- The service must not call the individual CRUD services from Milestone 2A —
  those are optimized for single-record operations. The importer performs bulk
  operations inside a transaction and must have direct database access.

---

## GOOD Field → Database Field Mapping

| GOOD Field                | Database Field                                  | Notes                |
| ------------------------- | ----------------------------------------------- | -------------------- |
| `character.key`           | `characterKey`                                  | e.g. `"HuTao"`       |
| `character.level`         | `level`                                         | 1–90                 |
| `character.ascension`     | `ascension`                                     | 0–6                  |
| `character.constellation` | `constellation`                                 | 0–6                  |
| `character.talent.auto`   | `talentNormal`                                  | 1–10 (base)          |
| `character.talent.skill`  | `talentSkill`                                   | 1–10 (base)          |
| `character.talent.burst`  | `talentBurst`                                   | 1–10 (base)          |
| `weapon.key`              | `weaponKey`                                     | e.g. `"StaffOfHoma"` |
| `weapon.lock`             | `locked`                                        | boolean              |
| `weapon.location`         | (resolved to `equippedWeaponId` on character)   |                      |
| `artifact.substats`       | `subStats`                                      | renamed              |
| `artifact.lock`           | `locked`                                        | boolean              |
| `artifact.location`       | (resolved to `equippedCharacterId` on artifact) |                      |

---

## Zod Validation Schema

The Zod schema lives in `games/genshin/importer/importer.schema.ts` and is
the single source of truth for what the importer accepts.

```typescript
// importer.schema.ts

import { z } from 'zod';

const SLOT_KEYS = ['flower', 'plume', 'sands', 'goblet', 'circlet'] as const;

export const GoodSubStatSchema = z.object({
  key: z.string().min(1),
  value: z.number(),
});

export const GoodCharacterSchema = z.object({
  key: z.string().min(1),
  level: z.number().int().min(1).max(90),
  constellation: z.number().int().min(0).max(6),
  ascension: z.number().int().min(0).max(6),
  talent: z.object({
    auto: z.number().int().min(1).max(15), // accept up to 15 (some tools export effective talent levels)
    skill: z.number().int().min(1).max(15),
    burst: z.number().int().min(1).max(15),
  }),
});

export const GoodWeaponSchema = z.object({
  key: z.string().min(1),
  level: z.number().int().min(1).max(90),
  ascension: z.number().int().min(0).max(6),
  refinement: z.number().int().min(1).max(5),
  location: z.string().default(''), // "" = unequipped
  lock: z.boolean().default(false),
});

export const GoodArtifactSchema = z.object({
  setKey: z.string().min(1),
  slotKey: z.enum(SLOT_KEYS),
  level: z.number().int().min(0).max(20),
  rarity: z.number().int().min(1).max(5),
  mainStatKey: z.string().min(1),
  lock: z.boolean().default(false),
  location: z.string().default(''),
  substats: z.array(GoodSubStatSchema).max(4),
});

export const GoodPayloadSchema = z.object({
  format: z.literal('GOOD'),
  version: z.number().int().positive(),
  source: z.string().optional(),
  characters: z.array(GoodCharacterSchema).default([]),
  weapons: z.array(GoodWeaponSchema).default([]),
  artifacts: z.array(GoodArtifactSchema).default([]),
});

// Type inferred from the schema — used throughout the importer service
export type GoodPayload = z.infer<typeof GoodPayloadSchema>;
```

---

## Import Algorithm

### Why NOT reuse the existing CRUD services

The CRUD services from Milestone 2A (`GenshinCharacterService`, etc.) perform
individual record operations. Running them inside a loop would produce N+1
queries and would not be atomic. The importer needs direct database access
through Prisma inside a single interactive transaction.

### The Full Algorithm (step-by-step)

```
INPUT: userId (string), rawJson (string)

STEP 1 — Validate
  Parse rawJson with JSON.parse()
  Validate against GoodPayloadSchema using zodSchema.parse()
  → If parse or validation fails: throw BadRequestError("Invalid GOOD format.")

STEP 2 — Find or create GenshinAccount
  Find account where userId = userId
  If not found → create GenshinAccount for this userId

STEP 3 — Execute in a single prisma.$transaction(async (tx) => { ... })

  3a. Clear weapon FKs on characters
      Set equippedWeaponId = null for ALL characters in this account.
      (Required before deleting weapons to avoid FK constraint violation.)

  3b. Delete all existing weapons for this account.

  3c. Delete all existing artifacts for this account.
      (Artifact FK equippedCharacterId points TO characters, not FROM characters,
      so deleting artifacts is always FK-safe.)

  3d. Upsert characters
      For each character in payload.characters:
        tx.genshinCharacter.upsert({
          where: { accountId_characterKey: { accountId, characterKey: char.key } },
          create: { accountId, characterKey, level, ascension, constellation,
                    talentNormal, talentSkill, talentBurst },
          update: { level, ascension, constellation,
                    talentNormal, talentSkill, talentBurst },
        })
      Collect results into Map<characterKey, { id }>

  3e. Insert all weapons
      For each weapon in payload.weapons:
        tx.genshinWeapon.create({ data: { accountId, weaponKey, level,
                                          ascension, refinement, locked } })
      Collect results into Array<{ weaponRecord, location }>

  3f. Insert all artifacts
      For each artifact in payload.artifacts:
        tx.genshinArtifact.create({ data: { accountId, setKey, slotKey, level,
                                             rarity, mainStatKey, subStats,
                                             locked } })
      Collect results into Array<{ artifactRecord, location }>

  3g. Resolve weapon equipment
      For each weapon where location !== "":
        characterId = characterMap.get(location)?.id
        If characterId exists:
          tx.genshinCharacter.update({
            where: { id: characterId },
            data: { equippedWeaponId: weaponRecord.id }
          })
        Else: skip (character in location field is not in this GOOD export)

  3h. Resolve artifact equipment
      For each artifact where location !== "":
        characterId = characterMap.get(location)?.id
        If characterId exists:
          tx.genshinArtifact.update({
            where: { id: artifactRecord.id },
            data: { equippedCharacterId: characterId }
          })
        Else: skip

STEP 4 — Return import summary
  {
    charactersImported: number,
    weaponsImported:    number,
    artifactsImported:  number,
  }
```

---

## Deduplication Strategy

| Entity               | Strategy                                  | Reason                                                                                                                         |
| -------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **GenshinAccount**   | Find or create                            | One per user. Update metadata if exists.                                                                                       |
| **GenshinCharacter** | **Upsert** by `(accountId, characterKey)` | Characters have a stable natural key. A player cannot have two Hu Taos. The unique index from 2A makes this trivial.           |
| **GenshinWeapon**    | **Replace** (delete all + re-insert)      | No stable natural ID. A player can own two identical weapons. The GOOD payload represents the player's complete current state. |
| **GenshinArtifact**  | **Replace** (delete all + re-insert)      | Same as weapons — no stable natural ID. Players constantly discard and replace artifacts.                                      |

**Why Replace is correct for weapons and artifacts:**

Artifacts in particular are frequently discarded. If a player throws away a
flower artifact and re-exports their GOOD file, that flower is simply gone from
the payload. A "merge" strategy (delete only records not in the new payload)
would require a stable ID to match old records to new records — which GOOD
does not provide. Replace is simpler, correct, and fast.

---

## Database Transaction

The importer uses Prisma's **interactive transaction** pattern:

```typescript
await prisma.$transaction(async (tx) => {
  // All steps 3a–3h use tx instead of prisma
  // If ANY step throws, Prisma rolls back the entire transaction automatically
});
```

**Why interactive transactions (not batch `$transaction([...])`)?**

The batch form `$transaction([op1, op2, op3])` cannot use results from earlier
operations (e.g., we need character IDs from step 3d before we can resolve
weapon equipment in step 3g). The interactive form (`async (tx) => { ... }`)
allows us to use `await` inside the transaction and chain operations.

**Rollback guarantee:** If the transaction throws at any point (invalid data,
DB constraint violation, network error), PostgreSQL rolls back the entire
transaction. The database is left in its pre-import state. The user can safely
retry the import.

---

## Backend Requirements

### New Module: `games/genshin/importer/`

This is a new subdomain within the Genshin bounded context.

**Files:**

#### `importer.schema.ts`

- Contains all Zod schemas for GOOD format validation.
- Exported so the HTTP controller (Milestone 2C) can use them for request validation.
- Contains the `GoodPayload` TypeScript type inferred from `GoodPayloadSchema`.

#### `importer.service.ts`

- `GenshinImportService` class.
- Single public method: `importAccount(userId: string, rawJson: string): Promise<ImportResult>`.
- Does NOT extend or depend on the Milestone 2A CRUD services.
- Uses Prisma directly via the interactive transaction pattern.

#### `importer.service.test.ts`

- Unit tests for `GenshinImportService`.
- Prisma is mocked at the module level.
- Tests cover: happy path, invalid JSON, invalid GOOD format, re-import (upsert),
  missing location character (skipped gracefully), empty payload.

### ImportResult interface

```typescript
export interface ImportResult {
  charactersImported: number;
  weaponsImported: number;
  artifactsImported: number;
}
```

---

## Edge Cases and Defined Behaviors

| Edge Case                                            | Behavior                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid JSON (not parseable)                         | `BadRequestError("Invalid GOOD format: JSON parse failed.")`                                                                                                                                                                                                                                                                                                                                                                                |
| Valid JSON but missing `format: "GOOD"`              | `BadRequestError("Invalid GOOD format: expected format to be 'GOOD'.")`                                                                                                                                                                                                                                                                                                                                                                     |
| Payload has no characters/weapons/artifacts          | Valid import — upserts account metadata, leaves roster unchanged for missing sections.                                                                                                                                                                                                                                                                                                                                                      |
| `location` references a character not in the payload | Weapon/artifact is created unequipped. No error thrown.                                                                                                                                                                                                                                                                                                                                                                                     |
| Re-import with same data                             | Idempotent. Characters are upserted (no change to values). Weapons/artifacts are replaced with identical data.                                                                                                                                                                                                                                                                                                                              |
| Re-import with fewer characters                      | Characters not in the GOOD payload are **left untouched** in the database. In Genshin Impact, a player can never lose a character they have pulled. A character missing from a GOOD export is always a scanner omission (the player deselected it for a faster scan) — never an actual data loss. Deleting DB records due to scanner omissions would be a critical UX failure. Manual deletion will be provided via the UI in Milestone 2C. |
| Artifact with invalid `slotKey`                      | Caught by Zod validation before DB touch — `BadRequestError`.                                                                                                                                                                                                                                                                                                                                                                               |
| Transaction fails midway (e.g., DB constraint)       | Full rollback — DB state unchanged.                                                                                                                                                                                                                                                                                                                                                                                                         |

---

## Security Considerations

- The import endpoint (2C) will require authentication — only the logged-in user
  can import into their own account.
- `userId` is taken from the verified JWT payload, never from the request body —
  a user cannot import into someone else's account.
- GOOD JSON is validated by Zod before any database access. No raw user input
  is passed to Prisma.
- The import is scoped to one `accountId` throughout — every `create` and `delete`
  includes the `accountId` filter.

---

## Performance Considerations

A large GOOD export can contain:

- ~60 characters
- ~200 weapons
- ~1500 artifacts

Operations:

- 60 upserts for characters
- 1 bulk delete + ~200 creates for weapons
- 1 bulk delete + ~1500 creates for artifacts
- ~200 + ~1500 update queries for equipment resolution

Total: ~3000–4000 Prisma queries in a single transaction.

**Optimization note:** For Milestone 2B, the straightforward sequential approach
is acceptable (imports are infrequent user-triggered events, not high-frequency
API calls). If profiling in Phase 4 reveals this is slow, `createMany` can be
used for the insert steps, and location resolution can use `updateMany` with
`in` filters.

---

## Testing Strategy

### Unit Tests (`importer.service.test.ts`)

- **Valid full import:** happy path with characters, weapons, and artifacts
- **Re-import:** same payload imported twice — characters upserted, weapons/artifacts replaced
- **Invalid JSON:** `BadRequestError` thrown before any DB call
- **Invalid GOOD format:** missing `format: "GOOD"` field — `BadRequestError`
- **Empty sections:** payload with `characters: []` — valid, returns zeros
- **Missing location character:** weapon with `location: "SomeCharNotInPayload"` — weapon created unequipped, no error
- **Transaction rollback:** Prisma transaction mock throws mid-way — verify no partial data

---

## Acceptance Criteria

The milestone is complete when:

- [ ] `importer.schema.ts` defines and exports all Zod schemas and `GoodPayload` type
- [ ] `importer.service.ts` implements `GenshinImportService.importAccount()`
- [ ] Import runs inside a single `prisma.$transaction(async (tx) => { ... })`
- [ ] Characters are upserted using the `accountId_characterKey` unique index
- [ ] Weapons and artifacts use the replace strategy (delete all + re-insert)
- [ ] Equipment relationships are correctly resolved from GOOD `location` fields
- [ ] Invalid JSON or invalid GOOD format throws `BadRequestError`
- [ ] Unit tests exist and pass for all scenarios above
- [ ] TypeScript reports zero errors
- [ ] No HTTP controllers or routes are introduced (those are Milestone 2C)

---

## Future Improvements (Out of Scope for 2B)

- HTTP endpoint for import (Milestone 2C)
- `createMany` / `updateMany` batch optimization for large accounts (Phase 4)
- Importing account metadata from UID lookup (Enka.Network API integration — Phase 3+)
- Manual character deletion via the API (Milestone 2C)
- Import history / audit log (Phase 6)
