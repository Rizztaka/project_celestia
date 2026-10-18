# Focus and durable goals (C3b)

Implemented locally, 2026-10-04. All routes below use `/api/v1`, bearer authentication and the existing success/error envelope. The [shared schemas and DTOs](../../packages/api-contracts/src/genshin/goals.ts) are authoritative. The additive `20261003180000_add_focus_goal_lifecycle` migration must precede a coordinated API/web cutover. This checkpoint has not been deployed.

## Focus

`GET /games/genshin/focus` returns `FocusRecord[]`: `characterKey`, `focused`, `revision`. It returns an empty array for a user without an imported account and performs only SELECTs. False membership rows remain in the response so clients retain revisions. Missing membership has revision 0.

`PATCH /games/genshin/characters/:characterKey/focus` accepts exactly:

```json
{ "contractVersion": 1, "expectedRevision": 0, "focused": true }
```

The response is the authoritative `FocusRecord`. The account comes from the authenticated user; the character must belong to that account. Unknown imported keys are valid. URL-encode natural keys (1–200 characters, no control characters). Missing/foreign characters return 404; invalid input returns 400; stale revisions return 409. Successful writes increment the revision, including unfocus. No account creation, focus limit, score multiplier or goal mutation occurs.

## Goal reads and creation

`GET /companion/goals` retains its array response and adds `status`, `priority`, `revision`, `completedAt`, `completionReason`, `predecessorId`, `needsReview` and `limitations`. Original identity, target, range, slot and timestamps remain. Internal user/request IDs are omitted. Order is priority ascending (1 first, 5 last), then creation time, then ID. Reads never normalize malformed legacy data or create accounts.

`POST /companion/goals` accepts a strict version-3 body:

```json
{
  "contractVersion": 3,
  "requestId": "ac192d8b-2aab-4b6c-93c4-dd3fabdc02c8",
  "goalType": "CHARACTER_TALENT",
  "targetKey": "HuTao",
  "fromPhase": 1,
  "toPhase": 6,
  "talentType": "normal",
  "priority": 3
}
```

It returns one `GoalRecord`. Ascension types (`CHARACTER_ASCENSION`, `WEAPON_ASCENSION`) accept integer phases 0–6; talents accept declared base levels 1–10 with `normal`, `skill` or `burst`. Every range requires `fromPhase < toPhase`. Individual source caps still apply to advice, including four-phase low-rarity weapons and unavailable Traveler talent exceptions. Non-talent slots are null/omitted. Priority defaults to 3. Unknown fields, fractional/out-of-range values, unsafe keys and invalid slots return 400. New goals start active with revision 0. This range expansion was implemented 2026-10-17; existing intent and contract version remain unchanged.

A new target must be a known catalog key or an owned imported character/weapon type key. Storing valid intent does not certify cost or route coverage. Catalog targets remain usable before import; focus is optional. Weapon goals track the type key, never a replaceable equipment UUID or one physical copy.

Retain the UUID request ID across retries of one draft. Repeating an accepted request returns 409 even after the goal is closed; refresh to discover the result. There are no blind client/server mutation retries.

## Revisioned lifecycle

`PATCH /companion/goals/:id` always requires `contractVersion: 3`, `expectedRevision` and `action`. It returns `{ goal, successor }`; `successor` is null except when creating a new active child.

| Action      | Additional fields                     | Allowed state             | Result                                                                   |
| ----------- | ------------------------------------- | ------------------------- | ------------------------------------------------------------------------ |
| `edit`      | `fromPhase`, `toPhase`, `priority`    | active, paused            | Same identity/ID and status; explicit new declared range/priority        |
| `priority`  | `priority`                            | active, paused            | Same target/status, new priority                                         |
| `pause`     | none                                  | active                    | paused                                                                   |
| `resume`    | none                                  | paused                    | active                                                                   |
| `complete`  | `reason`: `achieved` or `good_enough` | active, paused            | completed with server time and the user's reason                         |
| `archive`   | none                                  | active, paused, completed | archived, retaining completion metadata                                  |
| `successor` | `fromPhase`, `toPhase`, `priority`    | completed, archived       | Retain closed row; create one active child with the same intent identity |

All other transitions return 409. Each accepted command increments the addressed row's revision once, including successor creation. The child's revision starts at 0. Closed targets, reasons and completion times cannot be edited. Each closed row has at most one successor, even after that child is archived; continue through the child. Completion is an explicit user decision independent of stock, imported progression and cost eligibility.

Writes lock the stable owner row, check ownership/revision/current intent, and apply conditional updates inside one transaction. Import and focus writes use the same owner lock. Foreign/missing goal IDs return 404 without exposing another owner's data. Stale revisions and concurrent/replayed commands return visible 409 conflicts. Refresh confirmed state, retain the draft, and deliberately resubmit against the new revision.

## Duplicate and legacy policy

Current intent is `(owner, type, key, nullable slot)`, with null treated as equal. A new create/successor is blocked while any active or paused row has that identity. Legacy duplicates are retained: all active/paused members receive `needsReview`, and all active members are excluded from demand until explicit completion/archive resolves the group. Pausing one duplicate alone does not resolve it.

Malformed legacy ranges/slots and unavailable targets remain visible with limitations. Priority and closure remain possible even if a range cannot be edited into a valid intent. Reads, imports, focus and calculations never clamp, retarget, auto-complete, advance starting values or erase goals.

The web client's **Edit priority only** action sends the dedicated `priority` command without range/slot fields, so legacy intent needs no repair to be reprioritized. Fixed legacy talent editors display unsupported or missing slots explicitly rather than substituting a valid talent.

The migration adds neutral defaults (active, priority 3, revision 0); preserves all original IDs, owners, ranges and timestamps; and creates no accounts, focus rows or invented completion history. It replaces the old nullable-slot unique index with request/successor uniqueness, allowing closed talent history. SQL checks enforce priority/revision/completion metadata without rejecting old malformed ranges. Application owner locking enforces current-intent uniqueness while preserving existing duplicates.

## Planning, progress and compatibility

Materials, Today and the direct Planner recommendation path use active goals only, exclude ambiguous duplicates, and order eligible goals by user priority with stable ties. Legacy weighted scores do not override that order. C2b cost/route evidence gates, Mora, atomic stock receipts and nullable unknown deficits remain intact. All-inactive states leave manual routine tracking available.

Costs describe the declared from→target range. Re-import does not measure a new remaining-upgrade cost. Character detail may place stored ascension beside the declared ascension target, with lifecycle unchanged. Raw talents cannot establish base-level progress; weapon type goals cannot establish individual-copy progress. Section receipts do not date each character observation.

Old unversioned goal creation returns 409. Owned `DELETE /companion/goals/:id` returns 409 with instructions to use the new client; foreign/missing IDs return 404. DELETE is never reinterpreted as archive. All repository callers now use versioned lifecycle writes. Deploy migration, API and web together; do not retain mixed old/new writers. No release action is part of this local checkpoint.

Web commands pin the originating token and session generation, check before dispatch/after response and guard callbacks. Retries are disabled. Goal/focus/import success invalidates companion, Genshin, roster and intelligence views. Confirmed response merging refuses lower revisions. Failed saves preserve the draft and confirmed rows; explicit conflict refresh also refreshes planning views. Partial, empty, replacement and failed imports preserve focus and all goal fields/history.
