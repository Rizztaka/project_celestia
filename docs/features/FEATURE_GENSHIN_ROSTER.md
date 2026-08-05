# Feature Specification: Genshin Roster (Milestone 2A)

**Feature ID:** FEAT-002  
**Priority:** P0  
**Status:** Designing  
**Phase:** 2A — Genshin Foundation  
**Last Updated:** 2026-08-05

---

## Feature Name

Genshin Impact Player Roster — Database Foundation

---

## Objective

Establish the database schema and backend domain layer for storing a user's
Genshin Impact roster data. This includes their characters, weapons, and
artifacts as dynamic user-owned data.

This milestone does **not** include the account import parser (2B), HTTP
controllers/routes (2C), or the static game data lookup layer. It focuses
exclusively on: how is the data modeled, how is it stored, and how is it
retrieved via Service and Repository classes.

---

## Critical Design Constraint: Static vs Dynamic Data

`ARCHITECTURE.md` draws a hard boundary between two types of data:

| Category | Examples | Where it lives |
|---|---|---|
| **Static Game Data** | Character names, weapon base stats, artifact set bonuses, material costs | Version-controlled JSON files in the codebase |
| **Dynamic User Data** | A player's character at level 80, C2, with specific talents | PostgreSQL via Prisma |

**Consequence for this schema:**  
The database **never stores** a character's base stats, element, weapon type,
or any other static game metadata. It only stores a user's *instance* of that
character (level, constellation, talent levels, etc.), referenced by a string
key that maps to the static data files.

This is the same approach used by all major Genshin community tools (Genshin
Optimizer, Akasha System, etc.) and is the format our future account importer
(2B) will produce.

---

## Target Users

All Project Celestia users who connect their Genshin Impact account. This is
the foundational data layer that every future Phase 2 and Phase 3 feature
depends on.

---

## User Stories

- As a player, I want my character roster to be stored so that future features
  (planners, recommendations) can use it.
- As a player, I want my weapon and artifact inventory stored so that the
  Intelligence Core can suggest optimizations.
- As a developer, I want well-defined Service interfaces so that 2B (importer)
  and 2C (HTTP layer) can be built on top of 2A without needing to change it.

---

## Functional Requirements

- A `GenshinAccount` record links a user to their Genshin roster (one per user in Phase 2).
- A user can have many `GenshinCharacter` records — one per owned character.
- A user can have many `GenshinWeapon` records — representing their weapon inventory.
- A user can have many `GenshinArtifact` records — representing their artifact inventory.
- A character can have at most one weapon equipped.
- A character can have at most one artifact per slot (flower, plume, sands, goblet, circlet).
- A weapon or artifact not equipped to any character has `equippedCharacterId = null`.

---

## Non-Functional Requirements

- All Prisma queries must be scoped by `accountId` — no query may accidentally access
  another user's data.
- Services must throw domain `AppError` subclasses, never raw Prisma errors.
- Repositories may not contain business logic — only database access.
- All service methods must be independently unit-testable via mocking.

---

## Proposed Prisma Schema

### Design Decision: String Key References

Characters, weapons, and artifact sets are identified by string keys
(e.g., `"hutao"`, `"StaffOfHoma"`, `"ShimenawasReminiscence"`). These keys
reference static game data JSON files, not foreign keys to database tables.

**Why not a database table for static game data?**  
Static data updates when the game patches — not when users interact with the
platform. Putting it in the database creates migration work every patch cycle
and adds join complexity. Version-controlled JSON files are cheaper to update
and easier to reason about.

### Relationship Map

```
User (platform)
  └── GenshinAccount (1:1 per Phase 2)
        ├── GenshinCharacter[] (one row per owned character)
        │     └── equippedWeaponId ─────────────────┐
        │                                            │
        ├── GenshinWeapon[]    <────────────────────-┘  (optional 1:1)
        │
        └── GenshinArtifact[]  → equippedCharacterId (optional M:1)
              @@unique([equippedCharacterId, slotKey])
```

### Proposed Models

