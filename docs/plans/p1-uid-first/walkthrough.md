# Celestia P1 — current handoff

The current implementation is on the isolated `codex/p1-enka-showcase` branch. Earlier walkthroughs and screenshots in this directory are historical evidence; this document describes the current behavior. P1 remains pending the owner's personal acceptance.

## Launch

```powershell
Set-Location 'C:\Users\inuzu\.codex\worktrees\p1-enka-showcase\project-celestia'
pnpm install --frozen-lockfile
pnpm showcase:dev
```

Open http://127.0.0.1:45751/. If the launcher is already running, use that address without starting a second copy. The launcher uses the existing frontend and Express backend, isolated loopback ports, a sanitized environment and no real database credentials. The original checkout and its port 5173 remain separate and preserved.

## Current experience

- New visitors see Celestia's Today screen and **Add UID**. The shared dialog validates and searches a public UID, previews its showcased characters, and connects the whole showcase only after **Add UID** is selected. Search and Cancel never change the active UID.
- Returning visitors resume the last successfully connected UID. Sidebar **Switch UID** uses the same dialog. A UID lookup does not prove ownership or create an authenticated account.
- `/u/:uid` is Today. `/u/:uid/roster` is the retained character collection; element, weapon type, rarity and search filters combine locally and persist in the URL. `/u/:uid/inventory` shows latest observed equipment. `/u/:uid/showcase` shows only the latest successful public showcase.
- Each character bar on Public Profile links directly to `/u/:uid/character/:id`. There is no View build disclosure. The detail page has a character hero, key statistics, weapon panel, talents labeled by combat type and actual name, five artifact slots and a secondary full-stat disclosure. It has no refresh or top-right Switch UID control.
- The earlier authenticated features remain available through `/workspace` and their existing protected routes; they require their original configuration. Public showcase pages do not restore a login session.

## Refresh preserves the roster

Successful showcase responses add or update per-UID character records in browser IndexedDB, using one transaction. Refresh never clears the roster or deletes absent characters. Empty/hidden showcases and failures preserve saved observations. Older responses cannot overwrite newer builds. Character identity includes the Enka character key/form; duplicate refreshes do not duplicate records.

Retained characters remain available in Characters, Equipment and build details. They are labeled **Previously observed**, distinguish absence from the current showcase, and show their last observation time. Public Profile remains strictly current; it never presents the retained collection as a current showcase or complete private roster. Only the most recent observed build per character is retained, not a version history of every build.

Records belong to this browser and site origin. They survive reloads and UID switching, but do not synchronize across devices or from localhost to production. Clearing site data, browser eviction, private browsing or denied storage can prevent persistence. Storage failures display an error while retaining existing stored records and keeping the currently available builds in memory. Unreadable stored records are preserved rather than silently discarded.

The API reuses the bounded Enka adapter, same-UID request deduplication, TTL, pacing and Retry-After/backoff. Refresh stays disabled until eligible. The timer is the normal refresh feedback. Enka may itself return cached data after that timer expires. Production showcase requests default to the existing same-origin `/api/v1` proxy, avoiding a localhost request from a visitor's browser. No Supabase migration or new authentication system is introduced.

## Verification and deployment audit

See `roster-retention-test-results.json` for the 153 targeted passing tests and `roster-retention-quality-results.json` for final quality gates. The new tests cover transactional persistence, concurrent/older responses, per-UID isolation, empty showcases, storage denial and rollback. An actual App DOM interaction test verifies refresh/update, retained character details, current-only Public Profile, failure preservation and persistence after a new App mount.

The complete repository verifier passed: **1,705 tests across 102 files, including 118 required PostgreSQL cases**, with zero failures or skips. Its migration/schema checks, lint, types, production build, repository formatting and Git whitespace gates pass. See `full-verification.json`. It ran against a newly initialized disposable PostgreSQL cluster on loopback port 45759, never the running original database or Supabase. Its compact evidence is saved alongside this document. All newly authored source is linted, typechecked and formatted. Original preservation is checked independently across 3,481 paths plus HEAD, branch and index.

DOM tests are not a visual browser check. Visual review of the latest build sheet, native UID dialog and roster remains pending under the previously recorded browser automation block. Earlier screenshots do not certify the final layout.

See `deployment-audit.md` for the read-only GitHub, Vercel, Render and Supabase checks. The local implementation is committed before handoff; no push, merge or deployment is authorized by the request to check deployment. Production remains on the older master commit until the owner authorizes publishing.

## Personal verification

1. Open the local app in a fresh browser session. Search a UID, inspect its preview, cancel once, then search and Add UID. Confirm Today opens and the sidebar changes to Switch UID.
2. Check Characters and Equipment, apply combined filters, and click character bars on Public Profile to compare the detailed build with the public game data.
3. After the timer expires, refresh a UID whose displayed characters have changed. Returned builds should update, earlier characters should remain in Characters with observation labels, and Public Profile should contain only the latest successful showcase.
4. Reload Characters, switch to another UID and return. Saved observations must remain separated by UID. An empty showcase or network failure must not erase previously saved characters.
5. Check desktop and mobile layouts, native dialog keyboard focus, talent labels and the absence of refresh/Switch UID controls in the build content.

Stop after implementation and commit. Owner acceptance and P1 finalization remain pending.
