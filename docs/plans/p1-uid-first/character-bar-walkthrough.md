# Character bars open the full build

This refinement supersedes the earlier inline overview. Public Profile now renders each character as a single native link covering the portrait, text and padded bar area. It opens that character's existing `/u/:uid/character/:id` build page and preserves keyboard activation and opening in another tab.

Removed the View build/Close build control, inline overview and disclosure markup. The detailed page displays the full build directly, with named talents, equipment and statistics available immediately.

Both focused client suites pass: **37 tests** (`character-bar-test-results.json`). Coverage checks the full-area character link, correct destination, absence of inline controls/content, preserved detailed builds and missing-data states. Web production build with TypeScript and scoped lint pass. The original checkout preservation check passes for 3,481 files, HEAD, branch and index.

Reload http://127.0.0.1:45751/ and click any character bar in Public Profile. Vite picks up the frontend change without restarting the API. Browser interaction verification is still pending because of the previously reported Chrome extension automation block; no new browser result is claimed.

The changes remain in the existing isolated development worktree. No deployment, push, merge, database changes or P1 finalization.
