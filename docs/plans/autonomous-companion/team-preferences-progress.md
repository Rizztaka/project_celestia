# Personal team preferences — M1/M3 progress

Implemented locally on 2026-10-25. The full autonomous companion goal remains
active; this adds player intent to the existing public team search.

## Behavior

Players can mark favorites, require exact character forms, exclude characters,
and choose either highest tested DPS or most favorites followed by DPS. The chosen
driver and verification sample count are also saved. Choices apply immediately.
Public unauthenticated UID preferences remain in this browser; authenticated
preferences are owner/account scoped on the server.

Required forms and exclusions are hard constraints. The driver remains fixed.
An unavailable/unsupported required form, an excluded driver, conflicting Traveler
forms or more required members than available slots produces an explicit empty
result and explanation. Constraints are never silently relaxed. Requirements are
placed before enumerating remaining teammate slots, and setup order stays the same
as the unconstrained search so a shared lineup receives the same engine input.

Favorites are a separate priority, not a damage multiplier. Favorites-first keeps
valid candidate configurations containing the largest attainable favorite count,
then runs the unchanged simulation/ranking process on that set. Numeric DPS is
always the engine result. Highest-DPS mode retains all allowed candidates. A favorite
or exclusion applies across forms using canonical avatar identity; required members
use exact avatar/depot keys. Traveler variants count as one playable identity.

Preferences retain choices outside the currently observed roster. Those choices
can be removed explicitly; their absence does not establish unowned characters.
All gear remains as recorded, and public snapshots still cannot prove simultaneous
equipment exclusivity.

## Persistence and interaction

The versioned shared contract validates UID, bounded unique identity arrays,
supported samples, exact required forms and contradictory constraints. Local
storage uses `celestia.team-search.v1:<uid>` and a 16 KB parsing bound. No imported
build, goal, saved team or account record is overwritten.

### Authenticated server persistence — M1 Subphase 3

The authenticated team UI reads and writes
`GET/PATCH /api/v1/games/genshin/team-preferences`. Records are scoped by owner plus
selected account or UID, stored in the additive `genshin_team_preferences` table, and
protected by an atomically incremented revision. A stale `expectedRevision` returns
409; the client then refetches the stored revision while keeping the draft, so the
next save cannot silently overwrite another tab. Account-only scope fills a missing
UID from the stored account, including private accounts whose UID is null. Failed
saves preserve both the draft and the stored value.

The same versioned contract adds bounded `protectedGear`, `comfort`,
`timeBudgetMinutes` and content mode/difficulty/target. These fields are validated,
persisted and part of the search-session fingerprint, but the current form does not
expose them and candidate selection does not act on them yet. They are M2/M3
groundwork, not current ranking behavior. The authenticated UI always selects a UID
scope; a null-UID private account has no UI picker yet.

Unreadable, foreign-UID, unknown-version and oversized saved values stay intact.
Unavailable storage or invalid saved data allows clearly labeled temporary choices.
Saving checks the previously read raw value and rejects a detected intervening
write. This is conflict detection, not an atomic cross-tab transaction. Local edits
survive an external update until the player explicitly loads the saved version.

The storage hook subscribes to primitive snapshots and cleans up its listeners.
Editor state and focused inputs stay outside the keyed search session. Changing
preferences, driver or samples cancels/invalidate the old search without erasing
the preference editor's search term or keyboard focus. Saving unchanged search
inputs does not manufacture a new DPS result. No background polling of account data
or automatic spending/game interaction is introduced.

## Verification

- **M1 Subphase 3:** the focused suite passed **77/77** across eight files. The
  guarded preference/import integration files executed **9/9** on a disposable
  loopback PostgreSQL 18 database after all sixteen migrations applied, with zero
  skips. A further serial run of account-data, team-generator, export/deletion and
  request-safety files passed **40/40**, covering the new table in export/deletion
  and the exact twenty-one-table recovery inventory. A JSDOM regression covers the
  409 draft-preserving refetch. The full `pnpm run verify` suite passed
  **1993/1993 tests across 132 files, 0 failed, 0 skipped, 118 PostgreSQL cases**,
  including all type, lint and build checks; the repository Prettier gate passes.
  Two later repeats of the same green suite hit a post-completion Vitest worker
  `onTaskUpdate` RPC timeout that makes the wrapper exit non-zero; no test failed.

- **Historical 2026-10-25 result: 79/79 focused tests across ten files passed**, zero
  failures/skips. That count predates the authenticated server path. The prior
  nine-file suite plus `team-preferences.test.js` covers persistent UID isolation,
  malformed-data preservation, conflicting writes, missing/contradictory intent,
  required/excluded/favorite candidate sets, exact Traveler forms, unchanged engine
  inputs for shared lineups, editor focus, cancellation, refresh and real WASM runs.
- Contracts build/lint, web production build/types/lint, API type checks, scoped
  tooling lint and changed-file formatting passed.
- React skill review: versioned/bounded storage, primitive external-store snapshots,
  event-handler updates, stable editor identity, cleaned subscriptions and explicit
  labels/fieldsets. No new UI library, provider or dependency.
- Actual browser used the existing isolated fixture API and real showcase parser
  with synthetic UID `800000003`. Marked Furina favorite, required Escoffier,
  excluded Dahlia, selected Skirk and three samples, then saved and fully reloaded.
  All preferences and controls remained. The real gcsim worker compared the two
  eligible teams and returned **11,410 / 11,357 DPS** for the illustrative builds;
  both teams contained Furina/Escoffier and neither contained Dahlia.
- Synthetic UID `800000004` opened independently with zero checked preferences,
  highest-DPS priority, default driver and five samples. Browser warning/error logs
  were empty. Content width equaled viewport width (1265px); no fresh 320/390px
  acceptance is claimed. Keyboard navigation reached the result Save controls.
- Screenshot and accessibility evidence are in ignored
  `.local-maintenance/team-preferences-browser.png` and
  `.local-maintenance/team-preferences-browser.txt`. Synthetic browser-local data
  remains confined to the local preview origin. The tab and preview processes were
  closed after verification. The existing Vite manifest-import warning remains.
- `git diff --check` passed. This work includes no dependency/schema change or
  production account/release mutation.

## Remaining goal work

Comfort and encounter-specific eligibility need verified models before they can
affect recommendations. Imported-account adapters, reviewed 7.1 roster/mechanics
coverage, contextual build readiness, improved rotations, joint endgame assignment,
account-value pull comparisons and the fun simulator remain open. The current
unconstrained candidate builder still materializes all configurations and needs
streaming or other justified search improvements for large retained rosters.
No universal optimum or full live-patch support is claimed.
