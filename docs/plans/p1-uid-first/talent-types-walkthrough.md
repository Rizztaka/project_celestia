# Talent types and build-page design direction

Talent cards now show Normal Attack, Elemental Skill or Elemental Burst above the actual talent name. The API maps the type by skill ID against the selected character/depot's pinned Enka SkillOrder, including Traveler variants. Missing or unknown skills retain a null type and display "Talent type unavailable". Actual base levels and bonus levels are preserved.

The shared contract adds a nullable `kind` with a null default for older payloads. The local API/frontend launcher was restarted successfully on ports 45750/45751 to load the backend and contract changes. Reload the build page to review.

Verification: the six targeted suites pass (131 tests), covering mappings, partial/reordered observations, unknown skills, rendered labels, UID behavior and importer/journey regressions. Evidence: `talent-types-test-results.json`. Contracts, API and web builds (including TypeScript), scoped lint, formatting and original checkout preservation pass. Original preservation covers 3,481 files, HEAD, branch and index. Browser interaction verification remains pending under the previously documented extension automation block.

Recommended next design pass, not implemented here:

- A single character hero with a larger portrait, restrained element accent and level/constellation summary; remove duplicate character headings.
- A prominent key-stat panel, with full base/added property rows available in a secondary section.
- A separate weapon panel and consistently sized artifact cards with slot, main stat and quieter substats. Arrange columns on desktop and stack on mobile.
- Consistent spacing, aligned tabular values, restrained borders and Celestia's gold accent for emphasis. Keep clear keyboard focus and readable contrast.

These recommendations apply the grouping, alignment and hierarchy principles in [Apple's layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout) to the existing Celestia page. Larger visual changes remain a proposal. No deployment, push, merge, database changes or P1 finalization.