```prisma
// ==========================================
// GENSHIN DOMAIN
// ==========================================

/// Links a platform User to their Genshin Impact data.
/// One user = one Genshin account in Phase 2.
/// Phase 6 (Advanced Systems) will remove the @unique on userId
/// to support multi-account.
model GenshinAccount {
  id            String   @id @default(uuid())
  userId        String   @unique   // enforces 1 account per user (Phase 2)
  uid           String?            // in-game UID (9 digits), optional
  nickname      String?            // in-game traveler nickname
  adventureRank Int?               // AR 1–60+
  worldLevel    Int?               // WL 0–8
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  characters    GenshinCharacter[]
  weapons       GenshinWeapon[]
  artifacts     GenshinArtifact[]

  @@map("genshin_accounts")
}

/// A single character owned by the player.
/// characterKey maps to the static game data JSON (e.g. "hutao", "zhongli").
/// talentNormal/Skill/Burst store base talent levels (1–10) before
/// constellation bonuses — effective level is computed in application code.
model GenshinCharacter {
  id               String   @id @default(uuid())
  accountId        String
  characterKey     String   // e.g. "hutao", "raiden_shogun"
  level            Int      // 1–90
  ascension        Int      // 0–6 (required to determine max level tier)
  constellation    Int      // 0–6
  talentNormal     Int      // 1–10 (base, before C3/C5 bonus)
  talentSkill      Int      // 1–10
  talentBurst      Int      // 1–10
  equippedWeaponId String?  @unique  // 1:1 with GenshinWeapon
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  account          GenshinAccount    @relation(fields: [accountId], references: [id], onDelete: Cascade)
  equippedWeapon   GenshinWeapon?    @relation(fields: [equippedWeaponId], references: [id])
  equippedArtifacts GenshinArtifact[]

  @@unique([accountId, characterKey])  // cannot own the same character twice
  @@map("genshin_characters")
}

/// A weapon in the player's inventory.
/// weaponKey maps to static game data (e.g. "StaffOfHoma").
/// refinement: 1–5. ascension: 0–6.
model GenshinWeapon {
  id           String   @id @default(uuid())
  accountId    String
  weaponKey    String   // e.g. "StaffOfHoma", "EngulfingLightning"
  level        Int      // 1–90
  ascension    Int      // 0–6
  refinement   Int      // 1–5
  locked       Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  account      GenshinAccount    @relation(fields: [accountId], references: [id], onDelete: Cascade)
  equippedBy   GenshinCharacter? // back-relation from GenshinCharacter.equippedWeaponId

  @@map("genshin_weapons")
}

/// A single artifact in the player's inventory.
/// setKey, slotKey, mainStatKey reference static game data constants.
/// subStats stored as JSON: [{ key: "critRate_", value: 6.6 }, ...]
/// equippedCharacterId is null when the artifact is in the inventory
/// but not equipped to any character.
model GenshinArtifact {
  id                  String   @id @default(uuid())
  accountId           String
  setKey              String   // e.g. "ShimenawasReminiscence"
  slotKey             String   // "flower" | "plume" | "sands" | "goblet" | "circlet"
  level               Int      // 0–20
  rarity              Int      // 1–5 (star count)
  mainStatKey         String   // e.g. "hp", "atk", "critRate_", "eleMas"
  subStats            Json     @default("[]") // ArtifactSubStat[]
  locked              Boolean  @default(false)
  equippedCharacterId String?  // FK to GenshinCharacter.id
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  account     GenshinAccount    @relation(fields: [accountId], references: [id], onDelete: Cascade)
  equippedBy  GenshinCharacter? @relation(fields: [equippedCharacterId], references: [id])

  // A character cannot have two artifacts in the same slot
  @@unique([equippedCharacterId, slotKey])
  @@map("genshin_artifacts")
}
```

### TypeScript Type for subStats (application layer)

```typescript
// Not in the DB schema — used in Service/Repository layer to type the JSON field.
interface ArtifactSubStat {
  key: string;    // e.g. "critRate_", "atk_", "hp", "eleMas"
  value: number;  // e.g. 6.6, 35, 299, 23
}
```

---

## Design Trade-offs and Alternatives Considered

### Trade-off 1: JSON sub-stats vs separate ArtifactSubStat table

| | JSON on GenshinArtifact | Separate table |
|---|---|---|
| Complexity | Simple, one table | Extra join on every artifact query |
| Queryability | Cannot DB-filter by sub-stat value | Can `WHERE key = 'critRate_' AND value > 10` |
| Phase 2A fit | ✅ Correct for storage only | Overkill — Intelligence Core (Phase 4) does filtering in code |

