# K2 reviewed sources and claim manifest

2026-10-19. Review attribution: Codex (GPT-6), K2 agent implementor. This is a
bounded agent review of enduring mechanics and explicitly selected guide
scenarios, not human/in-game/official live-patch certification.

## Retained evidence and reuse

The ten newly acquired MIT source records are byte-identical captures at the K1
pins: genshin-db 49a6544a6c6ae36089cb42fa591fc46f01de8bcf (package 5.2.14,
package describes game 7.1), and Genshin Optimizer
cbee3af79d465735736cfbfbeaa6a9f89bea46dd (no independent game-version certification).
The K1 Optimizer Marechaussee Hunter sheet and both MIT notices are reused without
modification. Exact URLs, paths, acquisition timestamps, byte lengths and SHA-256
are in [the acquisition manifest](k2-source-manifest.json). All seventeen actual
pack inputs and their local byte hashes appear in
[the reviewed input manifest](k2-reviewed-source-inputs.json). The trusted registry
is bundled with the application; raw research files are needed only by the local
pack writer. Runtime neither fetches nor executes upstream content.

Six guide-reference observations were rechecked at their specific sections:
Fischl quick 4.0 / extended 4.7; Kazuha quick 7.1; Keqing quick Luna I / extended
Luna VII; KQM's artifact mechanics library. Kazuha quick explicitly calls its
extended guide out of date; that older guide is not an authority for K2. These
labels are upstream page labels, not independent accuracy proof. The retained
reference JSON contains original concise factual notes, URL/section/observed page
label, retrieval date and response SHA-256. Its pack source hash identifies those
retained observation bytes, not an archived page. No full guide prose, rankings,
artwork or HTML mirror is shipped. KQM/TCL are attributed external references;
MIT normalization is limited to the pinned records/sheets. No gcsim code, legacy
importer output or model-only candidate was promoted.

## Cross-checked mechanics

- MH: two-piece 15% Normal/Charged damage bonus. Four-piece current-HP changes
  while the wearer is on field establish stack triggers, 12 CRIT Rate percentage
  points per stack, maximum three, nominal five-second window. Leaving the field
  does not itself clear existing stacks. Max-HP-only changes are not current-HP
  triggers. No automatic HP fluctuation, three-stack uptime or team sustain claim.
- Golden Troupe: separate two-piece 20% Skill bonus, four-piece base additional
  25%, and additional off-field 25%. A carried off-field bonus persists for less
  than two seconds after return and clears at two seconds. No Oz snapshot or
  total damage calculation is inferred. Components remain separate in the API/UI.
- VV: two-piece 15% Anemo bonus; four-piece 60% ordinary Swirl reaction bonus;
  ordinary Swirl by the wearer on field enables matching Pyro/Hydro/Electro/Cryo
  resistance reduction of 40 percentage points for nominal ten seconds. Absorption
  or membership alone is insufficient. Target hit timing/hitlag are not modeled.
- Fischl: Skill/Oz relevance differs from selected on-field Normal/Charged use;
  Burst may refresh Oz. A4 unlock uses recorded ascension or explicit hypothetical
  unlock. Oz presence and the selected active character's Electro-related reaction
  are independent assumptions; no proc count, damage or enhanced passive claim.
- Kazuha: Skill follow-up plunge uses Normal Attack talent even in the reviewed
  support role. Burst application is a chosen cadence, not a universal requirement.
- Keqing: on-field attacks versus Skill/Burst swapping change ability relevance.
  Raw imported talent convention remains unknown. No base-level deficit, neglect
  score or automatic upgrade goal is inferred for any subject.
- Energy: selected use/skip/unknown plans are qualitative for all three. Rotation
  duration, particles, catches, enemies and actual cadence remain missing; no
  personalized numeric ER target or deficit is issued.

## REA result and limits

The installed skill and current help were read. The isolated supported
Node 24.11.0 / rea-agents 6.5.0 analyze-javascript-application command used four
explicit new Optimizer TSX sheets with integrity-policy fail and JSON output.
It exited zero: four parsed files, zero parse failures/contradictions, complete
_selected artifact graph_. See [the compact summary](k2-rea-summary.json) and
retained raw result/stderr under k2-evidence. AST recovery does not resolve imported
formula helpers, execute the sheets or certify all semantics. Semantic coverage
remains unknown. Manual review cross-checked constants/conditions against the
pinned structured records and specific artifact/guide sections; community agreement
is not independent official verification.

