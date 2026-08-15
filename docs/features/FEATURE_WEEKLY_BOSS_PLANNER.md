# Feature Specification: Weekly Boss Planner (Milestone 3D)

**Status:** Draft — Pending User Approval
**Phase:** 3 — Daily Companion
**Depends On:** Milestone 3A (DailyCompanion, PlannerPage tab structure), Milestone 3B (goal/tab pattern), Milestone 3C (EventProgress pattern)
**ADR References:** ADR-0005 (static vs dynamic data), ADR-0008 (frontend subview navigation), ADR-0009 (lazy reset pattern), ADR-0010 (GET must not mutate state)

---

## Overview

Weekly Bosses (also called "Trounce Domains") are the strongest enemies in Genshin Impact. They drop **Character Ascension Materials** — the rarest category of upgrade materials, required for every character's 4th and 6th ascension phase. The key mechanics that make them unique and worth tracking:

1. **Discounted resin:** The first **3** weekly boss fights each week cost **30 Resin** to claim rewards. Boss fights 4 and beyond cost **60 Resin** (double). Managing these 3 discounted fights is a significant resource decision.
2. **Weekly reset:** The discount counter resets every **Monday at 04:00 AM server time (Asia: 20:00 UTC Sunday night)**. This is a _different cadence_ from daily resets.
3. **Boss selection:** Players choose which bosses to fight each week based on which characters they're building.

The Weekly Boss Planner allows users to:

1. **See all available weekly bosses** in the current game version
2. **Mark which bosses they've defeated** this week (with the first 3 highlighted as "discounted")
3. **See a running resin cost summary** — e.g., "2 / 3 discounted fights used · Next fight costs 60 Resin"
4. **Phase 4 extension point:** Cross-reference bosses against active Farming Goals to highlight which bosses are "needed" this week

This feature lives in the `Platform Companion` domain as a new **"Weekly" tab** on `PlannerPage.tsx`.

---

## Decision 1 — Static Data Strategy: Curated JSON Seed File

**Problem:** The list of weekly bosses changes only when a new boss is added to the game — approximately once per major version (~3 months). This is far more stable than event data. However, boss reward material pools are still static data that should not be hardcoded in service logic.

**Options considered:**

| Option  | Description                                         | Verdict                                                              |
| ------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| A       | Hardcode the boss list directly in the service file | Silently stale, not independently updatable                          |
| **(B)** | **Curated JSON seed file committed to repo**        | ✅ Chosen — same pattern as `events.json` and `domain-schedule.json` |
| C       | Full static data pipeline (enums, DB seeding)       | Over-engineered for Phase 3                                          |

**Chosen approach (B): `apps/api/src/games/genshin/static/weekly-bosses.json`**

A single JSON file listing all available weekly bosses and their reward material pools. Updated only when a new boss is added — far less frequently than `events.json`.

### `weekly-bosses.json` Schema

```json
{
  "_comment": "PLACEHOLDER DATA — Current as of Patch 5.8. Add new bosses as they are released.",
  "bosses": [
    {
      "key": "Dvalin",
      "name": "Stormterror Dvalin",
      "location": "Mondstadt",
      "domainName": "Confront Stormterror",
      "dropKeys": ["HurricaneSeed", "CleansingHeart", "HoarfrostCore"],
      "wikiUrl": "https://genshin-impact.fandom.com/wiki/Confront_Stormterror"
    }
  ]
}
```

**Key field decisions:**

- `key` is a stable, short string used as the join key between the JSON and the user's `defeatedBossKeys` JSON array. It does NOT change if the boss's display name changes.
- `dropKeys` are GOOD-format material key strings — informational for Phase 3, cross-referenced with `UpgradeGoal` in Phase 4.
- `location` and `domainName` are purely display fields.
- `wikiUrl` is optional, same as in `events.json`.

---

## Decision 2 — Backend Data Model (Prisma)

