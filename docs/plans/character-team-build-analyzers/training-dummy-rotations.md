# Training dummy, rotation builder and bounded search — 2026-10-25

The owner requested one consistent, non-dying enemy for damage checking and
comparison, an identifier for the strongest rotation, and a player-friendly
rotation builder. This follows production commit `7883059` in the existing
`D:/Genshin Personal/celestia-build-analyzers` checkout. The owner has authorized
committing and publishing this ongoing feature. No database migration or API
runtime change is needed.

## Target and comparison conditions

New rotations default to a **level-100 neutral training dummy with 0% starting
resistance to all seven elements and Physical**. A standard preset sets the same
level and 10% uniform starting RES. Custom level/uniform RES remains available.
Existing saved settings are retained and identified as standard/custom as
appropriate, rather than silently changing previous tests.

The engine receives exactly one stationary target without an `hp` field. This
uses its duration-based mode, so the target cannot die and stop the test early.
Do not emulate infinite HP by setting an enormous finite HP number: setting HP
switches gcsim to damage mode and ignores the configured duration. The dummy has
no shields/phases/attacks or HP-threshold particle drops. Normal level-based DEF
and the team's actual resistance reductions remain active. Starting at 0% RES
does not mean disabling DEF or team debuffs.

Every candidate and its current-rotation baseline use the same saved builds,
target, duration, swap/energy/cooldown rules and matching seed ranges. Result
labels show these conditions. Target/build/rotation/settings changes invalidate
old results and comparisons. No cross-condition percentage gain is presented.

Verified against the [official configuration reference](https://docs.gcsim.app/reference/config/)
and the pinned engine's enemy/simulation source. The engine/WASM/license pin is
unchanged; its existing Nefer coverage gap is preserved and clearly blocks
unsupported whole-team calculation and search.

## Player-facing builder

- Character portrait cards expose supported Skill (E), Burst (Q), Normal and
  Charged attack buttons. Clicking adds an action; unsupported kits have no
  invented actions.
- A readable repeating-loop preview shows names, actions, repeats, parameters
  and waits. Step cards allow character/action changes, repeats and up/down
  reordering, with accessible button names and boundary disabling.
- Waits use **seconds**, rounded to engine frames internally. Existing saved
  frame waits remain compatible. Clearing a number leaves a valid empty input
  and blocks calculation until corrected, without rendering NaN.
- Character notes and numeric engine parameters remain under Advanced action
  options. Existing basic templates and explicit Save rotation remain.

## What the rotation search does

The pure deterministic planner groups consecutive actions for one character
into turns, preserving each turn's internal combo, waits and parameters. It
tests alternate turn orders and 3/6/9 repeats of the last Normal attack step.
The current rotation is always candidate 0. Plans are cloned, deduplicated and
bounded to 12 (Quick) or 48 (Wider) candidates and at most eight character turns.
All four-turn orders are represented in the wider search; larger permutation
spaces are capped deterministically, including adjacent swaps before traversal.
The manual calculator retains its existing 64-step/200-action limits.

A single worker screens candidates with seed 1, then verifies the top three
screened candidates plus the baseline with the selected sample count and seeds
1 through N. Finalists are ranked by mean DPS for the fixed duration, with
stable tie handling. Baseline verification must succeed; failed alternative
evaluations are excluded and counted explicitly. Zero-damage baselines have no
invented percentage gain. The UI shows ranked results, a readable sequence and
relative measured DPS. **Use this rotation** explicitly applies a tested plan
and its matching result; **Save rotation** remains a separate explicit action.

The feature reports **best verified/tested**, not a guaranteed global optimum.
It cannot exhaust all timings, animation cancels, arbitrary combo patterns,
parameters or longer rotations. Screening can miss a stronger unverified
candidate and random crit/proc variance can affect rankings. Increasing samples
can change the winner. No optimality, significance or in-game guarantee is
claimed. The UI states the scope and limits next to the action and results.

The batch worker initializes the pinned engine once, uses common fixed seeds,
yields between samples and reports both screening and verification progress.
Cancellation, a 240-second timeout, unmounts and errors terminate the worker.
The main thread remains responsive. Asset loading stays lazy; builds are not
sent to an external simulation service. The worker URL has a protocol revision
suffix so the new batch interface cannot reuse a stale single-job script.
The worker also accepts the previous single-job protocol, so already-open pages
keep working until the player refreshes.

## Verification

**145/145 tests across ten files pass**, including the existing 137 tests plus
new pure planner/ranking, service lifecycle and UI behavior checks. New checks
cover preserved combos/timing, all 24 four-turn orders, deterministic limits and
deduplication, 3/6/9 attack variants, ties/zero baselines, matching finalist
samples, baseline/error gates, incomplete responses, cancellation and timeout
cleanup. React/IndexedDB checks verify action buttons, reorder controls, presets,
explicit winner application/save, target invalidation and preserved saved teams.

The **shipped browser worker runs unchanged with the real WASM** in a Node test
harness using local same-origin asset reads. It decompresses and verifies the
asset, runs multi-job and successive batches, reproduces the same seeded
results, rejects invalid jobs, and completes exactly 600 frames for a ten-second
neutral dummy test. This is in addition to the existing engine conservation,
resistance and fresh-runtime reproducibility tests.

Web production build/TypeScript, full web lint and changed API tooling lint pass.
React review preserves pure planning, controlled fields, safe cleanup, explicit
mutation actions, accessible labels and lazy engine loading. No new dependency,
AI service, backend route or change to team/rotation storage schemas was added.

Browser acceptance used synthetic UID 800000001 on isolated ports 45760/45771.
The actual picker-saved Furina/Skirk/Escoffier/Dahlia fixture was opened, a
1.5-second wait became `wait(90)`, reordering moved the whole step and a Burst
button appended a supported action. The target configuration contained exactly
one level-100 target with zero RES and no finite HP field.

A real Quick search screened 12 candidates and compared four finalists over
seeds 1–10 for 60 seconds. Baseline measured **16,737 DPS**; best verified
alternative measured **18,508 DPS (+10.6%)**, changing the Skirk Normal attack
repeat count from six to nine in the tested loop. These are synthetic results,
not the owner's actual builds or a team recommendation. Explicit application
updated the builder and corresponding DPS; changing the dummy to 10% RES hid
the result. Explicit save/reload retained neutral settings, the 1.5-second wait,
Burst and nine attacks. A wider search was cancelled and became usable again.
390px/320px layouts had no horizontal overflow; action buttons and step controls
fit. Temporary viewport overrides were reset. No production team was changed.

Evidence:

- [Dummy and action palette](browser-rotation-builder-desktop.png)
- [Verified ranking](browser-rotation-search-desktop.png)
- [390px dummy](browser-training-dummy-390.png)
- [390px actions](browser-rotation-builder-390.png)
- [320px steps](browser-rotation-builder-320.png)

Release is a scoped commit and fast-forward push to master, followed by exact
Vercel commit/alias and published worker checks. Scratch receipts and temporary
tooling stay untracked. The original messy checkout remains untouched.
