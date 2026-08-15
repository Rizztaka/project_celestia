# Feature Specification: Daily Companion (Milestone 3A)

**Feature ID:** FEAT-007  
**Priority:** P0  
**Status:** Designing  
**Phase:** 3A — Daily Dashboard & Resin Planner  
**Last Updated:** 2026-08-11

---

## Feature Name

Daily Companion — Resin Tracker & Daily Checklist

---

## Objective

Allow authenticated users to track their Original Resin (the stamina currency in
Genshin Impact) and their daily activity checklist. This is the foundational feature
of Phase 3 and the first feature in the project that mutates game-state data rather
than just importing it from an external scanner.

After 3A:

- The user can **set their current resin** and the system will mathematically
  compute how much they currently have, updating in real time in the browser.
- The user can **check off daily tasks** (Commissions, Teapot, Parametric Transformer).

---

## Codebase Research Findings

### Finding 1 — Companion data belongs on the platform, not in the Genshin domain

The `apps/api/src/games/genshin` domain houses data that comes from the GOOD export.
Resin and daily checklist items are **user-specific, time-sensitive UI state**, not
imported game data. They belong in a new `/companion` module that lives alongside
`/platform` and `/games/genshin` in the API source tree.

Routes will be mounted at `v1Router.use("/companion", companionRoutes)` in `app.ts`,
not inside `genshin.routes.ts`.

### Finding 2 — Resin regeneration is fully computable from two fields

Genshin's resin rules:

- Max cap: **200 resin**.
- Regeneration rate: **1 resin every 8 minutes** (= 480 seconds).
- Resin does NOT regenerate beyond the cap.

To avoid a polling-heavy backend, we use the "timestamp + stored value" pattern:

1. The backend stores `resinAmount` (integer, 0–200) and `resinUpdatedAt` (UTC DateTime).
2. On every `GET`, the backend returns both raw fields. The **frontend** computes
   the effective current amount by projecting forward from `resinUpdatedAt`.
3. On every `PATCH` (user manually updates resin), the backend stores the new amount
   **and** refreshes `resinUpdatedAt` to `now()`.

This means the database is never stale — it just stores the "last known checkpoint".
No cron job or background worker is needed.

### Finding 3 — Daily reset is server-side UTC midnight

Genshin's daily reset occurs at **04:00 UTC** (server time varies by region, but
the most common is Asia server at UTC+8/05:00 which maps to UTC midnight in practice;
we will use **05:00 UTC** as the daily reset time for Asia server, which is the most
common server). The daily checklist flags (`commissionsDone`, `teapotClaimed`,
`transformerClaimed`) must be reset at each daily reset boundary.

**Decision for 3A:** The backend will NOT automatically reset checklist flags on a
cron/timer. Instead, the `GET /companion/daily` endpoint will detect whether
`dailyResetAt` (the DateTime of the last reset applied to this record) is before
the most recent 20:00 UTC boundary (04:00 Asia/Shanghai = 04:00 UTC+8). If yes, it
will reset the flags **at read time** (lazy reset) before returning the response and
persist the reset to the database.

This avoids building a background job scheduler for Phase 3A. A dedicated cron or
database-level reset can be added in a future phase.

### Finding 4 — Module structure follows the existing `platform` pattern

The existing `platform/users/` module has: `user.repository.ts`, `user.service.ts`,
`user.controller.ts`, `user.routes.ts`. We will replicate this flat structure under
`platform/companion/`.

The Companion feature is a **platform concern** (it is per-user, not per-Genshin-account)
and will live at `apps/api/src/platform/companion/`.

---

## Database Schema

### New Prisma Model: `DailyCompanion`

**File:** `apps/api/prisma/schema.prisma` [MODIFY]

