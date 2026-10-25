# Pinned team damage engine

Celestia runs gcsim v2.47.2 in a browser worker. The upstream source is pinned to
[`caf738dc807a646e2eee7e7b572f225dd6deb510`](https://github.com/genshinsim/gcsim/tree/caf738dc807a646e2eee7e7b572f225dd6deb510),
whose LICENSE is MIT. Do not rebuild from floating `main`: upstream licensing and
combat coverage can differ. Preserve all distributed license notices.

`celestia.go` adds `runCelestia(config, seed)` alongside upstream `cmd/wasm`.
It supplies the explicit seed to the existing evaluator/simulation and returns
numeric team/member damage. It does not modify character, weapon, artifact,
reaction, energy, cooldown or combat rules. Celestia uses seeds 1 through N,
not upstream's randomly seeded browser entry point.

## Rebuild

Extract the exact upstream revision and use an official Go toolchain compatible
with that source. The checked-in artifact was built with Go 1.27.3 on Windows
amd64; the official Windows archive SHA-256 was
`f26081f438319757f8a1b46d7d0b2c5ec7583d4038e485e0aa725cfde7885fff`.

From the repository root:

```powershell
node apps/api/tooling/gcsim/build.mjs <absolute-upstream-source-directory> <absolute-go-binary>
pnpm --filter @celestia/api exec vitest run tooling/team-damage.test.js
```

The builder verifies the pinned LICENSE, compiles `js/wasm` with local Go,
compresses the engine, copies its matching runtime and dependency license
notices, extracts exact numeric character/form, weapon and set identities, and
writes SHA-256 receipts. Verify the source revision independently before building;
the license hash alone is not a source revision attestation. Review generated
coverage and bump `gcsim-2.47.2-celestia-1` if engine behavior or inputs change.

The raw WASM is about 57 MB and stays in the extracted source directory. Only the
approximately 9 MB gzip file is distributed. The browser decompresses it and
checks the raw WASM hash before execution. Public assets are downloaded only when
the user clicks Calculate. No runtime simulator service receives build data.

## Boundaries

The adapter rebuilds stats from progression, **base** talent levels, weapons,
artifact main stats and substats. Equipment percent points become fractions.
Final observed combat totals are never added as artifact stats. Engine set
bonuses and progression are not counted twice. Unknown or incomplete members
block the complete team total rather than silently omitting damage.

This pin includes 124 character/forms, 237 weapons and 55 sets. Nefer is absent.
Numerical results describe the chosen rotation and enemy under engine rules;
they are not an optimal-team recommendation or a guarantee of in-game damage.
The basic rotation is deliberately labeled as an editable starting point.

Sources: [configuration reference](https://docs.gcsim.app/reference/config/),
[configuration guide](https://docs.gcsim.app/guides/understanding_config_files/),
[importing character stats](https://docs.gcsim.app/guides/importing_characters/).
