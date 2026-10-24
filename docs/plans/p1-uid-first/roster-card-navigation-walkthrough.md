# Whole character-card navigation

Each UID roster character card is now one native React Router link to the same character/form build route. Portrait, name, level, talents, weapon, footer and blank card space all belong to that link. Inner portrait/name/footer links were replaced with non-interactive content to avoid nested anchors and duplicate keyboard stops. A visible keyboard-focus outline is scoped to these UID cards.

Character data, retention labels, equipment, build routes and existing private workspace cards are unchanged. The existing retained-character App interaction regression now clicks the level area and verifies the build route and historical-build detail, covering the reported failure without adding redundant cases.

Validation: 77 existing client tests across five suites pass. Frontend lint, TypeScript and production build pass. Scoped tooling lint, formatting and whitespace checks run before commit. Publish through the established release PR and confirm the updated card module is served by production. No database migration or data change is needed.
