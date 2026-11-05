# Wish sandbox restoration

Goal: restore a separate fun simulator with fictional results and saved state
isolated from account ownership and wish savings. This implements the UI/session
part of M6; complete current-version rule/pool verification remains part of the
[full companion goal](implementation_plan.md).

Reuse the existing server calculator and six historical scenarios. Expose new
bounded, stateless public sandbox endpoints, retaining authenticated legacy
endpoints. Shared versioned contracts disclose approximations and reject requests
for changed rules. This model omits Capturing Radiance and approximates soft pity;
do not label it an exact current-version simulation or a live wish schedule.

Alternatives: duplicating a browser engine risks rule drift; requiring login adds
friction to fictional play. The existing stateless engine and public boundary fit
the UID-first interface. This is an implementation choice under the active goal.

## Delivery

- [ ] Tests first: public versioned catalog and pull requests, version mismatch,
      invalid input and historical scope. Add contracts and service/controller routes
      without account/database reads.
- [ ] Tests first: pure session transitions and bounded versioned storage. Share
      pity/guarantees within each banner type, clear Fate on scenario/path changes,
      keep types separate. Preserve malformed/newer data, detect intervening writes,
      retain at most 200 recent pulls and aggregate totals.
- [ ] Tests first: public client validation and accessible sandbox page. Include
      scenario/path selection, optional starting-state edits, one/ten pulls, results,
      history, save/restore, reset and recoverable request/storage errors. Prevent
      overlapping or stale responses from advancing state.
- [ ] Restore `/simulators` and add `/u/:uid/simulators`, with public/authenticated
      navigation. Verify real HTTP/browser flow, keyboard/mobile layout, build/types,
      lint and focused regressions.

Fictional state never updates real history, savings or ownership. Changed rules
require a fresh session. Existing scenario links remain traceable. The official
[Chronicled Wish FAQ](https://genshin.hoyoverse.com/en/news/detail/122695)
supports separate pity/Fate carryover. Some official scenario pages require
client-side rendering and were not text-readable in the web tool. This restoration
does not certify every historical pool, the soft-pity formula or modern Radiance.