## Reviewed claims

The runtime pack has 24 claims (23 active, one explicit exclusion), in stable order.
Every row has its own source dependencies, agent reviewer/date, supported scope,
review/conflict state and bounded eligibility/condition trees. The complete
machine-readable reviewed candidate is [k2-reviewed-pack.json](k2-reviewed-pack.json).

| Claim                          | Kind / state                                      | Subjects                        | Exact dependencies                                           | Review scope                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------- | ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| talent-role-unknown            | editorial / active; reviewed; conflict=false      | Keqing, Fischl, KaedeharaKazuha | db-keqing, db-fischl, db-kaedeharakazuha                     | Unknown role overview only; no talent neglect/base-level claim.                                                                                                                 |
| talent-on-field                | editorial / active; reviewed; conflict=false      | Keqing, Fischl                  | db-keqing, db-fischl, kqm-fischl-quick, kqm-keqing-quick     | Selected ability-use role; original qualitative interpretation of pinned kit and attributed guide sections, not a universal priority/ranking. Raw talent basis remains unknown. |
| talent-oz-off-field            | editorial / active; reviewed; conflict=false      | Fischl                          | db-fischl, go-fischl, kqm-fischl-quick                       | Selected ability-use role; original qualitative interpretation of pinned kit and attributed guide sections, not a universal priority/ranking. Raw talent basis remains unknown. |
| talent-burst-swap              | editorial / active; reviewed; conflict=false      | Keqing                          | db-keqing                                                    | Selected ability-use role; original qualitative interpretation of pinned kit and attributed guide sections, not a universal priority/ranking. Raw talent basis remains unknown. |
| talent-support-plunge          | editorial / active; reviewed; conflict=false      | KaedeharaKazuha                 | db-kaedeharakazuha, go-kaedeharakazuha, kqm-kazuha-quick     | Selected ability-use role; original qualitative interpretation of pinned kit and attributed guide sections, not a universal priority/ranking. Raw talent basis remains unknown. |
| energy-keqing-unknown          | editorial / active; reviewed; conflict=false      | Keqing                          | db-keqing, kqm-keqing-quick                                  | Qualitative chosen Burst plan only; missing rotation/particle data precludes personalized numeric ER, deficit or universal Burst cadence.                                       |
| energy-keqing-use              | editorial / active; reviewed; conflict=false      | Keqing                          | db-keqing, kqm-keqing-quick                                  | Qualitative chosen Burst plan only; missing rotation/particle data precludes personalized numeric ER, deficit or universal Burst cadence.                                       |
| energy-keqing-skip             | editorial / active; reviewed; conflict=false      | Keqing                          | db-keqing, kqm-keqing-quick                                  | Qualitative chosen Burst plan only; missing rotation/particle data precludes personalized numeric ER, deficit or universal Burst cadence.                                       |
| energy-fischl-unknown          | editorial / active; reviewed; conflict=false      | Fischl                          | db-fischl, kqm-fischl-quick                                  | Qualitative chosen Burst plan only; missing rotation/particle data precludes personalized numeric ER, deficit or universal Burst cadence.                                       |
| energy-fischl-use              | editorial / active; reviewed; conflict=false      | Fischl                          | db-fischl, kqm-fischl-quick                                  | Qualitative chosen Burst plan only; missing rotation/particle data precludes personalized numeric ER, deficit or universal Burst cadence.                                       |
| energy-fischl-skip             | editorial / active; reviewed; conflict=false      | Fischl                          | db-fischl, kqm-fischl-quick                                  | Qualitative chosen Burst plan only; missing rotation/particle data precludes personalized numeric ER, deficit or universal Burst cadence.                                       |
| energy-kaedeharakazuha-unknown | editorial / active; reviewed; conflict=false      | KaedeharaKazuha                 | db-kaedeharakazuha, kqm-kazuha-quick                         | Qualitative chosen Burst plan only; missing rotation/particle data precludes personalized numeric ER, deficit or universal Burst cadence.                                       |
| energy-kaedeharakazuha-use     | editorial / active; reviewed; conflict=false      | KaedeharaKazuha                 | db-kaedeharakazuha, kqm-kazuha-quick                         | Qualitative chosen Burst plan only; missing rotation/particle data precludes personalized numeric ER, deficit or universal Burst cadence.                                       |
| energy-kaedeharakazuha-skip    | editorial / active; reviewed; conflict=false      | KaedeharaKazuha                 | db-kaedeharakazuha, kqm-kazuha-quick                         | Qualitative chosen Burst plan only; missing rotation/particle data precludes personalized numeric ER, deficit or universal Burst cadence.                                       |
| mh-two-piece                   | mechanical / active; reviewed; conflict=false     | Keqing, Fischl, KaedeharaKazuha | db-marechausseehunter, go-marechausseehunter                 | Only Normal/Charged damage bonus from two matching pieces; no damage gain or set ranking.                                                                                       |
| mh-four-piece-stacks           | mechanical / active; reviewed; conflict=false     | Keqing, Fischl, KaedeharaKazuha | db-marechausseehunter, go-marechausseehunter, kqm-vv-trigger | Reviewed selected current-HP-change stacks, within five seconds, wearer on field at trigger; no max-HP-only trigger or automatic activation/uptime from team membership.        |
| gt-two-piece                   | mechanical / active; reviewed; conflict=false     | Keqing, Fischl, KaedeharaKazuha | db-goldentroupe, go-goldentroupe                             | Two-piece Skill DMG Bonus component only.                                                                                                                                       |
| gt-four-piece-base             | mechanical / active; reviewed; conflict=false     | Keqing, Fischl, KaedeharaKazuha | db-goldentroupe, go-goldentroupe                             | Four-piece unconditional additional Skill DMG Bonus component, independent of off-field timing.                                                                                 |
| gt-four-piece-field            | mechanical / active; reviewed; conflict=false     | Keqing, Fischl, KaedeharaKazuha | db-goldentroupe, go-goldentroupe                             | Additional off-field Skill DMG Bonus; carried bonus clears at two seconds after entering field. No Oz snapshot or sustained-uptime model.                                       |
| vv-two-piece                   | mechanical / active; reviewed; conflict=false     | Keqing, Fischl, KaedeharaKazuha | db-viridescentvenerer, go-viridescentvenerer                 | Two-piece Anemo damage bonus only; no benefit to unrelated damage targets is inferred.                                                                                          |
| vv-four-piece-swirl            | mechanical / active; reviewed; conflict=false     | KaedeharaKazuha                 | db-viridescentvenerer, go-viridescentvenerer                 | Ordinary Swirl reaction damage bonus only; Stellar Swirl excluded.                                                                                                              |
| vv-four-piece-resistance       | mechanical / active; reviewed; conflict=false     | KaedeharaKazuha                 | db-viridescentvenerer, go-viridescentvenerer, kqm-vv-trigger | Ordinary Swirl by wearer on field; matching Pyro/Hydro/Electro/Cryo target element within nominal ten seconds. Target-hit/hitlag and newer reaction extensions not simulated.   |
| team-fischl-oz-reaction        | editorial / active; reviewed; conflict=false      | Keqing, Fischl, KaedeharaKazuha | db-fischl, go-fischl, kqm-fischl-extended                    | Fischl A4 qualitative trigger only, not damage/proc frequency/ICD/Hexerei modeling. Selected active reactor must belong to the scenario; members alone do not trigger it.       |
| unmodeled-modern-interactions  | editorial / excluded; unsupported; conflict=false | Keqing, Fischl, KaedeharaKazuha | db-fischl, go-fischl, kqm-fischl-extended                    | Stellar Swirl, Hexerei enhancements, damage/proc and full runtime interactions remain outside K2.                                                                               |

## Deliberate limits

Modern/Hexerei/Stellar Swirl and other enhanced interactions are explicitly
excluded. No elemental absorption, reaction ownership/cadence, snapshot, damage,
set ranking, sustained buff uptime, rotation/team solver or saved team is inferred.
K2 stops here; K3, broader acquisition and release decisions remain separate.