```prisma
/// Stores a user's daily companion state: resin tracking and daily checklist.
/// One-to-one with User. Created lazily on first GET request (upsert).
///
/// Resin is tracked as a checkpoint: the stored amount + the time it was set.
/// The effective current amount is projected forward in the frontend using
/// the regeneration rate (1 per 8 minutes, cap 200).
///
/// Daily checklist flags are reset lazily when the daily reset boundary
/// (05:00 UTC) is detected to have passed since the last reset.
model DailyCompanion {
  id     String @id @default(uuid())
  userId String @unique

  // Resin tracking — checkpoint model
  resinAmount    Int      @default(0)   // 0–200, the amount at resinUpdatedAt
  resinUpdatedAt DateTime @default(now()) // when resinAmount was last set

  // Daily checklist
  commissionsDone   Boolean  @default(false)
  teapotClaimed     Boolean  @default(false)
  transformerClaimed Boolean @default(false)

  // Reset tracking — the DateTime of the last daily reset applied to this record
  dailyResetAt DateTime @default(now())

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("daily_companion")
}
```

Additionally, add the back-relation to the `User` model:

```prisma
dailyCompanion DailyCompanion?
```

---

## Backend Requirements

### Module: `apps/api/src/platform/companion/`

All files in a flat structure mirroring the `users/` module:

```
apps/api/src/platform/companion/
  companion.repository.ts
  companion.service.ts
  companion.controller.ts
  companion.routes.ts
```

---

### Repository: `companion.repository.ts`

Two methods only:

```typescript
// Returns the record, or null if the user has no companion data yet.
async findByUserId(userId: string): Promise<DailyCompanion | null>

// Creates or fully replaces the companion record for the given user.
async upsert(userId: string, data: Prisma.DailyCompanionUpdateInput): Promise<DailyCompanion>
```

The `upsert` Prisma method is appropriate here — it handles both the first-time
creation (user never opened the planner) and all subsequent updates in one atomic
operation, eliminating a create/update conditional in the service.

---

### Service: `companion.service.ts`

#### `getDailyState(userId: string): Promise<DailyCompanion>`

1. Calls `repository.upsert` with default values to ensure the record exists (idempotent).
2. Checks whether a daily reset is due (see logic below).
3. Returns the final state.

**Daily Reset Logic (lazy):**

```typescript
function getLastResetBoundary(): Date {
  // Asia server daily reset: 04:00 AM UTC+8 = 20:00 UTC previous day.
  const now = new Date();
  const resetHour = 20; // UTC
  const boundary = new Date(now);
  boundary.setUTCHours(resetHour, 0, 0, 0);
  // If current time is before today's 20:00 UTC, the last boundary was yesterday's
  if (now < boundary) {
    boundary.setUTCDate(boundary.getUTCDate() - 1);
  }
  return boundary;
}
```

If `companion.dailyResetAt < getLastResetBoundary()`, the service calls `upsert` to
reset all checklist flags to `false` and sets `dailyResetAt = now()` before returning.

#### `updateResin(userId: string, amount: number): Promise<DailyCompanion>`

1. Validates `amount` is an integer in [0, 200]. Throws `ValidationError` if not.
2. Calls `repository.upsert` with `{ resinAmount: amount, resinUpdatedAt: new Date() }`.
3. Returns the updated record.

#### `updateChecklist(userId: string, input: UpdateChecklistInput): Promise<DailyCompanion>`

1. Accepts a partial object `{ commissionsDone?, teapotClaimed?, transformerClaimed? }`.
2. Validates that at least one field is present. Throws `ValidationError` if empty.
3. Calls `repository.upsert` with the partial update.
4. Returns the updated record.

```typescript
interface UpdateChecklistInput {
  commissionsDone?: boolean;
  teapotClaimed?: boolean;
  transformerClaimed?: boolean;
}
```

---

### API Response Contract

All three endpoints return the same response shape — the full `DailyCompanion` record:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "resinAmount": 120,
    "resinUpdatedAt": "2026-08-11T14:23:00.000Z",
    "commissionsDone": false,
    "teapotClaimed": true,
    "transformerClaimed": false,
    "dailyResetAt": "2026-08-11T05:00:00.000Z"
  },
  "message": "Daily state retrieved successfully."
}
```

The frontend derives `currentResin` itself — the backend only sends the checkpoint.

---

### Controller: `companion.controller.ts`

Three methods:

```typescript
// GET /companion/daily
getDaily = async (req: Request, res: Response) => {
  const state = await this.companionService.getDailyState(req.user!.id);
  res.status(200).json(successResponse(state, 'Daily state retrieved successfully.'));
};

