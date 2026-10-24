# Remove Equipment from UID navigation

Remove Equipment from the shared guest/connected UID navigation, covering desktop and mobile. Remove the separate equipped-gear shortcut from Today. The two remaining UID shortcuts fill the desktop row and retain the existing stacked mobile layout. The original authenticated dashboard keeps its existing navigation and shortcuts.

Weapons, artifacts and statistics remain on each character's build page. No equipment, saved roster observation or account record is deleted. Existing equipment URLs remain compatible, without an advertised tab or Today shortcut.

Update the existing navigation regression to expect Characters and Public Profile without a separate inventory link or equipped-gear shortcut. Run the relevant existing client regressions and frontend lint, types, production build, formatting and whitespace gates. Publish through a checked release PR using the user's ongoing live-site authorization; confirm the production UID navigation module has no Equipment entry after Vercel finishes.

Validation passed: 77 existing client tests across five suites, frontend lint, TypeScript and production build, scoped tooling lint, formatter and Git whitespace checks. The original checkout still matches all 3,481 paths plus HEAD, branch and index. No new test cases were needed for this navigation-only change.
