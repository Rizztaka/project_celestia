# C5c local acceptance — 2026-10-12

Actual in-app Chromium browser against the owned synthetic helper and real
PostgreSQL. Default body/rate/concurrency policies were used. Admission time alone
was injected, advanced explicitly between retries; this is not evidence of a real
elapsed browser countdown, load testing, accessibility sign-off or remote deployment.

| Scenario                      | Actual observation                                                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Valid login                   | Owner A reached Today with its seeded goals/routines.                                                                                                                                                           |
| Login 429                     | After malformed HTTP attempts exhausted the socket budget, UI showed “Too many requests. Try again in 6 seconds.” Email/password stayed entered; no navigation or logout action occurred.                       |
| Login retry                   | Advance admission clock, explicitly click Sign in; Today loaded.                                                                                                                                                |
| GOOD preview                  | Materials-only synthetic export previewed; characters, weapons and artifacts showed Preserve.                                                                                                                   |
| Commit 429                    | Exhaustion through preview requests rejected Confirm import with 10-second guidance. Export, selected Materials and preview remained; no Import complete state.                                                 |
| Rejected commit preservation  | First two all-table canonical SHA256 snapshots in browser-fixture-results.json match exactly. All rows/metadata included, not just counts.                                                                      |
| Explicit commit retry         | After advancing the clock, the same preview committed; Import complete showed one material entry.                                                                                                               |
| Pending commit / owner switch | A real PostgreSQL owner-A row lock held a subsequent commit at Saving import. Signed out, logged in as B and opened Import, then released the lock. B's draft stayed empty and Import complete remained absent. |
| Registration                  | New disposable C5cBrowserNew account reached Today without import.                                                                                                                                              |
| Manual workflow               | Selected Asia, recorded resin 42; UI showed 42 / 200. No import was needed.                                                                                                                                     |
| Duplicate registration / 429  | Two duplicate attempts retained “Email is already registered.” Next attempt showed 300-second throttling guidance with fields retained. No false success.                                                       |
| Cleanup                       | Signed out before the final registration check, closed the created browser tab, quit helper; all owned resources/listeners stopped and normal web build restored. No viewport override was applied.             |

Saved screenshots: [login rejection](browser-login-429.jpg),
[import rejection](browser-import-429.jpg), [successful retry](browser-import-retry.jpg),
[new owner blank state](browser-owner-switch.jpg), [manual save](browser-no-import.jpg),
[registration rejection](browser-register-429.jpg).

One UI locator attempt looked for Daily Commissions before enabling optional
routines and found no control. Inspection correctly showed routines disabled by
default; manual resin recording then verified the no-import write path. This was
an acceptance-script assumption, not a claimed product defect.

The repository snapshot sentinel refinement and me/status body-parser wiring were
added after this browser run and are covered by subsequent complete verification.
No frontend files changed. Older human zoom, reduced-motion, assistive technology,
voluntary beta, remote CI and deployed-origin gates remain open.
