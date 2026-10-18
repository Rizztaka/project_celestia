# C5e proposal — core journey usability and accessibility

Prepared 2026-10-14 for a fresh phase chat. Proposal only; implementation has not
started. The owner starts this phase by submitting this prompt in the new chat.

Recommended configuration: **GPT-6 Astra / High effort**, one local agent, existing
checkout. This quality-first recommendation supersedes the earlier balanced Sol
recommendation. High is a task-specific starting point, not a measured optimum;
maximum effort is not assumed to guarantee better results. No model comparison has
been run on this phase.

## Owner intent and execution instruction

Implement this phase, rather than stopping at a plan or audit. The owner's latest
instruction is **quality first, step by step, without deadline-driven compromises**.
Build a genuinely useful, trustworthy Genshin companion suitable for unfamiliar
users. The current subscription ends on **October 24, 2026**, but that is continuity
context, not a completion deadline, reduced acceptance bar or forced launch date.
The owner expects to continue with another coding model afterward, so leave a
portable handoff if work remains.

Do the implementation, investigation, review and verification warranted by the
actual risks. Do not defer a necessary correctness fix, weaken validation or call a
phase complete to fit the calendar. Resolve discovered in-scope defects and verify
their fixes. If essential evidence is unavailable, state what remains unverified
and why; do not substitute confidence or test counts for that evidence. No process
can promise zero defects, so make completion claims precise and supported.

Avoid redundant work, repeated model comparisons and arbitrary scope expansion;
thoroughness should address concrete requirements and risks. Each phase runs in a
fresh chat. Finish this phase against its acceptance criteria and prepare the next
bounded recommendation; do not start later phases or create chats automatically.

## Outcome

Make the existing companion core journey practical to use with keyboard, narrow
layouts, browser zoom and reduced motion. Inspect and fix demonstrated problems;
do not expand the feature set or create another general hardening milestone.
End with a short owner walkthrough and an evidence-based list of any remaining
checks. Automated checks do not substitute for human usability or screen-reader use.

A new player must be able to understand what Celestia supports, record a useful
routine without an import, inspect imported equipment and receipts, choose a focus
and goal, and tell saved data from a draft or failed operation. Trust comes from
correct behavior and honest claims, not a large feature list or a passing test count.

## Current state and first reads

Work in `D:\Genshin Personal\project-celestia`. Preserve the intentionally dirty
working tree. GitHub HEAD does not contain the current implementation. Do not reset,
clean, stage, commit, push, deploy, or run normal/production database migrations.

Read these before editing:

1. `.agents/rules/architecture.md` and `docs/plans/CURRENT_HANDOFF.md`.
2. `docs/plans/c5d-account-data/walkthrough.md` and `beta-readiness.md`.
3. `docs/plans/c5d-argon-trial/review-results.md` and `evaluation-results.json`.
4. `docs/plans/c5-companion-beta/acceptance.md` and `usability.md`.
5. The relevant current UI, session guards, tests and existing disposable browser
   fixture tooling. Read its runbook before starting any fixture.

Inspect branch, HEAD, index and working status; record a compact baseline for touched
files. Current expected branch is master, HEAD
`2d8820a48db83d7c62feebd849f2f1c2d3488bb6`, with substantial intentional uncommitted
work. Reconcile any differences rather than overwriting them. Read current code and
the newest dated handoff entries first; older “not started” notes are historical.
Use targeted reads and existing harnesses rather than rereading every old artifact.

C5d is implemented. Its prior full run passed 1,004 tests / 55 files / 133 actual
PostgreSQL cases. The subsequent Argon trial added two HTTP tests, retained with
formatting corrected. That trial passed 53 focused tests plus API lint/types; a new
full 1,006-test result has NOT been measured. Production code was restored after
mutation testing. Do not repeat C5d or represent old evidence as a new execution.

Argon's tests have a documented conditional shared-auth-permit coverage gap. Track
it as a bounded testing follow-up; it is not an observed production permit leak and
must not consume this usability phase. Its database-test suggestion needs isolation-
aware expectations. Original response and evaluation evidence are preserved.

## Working scope

- Reuse the current implementation: sign-in, Today, Characters/focus/goals, Planner,
  import preview/confirmation, and Settings/account controls.
- Cover no-import first use and a synthetic returning account. Preserve existing
  owner/session isolation, explicit write intent, unavailable-data states and limits.
- Check keyboard order, visible focus, route/dialog focus restoration, accessible
  labels/error/status announcements and access to all essential controls.
- Exercise narrow layouts and actual 200%/400% browser zoom and reduced-motion
  preference where tools support them. Do not label viewport resizing or CSS
  inspection as actual zoom, OS preference or assistive-technology execution.
