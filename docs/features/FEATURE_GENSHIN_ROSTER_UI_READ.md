# Feature Specification: Genshin Roster Browsing UI (Milestone 2D)

**Feature ID:** FEAT-005  
**Priority:** P0  
**Status:** Designing  
**Phase:** 2D — Roster Browsing UI  
**Last Updated:** 2026-08-07

---

## Feature Name

Genshin Impact Roster — HTTP Read API & React Roster Page

---

## Objective

Allow authenticated users to view all characters currently in their Genshin account
roster, along with each character's progression stats and equipped weapon.

This milestone completes the Phase 2 data loop. After 2D:
- The user can **write** their data via the Import page (2C).
- The user can **read** their data via the Roster page (2D).

---

## Codebase Research Findings

> The following were discovered during pre-planning research and directly shape
> the implementation decisions below.

### Finding 1 — `getCharacters()` exists but lacks the weapon join

`GenshinCharacterService.getCharacters(accountId)` already exists (line 64 of
`character.service.ts`). However, it delegates to
`characterRepository.findByAccountId()`, which is a plain `findMany({ where: { accountId }})`.
It does **not** include the `equippedWeapon` relation. We need a new repository
method and a new service method to support the joined query.

### Finding 2 — No `userId`-to-account bridge in the character service

The controller will receive `req.user!.id` (a `userId`) from the JWT. The character
service expects an `accountId`. There is currently no method that accepts a `userId`
and returns the character roster in one call.

The controller could chain calls:
```
accountService.getAccountByUserId(userId) → accountId
characterService.getCharactersWithWeapon(accountId) → characters[]
```

But `accountService.getAccountByUserId()` throws `NotFoundError` if the user
has no account yet. A user who registered but never imported would get a 404 —
which is incorrect. An empty roster is a valid, expected state.

**Approved approach:** Add a single `getCharactersForUser(userId)` method to
`GenshinCharacterService` that:
1. Looks up the account via `prisma.genshinAccount.findUnique({ where: { userId } })`.
2. **Returns an empty array (not an error) if no account exists.** An unimported
   user has a valid empty roster.
3. If the account exists, calls the character repository with the weapon join.

This keeps the controller completely thin and handles the empty-state gracefully.

---

## Backend Requirements

### New Repository Method

**File:** `apps/api/src/games/genshin/characters/character.repository.ts` [MODIFY]

Add one method with a Prisma `include` to fetch characters alongside their weapon:

```typescript
async findByAccountIdWithWeapon(accountId: string) {
  return prisma.genshinCharacter.findMany({
    where:   { accountId },
    include: { equippedWeapon: true },
    orderBy: { level: 'desc' },  // highest level characters appear first
  });
}
```

The return type is inferred by Prisma as
`(GenshinCharacter & { equippedWeapon: GenshinWeapon | null })[]`.
Export this as a named type `CharacterWithWeapon` from the repository file.

---

### New Service Method

**File:** `apps/api/src/games/genshin/characters/character.service.ts` [MODIFY]

Add one method. The existing `getCharacters(accountId)` is left untouched —
it is used by other internal callers and tests.

```typescript
/**
 * Returns all characters for a user, joined with their equipped weapon.
 * Returns an empty array if the user has no Genshin account yet.
 * The controller calls this directly — it is the public read API.
 */
async getCharactersForUser(userId: string): Promise<CharacterWithWeapon[]> {
  const account = await prisma.genshinAccount.findUnique({ where: { userId } });
  if (!account) return [];  // Valid state: user registered but hasn't imported yet
  return this.characterRepository.findByAccountIdWithWeapon(account.id);
}
```

---

### API Response Contract

