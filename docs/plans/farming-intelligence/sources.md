# Farming evidence and REA record — 2026-10-17

## Seen in pinned upstream artifacts

- [Paimon.moe drop tables](https://github.com/MadeBaruna/paimon-moe/blob/105d0ebd1d551de96668b805d88c2c9a0590177a/src/data/dropRates.js):
  four talent and four weapon difficulty profiles, ordered from lower to higher
  material rarity. The same revision's
  [todo implementation](https://github.com/MadeBaruna/paimon-moe/blob/105d0ebd1d551de96668b805d88c2c9a0590177a/src/routes/todo.svelte)
  selects those profiles by difficulty, advances each modeled reward set by 20
  resin, and converts three excess lower-tier items to one higher-tier item.
  Celestia parses the numeric literals without executing that upstream JS and
  implements its own bounded binary-search calculator. Original
  [MIT notice](../../third-party/paimon-moe-LICENSE.txt) is retained.
- [canvas-genshin-maps coordinates](https://github.com/qiuxiang/canvas-genshin-maps/blob/2154df87e9e4ac8a0733c7603120603cc1d489b6/data/maps-data.json):
  actual surface-map points, label categories and location anchors. The types in
  that revision define planar x/y values and stable point IDs. The normalization
  retains only reviewed enemy/specialty families and teleports, never map tiles,
  images, upstream JavaScript, rich-text comments or executable content. Original
  [MIT notice](../../third-party/canvas-genshin-maps-LICENSE.txt) is retained.
- Progression material IDs/rarities and weekday domains come from the preceding
  [pinned progression snapshot](../production-readiness/sources.md). Every domain
  family must have contiguous material rarities. Reviewed coordinate-label joins
  use exact keys; no fuzzy material matching or inventory aliases are introduced.

Measured normalized coverage: 48 weekday domain families; 48 enemy/gathering
groups with 6,176 coordinate stops and 247 teleport/statue starts. Sixteen enemy
groups map to their three material tiers; 32 gathering groups map to individual
specialties. This is an older Mondstadt–early Sumeru coordinate snapshot, not a
current-patch or all-region map. Unmatched/newer materials stay unavailable.
Untranslated source landmark names are retained rather than guessed.

## Explicit modeling assumptions

Yield profiles are community planning means, not probability distributions.
Celestia applies the selected tier profile as a scenario to supported talent and
weapon families, including newer domains. That extrapolation is not newly
measured evidence for every domain. No player difficulty is inferred; the player
must select it. Sample size, confidence bounds and capture patch remain unknown.

The calculator reserves lower-tier demand before upward crafting. It finds the
smallest integer reward-set count whose mean-yield inventory scenario covers
the family. This approximates planning work; it is neither guaranteed loot nor
the mathematical expected stopping time of a random drop process. No downgrade,
crafting Mora, passive refund, event multiplier or unrecorded surplus is credited.
Missing stock for a required material blocks that family instead of becoming zero.

Calendar pacing starts at the next server reset and shares the selected daily
budget across open sources. It assumes the player chooses to spend that budget
on each eligible day; it does not infer future account resin or enforce a streak.
The first 28 days can be displayed, with a bounded 3,650-day computation horizon.
Unknown families remain outside the explicitly partial totals/dates.

Routes choose at most 20 nearby stops from the chosen teleport, then use
nearest-neighbor and bounded open-path 2-opt ordering. This is a deterministic
planar-distance heuristic, not a global optimum or terrain-aware walking path.
Coordinates do not establish current spawns, elevation, accessibility, unlocks,
enemy level, respawn time or item quantities. A schematic and numbered reference
list expose the actual points; map units are not advertised as meters or minutes.

## REA execution and limits

The owner added the local `reverse-engineer-anything` skill while this task was
running. Its Seen / Guessed / Unknown evidence discipline is applied above. The
new skill file is owner work and remains untouched.

`pnpm view rea-agents` confirmed version 6.5.0 and the official morluto/rea
repository. `pnpm dlx --package rea-agents@6.5.0 rea --help` and the analysis
subcommand help succeeded. No project dependency, lockfile or agent integration
configuration was changed.

Two static analysis attempts targeted only a private copy of the pinned
`dropRates.js`, using `analyze-javascript-application`, exact `--source-path`, a
30-second analysis bound and `--format json`. Both returned
`artifact_operation_failed / integrity_mismatch`, reporting a directory entry
change before opening the file. The second copy was freshly written with Node;
its SHA-256 still matched the pinned original. No
`record-and-continue` integrity override was used. This repeated failure was
observed on Windows; its underlying cause is not established here.

Private raw outputs are `rea-analysis.json` and `rea-clean-analysis.json` under
`C:/Users/inuzu/AppData/Local/Temp/celestia-farming-8JXUDN/`. No successful REA
extraction is claimed. Direct source inspection and independently hashed input
bytes support the Seen findings. The deterministic tests validate Celestia's
implementation; they cannot prove the historical means remain current game data.

## Rebuilding

`apps/api/tooling/build-farming-data.mjs <private-cache> <pinned-progression-source-data.json>`
uses the exact pinned inputs above and their expected SHA-256 values. It refuses
source drift, mismatched progression revisions and ambiguous/missing joins, then
writes the normalized snapshot and license notices. Run the repository formatter
on the generated JSON afterward. Runtime parsing checks its canonical fingerprint
and current progression dependency, validates joins and freezes the snapshot.
