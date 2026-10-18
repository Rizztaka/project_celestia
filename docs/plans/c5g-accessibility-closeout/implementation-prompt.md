# C5g — essential accessibility and comprehension close-out

Prepared 2026-10-16. **Not started.** Execute this bounded phase only when the owner
submits it in a new chat. Preparing this file is not execution authorization.

## Outcome and setup

Close the actionable accessibility/evidence gaps left by C5f, make only demonstrated
essential corrections, and deliver one local continue/hold recommendation. Gather
actual observations. Never convert automated success, a supplied explanation or
missing evidence into human acceptance. Quality takes priority over speed.

Recommended: **GPT-6 Astra / Extra High**, one local agent, execution mode,
**This computer**, **New worktree off**, existing checkout
`D:\Genshin Personal\project-celestia`, branch `master`.
Use the existing permission choice; broader permissions do not improve reasoning.
“No environment” is acceptable; the explicit synthetic guards below remain mandatory.
Do not change model/app settings or start another chat automatically.

Use the installed **Computer Use** skill for browser/native interactions. Read the
current skill path from the available catalog; do not hardcode an old plugin version.
Use supported browser/native APIs, with one controller at a time. Additional
plugins, dependencies or parallel browser agents are not required.

## Establish the actual starting state

Start with `docs/plans/CURRENT_HANDOFF.md` and the current working tree. Expected
HEAD is `2d8820a48db83d7c62feebd849f2f1c2d3488bb6`, master, empty index and substantial
intentional uncommitted work. Inspect actual cwd/HEAD/index/status and capture a
new baseline before edits. Preserve all inherited work. If accidentally opened
in a worktree, use the existing authorized checkout rather than reconstructing
it from HEAD or copying secrets.

Read applicable repository instructions and:

1. C5f `implementation_review.md`, `review-validation.json`, `acceptance-results.md`,
   `owner-observations.md`, `beta-gate-decision.md`, `walkthrough.md`,
   `validation-results.json`, `preservation-check.json` and `cleanup.json`.
2. C5e `owner-walkthrough.md` for the existing synthetic accounts, payload and
   core journey. Reuse it; do not invent a new broad testing program.
3. C5d `commands-and-cleanup.md` and `beta-readiness.md`; C5c
   `review-fixture-provenance.md` before any fixture run.
4. Current UI/tests relevant to a reproduced failure, not unrelated features.

C5f changed only equipment explanation/readability and one existing rendering
assertion, plus documentation. Full guarded recovery/verification passed
**1,006 tests / 55 files / 133 actual PostgreSQL cases** with no failures/skips.
The follow-up review passed **23 / 2** focused tests and hash-verified the full
result without rerunning it. Review added documentation and a dated handoff;
historical manifests remain historical.

## Known human evidence — do not start over

The owner completed the basic synthetic loop, understood duplicate non-save and
would probably return for goals. Visual hierarchy and oversized password input
were criticized without a demonstrated task blocker. At reported 400% zoom the
owner relied on memory to find options; per-path reachability is unresolved.

Tab/Shift+Tab/Space/Enter, visible focus and import scrolling were reported, but
the complete keyboard journey and exact draft retention were not established.
Reduced motion was not tested with a known effective preference. The owner
reported no screen reader they know how to operate; treat this as unavailable
unless new evidence changes it. Do not repeatedly ask that same question.

Unknown equipment was initially interpreted as present but unrecognized. Revised
copy received an assisted “Yes, that distinction is clear.” This owner is now
familiar with the explanation. A new neutral task can assess retention/use, but
cannot establish unfamiliar-user first-exposure comprehension.

## Work to perform

Save a compact plan/checklist and baseline here. Reassess native/browser controls
once. C5f's browser API lacked actual zoom/motion controls, but native Chrome
inspection and Ctrl+0 worked; do not assume all setting tests are blocked.

Start the unchanged guarded harness in an interactive PowerShell terminal:

```powershell
$env:NODE_ENV='test'
$env:DOTENV_CONFIG_PATH='NUL'
pnpm --filter @celestia/api exec tsx tooling/account-data-browser.mjs --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5c-request-safety\review-fixture.json'
```

Wait for `C5D_BROWSER_READY`. Use only its disposable accounts and the existing
C5e synthetic GOOD payload at `http://127.0.0.1:45449`. No real account deletion
is needed. Historical one-run cleanup/reconciliation scripts must not be rerun.
If a guard fails, retain the exact error and use existing ownership procedures;
never substitute a normal database or weaken guards.

Perform technical checks directly where supported, separately from human
observations. Ask early whether the owner is available for a short session and
continue independent work while awaiting the answer. Do not repeat the whole
routine/import/account walkthrough solely to obtain another general “looks good.”

