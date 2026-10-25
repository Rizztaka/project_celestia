# Individual team workspace redesign — 2026-10-25

The owner requested a calmer, approachable, professional and premium individual
team page while retaining every tool added so far. This continues the authorized
commit/publish workflow from production `3d54bd9`, in the existing isolated
`D:/Genshin Personal/celestia-build-analyzers` checkout. The messy original
checkout, inherited scratch files and all saved user data are preserved.

## Page hierarchy

The page now opens with a compact team hero, saved-browser/UID context, roster
portraits and names. Duplicate/delete actions are under Team options. A persistent
keyboard-accessible segmented navigation separates **Lineup & builds** from
**Damage lab**. The team retains its existing dedicated URL and missing-team,
UID-scoping, loading and storage-error behavior.

Both panels stay mounted while hidden. Switching sections retains unsaved role
and membership edits, the selected build view, rotation settings/edits, results,
search comparisons and an in-flight worker. Changing team/UID remounts the scoped
workspace and still cleans up the old worker normally. No automatic save or
external write was introduced.

## Lineup and builds

Saved lineups use shorter portrait cards and a quieter name/save toolbar. Save
changes is disabled until there is an actual edit. All four builds keep visible
character identities, key stats, optional roles and full-character links.
Equipment, build advice, checks and hypothetical comparisons expand from each
card; selecting an individual member retains the full build presentation.
The original team overview and replacement/comparison tools remain available.
The gallery and new-team maker keep their original layout.

## Damage lab

The lab is organized as three numbered sections:

1. **Set the target:** uniform-resistance infinite-HP dummy presets, custom
   controls, duration and sample count. On desktop this remains beside the
   rotation editor; it stacks naturally on smaller screens.
2. **Your rotation:** choose a character portrait, then add its supported action.
   This replaces four repeated action palettes with one focused composer. Step
   cards show the character, action, repeats, wait and any custom-action flag.
   Reordering/removal stays directly available; Edit step opens the detailed
   fields and advanced parameters. A full loop preview and optional basic
   template remain expandable. Rotation saves remain explicit.
3. **Test & improve:** separate current-loop calculation and bounded rotation
   search actions. Search method details are expandable; the visible summary
   retains candidate/sample counts and the lack of a global-optimum guarantee.
   Results retain DPS, total damage, per-member contributions, sample ranges,
   baseline comparison, explicit application, stale-result guards and errors.

Coverage explanations remain visible when testing is unsupported. Engine and
test-condition details, configuration and license are grouped at the bottom.
No calculation, search-planning, engine, data mapping, resistance, seed, storage
schema, energy or cooldown rule changed. Nefer remains unsupported by the pin.

The presentation uses the existing charcoal/ivory/gold palette, more legible
cards, softer borders, restrained accents, tabular damage figures and consistent
spacing. Page styles are scoped in `team-workspace.css`; there is no new UI
dependency. Navigation stays within reach on long pages. Mobile uses two-column
lineup cards, a stacked lab, readable controls and reduced-motion support.

## Validation

**146/146 focused tests across ten files pass**, including existing calculations,
real-WASM worker tests and team flows. The new integration test proves that
unsaved roles and rotation edits survive switching sections, a pending worker
is not terminated by navigation, cancellation still releases it, primary-tab
keyboard navigation works and switching does not write draft data. Existing
composer and keyboard tests were updated for character selection and the two
independent tab groups. Web TypeScript/build, full web lint and changed tooling
lint pass.

Browser acceptance used only synthetic UID 800000001 on isolated ports
45760/45771. The existing fixture lineup was opened through its dedicated URL.
Equipment expansion revealed the actual weapon and advice; changing a 1.5s wait
to 2s survived a primary-tab round trip, then was restored. The real engine
reproduced **18,508 DPS / 1,110,456 damage** over 60s, seeds 1–10, on the neutral
dummy, matching the prior UI for the same fixture inputs. Results remained
available after switching to builds and back. A real search screened twelve
candidates and compared three finalists, retaining baseline 18,508 DPS and
measuring an alternative at 18,651 DPS. These are synthetic checks, not the
owner's builds, optimality claims or recommendations.

Desktop and 390/320px layouts were visually checked. Document width stayed within
the viewport and composer/step controls fit. Temporary viewport overrides were
reset. No fixture team, role or rotation was saved on production. Existing live
content was inspected read-only as the visual baseline.

Evidence (synthetic fixtures):

- [Team header and lineup](browser-workspace-desktop.jpg)
- [Build cards](browser-workspace-builds-desktop.jpg)
- [Focused lab](browser-workspace-lab-desktop.jpg)
- [390px lab](browser-workspace-lab-390.jpg)
- [320px lab](browser-workspace-lab-320.jpg)
- [320px lineup](browser-workspace-builds-320.jpg)

Publication uses a scoped fast-forward commit to master and exact Vercel
commit/production-alias verification. Release receipts and live screenshots stay
in untracked scratch. No database migration or backend deployment is required.
