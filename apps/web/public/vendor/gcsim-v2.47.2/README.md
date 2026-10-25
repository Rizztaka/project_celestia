# gcsim v2.47.2 for Celestia

Upstream: https://github.com/genshinsim/gcsim

Pinned source: `caf738dc807a646e2eee7e7b572f225dd6deb510` (MIT).
This is a pinned release, not a build of current upstream main. All LICENSE files
in this directory are distribution notices for the engine and its dependencies.

`engine.wasm.gz` contains the WASM build with Celestia's deterministic seeded
entry point. `wasm_exec.js` is the matching official Go runtime. `manifest.json`
records the uncompressed WASM, runtime and bridge SHA-256 values.

The adapter, bridge, reproduction script and build instructions are distributed
in the Celestia repository at `apps/api/tooling/gcsim/`. The frontend adapter is
under `apps/web/src/lib/team-damage/`; the browser worker is
`apps/web/public/team-simulation-worker.js`.

Source and reproduction instructions:
https://github.com/Rizztaka/project_celestia/tree/master/apps/api/tooling/gcsim

Do not overwrite these files with an unreviewed upstream update. Engine coverage,
licensing and mechanics may change. Nefer is not implemented in this pin.
