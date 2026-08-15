# Feature Specification: Farming & Material Planner (Milestone 3B)

**Status:** Draft — Pending User Approval
**Phase:** 3 — Daily Companion
**Depends On:** Milestone 3A (DailyCompanion model), Phase 2 (GenshinCharacter, GenshinWeapon)

---

## Overview

The Farming Planner allows users to define upgrade **Goals** (e.g. "ascend Hu Tao from phase 5 to 6")
and instantly see:

1. **What materials they still need** — a delta of (total required) minus (GOOD-imported inventory)
2. **Which domains to farm today** — filtered to the Asia server's current day rotation

The backend lives in the existing `Platform Companion` domain. The frontend extends the existing
`/planner` page (`PlannerPage.tsx`) with a second tab.

---

## Decision 1 — Static Data Strategy: Curated JSON Seed Files

**Options considered:**

- (A) Full data pipeline from Ambr.top / genshin-data at build time
- (B) Hardcoded TypeScript lookup maps inside the service
- **(C) Curated JSON seed files committed to the repo** ← chosen

**Rationale:** A over-engineers 3B (Phase 4 concern). B bloats the service layer with data.
C gives a human-editable, reviewable single source of truth with zero runtime overhead.

**Committed to `apps/api/src/games/genshin/static/`:**

- `character-materials.json` — ascension and talent material costs per phase per character key
- `weapon-materials.json` — ascension material costs per phase per weapon key
- `domain-schedule.json` — domain name, location, drops, and which days (Mon–Wed–Thu etc.) it opens

These are loaded once at module init and held in memory. In Phase 4, when a full static-data service
is introduced, these JSON files become the migration source.

---

## Decision 2 — Prisma Model: `UpgradeGoal`

Goals belong to `User` (not `GenshinAccount`) because they are planner intent, not imported game
state. Goals survive GOOD re-imports.

```prisma
enum GoalType {
  CHARACTER_ASCENSION
  CHARACTER_TALENT
  WEAPON_ASCENSION
}

model UpgradeGoal {
  id        String   @id @default(uuid())
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  goalType   GoalType
  targetKey  String   // e.g. "HuTao", "StaffOfHoma" — references static data, NOT a FK
  fromPhase  Int      // inclusive lower bound (0–5)
  toPhase    Int      // inclusive upper bound (1–6)
  talentType String?  // "normal" | "skill" | "burst" — only for CHARACTER_TALENT, else null

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  // One active goal per (type, key, talent slot) per user
  @@unique([userId, goalType, targetKey, talentType])
  @@map("upgrade_goals")
}
```

**Why phases instead of levels?** Genshin's ascension system is phase-gated. Phases (0–6) are
the canonical unit. The frontend derives the "Level 80 → 90" display label from the phase.

---

## Decision 3 — Backend APIs

All routes under `/api/v1/companion/`, protected by `requireAuth`.

| Method   | Path                         | Description                                       |
| -------- | ---------------------------- | ------------------------------------------------- |
| `POST`   | `/companion/goals`           | Create an upgrade goal                            |
| `GET`    | `/companion/goals`           | List all goals for the user                       |
| `DELETE` | `/companion/goals/:id`       | Delete a goal by ID                               |
| `GET`    | `/companion/goals/materials` | Return full material delta across all goals       |
| `GET`    | `/companion/goals/today`     | Return today's farmable domains filtered by goals |

### `POST /companion/goals`

Body (Zod-validated in service):

```json
{
  "goalType": "CHARACTER_ASCENSION",
  "targetKey": "HuTao",
  "fromPhase": 5,
  "toPhase": 6,
  "talentType": null
}
```

Validation: `fromPhase < toPhase`, phase range 0–6, `talentType` required iff `goalType === CHARACTER_TALENT`.
Duplicate (same unique key) → `409 Conflict` with human-readable message.

### `DELETE /companion/goals/:id`

Returns `204 No Content`. Returns `404` if the goal doesn't belong to the requesting user.

### `GET /companion/goals/materials` — Material Delta

The service:

1. Loads user's goals from DB.
2. Aggregates all material requirements from static JSON seed files.
3. Subtracts the user's GOOD-imported material inventory (see Open Question 1 below).
4. Returns `{ needed, inventory, delta }` — all keyed by material identifier.

```json
{
  "needed": { "Silk Flower": 168, "Bloodjade Branch": 46 },
  "inventory": { "Silk Flower": 43, "Bloodjade Branch": 0 },
  "delta": { "Silk Flower": 125, "Bloodjade Branch": 46 }
}
```

> ⚠️ **Open Question 1 — Material Inventory Source (answer required before implementation):**
>
> The GOOD format includes a `materials` block (e.g. `{ "Silk Flower": 43 }`). Our current
> importer discards it.
>
> **Option A (Recommended):** Extend the importer to store materials in a new `GenshinMaterial`
> model (`accountId`, `itemKey`, `quantity`). The delta endpoint reads from DB. Keeps API clean,
> aligns with existing import architecture, makes materials first-class data.
>
> **Option B:** Do not extend the DB. The frontend passes the raw `materials` block from its
> cached GOOD data as the request body. The server computes statelessly. No schema change needed,
> but the endpoint is stateful on the client.
>
> Please confirm **Option A or B**.

