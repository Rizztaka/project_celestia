# C1a safe import checklist

- [x] Define versioned shared request/response contracts.
- [x] Preserve omitted and unselected sections; merge characters.
- [x] Validate owned equipment locations and duplicate assignments.
- [x] Require user-bound, expiring preview and clearing confirmations.
- [x] Commit account initialization and inventory atomically.
- [x] Reject stale previews, replay, and competing imports with recoverable conflicts.
- [x] Update the import UI, affected cache invalidation, and retry flow.
- [x] Service and HTTP tests: 35 cases passed.
- [x] Native disposable PostgreSQL 18 integration: 13 cases passed.
- [x] Browser verification: full/partial import, empty confirmation, stale preview/recovery, narrow screen.
- [x] Full suite, lint, types, formatting, and build.
- [x] Finish review handoff and preservation checks.

No production changes, push, or deployment. C1b provenance remains separate.
