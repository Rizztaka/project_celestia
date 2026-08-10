# Feature Specification: Genshin Inventory Browsing UI (Milestone 2E)

**Feature ID:** FEAT-006  
**Priority:** P0  
**Status:** Designing  
**Phase:** 2E — Weapon & Artifact Browsing UI  
**Last Updated:** 2026-08-10

---

## Feature Name

Genshin Impact Inventory — HTTP Read APIs & React Inventory Page (Weapons + Artifacts)

---

## Objective

Allow authenticated users to view their full Genshin weapon and artifact inventories
via a single unified **Inventory page** with tab-based navigation. This is the final
read-side implementation of Phase 2 (Genshin Foundation).

After 2E, the complete Phase 2 data cycle is:
- **Write:** Import page (2C)
- **Read (Characters):** Roster page (2D)
- **Read (Weapons + Artifacts):** Inventory page (2E) ← this milestone

---

## Codebase Research Findings

### Finding 1 — Both services already have `getWeapons(accountId)` and `getArtifacts(accountId)`

Both `GenshinWeaponService.getWeapons(accountId)` and
`GenshinArtifactService.getArtifacts(accountId)` exist. They delegate directly
to `repository.findByAccountId(accountId)`. No join is needed (weapons and
artifacts don't have nested relations we need to display). The existing repository
methods are sufficient. **No new repository methods are required.**

### Finding 2 — Same userId-to-account bridge problem as 2D

Identical to the character service problem from 2D: the controllers receive a
`userId` from the JWT, but `getWeapons()` and `getArtifacts()` expect an `accountId`.
We will apply the same approved pattern: add `getWeaponsForUser(userId)` and
`getArtifactsForUser(userId)` methods to their respective services. Both return `[]`
when no account exists — they never throw.

### Finding 3 — Artifacts can number in the hundreds

A typical Genshin player imports 200–1,000+ artifacts. A card grid identical to
the Roster page would be unusable at that scale. The Inventory page must use a
**compact list/table layout** for artifacts (not a wide card grid), while
weapons can use a medium-density card grid (they rarely exceed 50–100 items).

### Finding 4 — Single page, tab navigation (not sub-routes)

Using React Router sub-routes (e.g. `/inventory/weapons`, `/inventory/artifacts`)
would add routing boilerplate without a meaningful UX benefit. Since both datasets
are loaded independently and switching between them is instant (both fetch on mount),
in-component **React state tabs** (`"weapons" | "artifacts"`) are the right choice.
This keeps the component tree flat and avoids unnecessary URL fragmentation.

### Finding 5 — `subStats` is a Prisma `Json` field

The artifact `subStats` column is stored as `Json` in the database. Prisma returns
it as `unknown`. The frontend type must reflect this and safely render sub-stats
without crashing on malformed data.

---

## Backend Requirements

### New Service Methods

#### `GenshinWeaponService`

**File:** `apps/api/src/games/genshin/weapons/weapon.service.ts` [MODIFY]

```typescript
/**
 * Public read API for the HTTP layer (Milestone 2E).
 * Accepts a userId (from JWT). Returns [] if the user has no Genshin account.
 * Weapons are ordered by level descending.
 */
async getWeaponsForUser(userId: string): Promise<GenshinWeapon[]> {
  const account = await prisma.genshinAccount.findUnique({ where: { userId } });
  if (!account) return [];
  return this.weaponRepository.findByAccountId(account.id);
}
```

No new repository method is needed. `findByAccountId` is sufficient.
We do, however, add `orderBy: { level: "desc" }` to the existing
`weaponRepository.findByAccountId()` to match the same ordering convention
established for characters.

#### `GenshinArtifactService`

**File:** `apps/api/src/games/genshin/artifacts/artifact.service.ts` [MODIFY]

```typescript
/**
 * Public read API for the HTTP layer (Milestone 2E).
 * Accepts a userId (from JWT). Returns [] if the user has no Genshin account.
 * Artifacts are ordered by level descending, then rarity descending.
 */
async getArtifactsForUser(userId: string): Promise<GenshinArtifact[]> {
  const account = await prisma.genshinAccount.findUnique({ where: { userId } });
  if (!account) return [];
  return this.artifactRepository.findByAccountId(account.id);
}
```

We also add `orderBy: [{ level: "desc" }, { rarity: "desc" }]` to
`artifactRepository.findByAccountId()`.

---

### API Response Contracts

#### Weapons — `GET /api/v1/games/genshin/weapons`

**Auth:** Required (Bearer JWT)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "weapons": [
      {
        "id": "weapon-uuid",
        "weaponKey": "StaffOfHoma",
        "level": 90,
        "ascension": 6,
        "refinement": 1,
        "locked": true
      }
    ],
    "total": 1
  },
  "message": "Weapons retrieved successfully."
}
```

**Empty inventory response (200):**
```json
{
  "success": true,
  "data": { "weapons": [], "total": 0 },
  "message": "Weapons retrieved successfully."
}
```

---

#### Artifacts — `GET /api/v1/games/genshin/artifacts`

**Auth:** Required (Bearer JWT)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "artifacts": [
      {
        "id": "artifact-uuid",
        "setKey": "ShimenawasReminiscence",
        "slotKey": "goblet",
        "level": 20,
        "rarity": 5,
        "mainStatKey": "pyro_dmg_",
        "subStats": [
          { "key": "critRate_", "value": 3.9 },
          { "key": "critDMG_", "value": 13.2 },
          { "key": "atk", "value": 35 },
          { "key": "atk_", "value": 5.8 }
        ],
        "locked": false
      }
    ],
    "total": 1
  },
  "message": "Artifacts retrieved successfully."
}
```

