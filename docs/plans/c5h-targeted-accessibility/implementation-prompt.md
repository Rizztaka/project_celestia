# C5h — targeted accessibility verification

> **Superseded before harness execution, 2026-10-17:** The owner changed scope to
> production readiness, broader game data, all four servers and Seelie-inspired
> planning. See [the active implementation plan](../production-readiness/implementation_plan.md).
> The technical-subset authorization below is historical. Do not restart this
> acceptance loop automatically; actual reader evidence remains unperformed.

Prepared 2026-10-17; amended by explicit owner authorization on 2026-10-17.
**Technical checks authorized; screen-reader verification remains open.**
The owner approved separating the three technical checks from the unavailable
reader check with “then do it”. This amendment supersedes the original all-checks
reader prerequisite recorded in `preflight.md`; it does not grant an accessibility
pass or change the owner's C5g local decision.

## Outcome and prerequisites

Resolve the specific remaining C5g accessibility evidence gaps, correct only
demonstrated essential failures, and deliver one readiness disposition. Preserve
completed observations and the owner's explicit **local CONTINUE with recorded
gaps**. That decision is not a release authorization or a full accessibility pass.
Quality takes priority over speed; missing evidence must remain visible.

The technical session may proceed without a reader operator. Before starting the
harness, assess supported browser/native control for actual zoom, native sizing
and motion settings using the installed skill. C5g ended at a URL-policy check;
do not assume a new attempt fixes it. Execute only checks whose required controls
are available; document exact unsupported boundaries without substituting viewport
resizing for actual zoom or source inspection for rendered motion. If no technical
check can be performed, stop before starting the harness or changing application
code. Any policy stop still ends automated UI work; no controller bypass.

Actual reader verification still requires a competent operator with an existing
usable reader. The owner confirmed no reader experience; leave this check
**unperformed** in this session. Do not ask again, install a reader, turn this into
a training session, substitute DOM inspection for reader use, or infer human
acceptance. Do not repeat the completed general owner walkthrough or create a new
acceptance phase. Finish this bounded technical subset and retain readiness HOLD
while essential evidence remains missing.

## Setup and starting state

Recommended: **GPT-6 Astra / Extra High**, one local agent, normal execution mode,
**This computer**, **New worktree off**, existing checkout
`D:\Genshin Personal\project-celestia`, branch master. Keep existing permissions.
No environment is acceptable; explicit synthetic environment guards below still
apply. Do not change app/model settings or automatically create a chat/worktree.

Start with `docs/plans/CURRENT_HANDOFF.md`, applicable repository instructions and
actual cwd/HEAD/index/status. Expected HEAD:
`2d8820a48db83d7c62feebd849f2f1c2d3488bb6`, master, empty index and substantial
intentional uncommitted work. Capture a fresh baseline before edits. If opened in
a different checkout, use the existing authorized D: checkout; do not reconstruct
from HEAD or copy secrets.

Read:

- C5g `implementation_review.md`, `review-validation.json`, `acceptance-results.md`,
  `observations.md`, `gate-decision.md`, `validation-results.json`, `cleanup.json`,
  `preservation-check.json` and `walkthrough.md`.
- C5e `owner-walkthrough.md` for the established synthetic accounts and GOOD
  payload, using only the missing paths below.
- C5d `commands-and-cleanup.md` and `beta-readiness.md`, plus C5c
  `review-fixture-provenance.md` before fixture use.
- The currently installed Computer Use `SKILL.md` and required supporting guidance,
  discovered from the current skill catalog. Do not hardcode a plugin version.

C5g changed one grid class line in `GoalForm.tsx`. Its full recovery/verification
passed 1,006 tests / 55 files / 133 actual PostgreSQL cases, none failed/skipped.
Its follow-up review freshly passed 31/2 and hash-verified the full reports without
rerunning them. Treat both as inherited evidence until actually rerun.

## Controlled session

When supported control permits at least one named technical check, start the unchanged harness in an interactive
PowerShell terminal:

```powershell
$env:NODE_ENV='test'
$env:DOTENV_CONFIG_PATH='NUL'
pnpm --filter @celestia/api exec tsx tooling/account-data-browser.mjs --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5c-request-safety\review-fixture.json'
```

Wait for `C5D_BROWSER_READY` before opening `http://127.0.0.1:45449`. Use only its
disposable synthetic accounts and the existing C5e payload. Prepare the known
HuTao Base talent / Normal attack / declared 1 / target 6 / priority 3 goal as
needed; distinguish setup input from keyboard-test evidence. Never use ordinary
database configuration or submit a real account deletion.

Use one UI controller at a time. Explicitly hand control to the operator and stop
agent inputs until returned. Ask one focused observation at a time. Capture brief
results as each check completes so interruptions do not erase evidence. Do not
leave services running during an extended wait. Any policy stop ends automated
UI work; do not switch controllers/tools to bypass it. Perform owned non-UI cleanup
where permitted and record the exact remaining boundary.