**Endpoint:** `GET /api/v1/games/genshin/characters`  
**Auth:** Required (Bearer JWT)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "characters": [
      {
        "id": "char-uuid",
        "characterKey": "HuTao",
        "level": 90,
        "ascension": 6,
        "constellation": 1,
        "talentNormal": 6,
        "talentSkill": 9,
        "talentBurst": 9,
        "equippedWeaponId": "weapon-uuid",
        "equippedWeapon": {
          "id": "weapon-uuid",
          "weaponKey": "StaffOfHoma",
          "level": 90,
          "refinement": 1
        }
      }
    ],
    "total": 1
  },
  "message": "Characters retrieved successfully."
}
```

**Empty roster response (200 — not 404):**
```json
{
  "success": true,
  "data": { "characters": [], "total": 0 },
  "message": "Characters retrieved successfully."
}
```

---

### Controller: `GenshinCharacterController`

**File:** `apps/api/src/games/genshin/characters/character.controller.ts` [NEW]

```typescript
listCharacters = async (req: Request, res: Response) => {
  const characters = await this.characterService.getCharactersForUser(req.user!.id);
  res.status(200).json(
    successResponse(
      { characters, total: characters.length },
      "Characters retrieved successfully."
    )
  );
};
```

No try/catch. No validation. Pure translation: `req.user.id` in, response out.

---

### Routes: `character.routes.ts`

**File:** `apps/api/src/games/genshin/characters/character.routes.ts` [NEW]

```typescript
router.get("/characters", requireAuth, characterController.listCharacters);
```

Full path: `GET /api/v1/games/genshin/characters`

---

### Update Parent Aggregator

**File:** `apps/api/src/games/genshin/genshin.routes.ts` [MODIFY]

```typescript
router.use(importerRoutes);    // ✅ /import
router.use(characterRoutes);   // ✅ /characters  ← ADD THIS
```

No changes to `app.ts` — the parent aggregator already handles this.

---

## Frontend Requirements

### API Client Types & Function

**File:** `apps/web/src/lib/api.ts` [MODIFY]

```typescript
export interface RosterWeapon {
  id: string;
  weaponKey: string;
  level: number;
  refinement: number;
}

export interface RosterCharacter {
  id: string;
  characterKey: string;
  level: number;
  ascension: number;
  constellation: number;
  talentNormal: number;
  talentSkill: number;
  talentBurst: number;
  equippedWeaponId: string | null;
  equippedWeapon: RosterWeapon | null;
}

export interface RosterResponse {
  characters: RosterCharacter[];
  total: number;
}

export async function fetchGenshinRoster(): Promise<RosterResponse> {
  return fetchApi<RosterResponse>("/games/genshin/characters");
}
```

---

### TanStack Query Hook

**File:** `apps/web/src/pages/RosterPage.tsx` (inline — consistent with LoginPage pattern)

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["genshin", "characters"],
  queryFn: fetchGenshinRoster,
  retry: false,
});
```

`queryKey: ["genshin", "characters"]` is scoped to future cache invalidation —
when a new import happens, this cache key can be explicitly invalidated so the
roster page refreshes automatically (Phase 2E enhancement, out of scope here).

---

### New Page: `RosterPage.tsx`

**File:** `apps/web/src/pages/RosterPage.tsx` [NEW]

#### Character Name Formatting Utility

The GOOD format uses PascalCase character keys (e.g. `"HuTao"`, `"RaidenShogun"`,
`"KaedeharaKazuha"`). A simple regex splits them into display names:

```typescript
// "HuTao"            → "Hu Tao"
// "RaidenShogun"     → "Raiden Shogun"
// "KaedeharaKazuha"  → "Kaedhara Kazuha"
const formatCharacterName = (key: string): string =>
  key.replace(/([A-Z])/g, " $1").trim();
```

> **Note:** This is a best-effort formatter for Phase 2D. A proper static lookup
> table (key → canonical display name, element, rarity) is planned for Phase 4
> (Intelligence Core) when game data modeling is addressed.

---

#### UI States and Component Structure

```
RosterPage
 ├── Nav bar (identical to ImportPage — glass-panel, Project Celestia logo, sign out)
 └── Main content (max-w-6xl, animate-fade-in)
      ├── Page heading ("Your Roster" + character count badge)
      ├── [loading state]
      │    └── Skeleton grid — 6 pulsing placeholder cards (glass-panel, animate-pulse)
      ├── [empty state — characters.length === 0]
      │    └── Centered empty card with icon + CTA button → /import
      ├── [error state]
      │    └── Error banner (matches ImportPage error style)
      └── [populated state]
           └── Responsive grid (1 col → 2 col → 3 col → 4 col at xl)
                └── CharacterCard (one per character)
```

#### `CharacterCard` Design

Each card is a `glass-panel hover-lift` tile. Layout:

```
┌─────────────────────────────┐
│  [Avatar placeholder circle]│  ← Colored ring based on constellation count
│  Hu Tao              ★ C1  │  ← Display name + constellation badge
│  Lv.90 · A6                │  ← Level and ascension
├─────────────────────────────┤
│  TALENTS           N  S  B  │
│                    6  9  9  │  ← Three talent columns
├─────────────────────────────┤
│  ⚔ Staff of Homa  R1 · 90  │  ← Weapon chip (if equipped), or "No weapon" dimmed
└─────────────────────────────┘
```