### `GET /companion/goals/today` — Today's Farmable Domains

1. Determines Asia server weekday (boundary = 20:00 UTC, matching the daily reset).
2. Looks up open domains from `domain-schedule.json`.
3. Filters to domains whose drops overlap with at least one goal's needed materials.
4. Returns domain list with `name`, `location`, `drops[]`, and `relevantToGoals: boolean`.

```json
{
  "serverDay": "Tuesday",
  "domains": [
    {
      "domainKey": "CeciliaGarden",
      "name": "Cecilia Garden",
      "location": "Mondstadt",
      "drops": ["TeachingsOfBallad", "GuidesToBallad", "PhilosophiesOfBallad"],
      "relevantToGoals": true
    }
  ]
}
```

> ⚠️ **Open Question 2 (low stakes):** The weekly rotation assumes Monday starts the week
> (Mon/Thu domains open Mondays and Thursdays, Tue/Fri on Tuesdays and Fridays, Wed/Sat on
> Wednesdays and Saturdays, Sunday all domains open). Please confirm this matches your server.

---

## Decision 4 — Frontend UI: Second Tab on PlannerPage

Per **ADR 0008** (React state tabs for tightly-coupled sub-views), the Farming Goals view
lives as a second tab on the existing `/planner` page — not a separate route.

```
┌──────────────────────────────────────────────────────────────────┐
│  Daily Planner                                                   │
│  [ Daily ] [ Farming Goals ]   ← React state tabs               │
└──────────────────────────────────────────────────────────────────┘
```

**"Farming Goals" tab layout:**

```
Left column (Goals list)         Right column (Today's Domains)
────────────────────────         ──────────────────────────────
+ Add Goal (inline form)         TODAY — TUESDAY (Asia Server)

Hu Tao                           ✦ Cecilia Garden — Mondstadt
  Ascension 5 → 6                  Ballad books · needed by Venti
  [× Remove]
                                 ✦ Hidden Palace of Lianshan Formula
Venti                              Polearm billets · needed by
  Normal Talent 6 → 10             Staff of Homa

──────────────────────────────────────────────────────────────────
MATERIALS STILL NEEDED

Category      Material              Need  Have  Delta  Bar
─────────────────────────────────────────────────────────────────
Boss          Bloodjade Branch        46     0     46  ████░░░░
Talent Book   Guide to Ballad         18     6     12  ██████░░
Local         Silk Flower            168    43    125  ██░░░░░░
Common        Slime Concentrate       30    12     18  ████░░░░
```

**Add Goal inline form (no modal):**

- Step 1: Goal type radio (Character Ascension / Talent / Weapon Ascension)
- Step 2: Target key text input (free-text for 3B; autocomplete in Phase 4)
- Step 3: From/To phase dropdowns
- Submit → `POST /companion/goals` → invalidate goals + materials query

**Design tokens:** Goal list panel uses `glass-panel` card. Material rows use coloured category
badges (Boss = red, Talent Book = violet, Local = emerald, Common = zinc, Gem = amber, Billet = sky).
A slim horizontal progress bar (inventory / needed, capped at 100%) sits on each row.

---

## File Plan

### Backend

```
apps/api/src/games/genshin/static/
  character-materials.json         [NEW]
  weapon-materials.json            [NEW]
  domain-schedule.json             [NEW]

apps/api/src/platform/companion/
  goal.repository.ts               [NEW]  CRUD for UpgradeGoal
  goal.service.ts                  [NEW]  domain logic: create, list, delete, delta, today
  goal.controller.ts               [NEW]  HTTP translation layer (no business logic)
  companion.routes.ts              [MODIFY]  mount goal routes

apps/api/prisma/
  schema.prisma                    [MODIFY]  UpgradeGoal model + GoalType enum + User back-relation
  migrations/                      [NEW]     prisma migrate dev
```

If Option A approved for materials:

```
apps/api/src/games/genshin/importer/
  importer.service.ts              [MODIFY]  write genshin_materials rows on import
  importer.schema.ts               [MODIFY]  parse GOOD materials block
apps/api/prisma/schema.prisma      [MODIFY]  GenshinMaterial model
```

### Frontend

```
apps/web/src/pages/PlannerPage.tsx      [MODIFY]  add Farming Goals tab
apps/web/src/components/GoalForm.tsx    [NEW]     inline add-goal form
apps/web/src/components/MaterialRow.tsx [NEW]     single material requirement row
apps/web/src/lib/api.ts                 [MODIFY]  goal + materials API functions
apps/web/src/lib/static.ts              [NEW]     phase-to-level display helpers
```

---

## Verification Plan

### Automated Tests

- `goal.service.test.ts` — CRUD, Zod validation errors, delta computation with mock static data.

### Manual Verification

1. Create a CHARACTER_ASCENSION goal for Hu Tao (phase 5→6).
2. Confirm materials list shows Bloodjade Branch, Silk Flower, Slime Concentrate.
3. Confirm delta accounts for items already in the imported inventory.
4. On a Tuesday (Asia), confirm Cecilia Garden appears in "Today's Domains".
5. `pnpm test` — all tests pass, zero TypeScript errors.
