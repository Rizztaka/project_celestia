# Game data and reference evidence — 2026-10-17

## Seelie behavior study

Owner-selected target: https://seelie.me, inspected in an isolated in-app browser.
The public page identified itself as v7.1 build 261010. Observed the planner's
recurring task list, countdowns, separate activity section and resin-cost filters;
the character picker; a synthetic Hu Tao level target; separate current/target
normal/skill/burst controls; grouped goal costs and material inventory drilldowns.
Its totals also displayed resin/day estimates. Their hidden yield assumptions
were not recovered or verified. No Seelie source code, artwork, account, Google
Drive connection or backend was copied. This is behavior analysis with existing
browser tools; REA was researched, not installed or claimed as executed.

Useful patterns applied to Celestia: put the routine first, keep long-term goals
separate, offer human-readable target names, keep current/target inputs together,
collapse onboarding and material-source details, and show optional farming
allocations without streaks or automatic completion.

## Pinned progression snapshot

Source: [theBowja/genshin-db](https://github.com/theBowja/genshin-db), commit
`49a6544a6c6ae36089cb42fa591fc46f01de8bcf`.
Original [MIT notice](../../third-party/genshin-db-LICENSE.txt) is retained.
The upstream project describes its data as parsed/organized from game data. This
is attributed **community** evidence, not a claim that HoYoverse independently
verified every row. Game version and original game-observation time are unknown.
The review date identifies this inspection, not the game's capture date.

`sync-progression-catalog.mjs` downloads only JSON and the license at that pinned
commit, records per-file SHA-256 values and refuses truncated source indexes.
`build-progression-catalog.mjs` joins numeric material/domain IDs, normalizes names
to canonical-style GOOD keys, validates contiguous phases/positive quantities,
and generates API costs plus frontend target/source metadata. Runtime validation
checks the normalized fingerprint and joins, then freezes the snapshot. There is
no runtime dependency on the upstream service. Rebuild with the same cache and
then run the repository formatter; normalized content is deterministic.

Measured coverage: 122 character ascensions, 120 character talent tables through
level 10, 252 weapon ascensions, 508 consumed material references and 48 weekday
talent/weapon sources. One/two-star weapons retain their actual four-phase cap.
Manekin/Manekina lack numeric source quantities and are excluded. Three temporary
Prized Isshin Blade quest variants share an ambiguous name and are excluded.
Traveler slot-specific talent exceptions are not represented faithfully by the
single source table, so their talent advice stays unavailable. Their ascension
tables remain usable. Other unknown import keys remain preserved and unavailable
for calculation; no inferred alias conversion changes imported inventory.

The prior [Hu Tao primary calculator evidence](../c2b-data-trust/evidence/hutao-talents-primary.json)
remains unchanged. New tests independently assert those 1–6 totals, full Hu Tao
1–10 totals, Raiden ascension and Staff of Homa's four-tier totals, representative
named characters, all supported ranges, schedule joins, invalid input and drift.

## Server and resin policy

All four game servers use fixed offsets: America UTC−5, Europe UTC+1, Asia and
TW/HK/MO UTC+8. Daily resets are calculated at 04:00 server time and weeks begin
Monday at 04:00. The [official Version 1.1 notice](https://genshin.hoyoverse.com/en/news/detail/103763)
lists server timezones; the existing [C2a evidence](../c2a-clock-task-reliability/sources.md)
records official daily-mechanic text, current weekly rules and the owner's Asia
daily experience. The new regional implementation applies the common 04:00 rule
to those fixed offsets. It does not claim newly timed human observations on each
server. Unit/integration tests establish the implementation boundaries and
server isolation. Asia v1 period IDs remain unchanged.

Material-domain schedules and entrance/region names come from the pinned source
IDs, with Sunday included as provided. A normal reward set costs 20 Original
Resin. The [official Luna I update](https://genshin.hoyoverse.com/en/news/detail/159349)
describes the 20-resin reward interface and the optional 40-resin double claim;
it also changes Condensed Resin to 60 for three reward sets. Celestia's allocation
uses individual 20-resin reward sets and does not assume an old condensed recipe,
guaranteed drops, an Adventure Rank or sufficient farming runs to finish a goal.

Enemy/gathering hints come from the material source text. The official interactive
map is linked for exploration. No coordinate dataset or measured drop distribution
has been established here; these hints are not optimized walking routes or a
statistical resin-efficiency model. Those requirements remain explicit work.
