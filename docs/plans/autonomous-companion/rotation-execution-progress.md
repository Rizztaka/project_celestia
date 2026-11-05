# Rotation execution evidence

Implemented locally on 2026-10-25 as a prerequisite for contextual readiness.
The [overall companion goal](implementation_plan.md) remains active. This does
not complete M2 or replace target-specific readiness and marginal investment.

## Result

Saved-team DPS results now include **Rotation execution and energy**. For each
member, the panel distinguishes observed energy blocks, cooldown retries, a
requested Burst that never executed, and a rotation that never requested a
Burst. An older result has unknown diagnostics and asks for a new calculation.
No new absolute ER target or automatic recommendation to farm ER is inferred.

The existing gcsim bridge now observes native action-failure events by reason
and returns executed action counts. Combat logic and seeds remain unchanged.
The TypeScript summary validates versioned counters and averages over all
samples, including zeros. The calculator interprets counts; the explainer owns
the player-facing advice. Current input signatures already include the engine
version, which is bumped to `gcsim-2.47.2-celestia-2`. The changed raw WASM hash
also changes the worker/asset URLs.

Upstream failure intervals preserve the first reason seen until an action
executes. That makes interval duration unreliable for separating cooldown and
energy causes. The new counters instead count native retry checks. They are
neither seconds nor distinct failed Bursts. [Design and source inspection](rotation-execution-plan.md).

## Verification

- Verified the downloaded source checkout at exact revision
  `caf738dc807a646e2eee7e7b572f225dd6deb510` with no tracked source changes before
  adding the bridge. The official Go 1.27.3 Windows archive matched SHA-256
  `f26081f438319757f8a1b46d7d0b2c5ec7583d4038e485e0aa725cfde7885fff`.
- Rebuilt the WASM and manifest using that source and toolchain. No third-party
  source checkout, raw WASM or toolchain is added to project source; working
  materials stay ignored under `.local-maintenance/engine-review/`.
- Watched the new bridge and summary tests fail against the old implementation,
  then pass. A repeated Skill reports cooldown checks and zero energy checks;
  a repeated Burst without particle generation reports energy checks and one
  executed Burst. Same-seed results are identical.
- Before/after seeded numeric receipts are unchanged: the controlled Skill loop
  yields `70.26634841904867` DPS, and the Burst loop `18.554059559753924` DPS.
  These intentionally simple fixtures test execution diagnostics, not recommended
  teams or real-account performance.
- **31 tests passed across five focused files** in the final serial run, including the new diagnostics
  and rendered advice suites, existing saved-team interaction tests, benchmark
  tests, manifest checks and the real pinned engine.
- Web build/TypeScript and web lint passed; scoped API tooling lint passed.
- The shipped worker ran two controlled jobs with two samples each. All original
  seed-1 fields, including member damage/actions and total damage, matched the
  pre-change receipts exactly. Diagnostics were delivered through the unmodified
  browser-worker script. Evidence: ignored `engine-review/worker-evidence.json`.
- Earlier full API suite in an allowlisted synthetic environment, with dotenv disabled
  and `--maxWorkers=2`: **1,606 passed, 235 integration cases skipped, zero
  failures** across 107 passing and eleven skipped files. The skipped integrations
  remain unverified; this is not evidence of a production database round trip.
  The initial unrestricted-concurrency/non-isolated run had 80 failures. At lower
  concurrency, seventy no longer reproduced; the remaining ten reported the
  fixture environment guard requiring dotenv to be disabled. That isolated full
  run passed without changing those tests or weakening their guards. After the
  review fix, a second parallel run had sixteen failures (mostly five-second
  timeouts plus an asynchronous saved-team assertion), with three worker-update
  errors. That result was superseded by targeted root-cause fixes: K3 release
  tests now share an isolated immutable baseline fixture while preserving
  per-test copied stores, and origin tests reuse the default application instance
  while still resetting modules for configuration-validation cases. The focused
  files now pass **31/31 contextual-release tests and 60/60 origin middleware
  tests** individually; the combined serialized run with one worker passes
  **91/91** with zero failures and zero unhandled worker errors. The release
  lifecycle suite has an explicit 30-second bound because its complete pack
  validation is bounded filesystem work on Windows; assertions and failure hooks
  are unchanged.
- Real browser after the initial attachment delays: created a synthetic saved
  team and ran a single-action Furina Burst loop through the actual worker for
  twenty samples. It reported one Burst and 3,478 energy retry checks per sample.
  The other members correctly showed no requested Burst. The disclosure expanded
  and collapsed with Space; changing rotation removed the old result/evidence.
  No warning/error browser logs and no horizontal overflow at 1265px width.
  Mobile layout is not certified by this check. Screenshot and full AX evidence
  are ignored `engine-review/energy-browser.png` and `energy-browser.txt` files.
  The preview used an isolated fixture environment; no production account or
  database was used.

Independent scoped review found no critical or important defects. It identified
one validation edge case: an absent counter named `constructor` could read an
inherited object property while averaging. A regression reproduced `NaN`, and
the calculator now reads own properties only. Eighteen focused cases, including
the regression, passed after the fix. No review findings remain open. Independent
review did not replace the recorded engine, worker or browser verification.

## Remaining work

The fixed test starts with full energy and no enemy attacks. No observed energy
block does not prove sustained Burst uptime or survival. Energy blocks require
reviewing particle collection, rotation frequency and ER in context; they do not
prove a particular upgrade is best. Current full endgame verdicts, encounter
adapters, actual marginal investment, verified rotations, complete 7.1 knowledge,
joint mode-specific teams, pull value and the fun simulator remain unfinished.
