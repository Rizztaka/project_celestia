# Rotation execution evidence implementation plan

**Goal:** Give contextual readiness and team comparison reliable evidence about
executed Bursts and energy blocks, instead of conflating every retry with ER needs.

**Architecture:** Extend the existing pinned browser bridge and deterministic
summary. Count native action-failure events by reason; do not change combat rules.
Keep interpretation in a calculator and player-facing advice in an explainer.
Use the existing saved-team DPS panel. This is an M2 prerequisite, not completion
of the full [companion specification](implementation_plan.md).

**Tech stack:** pinned gcsim revision
`caf738dc807a646e2eee7e7b572f225dd6deb510`, Go 1.27.3, browser WASM, TypeScript,
React, Vitest. Work in the canonical checkout, preserving existing changes.

## Design decisions

The old aggregate count cannot distinguish energy from cooldowns. Upstream
`FailedActions` intervals keep only the initial reason until the action succeeds;
assigning the entire interval to that reason would misstate mixed causes.
Instead subscribe to existing `OnActionFailed` events and count each observed
reason. These are retry checks, not seconds, missed Bursts or distinct failures.
Executed action counts come from the existing action event log.

Expose versioned diagnostics. Old results without the new schema remain usable
for DPS but have unknown diagnostics. Partial/malformed diagnostics must fail
validation. Average counts over samples using all samples, including zeros.
An omitted Burst is untested energy demand, not an energy-ready verdict. A
positive energy block suggests checking particle collection, frequency and ER;
it does not prove that more ER is the best upgrade. Existing full-start energy,
fixed dummy and no-survival scope remain visible.

Alternatives considered: fixed ER thresholds lack team/rotation evidence;
reason-labelled interval durations inherit the upstream initial-reason ambiguity.
Native event counts provide directly observable evidence without changing rules.
This implementation choice follows the active autonomous goal and existing M2
plan; it does not introduce a new user requirement or certify endgame readiness.

## Tasks and regression proof

- [x] Add failing real-engine tests: repeated Skill yields cooldown checks, repeated
      Burst with no particle generation yields energy checks, executed counts match
      actions, same seeds retain identical damage. Preserve pre-change numeric receipts.
- [x] Add summary tests for averaging counts, old-result unknown state, malformed
      maps and partial diagnostics. Implement the versioned bridge/summary and bump
      the engine receipt/version after rebuilding the verified exact source.
- [x] Add calculator/explainer tests for blocked energy, cooldown-only, omitted and
      unexecuted Bursts and missing diagnostics. Render this evidence in saved-team
      results; retain the original build inputs and DPS numbers.
- [x] Verify actual browser worker delivery and rendered panel with synthetic data.
      Run focused tests, web build/types/lint and source/asset hash checks. Record
      evidence and limitations in the progress artifact and current handoff.

## Review focus

No-Burst loops must not be called energy-ready. Cooldown retries must not suggest
ER farming. Missing diagnostics must not become zero failures. Mixed samples
must average across all runs. Old cache/engine results must not reuse current
readiness evidence; the changed engine version and raw WASM hash invalidate them.

## Source inspection

Reviewed the exact pinned
[failure reasons](https://github.com/genshinsim/gcsim/blob/caf738dc807a646e2eee7e7b572f225dd6deb510/pkg/core/action/failure.go),
[failure emission](https://github.com/genshinsim/gcsim/blob/caf738dc807a646e2eee7e7b572f225dd6deb510/pkg/core/player/exec.go)
and [action collector](https://github.com/genshinsim/gcsim/blob/caf738dc807a646e2eee7e7b572f225dd6deb510/pkg/stats/action/action.go).
The source checkout and verified official Go archive stay ignored under
`.local-maintenance/engine-review/`; third-party source is not committed.
