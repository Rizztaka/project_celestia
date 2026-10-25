# Fixed enemy and player-chosen DPS — 2026-10-25

The owner clarified that enemy details should only explain the test conditions.
Players choose Default or Custom rotation, then explicitly request damage per
second. This supersedes the configurable target and automatic rotation search
controls described in the earlier training-dummy and workspace handoffs.

## Behavior

- One read-only level-100 infinite-HP target, 0% starting resistance to every
  element and Physical, normal level-based defense, no shields or enemy attacks.
- Every run lasts 60 seconds with 20 samples using the existing fixed seeds.
  Team buffs, reactions, resistance reductions, energy and cooldown rules remain
  active. Zero starting resistance does not mean zero defense.
- Default rotation is an explicitly described basic loop: other members use
  Skills, then the chosen main attacker uses Skill and six Normal attacks.
  Players choose the main attacker. It is a starting loop, not a claim of optimal
  play; Custom supports Bursts, combos, order, repeats and waits.
- Default and Custom are explicit radio choices. Switching keeps the custom
  draft. Save rotation persists the chosen mode, default attacker and custom
  steps only when clicked. Show DPS calculates the selected loop; the UI no
  longer selects or searches for a better rotation automatically.
- The primary result is average team damage per second. The explanation states
  DPS = total damage / time, including the full test's setup/cooldowns/waits.
  It does not claim damage is constant each second or measure only the opening
  second. Per-member DPS stays visible; total damage and sample details move to
  Calculation breakdown.

## Compatibility and architecture

`benchmark.calculator.ts` supplies pure canonical benchmark settings and default
steps. UI/explanations remain separate from numeric configuration. Existing
browser gcsim service, worker, pinned engine, validated inputs and coverage gates
are unchanged. The old bounded-search library/tests remain available internally
but have no player-facing control or automatic application in this flow.

The version-1 rotation envelope/key is retained with optional `rotationMode` and
`defaultDriver` fields. Existing nonempty saved steps load as Custom. Legacy
enemy/duration/sample overrides cannot affect new calculations. Reading never
rewrites saved data, and saving Default retains the separate custom steps.
UID/team boundaries, corrupt-storage handling, cancellation, stale-result guards
and mounted-panel state preservation remain covered.

No database/schema/backend change or engine coverage expansion. Nefer remains
unsupported by gcsim v2.47.2, so affected teams still show an explicit whole-team
coverage gate. No fabricated partial total is displayed.

## Verification

150/150 focused tests across 11 files pass, including four new pure benchmark /
rotation-preference tests. Client tests verify the read-only enemy has no editor,
the Default/Custom controls, preservation of custom drafts, fixed settings despite
legacy overrides, worker invocation, arithmetic, saving and stale-result hiding.
Full web lint, production build/TypeScript, scoped tooling lint and diff checks
pass.

Actual Chrome acceptance used only isolated synthetic UID 800000001 and a
synthetic Furina / Skirk / Escoffier / Dahlia lineup. The real WASM engine returned
18,599 average DPS for the six-step custom loop (1,115,924 total / 60 seconds,
20 samples; rounded display), and 15,762 DPS for Default with Skirk selected
(945,748 total / 60 seconds, 20 samples). Saving Default and reloading restored
Skirk while switching back to Custom retained six steps, a 1.5-second wait and
nine Normal attacks. The enemy aside contained zero input/select/textarea/button
controls. Responsive checks at 390 and 320 pixels showed no horizontal overflow.

Screenshots show synthetic fixtures, not the owner's damage/build results:

- [Read-only enemy and rotation choices](browser-fixed-dps-choices.jpg)
- [Real-engine average DPS result](browser-fixed-dps-result.jpg)
- [Mobile rotation and Show DPS](browser-fixed-dps-mobile.jpg)

Release follows the owner's existing scoped commit/push/Vercel authorization,
from production e227872. No synthetic fixture or rotation is written on production.
