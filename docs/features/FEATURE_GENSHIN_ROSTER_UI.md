# Feature Specification: Genshin Roster HTTP API & Import UI (Milestone 2C)

**Feature ID:** FEAT-004  
**Priority:** P0  
**Status:** Designing  
**Phase:** 2C — HTTP API Layer & Frontend Import UI  
**Last Updated:** 2026-08-07

---

## Feature Name

Genshin Impact Account Import — HTTP Controller & React UI

---

## Objective

Expose the `GenshinImportService` (Milestone 2B) through a secured REST endpoint,
and build the frontend Import Page where a user can paste their GOOD-format JSON
export and submit it to be saved into their account.

This milestone connects the backend domain logic to the user. After 2C is complete,
a user can open Project Celestia, navigate to the Import page, paste their GOOD
export, and see a confirmation of their imported roster.

---

## User Stories

- As a player, I want to paste my GOOD JSON export into a form and click a button
  to import my full Genshin roster.
- As a player, I want to see a clear success summary (how many characters, weapons,
  and artifacts were imported) so I know the import worked.
- As a player, I want to see a clear error message if my GOOD JSON is invalid,
  without losing what I pasted.
- As a developer, the import endpoint must reject unauthenticated requests.
  A user must never be able to import into another user's account.

---

## Backend Requirements

### Route Definition

```
POST /api/v1/games/genshin/import
Authorization: Bearer <JWT>         (required — enforced by requireAuth middleware)
Content-Type:  application/json
Body:          The raw GOOD payload object (the frontend JSON.parses the textarea
               content before sending, so Express receives a standard JSON object)
```

**Response on success (200):**

```json
{
  "success": true,
  "data": {
    "charactersImported": 12,
    "weaponsImported": 47,
    "artifactsImported": 183
  },
  "message": "Account imported successfully."
}
```

**Response on validation failure (400):**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid GOOD format: artifacts.0.slotKey — Invalid enum value."
  }
}
```

**Response on unauthenticated request (401):**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required."
  }
}
```

---

### Controller: `GenshinImportController`

**File:** `apps/api/src/games/genshin/importer/importer.controller.ts`

The controller follows the established pattern: thin, no business logic, only
HTTP boundary responsibilities (read from `req`, call service, write to `res`).

```typescript
// Pattern — follows the existing AuthController structure exactly
importGenshinAccount = async (req: Request, res: Response) => {
  // req.body is the GOOD payload object parsed by Express.
  // JSON.stringify re-serializes it to a string because importAccount()
  // is designed to accept a raw JSON string (self-contained validation).
  // This is a known double-serialization; it is acceptable because imports
  // are infrequent user-triggered events, not a hot API path.
  const rawJson = JSON.stringify(req.body);
  const result = await this.importService.importAccount(req.user!.id, rawJson);
  res.status(200).json(successResponse(result, 'Account imported successfully.'));
};
```

**Why no try/catch?** Express 5 propagates rejected promises from async route
handlers to the global error handler in `app.ts` automatically. The global handler
already catches `AppError` (which `BadRequestError` extends) and maps it to the
correct HTTP status code.

---

### Routes: `genshin.routes.ts` (Parent Aggregator)

**File:** `apps/api/src/games/genshin/genshin.routes.ts` [NEW]

This is the parent router for the entire Genshin bounded context. It is mounted
once in `app.ts` at `/api/v1/games/genshin` and aggregates all Genshin
sub-domain routers as they are added in future milestones.

Approved decision (per ADR 0001 Modular Monolith): each sub-domain gets its own
`*.routes.ts` file. The parent aggregator imports and mounts them all. This
prevents a single file from accumulating every Genshin route as the project grows.

```
genshin.routes.ts           ← mounted at /api/v1/games/genshin
  └── importer.routes.ts    → /import        (Milestone 2C)
  └── character.routes.ts   → /characters    (Milestone 2D, future)
  └── weapon.routes.ts      → /weapons       (Milestone 2D, future)
  └── artifact.routes.ts    → /artifacts     (Milestone 2D, future)
```

### Routes: `importer.routes.ts`

