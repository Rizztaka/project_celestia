# Section 5 — companion modernization, C6 and C7

Implemented locally on 2026-10-18 following the owner's Section 5 directive.

- OpenRouter credentials are optional in API validation, Compose and example
  environments. The lazy client has a 10-second timeout and no automatic retries.
  Authenticated `POST /api/v1/games/genshin/intelligence/ai-summary` summarizes
  explicitly submitted team/plan context. No credential, failed provider or empty
  provider text falls back to deterministic composition explanations. The endpoint
  bounds JSON and admits a burst of three requests per owner, refilling one every
  20 seconds, with one concurrent request per owner and four globally. Existing
  in-memory/Redis admission infrastructure is reused.
- The simulator retains the exact Odette fixture and adds the requested Mavuika
  and Raiden scenarios through 2027-01-01. Its initial selection chooses the first
  unexpired scenario, including selection state, history and reset behavior.
  Featured characters use the existing verified artwork pipeline. These scenarios
  are explicitly labeled as simulations, not a verified live banner schedule.
- C6 adds four roster-only character slots, a native modal picker with search and
  element filters, seven elemental resonance explanations and potential Vaporize,
  Melt, Hyperbloom, Swirl and Aggravate combinations. Evaluation validates unique
  keys, ownership and static element coverage. Full parties activate resonances;
  incomplete parties show previews. Element coverage does not claim rotation or
  damage validation. Numeric calculations, explanations and service orchestration
  remain separate from request validation.
- Named teams persist under `celestia_saved_teams`, partitioned by authenticated
  account ID. Versioned JSON export/import supports transfer between browsers.
  Imports validate file size, names, known distinct characters, IDs and a 100-team
  limit. Invalid files and storage failures preserve existing data. Teams remain
  local to the browser; account database exports do not include them.
- C7 adds character/weapon targets, date presets, inventory and pity inputs,
  guarantee controls, commissions, Welkin, Battle Pass, Abyss and active unclaimed
  event rewards. It displays deadlines, income arithmetic, whole pulls, leftover
  Primogems, required guarantee budgets and a deterministic probability estimate.
  Event failures/unavailable coverage are explicitly excluded, rather than
  represented as all rewards claimed.
- Planner includes Farming, Teams, Wish Savings, Events and Weekly Bosses while
  retaining the existing Daily tab and query links. NIKKE moves to a nested
  Archived Stubs disclosure on desktop. Its HTML link, route, endpoints and all
  database models remain intact. Mobile navigation focuses on Genshin tools.

## Calculation assumptions

The date horizon excludes today and includes the target date. Daily income assumes
all modeled claims; purchase crystals are excluded. Battle Pass credits only full
40-day cycles starting today. Abyss uses the directive's first/sixteenth reset
scenario and chosen 0/400/800 reward. These are editable planning assumptions,
not live schedule claims. Only unclaimed tiers of active events are credited,
assuming collection before both the event deadline and the target date.

Character estimates use a simplified 50/50, then featured guarantee, 90 hard pity
and the simulator's approximate soft-pity ramp. Capturing Radiance is excluded.
Weapons assume a selected Epitomized Path, zero starting Fate Points, 80 hard pity
and at most two five-stars for the selected target within the same banner. The
weapon guarantee checkbox means one of the two rate-up weapons, not necessarily
the selected weapon. Switching wish types resets the entered pity/guarantee.
Soft pity is described as increased probability, never as a guaranteed drop.

## Verification and preservation

`pnpm run verify` passes **1,247 tests / 75 files**, with zero failures or skips.
All 1,206 baseline cases remain represented; 41 cases cover the new calculations,
storage, composition and synthesis behavior. Root lint (zero warnings), type
checks and builds pass. All existing migrations and account-data tables are
preserved; no migration is needed.

The old origin test required an OpenRouter key; its assertion now verifies that
startup succeeds without that optional key while retaining required JWT secret
validation. The historical formatting record remains untouched. Its old
OpenRouter exception is retired in the verifier so that this updated source is
checked by normal Prettier rules; the other four exception hashes remain enforced.

The reproducible browser check is `apps/api/tooling/c6-c7-browser-check.mjs`, run
through `tsx` with the isolated verification environment, an absolute Playwright
package path and an evidence directory. It uses the real API, temporary synthetic
users and disposable PostgreSQL, with synthetic events only. It checks picker
filters, duplicate exclusion, modal Escape/focus restoration, resonances, storage
reload, import/export, AI fallback/rate admission, savings updates, simulator pulls
and 1280/640/320-pixel layouts. Temporary users, browser and API/preview servers
are cleaned up. The PostgreSQL fixture is stopped after final verification.

The configured remote model was unit-tested with mocked responses; no paid model
request, remote CI run, deployment or human acceptance is claimed. Prior dated
roadmap gates and verification artifacts remain historical records.
