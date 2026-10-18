# C5f — owner-local acceptance and beta gate decision

Prepared 2026-10-15. **Not started.** This file becomes the execution instruction
when the owner submits it in a fresh chat. Do not infer that this preparation is
authorization to begin the phase in the preceding chat.

## Configuration and outcome

Recommended: **GPT-6 Astra / Extra High**, one local agent, execution mode, **This
computer**, **New worktree off**, existing project at
`D:\Genshin Personal\project-celestia`, branch `master`. Keep the current permission
choice; no broader access, new environment or model trial is required. The previous
chat's screenshot is historical, not evidence of this chat's effective settings.
Check the actual working directory and available capabilities before proceeding.

Carry out a bounded owner-local acceptance session for the existing companion,
resolve demonstrated essential-task defects, verify changes, clean up and write
one evidence-based continue/hold recommendation. Do not stop at a plan. The owner
must supply their own usefulness observations and any final product decision.

Quality comes first. October 24, 2026 is subscription/continuity context, not a
forced release date or permission to weaken checks. Leave a portable handoff usable
by another local agent without this chat history.

## Preflight and source of truth

Start by reading `docs/plans/CURRENT_HANDOFF.md` and inspecting cwd, branch, HEAD,
index and working status. Expected HEAD is
`2d8820a48db83d7c62feebd849f2f1c2d3488bb6`, branch master, empty index and substantial
intentional uncommitted work. GitHub/HEAD alone does not contain this implementation.
Reconcile unexpected differences; never overwrite them to match an expected hash.
If the chat is in a fresh worktree, use the existing authorized D: checkout when
accessible. Otherwise explain the exact mismatch and request the correct local
chat; do not reconstruct missing work from HEAD or copy secrets blindly.

Read, in order:

1. `.agents/rules/architecture.md` and applicable repository instructions.
2. `docs/plans/c5e-usability-accessibility/implementation_review.md`, `walkthrough.md`,
   `acceptance.md`, `owner-walkthrough.md` and `review-validation.json`.
3. C5e `validation-results.json`, `cleanup.json` and `preservation-check.json` as
   needed to establish the exact baseline. The original preservation manifest
   predates the follow-up CURRENT_HANDOFF note; do not rewrite it to match.
4. `docs/plans/c5d-account-data/beta-readiness.md`, `commands-and-cleanup.md`, and
   `docs/plans/c5c-request-safety/review-fixture-provenance.md` before any fixture run.
5. Current UI/session code and relevant tests for any path that needs investigation.

C5e fixed goal/import focus, save-focus recovery, narrow import counts, sign-in
landmark/styles and loaded-page titles. Its full guarded recovery/verification
passed 1,006 tests / 55 files / 133 actual PostgreSQL cases, no failures/skips.
The follow-up review reran 34 focused client tests and verified hashes; it did not
rerun the full suite or browser checks. Treat these as historical measured results.

Actual 200%/400% zoom, reduced-motion execution, screen-reader output and human
usefulness remain **unperformed**. Prior viewport resizing is not actual browser
zoom. Native automation previously encountered user-input conflicts; browser
automation encountered an open Chrome extension panel. Reassess capabilities once,
then arrange a clear human handoff instead of retrying indefinitely.

## Work to perform

1. Save a compact `implementation_plan.md`, `task.md` and baseline under this
   directory. Reuse the C5e owner walkthrough rather than inventing a new product
   test program. Establish which essential checks tools can actually perform.
2. Start the existing guarded synthetic harness in an interactive terminal after
   reading its runbook. Use `NODE_ENV=test` and `DOTENV_CONFIG_PATH=NUL`:

   ```powershell
   $env:NODE_ENV='test'
   $env:DOTENV_CONFIG_PATH='NUL'
   pnpm --filter @celestia/api exec tsx tooling/account-data-browser.mjs --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5c-request-safety\review-fixture.json'
   ```

   Wait for `C5D_BROWSER_READY`; use only its disposable accounts and the synthetic
   payload documented in the C5e owner walkthrough. Do not substitute a normal DB.
   The old one-run `cleanup-interrupted.mjs` is historical evidence, not a reusable
   cleanup command. Use current ownership guards if a fixture needs recovery.

3. Prepare a working local test tab and ask the owner for one short observation
   session. Give actionable steps, synthetic credentials and the exact local URL.
   First establish when the owner is controlling the browser; do not send inputs
   concurrently. Ask about tasks completed, confusing language, saved/draft/failed
   distinctions and a task they would return to use. Record actual answers with
   attribution, separating owner observations from agent checks and inference.
4. Cover the existing core loop: sign-in; useful routine without import; goal
   creation/edit and duplicate rejection with retained draft; partial GOOD preview
   and explicit confirmation; retained goals/equipment/receipt boundaries;
   focus/navigation/back/reload; account export/deletion review and cancellation.
   No real account deletion is needed. Use prior tests for already covered data
   invariants; repeat browser paths where human acceptance or a new change needs it.
