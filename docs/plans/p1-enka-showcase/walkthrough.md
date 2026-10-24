# P1 — Personal Showcase Viewer

**Ready for personal acceptance; provisional until the owner checks their in-game showcase.** Implemented and verified on 2026-10-24, Asia/Calcutta. No push, merge, deployment, database migration or provider credentials.

## Open the application

The implementation is in its own worktree, not the original dirty checkout:

```powershell
Set-Location -LiteralPath 'C:\Users\inuzu\.codex\worktrees\p1-enka-showcase\project-celestia'
pnpm install --frozen-lockfile
pnpm showcase:dev
```

Dependencies are already installed on this machine; the install command is included for a fresh setup. Use the existing Node.js/pnpm installation (verified with Node 22.14.0 and pnpm 11.18.0).

When the terminal prints the local address, open **[My Showcase](http://127.0.0.1:45751/showcase)**. The isolated launcher also redirects its home, login and registration URLs to this public viewer, and hides the workspace link. Keep the terminal open. Press **Ctrl+C** there to stop both servers. If a port is occupied, stop the previous copy and rerun; the launcher deliberately does not select a different port. The original checkout on localhost:5173 is a separate application instance.

**No configuration, account registration, database or secret is required for this viewer.** The launcher builds shared contracts, generates Prisma's local client files, starts the real Express application on loopback port 45750, and starts Vite on 45751. Prisma generation reads the schema and does not migrate or connect to a database. The launcher disables dotenv loading, does not inherit application/provider credentials, and uses a deliberately unreachable synthetic database address. Existing database-backed workspace features require their ordinary development configuration; they are not part of this isolated public-viewer startup.

To use the feature in a normally configured existing Celestia development session instead, build the contracts and start API/web with their existing scripts and local settings. My Showcase is at `/showcase` and is also linked in the workspace navigation. Normal defaults remain API 4000 and web 5173. No Enka API key or account is needed.

## Personal acceptance procedure

1. In Genshin Impact, open your profile and Character Showcase. Add the characters you want visible and enable the option allowing others to view their details. Save your profile.
2. Open the local My Showcase link above.
3. Enter your own numeric UID and select **Load Showcase**. The UID is saved only as a browser preference; it is not an account-ownership link.
4. Compare the nickname, Adventure Rank, World Level and signature against the game.
5. Open each character's **View build** summary. Compare the reported level, ascension, constellation, talent base/bonus levels, weapon/refinement, and each artifact's slot, level and statistics.
6. Select **Refresh Showcase**. During the displayed cache window, it must say **locally cached** and retain the same successful-response time. Wait until the next allowed request time to request another response from Enka.
7. Optionally change one showcased character's gear in the game. Allow time for the game and Enka to update, then refresh after TTL. A new HTTP response does not guarantee Enka already reflects the in-game change.
8. Reload the page: your UID should still be filled in. No credentials, extensions or pasted tokens should be requested.

An empty/private result explains how to enable details. It does **not** mean you own no characters. Only detailed characters returned by the public showcase are displayed. This is not full-account synchronization or an inventory import.

All owner acceptance steps remain pending. The agent did not use the owner's UID, credentials or private account data.

## Implementation and boundaries

The Genshin-owned endpoint is `GET /api/v1/games/genshin/showcase/:uid`. It is public and read-only. It returns a typed showcase DTO, not a persisted roster. Invalid UID syntax is rejected before provider access. The adapter uses only `https://enka.network/api/uid/{uid}/`, with an application-identifying User-Agent, redirects disabled, a ten-second timeout and a two-megabyte response ceiling.

Cache behavior follows [Enka's API guidance](https://github.com/EnkaNetwork/API-docs/blob/master/api.md): honor response TTL, coalesce concurrent requests for the same UID, and avoid repeated upstream reads. A 429 establishes a shared cooldown across UIDs, honoring numeric or HTTP-date Retry-After; absent/invalid headers use a one-minute delay. Other failures have a thirty-second retry delay. Local spacing and one upstream operation at a time add a small request budget. Up to 64 process-local entries are retained; a fresh TTL entry is not evicted to satisfy another UID.

Responses distinguish `fetched`, `cached`, `stale`, and `unavailable`. Fetched means an HTTP response was obtained from Enka; it does not mean new game data was observed. On refresh failure, the last validated snapshot and its successful receipt time are retained. A validated successful response replaces only that UID's showcase snapshot. No GET writes a Celestia account, character, equipment, inventory, import receipt, goal or manual record.

Known provider statuses 400, 404, 424, 429, 500 and 503 have safe messages. A stale snapshot is returned with HTTP 200 and an issue; failure without a prior snapshot carries its mapped failure status (424 maps to 503). Network, timeout, malformed, oversized, duplicate-character and conflicting-stat responses do not publish partial builds.

Identity, portraits, talent order, localization and stat units use [Enka's Genshin data documentation](https://github.com/EnkaNetwork/API-docs/blob/master/docs/gi/api.md) and its linked metadata, pinned at `a9b583eb4a708dd3db56f6bdef35c3e84e4d213c`. [Provenance](../../../apps/api/src/games/genshin/static/enka/provenance.json) records the upstream URLs/hashes; the acquisition script keeps only English localization. Numeric level/ascension properties are used only when reported. Constellation absence follows Enka's documented C0 convention. Artifact levels and weapon refinements use documented offsets. Unknown character/equipment/stat identifiers remain visible rather than guessed.

Live responses use `statValue` for flat gear statistics although the documentation names `propValue`. The parser supports both with a conflict check; this difference was discovered in the live public example and has a regression test.

The UI uses existing Celestia branding, PageHeader, typography, navigation and TanStack Query. The direct public entry has its own query provider and does not attempt workspace session restoration; a final browser recheck recorded zero authentication requests. The workspace retains its normal authentication flow. Build details are separate from the persisted-roster character pages. UID storage is a versioned, validated browser preference; failed/blocked storage does not stop lookup. Provider strings render as plain text. Image URLs are constructed only from allowlisted icon-name syntax on Enka's fixed HTTPS image origin.

## Verification

**100 passed, 0 failed, 0 skipped/pending** across five files. [Per-case JSON](test-results.json):

| Suite                    | Cases | Purpose                                                                                                                                                                     |
| ------------------------ | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| showcase.test.ts         |    41 | UID validation, current/Traveler identity mapping, modern portrait/costume paths, gear, units, empty/private data, malformed input, TTL, rate limits and snapshot retention |
| showcase.http.test.ts    |     1 | Real application routing; invalid UID returns 400; a throwing database sentinel proves this flow never accesses account storage                                             |
| showcase-client.test.js  |    11 | Public UI states, isolated launcher links, builds, unknown fields, UID preference, credential-free requests and cache separation                                            |
| journey-client.test.js   |    19 | Existing roster, equipment, profile, navigation and account-client regression coverage                                                                                      |
| importer.service.test.ts |    28 | Existing import selection, preview and preservation behavior                                                                                                                |

Fresh API/web production builds, API/web/contracts lint and TypeScript checks passed. The compiled API was also loaded against its packaged metadata and resolved the synthetic Hu Tao identity successfully. Scoped Prettier and Git whitespace checks are recorded in the final handoff. No full database integration suite was run; this change has no database persistence or migrations.

Reproduce the focused tests from the worktree root:

```powershell
$env:NODE_ENV = 'test'
$env:DOTENV_CONFIG_PATH = 'NUL'
$env:DATABASE_URL = 'postgresql://synthetic:synthetic@127.0.0.1:1/never_connect'
$env:JWT_SECRET = 'synthetic-enka-only-secret-at-least-32-characters'
pnpm --filter @celestia/api exec vitest run src/games/genshin/showcase tooling/showcase-client.test.js tooling/journey-client.test.js src/games/genshin/importer/importer.service.test.ts --maxWorkers=1 --minWorkers=1 --fileParallelism=false
```

These automated tests are synthetic. The separate browser fixture replaces only the external Enka transport and exercises the actual web page, Express app, parser, cache and HTTP response. Browser checks confirmed invalid UID guidance, first load, build expansion, cache refresh without another upstream call, 503 retention, UID persistence after reload, 429 guidance and empty/private output. Four fixture upstream reads covered success, failure, rate-limit and empty states; the cache hit and reload issued none. [Browser evidence](browser-results.json), [synthetic build](showcase-synthetic-desktop.png), [retained stale build](showcase-synthetic-stale.png).

**Live verification is distinct:** Enka's documentation example UID `618285856` was successfully queried through the actual local API: **4 characters, 4 weapons, 20 artifacts**, all characters recognized by pinned metadata. Immediate repetition was cached with the same receipt time. The actual frontend also rendered those four builds and Amber's reported weapon, artifacts, talents and combat properties. [Live API summary](live-api-check.json). This establishes live transport/parsing/display for a public example, not correctness for the owner's account or a personal in-game comparison.

## Limitations and remaining work

- Server snapshots are process-local and bounded. Restarting the API clears the cache; the saved UID remains in the browser. This first version does not persist historical showcase builds.
- A public lookup cannot verify ownership, enumerate your roster, observe unequipped gear or recover private builds. Saved Enka profile builds are not queried.
- Enka/game caches may delay changes. A receipt time is not a provider-signed game observation time.
- Missing ascension/refinement/talents remain unknown. Unknown or newly released metadata uses visible ID fallbacks. Enka's English map omits some individual artifact-piece names; slot, set, ID and reported stats still display.
- Talent labels use metadata order and explicit skill IDs; unavailable textual skill names are not invented. Bonuses appear separately when reported.
- Browser checks covered the available desktop viewport; no claim of physical-phone acceptance or owner acceptance is made.
- The cache/cooldown is for this single-process personal app. Multiple API instances would need shared provider-budget/cache coordination before any future hosted release.

Next step: the owner conducts the acceptance procedure. No production rollout or HoYoLAB continuation is part of this milestone.

## Exact files changed

Existing files modified:

- `package.json` — isolated launcher command.
- `packages/api-contracts/src/index.ts` — showcase export.
- `apps/api/src/app.ts` — optional service injection for real-app verification.
- `apps/api/src/games/genshin/genshin.routes.ts` — read-only showcase router.
- `apps/web/src/App.tsx` — lazy public page route.
- `apps/web/src/components/CompanionLayout.tsx` — My Showcase navigation entry.

New implementation/data files:

- `packages/api-contracts/src/genshin/showcase.ts`
- `apps/api/src/games/genshin/showcase/showcase.parser.ts`
- `apps/api/src/games/genshin/showcase/showcase.service.ts`
- `apps/api/src/games/genshin/showcase/showcase.controller.ts`
- `apps/api/src/games/genshin/showcase/showcase.routes.ts`
- `apps/api/src/games/genshin/static/enka/characters.json`
- `apps/api/src/games/genshin/static/enka/english.json`
- `apps/api/src/games/genshin/static/enka/provenance.json`
- `apps/api/tooling/acquire-enka-metadata.mjs`
- `apps/api/tooling/showcase-server.mjs`
- `tooling/showcase-dev.mjs`
- `apps/web/src/lib/showcase.ts`
- `apps/web/src/components/ShowcaseSnapshot.tsx`
- `apps/web/src/pages/ShowcasePage.tsx`

New verification files:

- `apps/api/src/games/genshin/showcase/showcase.fixtures.ts`
- `apps/api/src/games/genshin/showcase/showcase.test.ts`
- `apps/api/src/games/genshin/showcase/showcase.http.test.ts`
- `apps/api/tooling/showcase-client.test.js`
- `apps/api/tooling/showcase-browser-fixture.mjs`

Milestone artifacts: every file under `docs/plans/p1-enka-showcase/`, including this walkthrough, plan/task, test/live/browser/quality summaries, screenshots, original-checkout preservation check and its small audit script. [Exact changed-file manifest](changed-files.json) enumerates all implementation and artifact paths.

At initial P1 completion, all 1,722 recorded original-checkout path states were unchanged. A later follow-up audit now records eight changes relative to that earlier baseline, with original HEAD/branch and empty staged diff retained; see [audit](original-preservation.json). This follow-up edited only the isolated worktree and did not restore or overwrite the separately changing original checkout. No schema, migration or lockfile was changed by P1. Draft PR #3 was reviewed only. The new branch remains local and uncommitted.

## Follow-up: browser address and character 10000125

See [followup-fixes.md](followup-fixes.md). The initial metadata followed the documentation's legacy table, which omitted 10000125. The corrected acquisition uses current `store/gi/avatars.json` and `store/gi/locs.json`, retaining legacy English gear hashes for compatibility. Current Enka metadata resolves 10000125 as Columbina. Modern /ui image paths and costume fields are supported with the same fixed-origin restriction. No observed progression is inferred from static character data.