- Record specific reproduced failures and make small fixes with proportionate
  validation. No speculative redesign, dependency addition or catalog expansion.
- Make supported server/data boundaries understandable at the decision point.
  Currently supported costs are narrow and production farming routes remain
  unavailable. Do not present unavailable advice, imported observations, estimates
  or manual records as verified live game progress. Preserve useful manual tracking.
- If an essential check requires human interaction unavailable to tools, prepare
  exact short steps for the owner and finish independent work. Do not claim that
  check passed. Owner-local use is not a public beta invitation.

Use one local implementation agent. The current owner authorization for quality-first
local implementation supersedes historical model/day role assignments for this phase. Do not make an
external-model review a mandatory step; use the code and measured results to resolve
routine decisions. Do not upload files or message another service automatically.

## Execution sequence and acceptance

1. Save a short `implementation_plan.md` and `task.md`. State the journeys, observed
   failures, likely files and checks. Begin the work without asking approval for
   routine reversible changes already authorized by this prompt.
2. Start a guarded disposable app fixture. Exercise the current behavior before
   editing. Record actual viewport, input method and how failures were induced.
3. Fix demonstrated defects in small groups. Prioritize blocked core tasks, lost
   drafts/misleading success, inaccessible essential controls and unclear support
   boundaries before cosmetic polish. Retest each changed path.
4. Validate the complete core journey after fixes. Record pass/fail/unperformed
   separately; include navigation/back/reload, no-import use, import preview and
   retained goals, failed-save recovery, keyboard focus and narrow-layout controls.
   Reuse existing verified session/import tests and add regressions only where the
   changed behavior needs them. Do not rewrite unrelated flows to increase coverage.
5. Produce a brief walkthrough the owner can perform in about 15 minutes, using
   synthetic data. Ask for observed usefulness/confusion, not a vague approval.
   Never fabricate observations or contact testers without authorization.
6. Close the phase with verified fixes and exact outstanding human checks. If no
   defects are reproduced, report the evidence without manufacturing a code change.

If a genuine data-loss or cross-owner issue is discovered, prioritize it over
cosmetic work and fix it within the existing architecture when possible. For a
change that requires a new product contract, external access or expanded authority,
record the concrete blocker and continue independent in-scope work. Do not quietly
turn this phase into account recovery, a schema redesign or a new service.

## Validation and completion

Use only disposable synthetic fixtures through the existing safety guards. No real
account deletion or normal database access. Use `NODE_ENV=test` and
`DOTENV_CONFIG_PATH=NUL` for applicable local test commands. Do not introduce Turbo
or weaken inherited tests, safety limits, formatter exceptions or database guards.

Run focused checks for changes first, then the existing required final verification
for the completed scope. Do not repeat a passing full suite without a new reason.
Use installed package scripts and the preserved guarded entry points; do not guess
commands or count unavailable/skipped database cases as passed. The current complete
recovery/verification entry point, after validating its disposable fixture, is:

```powershell
$env:NODE_ENV='test'
$env:DOTENV_CONFIG_PATH='NUL'
pnpm run recovery:rehearse --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5c-request-safety\review-fixture.json' --verify
```

Read `docs/plans/c5d-account-data/commands-and-cleanup.md` and the fixture provenance
before using this command. If that owned fixture is unavailable, use the existing
guarded procedure to create a separate disposable fixture; never substitute a normal
database or repair an inherited cluster destructively. Preserve all existing
discovery, floors, migration history, protected-file and raw-evidence checks.
Preserve prior evidence rather than regenerating old manifests to match new edits.
Stop owned temporary services and restore any temporary browser/build settings.

Save a concise plan/checklist and final walkthrough under this directory. Record
what changed, actual validation, outstanding human checks and fixture cleanup.
Prepare a short owner walkthrough of the core loop with space for actual feedback.
Update the current handoff so the next fresh chat can continue without this history.

The final handoff must include: changed files and behavior; exact checks actually
run; remaining reproducible defects and human-only checks; how to run the synthetic
walkthrough; cleanup status; and one recommended next phase with a concrete exit
condition. Distinguish local implementation from deployed evidence. Identify the
smallest remaining blockers to a trustworthy external beta (including support/
account recovery, operational recovery, deployed origins/CI and source upkeep as
applicable), rather than claiming this UI phase closes those separate gates.
Keep the handoff usable by Opus or another local coding agent without chat history.

Stop at this phase's outcome. Deployment, operator/backup/retention decisions and
public beta invitation remain separate. C6/C7 require useful real-use evidence and
a product decision; do not start them automatically. Prefer a finite outcome and
clear remaining decisions over continually inventing additional foundation phases.
