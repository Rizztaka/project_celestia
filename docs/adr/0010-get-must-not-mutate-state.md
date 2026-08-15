# ADR 0010: HTTP Semantics Preservation — GET Must Not Mutate State

**Date:** 2026-08-13
**Status:** Accepted
**Phase:** 3C — Event Planner
**Decider:** User + AI Engineering

---

## Context

During the design of the Event Planner (Milestone 3C), a question arose about
how to handle **stale `EventProgress` rows** in the database. These are rows
whose `eventKey` no longer appears in the current `events.json` (because the
patch has changed and old events have been removed).

Two cleanup strategies were considered:

- **Option A — Lazy:** Ignore stale rows. They are simply never read, since
  `EventService.getEvents()` only returns events present in `events.json`.
  Cleanup is deferred to a future maintenance utility.

- **Option B — Active on GET:** On every `GET /api/v1/companion/events` request,
  delete any `EventProgress` rows whose `eventKey` is absent from the current
  `events.json`.

## Decision

**We chose Option A (Lazy cleanup).**

The primary reason is HTTP semantics: `GET` requests MUST be **safe** and
**idempotent** per [RFC 9110 §9.2.1](https://www.rfc-editor.org/rfc/rfc9110#section-9.2.1).
A "safe" method is defined as one that does not change the state of the server.
A `GET` that silently deletes database rows violates this guarantee.

This matters because:

1. **Caching:** HTTP intermediaries (proxies, CDNs, TanStack Query's own
   cache) assume `GET` responses are read-only. A `GET` that mutates state can
   produce inconsistent behaviour when responses are cached and replayed.

2. **Retry safety:** If a `GET` fails mid-flight (e.g. network timeout), the
   client will retry it automatically. If that `GET` was also deleting rows,
   the retry could produce unexpected results — rows deleted twice (no-op here,
   but dangerous as a pattern).

3. **Observability:** Debugging is harder when a `GET` has side-effects. A
   developer investigating a missing row cannot tell whether it was deleted by
   a user action or silently purged by a read request.

## Consequences

- Stale `EventProgress` rows will accumulate after each patch update (~every
  6 weeks). They are small (one row per stale tier per user) and harmless:
  the service layer filters by `eventKey` membership in `events.json`.

- A future maintenance utility (planned for Phase 8 cleanup pass) can purge
  stale rows via an authenticated admin endpoint (`DELETE /api/v1/admin/events/stale`)
  or a scheduled background job. This is the correct place for destructive
  operations.

- This decision establishes a **project-wide principle**: no `GET` handler in
  the companion domain (or any other domain) is permitted to issue `DELETE`,
  `UPDATE`, or `INSERT` database statements as a side-effect of a read operation.

## Related

- ADR 0009 — Lazy Daily Reset Pattern (a complementary example: the lazy reset
  on `GET /companion/daily` does write to the DB, but this was an intentional
  trade-off made explicitly in that ADR, and the write is idempotent and
  essential to the feature. The event cleanup case lacks both properties.)