5. Complete the outstanding checks below with observed results. For each record
   browser/version, input method, effective setting, expected and observed behavior,
   pass/fail/unperformed, and evidence/reproduction where useful:
   - **Actual zoom:** browser menu at 200% and 400%, with its displayed zoom recorded.
     Exercise goal editing, failed-save recovery, import review/confirmation and
     account cancellation. Essential controls must remain reachable. The import
     table may scroll within its labelled region. Record CSS viewport separately.
   - **Reduced motion:** record and exercise the actual OS preference, or clearly
     identified supported browser emulation; distinguish those sources. Reload
     sign-in and Today, navigate and trigger a form error. Inspect visible behavior,
     not just the stylesheet. Restore the exact prior setting afterward.
   - **Keyboard:** use actual Tab/Shift+Tab/Enter/Space/Escape and arrows through the
     essential loop. Verify focus visibility/order, editor return and scroll-region
     access. Semantic locator filling alone is not a keyboard-only pass.
   - **Screen reader:** if a reader and a competent operator are available, record
     reader/version and actual landmarks, labels, errors, saves, import-stage and
     focus-return announcements. Check whether routine updates cause distracting
     title announcements. DOM roles alone do not establish the result. Do not
     install software or make broad OS changes merely to fabricate completion.
6. Investigate reported failures, preserve a minimal reproduction and make the
   smallest necessary correction in the existing architecture. Retest the failed
   path and adjacent core behavior. Prioritize data loss, cross-owner leakage,
   misleading saved state and inaccessible essential controls. Add proportionate
   regression coverage where it meaningfully protects the changed behavior.
   Do not manufacture changes if acceptance reveals no defect.

Ask for missing human evidence early and continue independent work while awaiting
it. An unanswered question is not a pass or permission. If the owner is unavailable
or a capability remains blocked, finish independent checks and deliver a precise
**hold** with the exact remaining steps. Do not claim owner acceptance completed,
leave services running indefinitely, or create recurring work to wait for feedback.

## Verification and preservation

Preserve inherited dirty work, session/owner isolation, explicit write intent,
unknown/unavailable states, thirteen migrations, all tests/floors, protected files,
raw evidence and existing fixture/recovery guards. Do not reset, clean, stage,
commit, push, deploy or run normal/production migrations. Do not introduce Turbo,
new dependencies, schema redesign, speculative UI redesign or catalog expansion.

For behavior changes, run relevant focused tests and real browser regressions,
then the existing complete guarded verification once after the final code changes:

```powershell
$env:NODE_ENV='test'
$env:DOTENV_CONFIG_PATH='NUL'
pnpm run recovery:rehearse --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5c-request-safety\review-fixture.json' --verify
```

Read and validate fixture provenance first. If it is unavailable, follow the
existing guarded procedure for a separate disposable fixture; do not repair an
inherited cluster destructively. If no behavior changed, do not rerun the full suite
without a concrete new concern: verify preservation and new evidence/docs, and
label the C5e full result as inherited. Never count skipped/unavailable cases as
passed. The historical classifier's 106 is distinct from 133 actual integration
assertions; report what the new run actually contains.

Stop only owned services, close owned test tabs, restore original viewport/zoom/
motion settings, type `quit` in the harness and await cleanup. Verify resources,
processes, ports, lease and normal web build state. Preserve private raw evidence
outside Git and exclude credentials/tokens/personal data from reports. Record any
interruption or unresolved cleanup precisely rather than hiding it.

## Deliverable and stopping rule

Write `acceptance-results.md`, `beta-gate-decision.md`, `walkthrough.md` and concise
validation/preservation/cleanup evidence here; update CURRENT_HANDOFF with a dated
entry. Separate newly observed results, inherited results, inferences and missing
evidence. List changed files, actual commands/results, resolved and unresolved
defects, owner comments and exact reproduction steps. Do not rewrite old evidence.

The decision document must make **one continue/hold recommendation** for the next
bounded action. It must distinguish local acceptance from external-beta readiness
and record the owner's decision separately if one was actually given. For each
remaining beta prerequisite, identify evidence, concrete missing decision/action
and who must provide it; do not invent an owner or an operational commitment:

- Essential accessibility and actual usefulness/comprehension evidence.
- Accountable support and lost-account/password-recovery policy.
- Operator-owned backup, retention/erasure, RPO/RTO and representative recovery,
  including deleted-identity reconciliation after restoration.
- Exact-build remote CI and deployed origin/auth/preflight evidence, with actual
  ingress and single-process abuse-control limits understood.
- Source upkeep responsibility and disable/rollback procedure for unsupported data.
- Separate owner authorization for deployment and any voluntary beta invitation.

Use the existing C5d readiness assessment to keep this list concrete. Do not build
all these separate capabilities in this acceptance phase. Argon's conditional
shared-auth-permit test gap is a separate bounded follow-up, not a proven production
leak; it must not consume this phase.

Exit with either recorded acceptance and verified essential fixes, or a truthful
hold identifying unavailable evidence and actionable blockers. Recommend the single
smallest next phase justified by those results. Do not automatically create a chat,
contact testers, launch a beta, or begin C6/C7. Avoid an endless sequence of general
hardening phases; use the observed core experience and explicit release gates to
decide what actually remains.