// PATCH /companion/resin
updateResin = async (req: Request, res: Response) => {
  const { amount } = req.body; // validated by Zod schema (see below)
  const state = await this.companionService.updateResin(req.user!.id, amount);
  res.status(200).json(successResponse(state, 'Resin updated successfully.'));
};

// PATCH /companion/checklist
updateChecklist = async (req: Request, res: Response) => {
  const state = await this.companionService.updateChecklist(req.user!.id, req.body);
  res.status(200).json(successResponse(state, 'Checklist updated successfully.'));
};
```

**Zod Schemas (service-level, per ADR 0007):**

```typescript
const UpdateResinSchema = z.object({
  amount: z.number().int().min(0).max(200),
});

const UpdateChecklistSchema = z
  .object({
    commissionsDone: z.boolean().optional(),
    teapotClaimed: z.boolean().optional(),
    transformerClaimed: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one checklist field must be provided.',
  });
```

---

### Routes: `companion.routes.ts`

```typescript
router.get('/daily', requireAuth, companionController.getDaily);
router.patch('/resin', requireAuth, companionController.updateResin);
router.patch('/checklist', requireAuth, companionController.updateChecklist);
```

Full paths:

- `GET    /api/v1/companion/daily`
- `PATCH  /api/v1/companion/resin`
- `PATCH  /api/v1/companion/checklist`

---

### Update `app.ts`

```typescript
// Companion routes (Phase 3)
v1Router.use('/companion', companionRoutes);
```

---

## Frontend Requirements

### Resin Computation Utility

**File:** `apps/web/src/lib/resin.ts` [NEW]

This is the most critical frontend utility of this milestone. It computes the
**effective current resin** from a backend checkpoint, without polling the server.

```typescript
const MAX_RESIN = 200;
const REGEN_SECONDS = 8 * 60; // 1 resin every 480 seconds

/**
 * Computes effective current resin from a stored checkpoint.
 * @param storedAmount  The resin value at the time of the last PATCH.
 * @param updatedAt     The ISO timestamp of the last PATCH (from backend).
 * @returns             The effective current resin, capped at MAX_RESIN.
 */
export function computeCurrentResin(storedAmount: number, updatedAt: string): number {
  const elapsedSeconds = (Date.now() - new Date(updatedAt).getTime()) / 1000;
  const regenerated = Math.floor(elapsedSeconds / REGEN_SECONDS);
  return Math.min(storedAmount + regenerated, MAX_RESIN);
}

/**
 * Computes seconds until the next resin tick.
 * Useful for a countdown timer in the UI.
 */
export function secondsUntilNextResin(storedAmount: number, updatedAt: string): number {
  if (computeCurrentResin(storedAmount, updatedAt) >= MAX_RESIN) return 0;
  const elapsedSeconds = (Date.now() - new Date(updatedAt).getTime()) / 1000;
  return REGEN_SECONDS - (elapsedSeconds % REGEN_SECONDS);
}

/**
 * Computes the ISO timestamp when resin will be full.
 * Returns null if resin is already full.
 */
export function resinFullAt(storedAmount: number, updatedAt: string): Date | null {
  const current = computeCurrentResin(storedAmount, updatedAt);
  if (current >= MAX_RESIN) return null;
  const remaining = MAX_RESIN - current;
  const elapsedSeconds = (Date.now() - new Date(updatedAt).getTime()) / 1000;
  const secondsToFull = remaining * REGEN_SECONDS - (elapsedSeconds % REGEN_SECONDS);
  return new Date(Date.now() + secondsToFull * 1000);
}
```

---

### API Client Types & Functions

**File:** `apps/web/src/lib/api.ts` [MODIFY]

```typescript
// ============================================================
// Daily Companion Types & Functions (Milestone 3A)
// ============================================================

