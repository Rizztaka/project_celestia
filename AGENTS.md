# Project Celestia workspace

The canonical project checkout is `D:/Genshin Personal/project-celestia`.
Use this directory for Project Celestia implementation, development and release
commands. The `master` branch follows the production Vercel site.

The owner wants one visible project folder. Do not create sibling checkouts or
project copies under `D:/Genshin Personal` unless they explicitly request one.
If isolation is needed, prefer a short-lived worktree under the ignored
`.worktrees/` directory here and remove it after merging. Keep generated output,
downloads and recovery archives in ignored directories. Do not commit copied
third-party source trees, large verification dumps or local environment files.

The old unfinished workspace is preserved in `.local-archive/cleanup-2026-10-25`.
Consult its manifest and patch only when recovering that work. The current
production source does not depend on it. Additional project guidance lives in
`.agents/AGENTS.md`.