---

### Controllers

#### `GenshinWeaponController`

**File:** `apps/api/src/games/genshin/weapons/weapon.controller.ts` [NEW]

```typescript
listWeapons = async (req: Request, res: Response) => {
  const weapons = await this.weaponService.getWeaponsForUser(req.user!.id);
  res.status(200).json(
    successResponse({ weapons, total: weapons.length }, "Weapons retrieved successfully.")
  );
};
```

#### `GenshinArtifactController`

**File:** `apps/api/src/games/genshin/artifacts/artifact.controller.ts` [NEW]

```typescript
listArtifacts = async (req: Request, res: Response) => {
  const artifacts = await this.artifactService.getArtifactsForUser(req.user!.id);
  res.status(200).json(
    successResponse({ artifacts, total: artifacts.length }, "Artifacts retrieved successfully.")
  );
};
```

Both follow the same pattern: one line in, one line out. No try/catch, no
validation logic.

---

### Routes

#### `weapon.routes.ts`

**File:** `apps/api/src/games/genshin/weapons/weapon.routes.ts` [NEW]

```typescript
router.get("/weapons", requireAuth, weaponController.listWeapons);
```

Full path: `GET /api/v1/games/genshin/weapons`

#### `artifact.routes.ts`

**File:** `apps/api/src/games/genshin/artifacts/artifact.routes.ts` [NEW]

```typescript
router.get("/artifacts", requireAuth, artifactController.listArtifacts);
```

Full path: `GET /api/v1/games/genshin/artifacts`

---

### Update Parent Aggregator

**File:** `apps/api/src/games/genshin/genshin.routes.ts` [MODIFY]

```typescript
router.use(importerRoutes);    // ✅ /import        (2C)
router.use(characterRoutes);   // ✅ /characters    (2D)
router.use(weaponRoutes);      // ✅ /weapons       (2E)
router.use(artifactRoutes);    // ✅ /artifacts     (2E)
```

No changes to `app.ts`.

---

## Frontend Requirements

### API Client Types & Functions

**File:** `apps/web/src/lib/api.ts` [MODIFY]