**File:** `apps/api/src/games/genshin/importer/importer.routes.ts` [NEW]

```typescript
router.post('/import', requireAuth, importController.importGenshinAccount);
```

---

### Mounting the Router in `app.ts`

**File:** `apps/api/src/app.ts` [MODIFY]

Add one line to the v1Router:

```typescript
v1Router.use('/games/genshin', genshinRoutes);
```

This means the full endpoint URL becomes `POST /api/v1/games/genshin/import`,
which is clean, extensible (future character/artifact CRUD routes all live under
`/games/genshin/`), and follows the modular structure from ARCHITECTURE.md.

---

## Frontend Requirements

### API Client Function

**File:** `apps/web/src/lib/api.ts` [MODIFY]

Add a typed function for the import endpoint. This follows the established pattern
of domain-specific functions wrapping `fetchApi`:

```typescript
export interface ImportResult {
  charactersImported: number;
  weaponsImported: number;
  artifactsImported: number;
}

export async function importGenshinAccount(
  goodPayload: unknown, // unknown because it comes from JSON.parse — typed by Zod on backend
): Promise<ImportResult> {
  return fetchApi<ImportResult>('/games/genshin/import', {
    method: 'POST',
    body: JSON.stringify(goodPayload),
  });
}
```

The frontend calls `JSON.parse(textareaValue)` before calling this function. If
the textarea content is not valid JSON, `JSON.parse()` throws and the UI catches
it to display an inline error — no network request is made.

---

### New Page: `ImportPage.tsx`

**File:** `apps/web/src/pages/ImportPage.tsx` [NEW]

**UI States and Component Structure:**

```
ImportPage
 ├── Nav bar (consistent with DashboardPage — Project Celestia logo + sign out)
 └── Main content area
      ├── [idle / error state]
      │    ├── Page heading ("Import Your Account")
      │    ├── Subtitle (instructions for getting GOOD export)
      │    ├── <textarea>  — large, monospace, for pasting GOOD JSON
      │    ├── [error banner] (shown only when mutation.isError or invalid JSON)
      │    └── <button>  "Import" / "Importing…" (disabled when isPending)
      └── [success state — shown after mutation.isSuccess]
           ├── Checkmark icon
           ├── "Import complete!" heading
           ├── Three stat cards:
           │    ├── Characters Imported: N
           │    ├── Weapons Imported: N
           │    └── Artifacts Imported: N
           └── "Import again" button (resets mutation back to idle)
```

**Key behavior rules:**

- The textarea value is preserved after errors. The user should not lose their
  pasted JSON just because the import failed.
- Clicking "Import" first calls `JSON.parse(value)` in the component. If that
  fails (not valid JSON), an inline error is set in local state — no network
  request is made.
- If `JSON.parse()` succeeds, `mutation.mutate(parsed)` is called.
- The success state replaces the form entirely (not a modal or toast). The user
  must explicitly click "Import again" to go back to the form.
- The "Import again" button calls `mutation.reset()` to return to idle state.

**TanStack Query mutation:**

```typescript
const mutation = useMutation({
  mutationFn: (goodPayload: unknown) => importGenshinAccount(goodPayload),
  // No onSuccess navigation — success state is shown inline on the same page
});
```

**Error message priority:**

1. Local JSON parse error (client-side, before network request)
2. `mutation.error instanceof ApiError ? mutation.error.message : null`
   (server-side: Bad Request from invalid GOOD format, 500 server error, etc.)

---

### Route Registration in `App.tsx`

**File:** `apps/web/src/App.tsx` [MODIFY]

Add `/import` as a protected route:

```tsx
<Route element={<ProtectedRoute />}>
  <Route path="/" element={<DashboardPage />} />
  <Route path="/profile" element={<ProfilePage />} />
  <Route path="/import" element={<ImportPage />} /> {/* NEW */}
</Route>
```

---

### Dashboard Update

**File:** `apps/web/src/pages/DashboardPage.tsx` [MODIFY]

Replace the existing "Characters — Coming in Phase 2" placeholder card with a
real, clickable "Import Account" card that links to `/import`.

