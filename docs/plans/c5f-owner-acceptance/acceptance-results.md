# C5f owner-local acceptance — 2026-10-15–16

Bounded observation and essential correction completed. **HOLD** further progression
pending the specific human evidence in [the decision](beta-gate-decision.md).
Full human accessibility acceptance is not established. The owner supplied useful
observations, but no continue/release decision.

## Session and attribution

- Existing D: checkout, master, unchanged HEAD and empty index. See
  [preflight](preflight.json), [baseline](starting-state.json) and final
  [preservation](preservation-check.json).
- Unchanged guarded synthetic C5d harness with the C5c review fixture. Owner
  session on October 15; assisted wording recheck and final regression October 16.
  Original private run `celestia-recovery-99lkgU` was interrupted. Exact owned
  resources were reconciled before fresh run `celestia-recovery-BXUuIE`.
- Owner explicitly took browser control, then returned it. Agent inputs stopped
  throughout that interval; read-only inspection followed explicit permission.
- Chrome version **155.0.8059.79**, Official Build, 64-bit, reported by the owner
  from the version page. Primarily mouse input with the keys listed below.
- Initial CSS viewport **767×722**, DPR 1.25, no override. CSS viewport at actual
  200%/400% was not captured. Later 697×656/DPR 1.375 corresponded to native Chrome
  showing 110%; this is not evidence of either requested zoom setting.
- Exact responses and interpretation limits: [owner observations](owner-observations.md).

## Observation matrix

| Check / expected behavior                                                                | Source and effective input/setting                     | Result                                        | Observed behavior / evidence limit                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign-in and useful routine without import                                                | Owner; mouse and some keys, initial reported 100%      | Reported complete                             | First two tasks completed. Manual/live-data distinction was not independently explained.                                                                                                                        |
| Goal create/edit and duplicate rejection                                                 | Owner plus agent read-only inspection                  | Partial                                       | Owner explicitly certain duplicate did not save. One active HuTao normal 1→6 goal at priority 4 observed after Cancel. Exact retained draft fields were not confirmed by owner.                                 |
| Editor focus return                                                                      | Owner / agent DOM inspection                           | Partial                                       | Owner described goal centered on screen; agent found keyboard activeElement Add goal. Visual position is separate from keyboard focus.                                                                          |
| Partial GOOD preview and explicit confirmation                                           | Owner; synthetic character-only payload                | Positive overall report                       | Requested import/navigation/cancellation loop “Looked good to me”; individual substeps were not separately narrated.                                                                                            |
| Receipt and retained goal meaning                                                        | Owner explanation                                      | Partial comprehension                         | Receipt understood generally as import time, without explicitly distinguishing game observation time. Manual goal control understood in part; “disappear” does not establish completion/history comprehension.  |
| Unknown equipment meaning                                                                | Owner explanation; then agent reproduction             | Initial comprehension failure; copy corrected | Owner inferred equipment was present but unrecognized. Revised explanation states presence and emptiness are both unknown. Assisted recheck: “Yes, that distinction is clear.” Unprompted recheck remains open. |
| Navigation, Back/reload and account cancellation                                         | Owner; mouse and some keys                             | Positive overall report                       | No task failure reported. Password entry is valued, but oversized input looks out of place.                                                                                                                     |
| Keyboard access/order/return and import scrolling                                        | Owner; Tab, Shift+Tab, Space, Enter actually reported  | Partial                                       | Visible focus and import-region scrolling reported. Escape/arrows, scrolling input method and complete keyboard-only journey remain unverified. Semantic locator regression is not keyboard acceptance.         |
| Actual 200% zoom: essential controls reachable                                           | Owner; reported 200%, mouse/keys not separated by path | Inconclusive                                  | “Could understand to some extent.” No menu capture, CSS viewport or per-path reachability result.                                                                                                               |
| Actual 400% zoom: essential controls discoverable/reachable                              | Owner; reported 400%                                   | Concern; inconclusive                         | Relied on memory to find options. No specific unreachable control established; does not pass essential-path acceptance.                                                                                         |
| Reduced motion: effective preference suppresses motion on sign-in/Today/navigation/error | Owner; effective setting unknown, Windows unchanged    | UNPERFORMED                                   | “Didn't felt anything different” does not establish an effective reduced-motion test. No browser emulation used.                                                                                                |
| Reader landmarks/labels/errors/saves/import stages/focus/title announcements             | Owner reports no competent reader/operator             | UNPERFORMED                                   | No reader/version or actual announcement evidence; DOM semantics cannot substitute.                                                                                                                             |
| Usefulness                                                                               | Owner                                                  | Positive local evidence                       | Would probably return for goals. No recurring-use or external-participant outcome inferred.                                                                                                                     |

## Demonstrated correction and regression

Minimal reproduction: use the empty synthetic account and C5e character-only GOOD
payload, confirm import, open Hu Tao and read the six unknown assignments. Ask what
“unknown” establishes. The owner's original answer asserted equipment presence.

`CharacterEquipmentView.tsx` now says “No equipment assignment is recorded here,
and the equipment import history is unknown” for unknown provenance, followed by
“Celestia cannot tell whether this slot is empty or equipped in-game.” The latter
line uses the inherited 14px body size and lighter text instead of a smaller
footnote. No data, API, import, goal or session semantics changed. One existing
rendering assertion in `tooling/character-equipment.test.js` follows the new text.

Agent browser regression on October 15 showed the revised explanation in all six
unknown assignment notices after reload; 14px computed font size, document
client/scroll width 684/684. Active declared HuTao goal 1→6 remained present with
stored talents 6. October 16 returning-account regression showed StaffOfHoma,
five recorded artifacts, distinct character/weapon/artifact receipts, focus and
completed/active/archived/paused goals. Receipt disclaimers still distinguish import
time from game observation. These are agent checks, not owner acceptance.

Focused tests passed **23 / 2 files**, zero failures/skips. Fresh unchanged guarded
recovery/full verification passed **1,006 / 55 files / 133 actual PostgreSQL cases**,
zero failures/skips, plus lint, types, builds, schema and repository integrity checks.
Exact commands and private report hashes are in [validation](validation-results.json).

## Unresolved observations and scope

Weak visual hierarchy and oversized password input are recorded cosmetic feedback;
no essential task failure was demonstrated. Yellow duplicate wording was initially
described as “not an error,” but the owner explicitly understood non-save. No
duplicate-save defect is claimed. The 400% discoverability concern needs a
task-specific observed reproduction before choosing a fix. Broad redesign is
outside this phase.

C5e's 1,006 / 55 / 133 actual PostgreSQL full result and 34 / 3 focused review are
historical results whose hashes matched preflight; they do not supply human
acceptance. C5f's fresh run is separately recorded. Historical data/session
invariants remain evidence, not invented new browser passes.

## Settings and interruption

Owner reported restoring 100% and leaving Windows unchanged. Native Chrome then
showed 110%; agent Ctrl+0 restored **Zoom: 100%**, with Reset disabled. No viewport
override or OS motion change was applied. Native inspection was available after
handoff despite the browser API lacking zoom control. Initial DOM evaluator limits,
a read timeout, a stale native Reset index and a case-sensitive locator miss were
tool issues, not application failures.

The interrupted original harness did not produce a normal completion record. Exact
owned database/role/tablespace resources were removed after guarded ordinary WAL
recovery; no inherited catalog repair or PID-file deletion. The subsequent harness
quit successfully, restored the ordinary web build and closed its ports. Owned tabs
are absent. See [cleanup](cleanup.json) for final resource/lease/process evidence.
