# C5g acceptance results — 2026-10-16–17

Bounded technical and owner observation work is complete with explicit gaps.
**Agent readiness recommendation: HOLD. Owner local decision: CONTINUE with recorded
gaps.** Neither is deployment, invitation, C6/C7 or full accessibility acceptance.
Exact owner statements and input sequences are retained in [observations](observations.md).

## Environment and attribution

- Existing D: master checkout, expected HEAD, empty index; [baseline](starting-state.json)
  captures 951 inherited files. One agent, unchanged guarded C5d harness/C5c review
  fixture and existing C5e synthetic accounts/payload. No real account operation.
- Initial Chrome native menu: 100%; CSS viewport 767×722, outer 782×871, DPR 1.25.
  Actual native zoom steps reached 200% and 400%, separately from viewport readings.
  No viewport override was used. October 16 browser version was not freshly captured;
  C5f's 155.0.8059.79 is inherited only. October 17 running executable metadata
  reported 155.0.8059.82; it must not be retroactively assigned to October 16 checks.
- At initial 200%: CSS 383×361, outer 782×871, DPR 2.5. At initial/owner 400%:
  CSS 191×180, outer 782×871, DPR 5. Later agent geometry changed without an agent
  resize to 230×180/935×871 at 400%, then 518×347/1051×846 at 200%. Cause unobserved.
  Do not conflate these widths or claim an exact original-width post-fix retest.
- Owner controlled input during the focused tasks. Agent inputs stopped until the
  explicit handback. Read-only observations are separately attributed. Prior C5f
  coaching means equipment answers measure retention/use, not unfamiliar first exposure.

## Results

| Check                                                      | Actual observation                                                                                                                                                                                                                               | Result / boundary                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Owner 400% goal edit                                       | Priority changed to 4, reported “quite easy”; read-only confirmed one active 1→6 goal at priority 4                                                                                                                                              | Positive owner task evidence                                                           |
| Owner 400% duplicate and Cancel                            | Reported duplicate warning, scrolling back down and cancelling                                                                                                                                                                                   | Completed as reported; exact retained fields were not read back                        |
| Owner 400% import                                          | Both Preview changes and Confirm import reachable without help; nothing hard/unreadable reported                                                                                                                                                 | Positive per-control owner evidence; later saved character count 1 corroborated        |
| Owner 400% account cancellation                            | Both export/deletion Cancel controls reported easy to find/use                                                                                                                                                                                   | Positive owner evidence; no operation submitted                                        |
| Keyboard navigation                                        | Actual Tab/Shift+Tab/Space/Enter; Other tools expanded, link entered, Escape returned to trigger; visible skip link activated to main; Planner reached by keyboard                                                                               | Agent technical pass for exercised loop, not reader acceptance                         |
| Goal number readability at initial 400%                    | Both values hidden in two-column row at 191px CSS viewport                                                                                                                                                                                       | **Demonstrated failure; corrected** by stacking fields on narrow screens               |
| Corrected goal form at later 400%                          | Actual keys; visible 1 and 6 in stacked fields; duplicate retained Base talent/HuTao/Normal attack/1/6/priority 2; Cancel returned to Add goal                                                                                                   | Agent pass at observed 230×180 CSS; original 191px post-fix retest remains unperformed |
| Goal edit at later 400%                                    | Disabled identity fields skipped; priority 4→3 saved; range 1→6 unchanged; visible focus returned exactly to Edit range / priority                                                                                                               | Agent technical pass                                                                   |
| Import at later 400%                                       | Keyboard entry/Space selection/Enter preview; Review heading focus; labelled counts region scrolled with Right from 0 to 295.8px, final After column visible; Confirm reached and activated; Import complete focus; restart returned to textarea | Agent technical pass; internal table scrolling allowed                                 |
| Account cancellation at later 400%                         | Password focus on opening; keyboard reached visible Cancel in each form; exact export/deletion trigger focus restored                                                                                                                            | Agent technical pass; submit buttons remained disabled                                 |
| Account cancellation at actual 200%                        | Same keyboard cancellation paths and visible controls; exact trigger returns                                                                                                                                                                     | Agent technical pass at 518×347 CSS                                                    |
| Import at actual 200%                                      | Keyboard preview reached Review your changes; Characters checked                                                                                                                                                                                 | **Partial**: interruption occurred before confirmation/scrolling check                 |
| Goal edit/duplicate/cancel at actual 200% after correction | Not completed before UI control stopped                                                                                                                                                                                                          | **Unperformed**, no inferred pass from 400% or automated tests                         |
| Reduced motion                                             | No effective preference was applied. Windows Settings launch timed out with no Settings window; subsequent native Chrome capture hit a URL-policy stop before browser emulation could be inspected                                               | **Unperformed**; CSS rules are not a rendering pass                                    |
| Screen reader                                              | Inherited absence of competent reader operator unchanged; no reader installed or claims substituted from DOM/AX                                                                                                                                  | **Unperformed**, concrete external evidence gap                                        |

## Correction and limits

Only `apps/web/src/components/GoalForm.tsx` changed: `grid-cols-2` became
`grid-cols-1 ... sm:grid-cols-2` for the two numeric fields. This preserves the
wide layout and makes each field use the available narrow width. No state, data,
API, receipt, session, goal lifecycle or import semantics changed. The private
before screenshot is listed in [validation](validation-results.json). Actual
post-fix browser screenshots were observed in the tool transcript; the later UI
stop prevented a new retained after screenshot/original-width comparison.

Existing focused goal/session and journey tests passed **31 tests / 2 files**,
zero failures/skips. Fresh unchanged guarded recovery/full verification then passed
**1,006 tests / 55 files / 133 actual PostgreSQL cases**, zero failures/skips, with
schema, lint, type, build, repository-format and diff checks passing. Exact results
and raw hashes are in [validation](validation-results.json). The historical
classifier still reports 106; all eight integration suites total 133. No test that
merely mirrors the CSS class was added.

## Comprehension and local decision

- Equipment: owner now associates the notice with missing records, with uncertainty.
  Both possible in-game states were not explicitly explained. Prior coaching remains
  disclosed; no first-exposure acceptance claim.
- Receipt/live data: original “live now to be used” was ambiguous. A neutral scenario
  elicited that an in-game change without re-import would leave past imported data.
  This supports no automatic synchronization; original export age versus receipt
  time remains partial.
- Goal completion/history: owner would “delete it” and prefers only unfinished
  work. Deliberate completion and retained history were not established. This is
  a preference/comprehension gap, not an observed data-loss defect or redesign request.
- Resin: owner expects entering 80 to replace the previous displayed amount.
  Subsequent estimation and game-state boundaries remain unexplained; no incorrect
  belief is invented from an incomplete answer.
- Owner explicitly chose **“Local CONTINUE with recorded gaps”** after the named
  accessibility/comprehension gaps were presented. Agent readiness recommendation
  remains HOLD pending missing essential evidence. No next phase starts here.

## Interruption and restoration

The original harness survived the first tab closure, then ended during a later
interruption without its normal cleanup result. Exact owned resources were
reconciled with unchanged ownership/identity/quiescence guards; the historical
one-run C5g script must not be rerun. Fresh harness Gwsf8Z reached READY and quit
with all four cleanup flags true, restoring ordinary web output.

Computer Use stopped because it could not determine the current Chrome URL with
enough confidence to enforce policy. No alternate UI route was attempted afterward.
Owner reported **“was already on 100% zoom so i just closed it”**. Final zoom/tab
restoration is owner-reported, not agent-verified; no motion setting or viewport
override was applied. See [cleanup](cleanup.json) for non-UI resource verification.
