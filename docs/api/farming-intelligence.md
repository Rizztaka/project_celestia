# Farming intelligence V1

`GET /api/v1/games/genshin/intelligence/farming` requires the normal bearer token.
It reads the verified subject's coherent plan and recorded materials. It accepts
no owner/account identity, body, client timestamp or persistence action.

Strict query:

| Field                      | Allowed values                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `contractVersion`          | Required literal `1`                                                                      |
| `talentTier`, `weaponTier` | Optional `1`–`4`; absent means difficulty unknown                                         |
| `includeRoute`             | Optional `true`/`false`; omitted preserves coordinate API behavior; Planner sends `false` |
| `materialKey`              | Optional canonical-style material key, up to 100 characters                               |
| `startPointId`             | Optional exact source teleport ID from the response                                       |
| `maxStops`                 | `5`, `10`, `12`, `20`; default `12`                                                       |

Unknown query fields and malformed/oversized options return 400; an unknown
teleport returns 400. Unknown material coverage returns an unavailable route.
Unauthenticated requests fail before advice. A bounded read-consistency failure
returns 409, never a mixed-owner or stale-revision fallback.

The shared contract is
`packages/api-contracts/src/genshin/farming.ts`. The standard success envelope
contains `{recommendation, score, explanations}`. `score` is only the route's
percentage planar-distance improvement over its nearest-neighbor baseline, not a
character ranking or farming-completion score.

`recommendation` includes server time/selection, `serverWeekday` (0 Monday–6 Sunday, null without a server), current period/validity,
plan/routine/goal revisions, domain-family projections and difficulty comparisons,
partial resin total, excluded families/materials, shared-budget schedule, optional
coordinate route, material/teleport choices and pinned source attribution.

Required stock and selected difficulty qualify estimates. Upward three-to-one
crafting spends recorded stock once within each disjoint material family. The
smallest integer count satisfying the mean-drop scenario is reported, with
explicit unknown/covered/limit states. No sampled distribution, confidence bound,
loot guarantee or exact expected finish time is invented. Calendar pacing begins
at the next server reset using the existing daily budget and open weekdays.

The retained route API chooses a bounded nearby subset of actual source points from a selected
teleport and improves their planar order. It supplies no terrain routing, walking ETA, unlock/spawn
confirmation or enemy drop quantities. The owner clarified that in-game navigation is sufficient: coordinate controls are removed from Planner. `includeRoute=false` skips route selection/ordering and returns empty coordinate choices. The default remains compatible for existing API callers.

There are no new tables, writes, migrations, background jobs or runtime external
requests. The game domain owns the source rules and calculations. Its repository
adapts the existing owned plan read; platform never imports Genshin code.
Frontend uses the central session-checked API client and TanStack Query, refreshes
at the supplied server reset, and keeps its difficulty choices ephemeral. The main Planner view is the pinned 48-family weekday catalog with material names, full drop days, current/next availability, search and goal filtering. It works without known stock or a difficulty setting. Resin estimates are optional and initially collapsed.
Existing manual routines, Today allocation, inventory, goal intent and completion
remain independent. See [source evidence and REA limits](../plans/farming-intelligence/sources.md).
