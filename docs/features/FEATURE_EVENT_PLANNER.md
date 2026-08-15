# Feature Specification: Event Planner (Milestone 3C)

**Status:** Draft — Pending User Approval
**Phase:** 3 — Daily Companion
**Depends On:** Milestone 3A (DailyCompanion, PlannerPage tab structure), Milestone 3B (goal/tab pattern)
**ADR References:** ADR-0005 (static vs dynamic data), ADR-0008 (frontend subview navigation), ADR-0009 (lazy reset pattern)

---

## Overview

Genshin Impact events are time-limited game activities that award Primogems, Crowns of Insight, Ascension materials, and other valuable resources. They typically last 2–3 weeks and are tied to the current game patch (every ~6 weeks).

The Event Planner allows users to:

1. **See all active events** for the current patch with their time remaining
2. **Track which reward tiers they have claimed** across each event
3. **See a summary of total unclaimed Primogems** across all events at a glance

This feature lives in the `Platform Companion` domain as a third tab on `PlannerPage.tsx`.

---

## Decision 1 — Event Data Strategy: Curated Patch JSON File

**Problem:** Event data changes every 6 weeks with each Genshin patch. It is not available from any stable, structured public API. Building a full scraping pipeline or admin UI would be over-engineering for Phase 3.

**Options considered:**

| Option  | Description                                        | Verdict                                        |
| ------- | -------------------------------------------------- | ---------------------------------------------- |
| A       | Scrape/parse HoYoWiki or ambr.top at build time    | Over-engineered; brittle                       |
| B       | Admin UI to input events via the database          | Requires admin auth scaffolding not yet built  |
| **(C)** | **Curated JSON file per patch, committed to repo** | ✅ Chosen                                      |
| D       | External community event API (e.g., genshin-db)    | No reliable, structured events endpoint exists |

**Chosen approach (C): `apps/api/src/games/genshin/static/events.json`**

A single JSON file is manually maintained per patch update (approximately every 6 weeks). It is the same pattern used for `domain-schedule.json` in Milestone 3B. No database migration is needed when patch content changes — only the JSON file is updated. In Phase 4, when a full static-data pipeline exists, this file becomes the migration source.

**Patch cadence:** When a new patch drops, the developer updates `events.json` and deploys. This is a deliberate, pragmatic trade-off: correctness over automation for Phase 3.

### `events.json` Schema

```json
{
  "patch": "5.8",
  "patchStartUtc": "2026-08-06T06:00:00Z",
  "patchEndUtc": "2026-09-17T05:59:59Z",
  "events": [
    {
      "key": "WindsOfHarmony5.8",
      "name": "Winds of Harmony",
      "type": "combat",
      "startUtc": "2026-08-06T06:00:00Z",
      "endUtc": "2026-08-26T14:59:59Z",
      "description": "Complete combat challenges to earn rewards.",
      "wikiUrl": "https://genshin-impact.fandom.com/wiki/Winds_of_Harmony",
      "rewardTiers": [
        { "tierId": "t1", "label": "Stage 1 Complete", "primogems": 60, "other": [] },
        { "tierId": "t2", "label": "Stage 2 Complete", "primogems": 60, "other": [] },
        { "tierId": "t3", "label": "Stage 3 Complete", "primogems": 60, "other": [] },
        {
          "tierId": "t4",
          "label": "All Stages Complete",
          "primogems": 0,
          "other": ["CrownOfInsight"]
        }
      ]
    }
  ]
}
```

**Key field decisions:**

- `key` is a stable, unique string identifier composed of `eventName + patch`. This is the join key between the static file and the user progress table.
- `rewardTiers` is an ordered array. The UI renders them as a checklist. Each tier has its own claim state.
- `primogems` is broken out explicitly because it drives the "total unclaimed Primogems" summary widget — a high-value UX feature.
- `other` is a string array of GOOD-format item keys (e.g. `"CrownOfInsight"`, `"TeachingsOfBallad"`) to display alongside primogem counts. No quantity is tracked — these are informational only for Phase 3.
- `wikiUrl` is optional. The frontend renders a discrete external link if present.
- UTC timestamps are used throughout (consistent with the Asia server reset pattern established in ADR-0009).

---

## Decision 2 — Prisma Data Model: `EventProgress`

**Problem:** User progress (which reward tiers have been claimed) must persist across sessions and survive page refreshes. It is user-specific and ephemeral relative to game updates.

**Key design decision: track by tier, not by event**

Tracking progress at the **reward tier** level (rather than just "this event is done/not done") gives the user meaningful granularity. Many events have 4–6 reward tiers that unlock over multiple days as content releases. A binary per-event flag would be too coarse.

**Model:**