**Problem:** We need to track which weekly bosses a user has defeated this week, with a weekly reset mechanism — but the reset cadence differs from the daily one already in `DailyCompanion`.

### Weekly Reset Boundary

The weekly reset for Genshin Impact (Asia server) occurs at:

- **Monday 04:00 AM UTC+8** = **Sunday 20:00 UTC**

The lazy reset pattern (ADR-0009) applies cleanly here. On `GET /companion/weekly-bosses`, the service computes the most recent Sunday 20:00 UTC boundary and compares it against the stored `weeklyResetAt`. If the boundary has passed since the record was last reset, it replaces `defeatedBossKeys` with `[]` and updates `weeklyResetAt` — all within the same request handler, before returning the response.

**Crucially, this must NOT be placed inside `DailyCompanion`.** Adding a weekly reset timestamp and defeat list to the daily companion model would conflate two different reset cadences in one table, making the reset logic fragile and harder to unit-test in isolation.

### New Model: `WeeklyBossState`

```prisma
/// Tracks a user's weekly boss defeat status.
/// One-to-one with User. Created lazily on the user's first weekly boss request.
///
/// defeatedBossKeys stores the set of bossKeys defeated this week as a JSON
/// string array (e.g., ["Dvalin", "Lupus"]). JSON storage is used instead of
/// a junction table because: (a) the set is small and bounded (<=~12 bosses),
/// and (b) a junction table would require DELETE rows on every lazy weekly
/// reset — violating ADR-0010 (GET must not mutate state via destructive ops).
/// The JSON array reset is a single UPDATE, not a DELETE+INSERT.
///
/// Weekly reset boundary: Sunday 20:00 UTC (= Monday 04:00 UTC+8).
/// Reset is applied lazily on every GET, not by a cron job.
model WeeklyBossState {
  id     String @id @default(uuid())
  userId String @unique

  defeatedBossKeys Json     @default("[]") // string[] — keys from weekly-bosses.json
  weeklyResetAt    DateTime @default(now())

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("weekly_boss_state")
}
```

**Why JSON array over a junction table:**

A `WeeklyBossDefeat(userId, bossKey)` junction table would require `DELETE FROM weekly_boss_defeats WHERE userId = ?` on every lazy weekly reset — which is a destructive side-effect on a `GET` request and directly violates ADR-0010. Storing the week start date alongside junction rows would avoid deletions, but stale rows would accumulate indefinitely. The JSON array approach satisfies ADR-0010: the reset is a single idempotent `UPDATE` of one field.

> **Open Question OQ-1 (for user):** This is a deliberate denormalization. The trade-off is: no ability to query "how many users defeated Dvalin this week" — but we have no analytics requirement for Phase 3. Do you agree with this approach?

---

## Decision 3 — Backend APIs

All routes mount under the existing `/api/v1/companion` router.

### Route Definitions

| Method  | Path                                | Controller Method | Description                                                                                      |
| ------- | ----------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| `GET`   | `/companion/weekly-bosses`          | `getWeeklyBosses` | Fetch all bosses hydrated with defeat status. Triggers lazy weekly reset if boundary has passed. |
| `PATCH` | `/companion/weekly-bosses/:bossKey` | `patchBoss`       | Toggle a boss's defeated status. Body: `{ "defeated": boolean }`                                 |

### GET Response Shape

```typescript
interface WeeklyBossesResponse {
  weeklyResetAt: string; // ISO UTC — when this week's state was last reset
  nextResetAt: string; // ISO UTC — next Sunday 20:00 UTC boundary
  defeatedCount: number; // total bosses defeated this week
  discountedRemaining: number; // discounted fights left (max 3, min 0)
  nextFightCost: number; // 30 if discounted fights remain, else 60
  bosses: HydratedWeeklyBoss[];
}

interface HydratedWeeklyBoss {
  key: string;
  name: string;
  location: string;
  domainName: string;
  dropKeys: string[];
  wikiUrl: string | null;
  defeated: boolean;
  fightCost: number; // resin cost to claim THIS boss (based on position in defeat order)
}
```

