# Today and Public Profile cleanup

Implemented the screenshot feedback in the same isolated worktree and local branch.

- Today now contains the shared Celestia welcome/hero and shortcuts only. Removed its showcase refresh/status section, public account overview and character preview grid. UID data remains connected to the sidebar, Characters, Equipment and Public Profile views.
- Public Profile and character detail pages use the refresh countdown without the fetched/cached response panel, upstream timestamps or cache diagnostics. Refresh remains disabled during TTL/backoff. Network/provider failures remain visible and the previous successful data stays available.
- Removed the separate “Open [character] build page” links. The entire character header, including its portrait, name, stats and surrounding space, links to the detailed character route. The View build rectangle remains a separate inline disclosure below it.
- View build is a native disclosure below the character header. It expands talents, equipment and statistics immediately below that character. Identity links sit outside the disclosure, so navigating and expanding have separate targets. Detailed routes still open the build expanded.

Verification: **126 automated tests pass**, including updated Today expectations, compact profile timer/error states, detail links, shared data, mapping and earlier regressions. Web build (including TypeScript), web lint and formatting pass. Original checkout preservation still passes for all 3,481 recorded files, HEAD, branch and index.

Browser verification was attempted with a synthetic provider using the real frontend/API, but Chrome blocked automation because another extension UI was open. No new interactive browser result or updated screenshot is claimed for this cleanup. The inline disclosure and links are covered by automated rendering checks; personal interaction verification remains pending.

Header click-area follow-up: the two focused client suites pass after expanding the click target; TypeScript and the component lint check pass. Native link behavior supports keyboard activation and opening details in a new tab without making the View build control part of that link.

Reload [Celestia](http://127.0.0.1:45751/), open Public Profile and use View build to expand in place. Click a character's portrait or name for its detailed page. No database changes, deployment, push or merge were performed.