| Check                        | Required observation and pass boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keyboard-only essential loop | Actual keys through navigation/skip link, goal edit, duplicate rejection, Cancel, import preview/confirmation and account cancellation. Use Tab/Shift+Tab/Enter/Space and Escape/arrows where the control supports them. Observe visible focus, logical order, exact return target and labelled import-region scrolling without mouse rescue. Locator filling and activeElement alone are insufficient. Do not invent an Escape requirement for an ordinary form without a dismissible popup.  |
| Actual zoom                  | Record browser/version, original zoom and window size. Set actual browser menu zoom to 200% then 400%, record the displayed percentage and CSS viewport separately. Check goal editing, duplicate rejection with retained values, cancellation, import review/confirmation and account cancellation. Essential controls must be reachable without clipping/overlap; internal labelled table scrolling is allowed. Viewport resizing is not browser zoom.                                       |
| Reduced motion               | Record original/effective OS preference or explicitly identified supported browser emulation. Verify the effective browser media preference as supporting evidence, then inspect actual sign-in/Today reload, navigation and form-error movement/fading. A CSS/media-query check alone is not a rendering pass. Restore the exact prior state.                                                                                                                                                 |
| Screen-reader behavior       | Only if a competent operator and an existing usable reader are available: record reader/version and actual landmarks/labels, checked/disabled state, errors/saves, import-stage/focus-return and routine-title announcements. Agent technical output inspection, if supported, must be attributed as such; it is not human reader acceptance. If unavailable, record the concrete external evidence gap and finish the other checks. Do not install software merely to manufacture completion. |

For the owner session, state clearly when input control is handed over and stop
agent browser inputs until returned. Give **one concrete task and one short
observation request at a time**, using plain language. Focus on:

- Finding and using the named controls at 400% without step-by-step pointing.
  Record which option was hard to find, what the owner tried, whether help was
  needed, and whether the task completed. Avoid a vague overall zoom rating.
- Inspecting the exact entered duplicate draft after rejection; record actual
  fields/values and cancellation outcome.
- Explaining equipment uncertainty, receipt time, manual/live data and deliberate
  goal completion/history using neutral questions before any new explanation.
  Mark the prior coaching; preserve incorrect/uncertain answers as evidence.
- A separately requested explicit **local continue-or-hold decision**, with the
  unresolved reader/other evidence visible. This does not authorize deployment
  or invitations. An unanswered question is not a decision.

Record per check: source (owner/agent/inherited), environment/version, input,
effective setting, task/expected behavior, observed result, pass/fail/unperformed
or inconclusive, reproduction and evidence. Preserve synthetic screenshots or
actual announcement records where useful, outside Git if they contain private
runtime information. Do not record credentials/tokens in reports.

Investigate demonstrated failures and make the smallest necessary fix. Prioritize
inaccessible essential controls, data loss, misleading saved state and incorrect
data meaning. Use the 400% reproduction to decide whether visual hierarchy needs
a targeted correction; do not launch a speculative redesign. Retest the failed
path and adjacent behavior. Do not add code merely to make the phase look active.

## Verification, cleanup and stopping rule

Preserve session/owner isolation, explicit write intent, unknown/unavailable states,
thirteen migrations, test floors, protected files, raw evidence and unchanged
fixture/recovery guards. No reset/clean/staging/commit/push/deployment, normal
migrations, new dependencies, catalog expansion, C6/C7 or operational-feature build.

For application behavior changes, run proportionate focused tests and real browser
regressions, then the unchanged full command once after final code changes:

```powershell
$env:NODE_ENV='test'
$env:DOTENV_CONFIG_PATH='NUL'
pnpm run recovery:rehearse --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5c-request-safety\review-fixture.json' --verify
```

If no application behavior changed and no concrete regression concern exists,
verify evidence/preservation/formatting and label C5f's full run as inherited.
Never claim it ran again. Distinguish the historical classifier's 106 from the
actual integration count in a fresh report.

Restore exact initial zoom/motion/viewport state and verify it; close owned tabs,
type `quit` and await all four harness cleanup flags. Verify owned resources,
processes, ports, lease, credentials and ordinary web build. If interrupted,
reconcile only exact owned resources under existing guards. Do not leave services
running indefinitely or create recurring work while waiting for human evidence.

Deliver `acceptance-results.md`, `walkthrough.md`, `gate-decision.md` and concise
validation/cleanup/preservation evidence here; update CURRENT_HANDOFF. Separate
technical passes, human results, residual defects and unavailable evidence. Make
one recommendation for the smallest justified next action, with the owner's
decision separately attributed if supplied.

If screen-reader or owner evidence remains unavailable, complete independent
checks and issue a precise hold with who/what is needed. Do not automatically
propose another identical acceptance loop. A local pass still leaves C5d/C5f's
specific support/lost-access, operator recovery/retention/erasure, exact-build remote
CI/deployed-origin/ingress, source-upkeep and deployment/invitation gates open.
Name their required decision providers without inventing commitments. Stop after
this bounded phase.
