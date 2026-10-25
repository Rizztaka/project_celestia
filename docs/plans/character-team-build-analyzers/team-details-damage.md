# Dedicated team pages and damage simulation — 2026-10-25

The owner asked for each saved team to open its own page, for actual composition
damage calculation, and for roles to remain only if useful. This continues the
owner's authorized commit/push/production-deployment workflow. Work took place in
`D:/Genshin Personal/celestia-build-analyzers`, based on production `f550545`;
the original messy checkout and inherited scratch files are preserved.

## Delivered behavior

The existing maker and compact saved gallery remain at `/u/:uid/teams`.
Each card is now a keyboard-accessible link to `/u/:uid/teams/:teamId`.
That page shows all four observed builds, existing overview/comparison/editing,
duplicate/delete actions and a collapsed damage-calculation section. Old
`?team=id` gallery links redirect. Full character pages return to the exact team.
Missing local teams explain the UID/browser boundary and offer a way back.

Roles are explicitly optional build purposes. They select the existing reviewed
main-stat, talent and composition advice; selecting one does not confer buffs or
multiply damage. Role selectors are omitted for kits with no reviewed role
coverage. This advice currently covers Furina, Sucrose, Skirk and Xilonen with
the existing constellation/coverage restrictions. Damage engine coverage is
independent of that advice catalog.

The damage panel runs pinned gcsim v2.47.2 combat logic in a dedicated browser
worker. Inputs include the four observed builds, explicit action sequence,
repeat/wait counts, numeric action parameters, duration, enemy level/resistance
and sample count. The editable basic skill/normal-attack loop requires the user
to choose an on-field attacker and is labeled as an unoptimized starting point.
Other members' Skills precede the driver's Skill/attacks so swapping does not
immediately end a driver's stance. Bursts and timing must reflect actual play.

The panel reports mean DPS, total damage, per-member contribution and fixed-seed
sample range. It reports action waits and idle members. Cancel terminates the
worker; errors/timeouts leave the form usable. Changing any analysis input hides
old results. Rotations/settings are saved only with the explicit Save rotation
action, separately per UID/team. Existing team and observation storage formats
are unchanged. Teams are still browser-local; a separate URL is not a server-side
share link.

## Calculation and architecture

This adapts the build-intelligence skill's deterministic calculation/explanation
separation to the existing public browser-only analyzer architecture. Pure typed
`calculator.ts` builds validated numerical inputs; `explainer.ts` translates
structured issues. A service manages worker lifecycle; React renders results.
No artificial API/controller/database feature was added just to imitate the
skill's default server directory layout. No runtime AI, new account requirement,
database migration or backend deployment is needed.

The adapter uses exact numeric avatar/form, weapon and artifact-set identities.
It supplies progression, **base** talents, artifact main stats once and substats;
percentage points are converted to engine fractions. Final observed combat
totals, weapon stats, set bonuses and constellation talent boosts are not added
again. The engine handles base progression, weapons, sets, attacks, buffs,
reactions, cooldowns and energy. Whole-team output is blocked for unknown kits,
unsupported equipment, incompatible weapons or incomplete observed inputs.

Seeds 1 through N are passed directly to the upstream evaluator. The browser
downloads about 9 MB only when Calculate is clicked, decompresses it and verifies
the raw WASM SHA-256 before execution. Calculations stay on-device. The artifact
is built from MIT commit `caf738dc807a646e2eee7e7b572f225dd6deb510`, not current
floating upstream main. All distribution licenses, exact bridge source, matching
Go runtime, builder, numerical identity metadata and integrity manifest ship.
[Reproduction and source references](../../../apps/api/tooling/gcsim/README.md).

## Limits that must remain visible

- The pinned engine has 124 character/forms, 237 weapons and 55 artifact sets.
  **Nefer is absent**. Teams containing Nefer receive a coverage explanation and
  no partial team total. Some other new equipment/forms may also be absent.
- Numerical output describes the chosen rotation/enemy, not optimal play or a
  guarantee of actual in-game damage. The starter has no claim to optimality.
- Single stationary enemy; full starting HP/energy; no external particles;
  12-frame swap delay; cooldown/energy checks enabled. Conditional mechanics use
  the engine defaults unless exposed through supported action parameters.
- No enemy-wave, multi-target, arbitrary GCSL editor, auto-optimized rotation,
  automatic best-team ranking or new reviewed character guidance is claimed.
- Engine upgrade requires coverage, combat, licensing and artifact review.
  Do not silently replace the pin with floating main.

## Validation

**137/137 focused tests across nine files pass**, including real unmocked WASM
runs, repeatability across fresh runtimes, damage conservation, resistance
sensitivity, artifact-only stats, missing-data/coverage gates, script injection
bounds, result invalidation signatures, UID/team preference boundaries, actual
IndexedDB team editing and routed gallery/detail/back/legacy/duplicate flows.
Full web lint and production build (including TypeScript) pass; changed API
tooling lint passes. The engine bridge was compiled with official Go 1.27.3.

Browser acceptance used only the isolated synthetic API/frontend on ports
45760/45771 and synthetic UID 800000001. No fixture or test team was written on
production. A freshly created Furina/Skirk/Escoffier/Dahlia lineup was saved
through the actual picker/maker, then opened by keyboard into its dedicated URL.
All four builds and optional role descriptions appeared. Character and gallery
return links reached the intended routes.

Actual browser worker/WASM run, 60 seconds, seed 1, enemy level 100:

| Enemy resistance | Team DPS (rounded) | Total damage (rounded) |
| ---------------- | -----------------: | ---------------------: |
| 10%              |             14,971 |                898,270 |
| 50%              |             12,493 |                749,566 |

These are synthetic fixture results, not the owner's builds or a recommendation.
At 10% RES the contributions were Furina 462,488, Skirk 192,903,
Escoffier 224,755 and Dahlia 18,124 (rounding may differ from exact conservation).
Changing resistance removed the old result immediately. A 180-second/50-sample
run was cancelled and Calculate became usable. Reload restored the explicitly
saved 60-second/level-100/10%-RES/one-sample/five-step rotation and all four builds;
a second seed-1 run reproduced the same total. Desktop, 390px and 320px layouts
were inspected; no horizontal overflow and all rotation controls fit. Temporary
browser viewport overrides were reset. A transient Chrome extension overlay
blocked one action but subsequent fresh state and controls recovered normally.

Evidence (synthetic fixtures):

- [Team page](browser-team-details-desktop.png)
- [Damage result](browser-team-damage-desktop.png)
- [390px result](browser-team-damage-390.png)
- [320px controls](browser-team-damage-320.png)

Release uses a scoped commit and fast-forward push to `master`; Vercel production
must be checked against that exact commit. A release receipt is kept in scratch
after publication, without committing scratch/toolchain/source downloads.