- **Avatar placeholder:** A circle with the character's initials (e.g. "HT" for
  Hu Tao), colored by constellation tier (0: zinc, 1–2: indigo, 3–4: violet,
  5–6: amber with a glow ring).
- **Constellation badge:** Small pill `C0`–`C6`. C6 gets `text-amber-400`.
- **Talent section:** Three columns (N/S/B) with the numeric level. Levels ≥ 10
  get `text-accent-400` to highlight maxed talents.
- **Weapon chip:** If `equippedWeapon !== null`, shows the formatted weapon name,
  refinement (R1–R5), and level. If null, shows a dimmed "No weapon equipped" row.
- **Skeleton:** The loading state renders 6 cards identical in size to real cards
  but with all content replaced by `animate-pulse bg-white/5 rounded` blocks.

---

### Route Registration

**File:** `apps/web/src/App.tsx` [MODIFY]

```tsx
<Route path="/roster" element={<RosterPage />} />   {/* protected */}
```

**File:** `apps/web/src/pages/DashboardPage.tsx` [MODIFY]

Replace the dimmed "Roster — Coming in Phase 2D" card with a real, clickable
card linking to `/roster`.

---

## Open Questions (None — all resolved above)

All architecture decisions were resolved during research:
1. ✅ **Empty state:** 200 with empty array, not 404.
2. ✅ **Character names:** PascalCase regex for 2D; static lookup table deferred to Phase 4.
3. ✅ **Scope:** Characters only for 2D. Weapon and artifact browsing pages are 2E.
4. ✅ **Weapons in roster response:** Included as a nested join on each character card. No separate weapon list endpoint needed for this page.

---

## New File Summary

### Backend (API)

| File | Type | Description |
|---|---|---|
| `characters/character.repository.ts` | MODIFY | Add `findByAccountIdWithWeapon()` with Prisma `include` |
| `characters/character.service.ts` | MODIFY | Add `getCharactersForUser(userId)` with empty-state handling |
| `characters/character.controller.ts` | NEW | `listCharacters` handler |
| `characters/character.routes.ts` | NEW | `GET /characters` protected route |
| `games/genshin/genshin.routes.ts` | MODIFY | Mount `characterRoutes` |

### Frontend (Web)

| File | Type | Description |
|---|---|---|
| `lib/api.ts` | MODIFY | Add `RosterCharacter`, `RosterWeapon`, `RosterResponse`, `fetchGenshinRoster()` |
| `pages/RosterPage.tsx` | NEW | Roster page with `CharacterCard`, skeleton, empty state |
| `App.tsx` | MODIFY | Add `/roster` protected route |
| `pages/DashboardPage.tsx` | MODIFY | Activate the Roster card link |

---

## Acceptance Criteria

- [ ] `GET /api/v1/games/genshin/characters` returns 200 with character array for an authenticated user with imported data
- [ ] `GET /api/v1/games/genshin/characters` returns 200 with an **empty array** for a user who has never imported (no crash, no 404)
- [ ] `GET /api/v1/games/genshin/characters` returns 401 for unauthenticated requests
- [ ] Each character in the response includes its `equippedWeapon` object (or `null`)
- [ ] Characters are ordered by level descending (highest level first)
- [ ] `/roster` page shows a skeleton loading state while fetching
- [ ] `/roster` page shows an empty-state CTA with a link to `/import` when roster is empty
- [ ] `/roster` page renders a `CharacterCard` grid using `glass-panel` and `hover-lift`
- [ ] Each card displays: formatted name, level, ascension, constellation, all three talent levels, equipped weapon (or "No weapon equipped")
- [ ] `/roster` is a protected route — unauthenticated users are redirected to `/login`
- [ ] Dashboard "Roster" card links to `/roster`
- [ ] Zero TypeScript errors on both `apps/api` and `apps/web`
- [ ] All existing 72 tests continue to pass

---

## Future Work (Out of Scope for 2D)

- Weapon inventory page: `GET /api/v1/games/genshin/weapons` + `WeaponsPage.tsx` — Phase 2E
- Artifact inventory page: `GET /api/v1/games/genshin/artifacts` + `ArtifactsPage.tsx` — Phase 2E
- Static character metadata lookup (element, rarity, proper display names) — Phase 4
- Cache invalidation on import (invalidate `["genshin", "characters"]` after a successful import) — Phase 2E
