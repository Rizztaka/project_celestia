# Contextual guide knowledge K1

`GET /api/v1/games/genshin/characters/:characterKey/guide-advice` requires bearer
authentication and `contractVersion=1`. Optional single query values:

- `hp=unknown|above_90|at_or_below_90` (default unknown).
- `example=harbinger` explicitly selects a hypothetical weapon, without implying
  ownership, equipping it or writing any data.
- `refinement=unknown|1|2|3|4|5` is permitted only with `example=harbinger`.
  Otherwise the service uses recorded refinement; invalid legacy values remain unknown.

Unknown fields, duplicate values, wrong versions and malformed fields return 400.
Missing authentication returns 401. Character keys follow the equipment contract;
missing accounts, missing characters and foreign characters receive the identical
non-enumerating 404. User identity comes only from authentication. Reads use the
existing equipment service's coherent owned snapshot, with no HTTP self-call or write.

The strict shared version-1 response contains applicability and reasoning trace,
conclusion, nullable conditional and modeled CRIT Rate contribution in percentage
points, scenario, recorded weapon assignment/provenance, source hashes, agent
review attribution, limited coverage and stable relevant-input fingerprint. It has
no score. Owned unsupported characters receive `coverage=unsupported` and retain
normal equipment browsing. No Harbinger record yields `no_weapon_scenario` until
the player explicitly opts into the example.

HP assumptions never observe live HP. Activation is strictly above 90%; equality
is inactive. Unknown HP never establishes sustained uptime. Known refinement may
provide the conditional potential amount without a modeled active amount. Unknown
refinement never defaults to R5. These contributions are neither DPS gains nor
total character CRIT Rate or a best-weapon claim. Unreliable HP maintenance is not
proof of permanently zero uptime.

The local `k1-1` pack normalizes only the pinned MIT genshin-db mechanic and selected
MIT Optimizer constants. Notices ship with static data. KQM remains attributed
external reading. Review is by the Codex agent, not a human or in-game tester;
official live-patch coverage, source independence, full formula-helper semantics
and ongoing maintenance ownership are unverified. REA evidence is reused with its
partial graph and unknown semantic coverage. The historical candidate remains
non-production. No importer/scraper, upstream runtime fetch or source execution is used.

`tsx tooling/build-guide-knowledge.mjs candidate.json destination.json` validates
schema, review/conflict state, references, exact units/refinement values, expression
bounds, content fingerprint and pinned retained source bytes before an atomic local
replacement. It never promotes the research draft or invents a review. Runtime
validation checks the bundled content fingerprint and pinned source digest registry;
it does not need research files in a deployment or fetch upstream resources.

The card uses scenario-aware TanStack Query keys under `genshin`, originating-session
checks and AbortSignal cancellation. Relevant character/weapon/section-receipt and
session changes reset assumptions by re-keying the component. Successful import
uses existing Genshin invalidation. Failed refreshes retain clearly labeled advice
only for the same snapshot and assumptions; changed scenarios show their own
loading/error state. A concurrently changed API snapshot requests an equipment
refresh before advice is shown. Account snapshot age and user assumptions remain
separately labeled. Native checkbox/select/button/details controls support keyboard
and narrow layouts. Existing KQM tabs, deep links and contracts are preserved.

## K2 version 2

GET /api/v1/games/genshin/characters/:characterKey/guide-advice/v2 uses the same
bearer authentication and non-enumerating ownership rules, with required single
contractVersion=2. The version-1 route/schema remain independent and compatible.
Reviewed subjects: Keqing, Fischl, KaedeharaKazuha. Other owned characters return
unsupported coverage and no cards.

Optional single query fields (default unknown unless stated):

- role=unknown|on_field|off_field|burst_swap|quickswap_support, limited to the
  subject's returned supportedRoles; burst=unknown|use|skip.
- setExample=recorded|MarechausseeHunter|GoldenTroupe|ViridescentVenerer (default
  recorded); examplePieces=unknown|0|1|2|3|4|5 requires a hypothetical set.
- hpChange, mhOnField, swirl, vvOnField, oz, electroReaction: unknown|yes|no.
  Field flags describe the wearer at the trigger, not live current position.
- mhStacks=unknown|0|1|2|3; mhWindow=unknown|within_5s|expired;
  gtField=unknown|off_field|returned_under_2s_with_bonus|on_field_at_least_2s;
  vvWindow=unknown|within_10s|expired.
- swirlElement/targetElement: unknown or lowercase game element. Ordinary VV
  reduction requires matching Pyro/Hydro/Electro/Cryo, on-field Swirl and the
  nominal ten-second window. Absorption alone proves no Swirl.
- team: one JSON string (maximum 1,500 characters), up to three unique additional
  {characterKey,selection:"owned"|"hypothetical"} members. The subject is included
  for a four-member total. Owned selections must belong to the user; hypothetical
  examples are limited to the reviewed group. activeCharacter must be selected.
  exampleFischlA4=unlocked requires hypothetical Fischl; owned unlock eligibility
  uses recorded ascension.

Unknown fields, duplicate values, bad versions, malformed/duplicate teams and
unsupported scenarios return 400. No owner/account ID is accepted. All owned
members, equipment and receipts come from one SELECT/MVCC snapshot. No migration
or write occurs. Missing assignment contributes to an upper bound, not a known
empty slot: two matching pieces and three unresolved slots means [2,5]. Foreign
or inconsistent relations cannot certify eligibility.

The strict result includes all relevant typed mechanical/editorial claims,
separate eligibility/applicability, complete composite/leaf traces with values and
origins, explicit-unit effects, per-claim sources/review, exclusions and stable
order. Fingerprints cover pack content, normalized scenario and relevant owned
facts. Recorded bounds stay visible beside hypothetical sets. Effects are not
summed across units or called DPS gains. Talent guidance is ability relevance
with unknown stored convention, never an inferred base-level deficit or automatic
goal. Burst guidance is qualitative; rotation, particles/catches and cadence are
unmodeled, so no personalized numeric ER target is issued.

The build-contextual-knowledge.mjs writer validates bounded trees, trusted source
registry and retained bytes, per-claim review/conflicts, references, units/ranges
and content hash before atomic replacement. Runtime validates the local k2-1 pack
without upstream fetches or expression execution. See the K2 source manifest for
agent review scope and excluded modern interactions.

Client keys include pack, scenario, relevant equipment/roster identity and session.
The client checks the API's observation fingerprint before rendering, retains
failed-refresh data only in its originating context, cancels on session switch
and uses existing import invalidation. Changed records reset assumptions. Native
controls and optional evidence provide progressive disclosure. K1 remains available beside contextual guidance on the detail page.
