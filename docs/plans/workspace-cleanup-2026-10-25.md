# Workspace cleanup — 2026-10-25

Production at `projectcelestia.vercel.app` was Vercel deployment
`dpl_8xNaznbaHncmp4NYKvnjTQcXmLUe`, commit
`0fce4086d8bc260838050d4084393e7769629ca1` on `master` before this
housekeeping change. The source includes the DPS-first team generator.

`project-celestia` was on an older `codex/contextual-guide-knowledge` branch
with 64 modified/deleted tracked paths and 1,674 untracked files. Those
untracked files contained 3,166,214 lines / 173,236,208 bytes. The largest
parts were verification output, source caches and several large candidate
character-knowledge corpora. None was in the deployed Git commit.

Recovery files are under the ignored local directory
`.local-archive/cleanup-2026-10-25/`:

- `original-unfinished-work.zip` holds 3,356 non-generated files from the old
  working tree, including local configuration. `original-working-tree.patch`,
  `original-index.patch`, and `original-git-state.txt` record its Git changes.
- `analyzer-recovery-material.zip` holds the former analyzer checkout's scratch
  source and receipts. Downloaded Go, source ZIPs and the rebuildable raw WASM
  were excluded; the published compressed WASM is tracked by Git.
- `old-review-bundle.zip` is a byte-for-byte source review snapshot. The older
  `project-celestia.zip` was moved into the same archive directory.

Each new ZIP has a corresponding JSON receipt, SHA-256 digest, per-file manifest
and passed ZIP readback check. The old working tree was then cleared, `master`
fast-forwarded to the deployed commit, and dependencies installed from the
lockfile. The redundant `celestia-build-analyzers` worktree and static review
folder were removed; empty parent `docs` was removed. The separate
`genshin-optimizer-lite` Git repository was left untouched.

Only `.gitignore`, VS Code settings, this handoff and `AGENTS.md` were changed
after aligning the app to production. Future Project Celestia work belongs in
the canonical project folder. The production team generator's damage coverage
and knowledge claims have not been audited as part of this filesystem cleanup.