export interface DailyState {
  id: string;
  userId: string;
  resinAmount: number;
  resinUpdatedAt: string; // ISO string
  commissionsDone: boolean;
  teapotClaimed: boolean;
  transformerClaimed: boolean;
  dailyResetAt: string; // ISO string
}

export async function fetchDailyState(): Promise<DailyState> {
  return fetchApi<DailyState>('/companion/daily');
}

export async function updateResin(amount: number): Promise<DailyState> {
  return fetchApi<DailyState>('/companion/resin', {
    method: 'PATCH',
    body: JSON.stringify({ amount }),
  });
}

export async function updateChecklist(
  input: Partial<Pick<DailyState, 'commissionsDone' | 'teapotClaimed' | 'transformerClaimed'>>,
): Promise<DailyState> {
  return fetchApi<DailyState>('/companion/checklist', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
```

---

### New Page: `PlannerPage.tsx`

**File:** `apps/web/src/pages/PlannerPage.tsx` [NEW]

#### Page Structure

```
PlannerPage
 ├── Nav bar (glass-panel, identical to RosterPage)
 └── Main content (max-w-5xl, animate-fade-in)
      ├── Page heading ("Daily Planner" + reset countdown)
      ├── ResinTracker (left column, ~60% width)
      │    ├── Circular SVG progress arc (0–200)
      │    ├── Current resin (large number, live ticking)
      │    ├── "Full in X:XX:XX" countdown (or "FULL" badge)
      │    ├── Manual input: "Update Resin" number field + button
      │    └── Resin cap warning (amber glow at 180+)
      └── DailyChecklist (right column, ~40% width)
           ├── Commissions (4/4)  [checkbox]
           ├── Teapot Currency    [checkbox]
           └── Parametric Transformer [checkbox]
```

#### Resin Progress Arc Design

An SVG circle using `stroke-dasharray` and `stroke-dashoffset` to render a
smooth arc from 0° to 360° representing 0–200 resin. Colors:

- 0–159: `stroke: #6366f1` (accent indigo)
- 160–179: `stroke: #f59e0b` (amber, approaching cap)
- 180–199: `stroke: #ef4444` (danger red, near cap)
- 200: `stroke: #34d399` (emerald, full — pulse animation)

The displayed number inside the circle (`currentResin`) is recomputed every
second using a `useInterval` hook driven by `setInterval`. This creates the
"live ticking" effect without any server polling.

#### Live Resin Countdown

Below the circle:

- While below cap: `"Full in 14h 32m"` — computed from `resinFullAt()`.
  Format: `Xh Ym` (hours + minutes, no seconds — too noisy for a "full" estimate).
- At cap (200): an emerald pulsing badge `"● FULL"`.

#### Manual Resin Update

A small form:

- Number input: `type="number"` with `min=0`, `max=200`, step=1.
- Pre-filled with `computeCurrentResin(...)` so the user adjusts from the
  correct value.
- Submit → calls `updateResin(amount)` mutation → invalidates `["companion", "daily"]`
  query → UI updates.

#### Daily Checklist

Three toggle rows (not checkboxes — they use a custom toggle switch for premium feel):

```
┌────────────────────────────────────┐
│  ✓  Daily Commissions     [toggle] │  green on check
│  ✓  Teapot Currency       [toggle] │
│     Parametric Transformer [toggle] │  gray when unchecked
└────────────────────────────────────┘
```

- Each toggle calls `updateChecklist({ field: newValue })` optimistically.
- Optimistic update: flip the local state immediately, then sync with server response.
- The "Commissions" row shows a sub-label `"4 / 4 done"` (hard-coded for Phase 3A;
  individual commission tracking is Phase 3B).

---

### Route Registration

**File:** `apps/web/src/App.tsx` [MODIFY]

```tsx
<Route path="/planner" element={<PlannerPage />} />   {/* protected */}
```

**File:** `apps/web/src/pages/DashboardPage.tsx` [MODIFY]

Activate the dimmed Daily Planner card linking to `/planner` (emerald theme).

---

## Open Questions (None — all resolved above)

1. ✅ **Where does companion data live?** Platform module, not inside the Genshin domain.
2. ✅ **How is resin "live"?** Frontend projection from a backend checkpoint via `resin.ts` utility — no polling.
3. ✅ **Daily reset implementation?** Lazy reset at read time in the service — no background cron for Phase 3A.
4. ✅ **Reset time?** 20:00 UTC (04:00 Asia/Shanghai = 04:00 UTC+8 — user confirmed Asia server).
5. ✅ **Upsert vs create/update?** Single Prisma `upsert` in the repository — eliminates conditional logic in the service.

---

## New File Summary

### Backend (API)

| File                                         | Type   | Description                                                       |
| -------------------------------------------- | ------ | ----------------------------------------------------------------- |
| `prisma/schema.prisma`                       | MODIFY | Add `DailyCompanion` model + back-relation on `User`              |
| `prisma/migrations/`                         | NEW    | Auto-generated migration from `prisma migrate dev`                |
| `platform/companion/companion.repository.ts` | NEW    | `findByUserId` + `upsert`                                         |
| `platform/companion/companion.service.ts`    | NEW    | `getDailyState`, `updateResin`, `updateChecklist` with lazy reset |
| `platform/companion/companion.controller.ts` | NEW    | `getDaily`, `updateResin`, `updateChecklist` handlers             |
| `platform/companion/companion.routes.ts`     | NEW    | Three protected routes                                            |
| `app.ts`                                     | MODIFY | Mount `companionRoutes` at `/companion`                           |

### Frontend (Web)

| File                      | Type   | Description                                                           |
| ------------------------- | ------ | --------------------------------------------------------------------- |
| `lib/resin.ts`            | NEW    | `computeCurrentResin`, `secondsUntilNextResin`, `resinFullAt`         |
| `lib/api.ts`              | MODIFY | Add `DailyState`, `fetchDailyState`, `updateResin`, `updateChecklist` |
| `pages/PlannerPage.tsx`   | NEW    | Full planner page with SVG resin arc, live countdown, checklist       |
| `App.tsx`                 | MODIFY | Add `/planner` protected route                                        |
| `pages/DashboardPage.tsx` | MODIFY | Activate Daily Planner card                                           |

---

## Acceptance Criteria

- [ ] `GET /api/v1/companion/daily` returns a `DailyCompanion` record for authenticated user (creates one on first request)
- [ ] `PATCH /api/v1/companion/resin` updates `resinAmount` and `resinUpdatedAt`; rejects values outside [0, 200]
- [ ] `PATCH /api/v1/companion/checklist` updates one or more boolean flags; rejects empty body
- [ ] Daily checklist flags are automatically reset (lazily) when `dailyResetAt` is before the last 05:00 UTC boundary
- [ ] All three endpoints return 401 for unauthenticated requests
- [ ] `/planner` page renders a live SVG resin arc that ticks every second without server polling
- [ ] The resin display shows color changes (indigo → amber → red → emerald at full)
- [ ] "Full in X" countdown updates every second; shows pulsing "FULL" badge when at 200
- [ ] Manual resin update form is pre-filled with the computed current value
- [ ] Checklist toggles update optimistically and sync with server
- [ ] `/planner` is a protected route — unauthenticated users are redirected to `/login`
- [ ] Dashboard "Daily Planner" card links to `/planner`
- [ ] Zero TypeScript errors on both `apps/api` and `apps/web`
- [ ] All existing 72 tests continue to pass

---

## Future Work (Out of Scope for 3A)

- Individual commission tracking (4 separate checkboxes) — Phase 3B
- Resin expenditure log (domain events) — Phase 3B
- Server-side reset cron job — Phase 3B
- Condensed Resin / Fragile Resin tracking — Phase 3B
- Farming planner (resin → domain drops) — Phase 3C