Record current browser/version, actual menu zoom, CSS viewport, DPR, outer-window
size, original motion setting and reader/version. Keep browser zoom distinct from
viewport resizing. Record source as agent observation, operator report or inherited
evidence; no new test may borrow a historical version or setting silently.

## Only the remaining checks

| Check                      | Required evidence and pass boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Original 400% reproduction | Use actual menu zoom 400% and supported native window sizing to reproduce a **191px CSS viewport width**. Record actual geometry; never substitute 230px or a viewport override without marking the original reproduction unresolved. Observe readable 1 and 6 in the corrected stacked fields. Use actual keys to edit/save, reject a duplicate with exact draft retention, and Cancel with visible return focus. Retain a synthetic after screenshot with geometry. If exact width cannot be reached, report the measured width and unresolved boundary. |
| Missing 200% paths         | Set actual menu zoom 200%, record geometry. Keyboard goal edit/save, duplicate rejection with Base talent/HuTao/Normal attack/1/6/priority 2 retained, and Cancel/return focus. Complete Characters import preview, labelled counts-region scrolling, reachable Confirm import, completion and restart focus. Existing 200% account cancellations need no repeat unless a relevant correction affects them.                                                                                                                                                |
| Reduced motion             | Record original setting; apply a supported OS preference or explicitly identified browser emulation. Verify the effective browser media preference as supporting evidence. Inspect actual sign-in and Today reload, navigation and form-error movement/fading. Source CSS or media-query truth alone is insufficient. Restore the exact original preference and verify it.                                                                                                                                                                                 |
| Actual reader behavior     | Competent operator records reader/version and actual landmarks/headings, form labels, checked/disabled states, duplicate errors, saved state, goal-editor focus return, import review/completion and routine-title announcements. Record missing, repeated or confusing output and exact reproduction. DOM/AX inspection and agent summaries alone cannot close this check. Save concise actual announcement notes; do not invent spoken output.                                                                                                           |

Use Tab/Shift+Tab/Enter/Space and supported Escape/arrows for keyboard evidence.
Observe visible focus and exact return targets; locator filling or activeElement
alone is insufficient. Internal scrolling of the labelled import table is allowed.
Do not require Escape to dismiss an ordinary form without a dismissible popup.

Do not repeat the completed owner's 400% tasks or broad usefulness interview.
Preserve prior coaching and the partial receipt/export-age, manual-data and
goal-history answers. Reader results do not establish unfamiliar-user comprehension.
Do not reinterpret the preference for unfinished work as a redesign request.

## Corrections and verification

Investigate reproducible essential failures before editing. Make the smallest
necessary correction, retest the failed path at the same effective setting and
relevant adjacent behavior, and preserve before/after observations. No speculative
visual redesign, catalog expansion, dependencies or operational-feature build.

Preserve session/owner isolation, explicit write intent, unknown/unavailable
states, all thirteen migrations, test floors, protected files, formatter exceptions,
historical raw evidence and fixture/recovery guards. Never rerun historical one-run
reconciliation/cleanup scripts, including C5g's. If interrupted, inspect exact
ownership and use existing guarded procedures without force deletion or guard edits.

For application behavior changes, run proportionate existing tests (add coverage
only for a meaningful uncovered behavior), actual UI regressions and this unchanged
full command once after final code changes:

```powershell
$env:NODE_ENV='test'
$env:DOTENV_CONFIG_PATH='NUL'
pnpm run recovery:rehearse --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5c-request-safety\review-fixture.json' --verify
```

If application code is unchanged and no concrete regression concern exists,
hash-verify inherited full reports and check final documentation/preservation;
do not rerun the full suite solely to obtain another count. The historical
classifier's 106 is distinct from the eight integration suites' actual 133.

## Cleanup, disposition and stop

Restore and verify initial zoom, motion and any changed window geometry. Close only
owned tabs. Type `quit`, await exit and all four harness cleanup flags, then verify
owned resources/processes, ports, lease, generated credentials and ordinary web
build. If only the operator can verify restoration, label it operator-reported.
Do not delete inherited directories or retain running services while awaiting input.

Deliver `acceptance-results.md`, `validation-results.json`, `cleanup.json`,
`preservation-check.json`, `gate-decision.md` and `walkthrough.md` in this directory;
update CURRENT_HANDOFF with a dated note. Link each formerly missing check to its
new evidence or exact remaining blocker. Separate technical pass/fail, human
observations, residual defects and unavailable evidence.

Keep the owner's C5g local CONTINUE decision attributed and unchanged. Request a
new decision only if materially new findings require it; silence is not approval.
Give one readiness recommendation from the resulting evidence. An accessibility
pass still leaves support/lost-access, operator recovery/retention/erasure,
exact-build remote CI/deployed-origin/ingress, source upkeep and deployment/invitation
gates open with their existing required decision providers.

No reset/clean, staging, commit, push, deployment, invitation, normal migration,
new dependency, recurring task or C6/C7. Do not automatically propose another
identical acceptance loop. Stop after this bounded phase.