```typescript
// ============================================================
// Genshin Inventory Types & Functions (Milestone 2E)
// ============================================================

export interface InventoryWeapon {
  id: string;
  weaponKey: string;
  level: number;
  ascension: number;
  refinement: number;
  locked: boolean;
}

export interface ArtifactSubStat {
  key: string;
  value: number;
}

export interface InventoryArtifact {
  id: string;
  setKey: string;
  slotKey: string;
  level: number;
  rarity: number;
  mainStatKey: string;
  subStats: ArtifactSubStat[];
  locked: boolean;
}

export interface WeaponsResponse {
  weapons: InventoryWeapon[];
  total: number;
}

export interface ArtifactsResponse {
  artifacts: InventoryArtifact[];
  total: number;
}

export async function fetchGenshinWeapons(): Promise<WeaponsResponse> {
  return fetchApi<WeaponsResponse>("/games/genshin/weapons");
}

export async function fetchGenshinArtifacts(): Promise<ArtifactsResponse> {
  return fetchApi<ArtifactsResponse>("/games/genshin/artifacts");
}
```

---

### TanStack Query Hooks

Both queries use `queryKey: ["genshin", "weapons"]` and `["genshin", "artifacts"]`
respectively. The parent key `"genshin"` ensures that
`queryClient.invalidateQueries({ queryKey: ["genshin"] })` in `ImportPage` (which
we added in the 2D enhancement) will invalidate both the roster AND the inventory
simultaneously on re-import.

```typescript
// In InventoryPage.tsx:
const weaponsQuery = useQuery({
  queryKey: ["genshin", "weapons"],
  queryFn: fetchGenshinWeapons,
  retry: false,
});

const artifactsQuery = useQuery({
  queryKey: ["genshin", "artifacts"],
  queryFn: fetchGenshinArtifacts,
  retry: false,
});
```

Both queries **fire in parallel on mount**. Tab switching is therefore instant
with no loading delay after the initial render.

---

### New Page: `InventoryPage.tsx`

**File:** `apps/web/src/pages/InventoryPage.tsx` [NEW]

#### Tab Navigation (React State, Not Sub-Routes)

```typescript
const [activeTab, setActiveTab] = useState<"weapons" | "artifacts">("weapons");
```

The active tab is stored in component state. No URL change occurs on tab switch.

#### Page Structure

```
InventoryPage
 ├── Nav bar (glass-panel, identical to RosterPage)
 └── Main content (max-w-7xl, animate-fade-in)
      ├── Page heading ("Inventory" + summary counts, e.g. "47 weapons · 312 artifacts")
      ├── Tab bar (two tabs: "Weapons" | "Artifacts" — underline-style active indicator)
      └── Tab content panel
           ├── [weapons tab]
           │    ├── [loading] → 8 skeleton WeaponCards
           │    ├── [empty]   → EmptyState with /import CTA
           │    └── [data]    → 2-col / 3-col / 4-col WeaponCard grid
           └── [artifacts tab]
                ├── [loading] → 10 skeleton ArtifactRows
                ├── [empty]   → EmptyState with /import CTA
                └── [data]    → compact ArtifactList (rows, not cards)
```

---

#### `WeaponCard` Design

Weapons are relatively scarce (50–100 items). A medium-density card grid is appropriate.

```
┌──────────────────────────┐
│  [Icon circle: R1–R5     │  ← Refinement tier color ring
│   color ring]            │
│  Staff of Homa    R1     │  ← Formatted name + refinement badge
│  Lv.90 · A6             │  ← Level and ascension
│                          │
│  ⚔ [Equipped by]        │  ← "Equipped by Hu Tao" or dimmed "Unequipped"
└──────────────────────────┘
```

- Refinement color ring: R1: zinc, R2: indigo, R3: violet, R4: amber, R5: amber + glow
- Ascension displayed as `A0`–`A6`.
- "Equipped by" field: We have `equippedCharacterId` on the weapon from the DB.
  For Phase 2E, we do NOT attempt to resolve the character name (that requires a
  cross-reference that adds complexity). We display simply "Equipped" (green dot)
  or "Unequipped" (dimmed) based on whether `equippedCharacterId` is non-null.
  The full name resolution is a Phase 4 enhancement.
- `glass-panel hover-lift` card.

