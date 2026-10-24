# P1 — Personal Showcase Viewer

## Scope and repository audit

Implement the documented public Enka UID lookup inside the existing Express / React / shared-contract monorepo. No HoYoLAB or Enka authentication, desktop runtime, database writes, migration, imports, optimizer or deployment.

Implementation is isolated at `C:/Users/inuzu/.codex/worktrees/p1-enka-showcase/project-celestia`, branch `codex/p1-enka-showcase`, from released `origin/master` commit `00cf0423987bcb2b2a75a8e35b517e330707af1e`. The original checkout at `D:/Genshin Personal/project-celestia` has substantial unfinished work and is not modified. Existing features on the released baseline remain.

Reviewed the dirty HoYoLAB implementation and open draft PR #3 (`58400156ddfa3413e1f4a91930dc013936c0518b`). Both rely on provider session material and are excluded. No PR was modified. Existing roster, equipment, artwork, JWT/session, import and API components were inspected. Showcase observations must not call their persistence paths.

## Implementation

1. Define a small validated public showcase DTO and UID schema in api-contracts.
2. Pin Enka's documented character/localization metadata, recording commit, source hashes and acquisition code. Keep unknown identities/stats explicit.
3. Add a Genshin-owned read-only adapter: fixed HTTPS endpoint, identifying User-Agent, bounded response/timeout, strict parsing, in-process bounded TTL cache, concurrent request coalescing, local request spacing and shared dynamic rate-limit cooldown. Failed refreshes return the prior successful snapshot with a stale label.
4. Add a focused public `/showcase` page, reachable from existing navigation. Reuse shared typography, PageHeader and branding. Save only the UID preference in versioned browser storage. No account ownership claim. Details stay within this page rather than navigating to persisted-roster character pages.
5. Add a one-command, loopback-only local launcher for this public flow without database configuration. Use the real Express app and frontend, with dotenv disabled and a deliberately unreachable synthetic database address. Existing authenticated features continue to work under their normal startup.
6. Test parser/mapping, malformed/private/empty responses, stat units, cache/rate-limit/concurrency/failure behavior, HTTP boundaries, source separation and UI states. Build/lint/types and browser-check the complete public flow.
7. Record synthetic versus live evidence, exact commands, limitations and the owner's pending acceptance in task.md and walkthrough.md.

## Data rules

One validated successful lookup replaces only its cached showcase snapshot. Missing avatarInfoList is an empty/private public showcase, not an empty owned roster. Only the documented UID endpoint is used; saved Enka profile builds are not fetched. No Prisma repository or manual/account storage is imported by showcase code.

Cache hits are labeled as locally cached. A new upstream HTTP request is labeled as an Enka response, not a fresh in-game observation: Enka itself may cache it. Local receipt time is never called the time the game was observed. Server cache is bounded and process-local; restarting clears it. The UID preference survives browser visits.

## Acceptance boundary

P1 is provisional until the owner loads their own UID and compares the public builds to the actual game. Agent checks must not claim that acceptance. No push, merge or deployment.
