# Actual browser observations — 2026-10-17

Agent functional checks on the unchanged guarded C5d harness using the C5c review
fixture. Private run: `C:/Users/inuzu/AppData/Local/Temp/celestia-recovery-zMOWa6`.
Waited for READY. Used only `c5b-empty@test.invalid` and synthetic data.
These are agent observations, not a human acceptance or reader session.

| Path                | Actual result                                                                                                                                                                                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First use           | Optional routines remain off, inventory/resin unknown, manual goals usable before import. Getting-started text is collapsed. Routine appears before the long-term goal shortlist.                                                                                                                                      |
| Four servers        | Saved America, Europe, TW/HK/MO and Asia through the UI. Selected labels and UTC−5 / UTC+1 / UTC+8 settings appeared after confirmation. Same-time countdowns differed appropriately: about 19h42 / 13h42 / 6h42 / 6h42 to daily reset. Asia/TW remain separate selections. Server week labels changed with selection. |
| High-tier talent    | Selected the display name Hu Tao, Normal attack, 1→10. Saved through the actual API. Displayed exact totals including Mora 1,652,500, Philosophies 38, Energy Nectar 31, weekly shard 6 and crown 1. Missing stock stayed Unknown.                                                                                     |
| Weapon target       | Selected Staff of Homa by name, 0→6. Saved and included the fourth domain-material tier, elite/common items and Mora. Saturday showed Hidden Palace of Lianshan Formula; Hu Tao's Tuesday/Friday/Sunday source was correctly closed.                                                                                   |
| Duplicate/draft     | Attempted Hu Tao normal 1→10 at priority 2. Duplicate rejection retained type, name, slot, from 1, target 10 and priority 2. Cancel removed the editor and returned focus to Add goal. Read-only control values and actual focus were inspected; this is not a keyboard-only or reader claim.                          |
| Edit                | Changed the existing Hu Tao goal from 1→10 to 6→10 and saved. Confirmed the new range and retained active state.                                                                                                                                                                                                       |
| Character ascension | Selected Raiden Shogun by name, 0→6. Saved; Amakumo Fruit and all other ascension materials became available.                                                                                                                                                                                                          |
| Import preservation | Previewed and confirmed a materials-only GOOD export with eleven quantities of 1, source `Production UI synthetic`. Preview showed all unselected sections preserved; completion reported 11 materials. All three goals, ranges, priorities and active states remained. No real account/export/deletion occurred.      |
| Resin pacing        | Recorded resin 80, enabled Daily commissions, set daily budget 80. Today allocated 80 Original Resin as four optional 20-resin reward sets to the open weapon domain. It explicitly avoided a guaranteed drop/run-to-finish claim. Daily checkbox recording saved successfully.                                        |
| Source drilldown    | Expanded Dead Ley Line Branch: showed “Dropped by Abyss Mages · Stardust Exchange” and the official interactive-map link. This is a source hint/map handoff, not an optimized coordinate route.                                                                                                                        |
| Final material UI   | Reloaded the final build: displayed formatted 2,175,000 total Mora for the edited three-goal plan, recorded 1 and “Need 2,174,999”. Unknown unprovided materials remained unknown. Speculative category badges and unknown-stock progress bars were removed.                                                           |
| Responsive width    | At an explicit 320×800 CSS viewport override, document client/scroll widths both measured 305px. Goal-editor numeric fields visibly showed 6 and 10, each about 205.6px wide. No page horizontal overflow. This is responsive testing, not actual 200%/400% menu zoom.                                                 |

Default viewport after the first override reset measured 1280×720 CSS, with
client/scroll widths both 1265px. The IAB screenshot surface captured only
987×712 pixels at that default; this is a capture/viewport mismatch, not a
demonstrated document overflow. An explicit 987×712 responsive capture measured
client/scroll widths 972/972 and produced the unclipped `today-review.jpg`.
The viewport reset API completed before both owned tabs were closed; final tab
inventory was empty. Browser zoom, OS motion and native window geometry were not
changed. Actual zoom, effective motion and reader behavior are still unperformed.

Private screenshots in
`C:/Users/inuzu/AppData/Local/Temp/celestia-production-300a96498202497babfec0d3d4887d7f/`:
`planner.jpg` (full page, default capture width limitation), `today.jpg` (same
limitation), and `today-review.jpg` (unclipped responsive review).

Three locator mistakes were resolved by inspecting fresh DOM state: uppercase
Email versus the semantic label “Email”, an assumed import page title, and an
assumed completion region. No unknown-outcome write was repeated. The actual
import completion was independently observed after the region lookup failed.
No UI-policy stop occurred in this execution.