---

#### `ArtifactRow` Design

Artifacts can number in the hundreds. A compact row layout is critical for usability.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Slot Icon]  Shimenawa's Rem. · Goblet  ★5  +20  Pyro DMG%  │ CR 3.9  CD 13.2  ATK 35  ATK% 5.8 │ 🔒 │
└────────────────────────────────────────────────────────────────────────────┘
```

Layout (left to right):
1. **Slot icon** (SVG or initials badge for flower/plume/sands/goblet/circlet).
2. **Set name** (formatted PascalCase) + slot name.
3. **Rarity stars** (★ count colored gold/purple based on 5★/4★).
4. **Level** (`+20`, `+16`, etc.) colored by level tier (0–3: zinc, 4–8: zinc, 9–12: indigo, 13–16: violet, 17–20: amber).
5. **Main stat** (formatted key).
6. **Sub-stats** (up to 4, displayed as compact chips: `CR 3.9 · CD 13.2 · ATK 35 · ATK% 5.8`).
7. **Lock icon** (if `locked === true`).

Each row has a `glass-panel` background, subtle border, and `hover:bg-white/5` transition.
No hover-lift (too many rows, the motion would be visually noisy).

---

#### Stat Key Formatting Utility

GOOD format uses abbreviated stat keys (e.g. `"critRate_"`, `"atk_"`, `"eleMas"`).
A small lookup map converts them to short display labels for the artifact rows:

```typescript
const STAT_LABELS: Record<string, string> = {
  "hp":           "HP",
  "hp_":          "HP%",
  "atk":          "ATK",
  "atk_":         "ATK%",
  "def":          "DEF",
  "def_":         "DEF%",
  "eleMas":       "EM",
  "enerRech_":    "ER%",
  "critRate_":    "CR",
  "critDMG_":     "CD",
  "heal_":        "Heal%",
  "pyro_dmg_":    "Pyro%",
  "hydro_dmg_":   "Hydro%",
  "cryo_dmg_":    "Cryo%",
  "electro_dmg_": "Electro%",
  "anemo_dmg_":   "Anemo%",
  "geo_dmg_":     "Geo%",
  "dendro_dmg_":  "Dendro%",
  "physical_dmg_":"Phys%",
};