**Decision:** JSON for Phase 2A. Intelligence Core (Phase 4) will filter in application code. If profiling in Phase 4 shows this is a bottleneck, we can migrate to a junction table then.

### Trade-off 2: GenshinAccount as ownership root vs direct User FK

Without `GenshinAccount`, every character/weapon/artifact would have `userId` directly. This locks us into one-Genshin-account-per-user forever.

With `GenshinAccount` as an intermediate root, Phase 6 multi-account support is a simple `@unique` removal — no schema migrations required for the character/weapon/artifact tables.

**Decision:** `GenshinAccount` ownership root. The cost is one extra join on lookups; the benefit is future-proofing multi-account.

### Trade-off 3: `ascension` stored separately from `level`

In Genshin, a character can be "Level 20 / Ascension 0" (not yet ascended) or "Level 20 / Ascension 1" (just ascended, unlocking levels 21-40). Level alone is ambiguous at the ascension thresholds (20, 40, 50, 60, 70, 80). Both fields are necessary.

---

## Backend Requirements (Milestone 2A)

Each subdomain in `apps/api/src/games/genshin/` follows the existing DDD pattern.

### Module: `accounts/`
- `GenshinAccountRepository`: `create()`, `findByUserId()`, `findById()`
- `GenshinAccountService`: `createAccount()`, `getAccountByUserId()`

### Module: `characters/`
- `GenshinCharacterRepository`: `create()`, `findByAccountId()`, `findByKey()`, `update()`, `delete()`
- `GenshinCharacterService`: `addCharacter()`, `getCharacters()`, `updateCharacter()`, `removeCharacter()`

### Module: `weapons/`
- `GenshinWeaponRepository`: `create()`, `findByAccountId()`, `findById()`, `update()`, `delete()`
- `GenshinWeaponService`: `addWeapon()`, `getWeapons()`, `updateWeapon()`, `removeWeapon()`

### Module: `artifacts/`
- `GenshinArtifactRepository`: `create()`, `findByAccountId()`, `findById()`, `update()`, `delete()`
- `GenshinArtifactService`: `addArtifact()`, `getArtifacts()`, `updateArtifact()`, `removeArtifact()`

> Note: HTTP Controllers and Routes are **not** part of 2A. They are part of Milestone 2C (Frontend + API layer).

---

## Database Impact

**New tables:**
- `genshin_accounts`
- `genshin_characters`
- `genshin_weapons`
- `genshin_artifacts`

**Modified tables:**
- `users` — gains a `genshinAccount` back-relation (no column change; Prisma relation only)

**Migration:** A single `prisma migrate dev` migration named `add-genshin-foundation`.

---

## Security Considerations

- All repository queries are scoped by `accountId`. Accessing by character `id` alone
  must always include an `accountId` check to prevent cross-user data access.
- No endpoint in 2A returns unvalidated user input — all incoming data will be
  typed and validated via Zod schemas (added in 2C when HTTP layer is built).

---

## Testing Strategy

- Unit tests for each Service class (characters, weapons, artifacts, accounts)
- Repository mocked with `vi.mock` following the established pattern from Phase 1
- Test coverage: `addCharacter()` happy path, duplicate character (conflict), character not found (404), cross-account access guard

---

## Acceptance Criteria

The milestone is complete when:

- [ ] Prisma schema contains all four Genshin models
- [ ] Migration applies cleanly to the development database
- [ ] `prisma generate` completes without errors
- [ ] Repository classes exist for all four modules
- [ ] Service classes exist for all four modules
- [ ] Services throw appropriate `AppError` subclasses for domain failures
- [ ] Unit tests exist for all Service classes
- [ ] TypeScript reports zero errors
- [ ] No HTTP controllers or routes are introduced (those are 2C)

---

## Future Improvements (Out of Scope for 2A)

- HTTP API layer (Milestone 2C)
- Account import parser (Milestone 2B)
- Static game data validation (validate `characterKey` against a known list)
- Material/inventory tracking (Phase 2 later)
- Multi-account support (Phase 6)
- Sub-stat junction table migration if Phase 4 profiling shows a bottleneck