The card should make it immediately obvious what to do after registering. Its
description should read: "Import your Genshin Impact roster using a GOOD format
export from Genshin Optimizer or Inventory Kamera."

---

## Error Handling Summary

| Error Source                       | Error Type                          | HTTP Status | UI Behavior                                                                     |
| ---------------------------------- | ----------------------------------- | ----------- | ------------------------------------------------------------------------------- |
| Textarea is empty on submit        | Client validation                   | N/A         | Inline message: "Paste your GOOD export first."                                 |
| Textarea content is not valid JSON | `JSON.parse` throws                 | N/A         | Inline message: "This doesn't look like valid JSON."                            |
| GOOD payload fails Zod schema      | `BadRequestError` from service      | 400         | `mutation.error.message` shown in error banner                                  |
| JWT missing or expired             | `UnauthorizedError` from middleware | 401         | `ApiError` — `useEffect` calls `logout()`, ProtectedRoute redirects to `/login` |
| Unexpected server error            | Unhandled error in global handler   | 500         | Generic "Something went wrong." message in error banner                         |

---

## New File Summary

### Backend (API)

| File                                            | Type   | Description                                                   |
| ----------------------------------------------- | ------ | ------------------------------------------------------------- |
| `games/genshin/importer/importer.controller.ts` | NEW    | `GenshinImportController` with `importGenshinAccount` handler |
| `games/genshin/importer/importer.routes.ts`     | NEW    | Express router for `/import` (protected by `requireAuth`)     |
| `app.ts`                                        | MODIFY | Mount `genshinRoutes` at `/api/v1/games/genshin`              |

### Frontend (Web)

| File                      | Type   | Description                                                        |
| ------------------------- | ------ | ------------------------------------------------------------------ |
| `pages/ImportPage.tsx`    | NEW    | Full import page with textarea, loading, success, and error states |
| `lib/api.ts`              | MODIFY | Add `importGenshinAccount()` API client function                   |
| `App.tsx`                 | MODIFY | Add `/import` protected route                                      |
| `pages/DashboardPage.tsx` | MODIFY | Replace Phase 2 placeholder card with real "Import Account" link   |

---

## Edge Cases and Defined Behaviors

| Edge Case                                                  | Behavior                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Empty textarea on submit                                   | Client-side check — no network request, inline message                    |
| Non-JSON text pasted                                       | `JSON.parse` fails client-side — no request, inline message               |
| Valid JSON but wrong format (e.g., a Pokémon tracker JSON) | Backend `BadRequestError` — `mutation.error.message` displayed in banner  |
| User submits twice rapidly                                 | Button is disabled while `isPending`                                      |
| Import succeeds but user navigates away and back           | Success state is cleared (TanStack Query mutation state is not persisted) |
| Logout while import is in flight                           | 401 returned — `logout()` called — redirect to `/login`                   |

---

## Acceptance Criteria

The milestone is complete when:

- [ ] `POST /api/v1/games/genshin/import` returns 200 with `ImportResult` for a valid GOOD payload
- [ ] The endpoint returns 401 for requests without a JWT
- [ ] The endpoint returns 400 with a readable message for invalid GOOD format
- [ ] `GenshinImportController` has no business logic — it only validates HTTP boundary and delegates to service
- [ ] `ImportPage.tsx` renders the textarea + import button in idle state
- [ ] `ImportPage.tsx` shows loading state while mutation is pending (button disabled)
- [ ] `ImportPage.tsx` shows the success summary with 3 stat counts after import
- [ ] `ImportPage.tsx` shows a preserved error banner without clearing the textarea on failure
- [ ] `/import` route is protected (unauthenticated redirect to `/login`)
- [ ] Dashboard "Import Account" card links to `/import`
- [ ] TypeScript reports zero errors across both `apps/api` and `apps/web`

---

## Future Improvements (Out of Scope for 2C)

- Roster browsing UI (character list, artifact inventory views) — Phase 2D
- Drag-and-drop file upload for `.json` files instead of paste — Phase 2D
- Import history timeline — Phase 6
- Progress indicator for large imports — Phase 4 optimization