function formatStat(key: string): string {
  return STAT_LABELS[key] ?? key;
}
```

This is a complete and final lookup for all valid GOOD stat keys. No Phase 4
deferral needed here — the stat key vocabulary is finite and well-known.

---

#### Slot Icon / Label Map

```typescript
const SLOT_LABELS: Record<string, string> = {
  flower:  "Flower",
  plume:   "Plume",
  sands:   "Sands",
  goblet:  "Goblet",
  circlet: "Circlet",
};
```

Each slot gets a simple letter badge (F/P/S/G/C) in a colored square.

---

#### Empty State

Shared between both tabs — same component reused with different copy:

```
[Icon]
"No weapons in your inventory"
"Import your account to see your weapons here."
[Import Account button → /import]
```

---

### Route Registration

**File:** `apps/web/src/App.tsx` [MODIFY]

```tsx
<Route path="/inventory" element={<InventoryPage />} />   {/* protected */}
```

**File:** `apps/web/src/pages/DashboardPage.tsx` [MODIFY]

Activate the dimmed "Daily Planner" card placeholder — **no, this is the wrong card.**
Instead, we add a new **Inventory** card to the dashboard grid that links to `/inventory`.

> Currently the Dashboard has 3 cards: Import Account, Roster, Daily Planner (dimmed).
> We replace the "Daily Planner" placeholder with a live "Inventory" card for 2E.
> The Daily Planner card is re-added as a dimmed placeholder in Phase 3.
> This keeps the dashboard grid at 3 active + 1 dimmed structure.

---

## Open Questions (None — all resolved above)

1. ✅ **Single page vs sub-routes:** React state tabs. No URL fragmentation.
2. ✅ **Layout for artifacts:** Compact row list (not a card grid) — designed for scale.
3. ✅ **Equipped-by resolution for weapons:** `"Equipped" / "Unequipped"` binary only. Name resolution in Phase 4.
4. ✅ **Stat key formatting:** Complete `STAT_LABELS` lookup (finite vocabulary). No deferral needed.
5. ✅ **Parallel fetching:** Both queries fire on mount so tab switching is instant.
6. ✅ **Cache invalidation:** Uses `["genshin", "weapons"]` and `["genshin", "artifacts"]` keys — already invalidated by the `ImportPage` enhancement.

---

## New File Summary

### Backend (API)

| File | Type | Description |
|---|---|---|
| `weapons/weapon.service.ts` | MODIFY | Add `getWeaponsForUser(userId)` + `prisma` import |
| `artifacts/artifact.service.ts` | MODIFY | Add `getArtifactsForUser(userId)` + `prisma` import |
| `weapons/weapon.repository.ts` | MODIFY | Add `orderBy: { level: "desc" }` to `findByAccountId` |
| `artifacts/artifact.repository.ts` | MODIFY | Add `orderBy: [{ level: "desc" }, { rarity: "desc" }]` to `findByAccountId` |
| `weapons/weapon.controller.ts` | NEW | `GenshinWeaponController.listWeapons` |
| `artifacts/artifact.controller.ts` | NEW | `GenshinArtifactController.listArtifacts` |
| `weapons/weapon.routes.ts` | NEW | `GET /weapons` protected route |
| `artifacts/artifact.routes.ts` | NEW | `GET /artifacts` protected route |
| `genshin.routes.ts` | MODIFY | Mount `weaponRoutes` and `artifactRoutes` |

### Frontend (Web)

| File | Type | Description |
|---|---|---|
| `lib/api.ts` | MODIFY | Add `InventoryWeapon`, `InventoryArtifact`, `WeaponsResponse`, `ArtifactsResponse`, `fetchGenshinWeapons()`, `fetchGenshinArtifacts()` |
| `pages/InventoryPage.tsx` | NEW | Tabbed inventory page with `WeaponCard` grid and `ArtifactRow` list |
| `App.tsx` | MODIFY | Add `/inventory` protected route |
| `pages/DashboardPage.tsx` | MODIFY | Replace Daily Planner placeholder with live Inventory card |

---

## Acceptance Criteria

- [ ] `GET /api/v1/games/genshin/weapons` returns 200 with weapon array for authenticated user with imported data
- [ ] `GET /api/v1/games/genshin/weapons` returns 200 with **empty array** for user who has never imported
- [ ] `GET /api/v1/games/genshin/artifacts` returns 200 with artifact array for authenticated user with imported data
- [ ] `GET /api/v1/games/genshin/artifacts` returns 200 with **empty array** for user who has never imported
- [ ] Both endpoints return 401 for unauthenticated requests
- [ ] Weapons are ordered by level descending
- [ ] Artifacts are ordered by level descending, then rarity descending
- [ ] `/inventory` page renders the Weapons tab by default
- [ ] Tab switching between Weapons and Artifacts is instant (no re-fetch)
- [ ] Both tabs show skeleton loading states while fetching
- [ ] Both tabs show an empty-state CTA linking to `/import` when inventory is empty
- [ ] `WeaponCard` displays: formatted name, level, ascension, refinement badge, equipped/unequipped status
- [ ] `ArtifactRow` displays: slot badge, set name, level, rarity, main stat, all sub-stats, lock icon
- [ ] Dashboard "Inventory" card links to `/inventory`
- [ ] `/inventory` is a protected route — unauthenticated users are redirected to `/login`
- [ ] Zero TypeScript errors on both `apps/api` and `apps/web`
- [ ] All existing 72 tests continue to pass

---

## Future Work (Out of Scope for 2E)

- Weapon "equipped by" character name resolution — Phase 4
- Artifact filtering and sorting controls (by set, slot, main stat) — Phase 3
- Character-to-artifact/weapon linking view (see a character's full build) — Phase 4
- Static weapon metadata (weapon type, rarity) — Phase 4