```prisma
/// Stores which reward tiers a user has claimed for a time-limited event.
/// One row per (user, eventKey, tierId) — the combination is unique.
/// eventKey and tierId reference the static events.json — NOT database FKs.
model EventProgress {
  id        String   @id @default(uuid())
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  eventKey  String  // matches events.json "key" field, e.g. "WindsOfHarmony5.8"
  tierId    String  // matches events.json rewardTiers[].tierId, e.g. "t1"
  claimed   Boolean @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, eventKey, tierId])
  @@map("event_progress")
}
```

**Why `claimed: Boolean` and not just a row-exists pattern?**

An explicit `claimed` boolean allows us to `upsert` idempotently rather than `create`-or-`delete`. This keeps the service layer clean — a single `PATCH` endpoint toggles the value, and the UI can be optimistically updated without worrying about race conditions on insert vs. delete.

**Why attach to `User` and not `GenshinAccount`?**

Events are account-agnostic planner state, identical to `UpgradeGoal` in Milestone 3B. They survive GOOD re-imports. This is consistent with the established pattern.

---

## Decision 3 — Backend APIs

All routes are mounted under `/api/v1/companion/events` (extending the existing companion router).

### Routes

| Method  | Path                                               | Description                                                                 |
| ------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| `GET`   | `/api/v1/companion/events`                         | Returns active events from the static JSON, merged with the user's progress |
| `PATCH` | `/api/v1/companion/events/:eventKey/tiers/:tierId` | Toggles (upserts) the `claimed` state for one reward tier                   |

### `GET /api/v1/companion/events` — Response Shape

The backend performs the merge of static data + user progress rows, returning a single hydrated response. The frontend never loads `events.json` directly.

```json
{
  "success": true,
  "data": {
    "patch": "5.8",
    "totalUnclaimedPrimogems": 240,
    "events": [
      {
        "key": "WindsOfHarmony5.8",
        "name": "Winds of Harmony",
        "type": "combat",
        "startUtc": "2026-08-06T06:00:00Z",
        "endUtc": "2026-08-26T14:59:59Z",
        "isActive": true,
        "isExpired": false,
        "hoursRemaining": 312,
        "description": "...",
        "wikiUrl": "...",
        "rewardTiers": [
          {
            "tierId": "t1",
            "label": "Stage 1 Complete",
            "primogems": 60,
            "other": [],
            "claimed": true
          },
          {
            "tierId": "t2",
            "label": "Stage 2 Complete",
            "primogems": 60,
            "other": [],
            "claimed": false
          }
        ],
        "claimedPrimogems": 60,
        "totalPrimogems": 180
      }
    ]
  },
  "message": "Events fetched."
}
```

**`totalUnclaimedPrimogems`** is computed server-side: the sum of `primogems` for all tiers where `claimed = false` across all non-expired events. This drives the summary chip shown at the top of the Events tab.

**`isActive` / `isExpired`** are computed from `startUtc`/`endUtc` relative to the current UTC time. Events that have not yet started are included in the response (shown as "Upcoming") but their reward tiers are non-interactive.