**Note on `fightCost`:** Each boss in the response has its own `fightCost` pre-computed by the service. Undefeated bosses are assigned costs in order: the first undefeated boss gets 30 (if discounts remain), the next gets 30 (if discounts remain), etc. Defeated bosses show the cost that was "used" when they were defeated. This is computed purely from `defeatedCount` at the time of the GET.

> **Open Question OQ-2 (for user):** The `fightCost` per boss is computed at read time and tells the user what each remaining fight will cost. However, we cannot know the _order_ in which a user will fight remaining bosses. Should we show `fightCost` on each undefeated boss as if they fight them in list order (top to bottom), or simply show a single global "next fight costs X" on the summary bar and leave individual boss cards without a per-boss cost?

### PATCH Response Shape

```typescript
// Request body
{ "defeated": boolean }

// Response
{ "bossKey": string; "defeated": boolean; }
```

**Validation:**

- `NotFoundError` if `bossKey` not in `weekly-bosses.json`
- `BadRequestError` (Zod) if body is malformed

---

## Decision 4 — Frontend Integration: New "Weekly" Tab

**Chosen: Add a 4th tab to PlannerPage.tsx — `Daily | Weekly | Farming Goals | Events`**

Adding a separate page would be over-engineering for a single tracker. Integrating into the "Daily" tab would confuse the two different reset cadences. The ADR-0008 tab pattern is the right fit.

### UI Design

1. **Tab badge:** When `discountedRemaining > 0`, the "Weekly" tab label shows a subtle amber badge with the number of discounted fights remaining — consistent with the Primogem badge on the Events tab. This gives at-a-glance visibility from any other tab.

2. **Summary bar** (top of panel): Shows the discount status and next reset time.
   - Active discounts: `"2 / 3 discounted · Next fight: 30 Resin · Resets in 4d 3h"`
   - All discounts used: `"3 / 3 used · Remaining fights: 60 Resin · Resets in 4d 3h"`
   - All done: `"All bosses cleared this week ✓"`

3. **Boss cards** (`WeeklyBossCard.tsx`):
   - Boss name, domain, location
   - Drop material keys as a compact, lower-opacity list
   - A prominent **toggle button** (not a checkbox — the action carries more weight than a daily checklist tick). Button text: "Defeated" / "Mark Defeated"
   - When defeated: card is dimmed, button shows "✓ Defeated", and a "Used 30 Resin" (or 60) label appears
   - A wiki link if `wikiUrl` is present

4. **Optimistic update:** Same `onMutate` → snapshot → rollback pattern from 3C. Per-boss `pendingBosses: Set<string>` to disable buttons during in-flight requests.

5. **Weekly reset countdown:** Uses the same `formatTimeRemaining` helper from EventCard (hours → "4d 3h" etc.), applied to `nextResetAt`.

---

## Verification Plan

### Automated Tests (`weekly-boss.service.test.ts`)

- Returns all bosses with `defeated: false` for a new user (no DB row yet)
- Correctly reflects defeated bosses after an upsert
- Lazy weekly reset: if `weeklyResetAt` is before the most recent Sunday 20:00 UTC boundary, `defeatedBossKeys` is cleared and the updated state returned
- `discountedRemaining` and `nextFightCost` computed correctly for 0, 1, 2, 3, and 4 defeated bosses
- `patchBoss` throws `NotFoundError` for an unknown `bossKey`
- `patchBoss` throws `BadRequestError` for malformed body
- Idempotency: marking a boss defeated twice returns the correct state

### Manual Verification

- Navigate to `/planner` → Weekly tab
- Mark a boss as defeated → card dims immediately (optimistic), tab badge decrements
- Mark 3 bosses → summary bar transitions from "30 Resin" to "60 Resin" per fight
- Weekly reset countdown displays correctly
