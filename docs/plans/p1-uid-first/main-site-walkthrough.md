# UID connects to the main Celestia site

The UID entry now opens **Today, at your pace** in the main Celestia layout. The existing sidebar, workspace bar, page focus/title handling, mobile drawer, Today hero and shortcut styles are reused. The authenticated Today page uses the same extracted `DashboardWelcome` component and retains its original planner/import/session actions.

The UID workspace shares one `enka-showcase` query across Today, Characters, Equipment, Public Profile and character details. The existing backend, parser, metadata and TTL/backoff logic are reused. Main collection cards show the returned character names, levels, constellations, base talents and equipped weapon. Equipment tabs display the reported weapons/artifacts with statistics and character links. Updating the showcase updates these views together.

| Route                   | Main-site page                                         |
| ----------------------- | ------------------------------------------------------ |
| `/u/:uid`               | Today, connected profile and current character preview |
| `/u/:uid/roster`        | Searchable character collection                        |
| `/u/:uid/inventory`     | Equipped weapons and artifacts                         |
| `/u/:uid/showcase`      | Full public profile and showcase                       |
| `/u/:uid/character/:id` | Build details inside the main layout                   |

Switch UID and returning-user behavior remain available. No authenticated account is created, no token is synthesized and no data is imported into an unrelated registered account. Original authenticated features and historical records remain intact. Public UID data does not expose the full private roster, unequipped inventory, materials, daily activity or saved account plans; those are not invented or mixed into this workspace.

## Verification

- **125 tests pass** in six test files, including the previous 115 regressions and 10 new main-workspace tests. `main-site-test-results.json` contains the result.
- Web build (including TypeScript), web lint, API lint, formatting and Git whitespace checks pass. No backend or shared contract runtime code changed in this follow-up; earlier API/contracts build and type gates remain applicable.
- Browser → existing Express API → synthetic Enka transport → main UI verified: Continue opens Today, Characters uses the same data, detail links retain the main shell, Equipment maps the same weapon/artifact statistics, and navigation did not make another provider call (counter remained 1 across the initial pages).
- Main dashboard retention and disabled refresh were checked after a synthetic 429. Switching to a 10-digit UID opened its own Today workspace. Direct reload retained the correct UID and respected TTL. Refreshing to a Columbina fixture updated the main character card and opened its details correctly; a detail reload also passed.
- Mobile checks at 390×844 and 320×740 showed no horizontal overflow. The reused drawer navigated and closed correctly, restoring body scrolling. Viewport overrides were reset.
- Authentication request counter remained **0** through all browser checks; synthetic provider counter ended at 5 after intentional refreshes, switching and reloads.
- Chrome blocked automation when another extension UI opened during the final full-root resume check. That final check was not recorded as passing. The earlier resume implementation and regressions remain unchanged; personal acceptance remains pending.
- Original checkout preservation check still passes: 3,481 file hashes, branch, HEAD and index unchanged.

Screenshots use synthetic test data: `main-site-desktop.png` and `main-site-mobile.png`. They demonstrate the main layout, not any real player's account.

## Try it

The development app is at [Celestia](http://127.0.0.1:45751/). Reload an existing `/u/:uid` page to see the main Today dashboard. Entering a UID from `/` opens that dashboard automatically; use Characters and Equipment in the sidebar or mobile menu.

To restart, run `pnpm showcase:dev` from `C:\Users\inuzu\.codex\worktrees\p1-enka-showcase\project-celestia`. The original checkout on port 5173 is preserved; this review build remains isolated on branch `codex/p1-enka-showcase`. Nothing was pushed, merged or deployed. P1 awaits owner verification.