**`hoursRemaining`** is computed server-side for display. Negative values indicate the event has expired and will not be returned (expired events are filtered out of the response entirely — once gone, they're gone).

### `PATCH /api/v1/companion/events/:eventKey/tiers/:tierId` — Request / Response

```json
// Request body
{ "claimed": true }

// Response
{
  "success": true,
  "data": { "eventKey": "WindsOfHarmony5.8", "tierId": "t1", "claimed": true },
  "message": "Reward tier updated."
}
```

The endpoint validates that `eventKey` and `tierId` exist in the current `events.json`. If the event has expired or is unknown, it returns a `404 NotFoundError`. This prevents stale progress rows from being created for events no longer in the static file.

---

## Decision 4 — Frontend Integration: Third Tab ("Events")

**Options considered:**

| Option | Description                            | Verdict                                                            |
| ------ | -------------------------------------- | ------------------------------------------------------------------ |
| A      | Third tab "Events" on PlannerPage      | ✅ Chosen — clean separation                                       |
| B      | Countdown widget pinned to "Daily" tab | Mixes concerns; "Daily" tab is already well-scoped                 |
| C      | Separate `/events` page                | Over-engineered for Phase 3; tab pattern is established (ADR-0008) |

**Chosen approach (A):** Add a third "Events" tab to the existing `PlannerPage.tsx` tab switcher. The tab bar becomes: `[ Daily ] [ Farming Goals ] [ Events ]`.

### Events Tab Layout

```
┌──────────────────────────────────────────────────────┐
│  ✦ 240 Primogems unclaimed  ·  Patch 5.8             │  ← Summary chip
└──────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  Winds of Harmony                            Expires in 13 days │
│  ─────────────────────────────────────────────────────────────  │
│  ☑  Stage 1 Complete    60✦  (strikethrough if claimed)         │
│  ☐  Stage 2 Complete    60✦                                     │
│  ☐  Stage 3 Complete    60✦                                     │
│  ☐  All Stages Complete  ✦ + Crown of Insight                   │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  … (next event card)                                           │
└────────────────────────────────────────────────────────────────┘
```

**UX decisions:**

- Each **event card** is self-contained. Claimed tiers render with a strikethrough and reduced opacity (not removed from the list — users need to see what they've already done).
- Toggling a tier is an **optimistic update**: the UI flips the checkbox immediately, and rolls back on error.
- Events are sorted: **active first** (by `endUtc` ascending, so most-urgent is at top), then **upcoming**.
- An "Upcoming" badge is shown on events that have not yet started.
- **No expired events** are shown. They are filtered on the server.
- The Primogem count chip uses the `totalUnclaimedPrimogems` field from the API response.

### API Integration (Frontend)

New functions added to `apps/web/src/lib/api.ts`:

```typescript
export interface EventRewardTier {
  tierId:    string;
  label:     string;
  primogems: number;
  other:     string[];
  claimed:   boolean;
}

export interface GenshinEvent {
  key:             string;
  name:            string;
  type:            string;
  startUtc:        string;
  endUtc:          string;
  isActive:        boolean;
  isExpired:       boolean;
  hoursRemaining:  number;
  description:     string;
  wikiUrl?:        string;
  rewardTiers:     EventRewardTier[];
  claimedPrimogems:  number;
  totalPrimogems:  number;
}

export interface EventsResponse {
  patch:                   string;
  totalUnclaimedPrimogems: number;
  events:                  GenshinEvent[];
}

// GET /api/v1/companion/events
export async function fetchEvents(): Promise<EventsResponse> { ... }

// PATCH /api/v1/companion/events/:eventKey/tiers/:tierId
export async function patchEventTier(
  eventKey: string,
  tierId:   string,
  claimed:  boolean,
): Promise<{ eventKey: string; tierId: string; claimed: boolean }> { ... }
```

**TanStack Query keys:**

```typescript
const EVENTS_KEY = ['companion', 'events'] as const;
```

The optimistic update pattern follows the same approach as `patchChecklist` in Milestone 3A — cancel in-flight queries, snapshot previous data, update optimistically, roll back on error.

---

## Open Questions

> **OQ-1: Initial Seed Data**
>
> The implementation will include a realistic `events.json` seeded with a representative sample of Genshin 5.x patch events (based on publicly documented patch history). Should this seed data reflect the **current actual patch** (which would require research), or should it use **clearly-labelled placeholder events** that demonstrate the feature without claiming to be current?
>
> Recommendation: Use **clearly-labelled placeholder events** for Phase 3. This avoids hardcoding data that will be immediately stale and makes it obvious to the user that they should update `events.json` for their current patch.

> **OQ-2: Event Progress Stale Data Cleanup**
>
> After a patch update (when events are removed from `events.json`), stale `EventProgress` rows will remain in the database for keys that no longer exist. Two strategies:
>
> - **(A) Lazy — ignore stale rows** (they are simply never read since the event key no longer appears in the JSON). This is the simplest approach.
> - **(B) Active — on every `GET /events`, delete any `EventProgress` rows whose `eventKey` is not in the current JSON.**
>
> Recommendation: **Option A** for Phase 3. The rows are small, harmless, and cleanup can be a periodic maintenance task in Phase 8.

---

## Files Affected

### [NEW] Static Data

- `apps/api/src/games/genshin/static/events.json`

### [NEW] Backend — Event Module

- `apps/api/src/platform/companion/event.repository.ts`
- `apps/api/src/platform/companion/event.service.ts`
- `apps/api/src/platform/companion/event.controller.ts`
- `apps/api/src/platform/companion/event.service.test.ts`

### [MODIFY] Backend

- `apps/api/prisma/schema.prisma` — add `EventProgress` model + back-relation on `User`
- `apps/api/src/platform/companion/companion.routes.ts` — mount event routes

### [NEW] Frontend

- `apps/web/src/components/EventCard.tsx` — single event card with tier checklist

### [MODIFY] Frontend

- `apps/web/src/lib/api.ts` — `EventsResponse` types + `fetchEvents`, `patchEventTier`
- `apps/web/src/pages/PlannerPage.tsx` — add "Events" tab + EventsTab panel

---

## Verification Plan

### Automated Tests (`event.service.test.ts`)

- Returns correct `totalUnclaimedPrimogems` across multiple events
- Correctly marks events as `isActive` / upcoming based on UTC timestamps
- `patchEventTier` validates that eventKey and tierId exist in the static JSON
- `patchEventTier` throws `NotFoundError` for unknown eventKey
- `patchEventTier` throws `NotFoundError` for valid eventKey but unknown tierId
- Upsert is idempotent (calling PATCH twice with `claimed: true` is safe)

### Manual Verification

- Events tab renders correctly with the three-tab switcher
- Checking a tier box immediately updates the UI (optimistic update)
- The unclaimed Primogem summary chip updates in real time as tiers are checked
- Refreshing the page preserves claim state
- Events are sorted by urgency (earliest expiry first)
