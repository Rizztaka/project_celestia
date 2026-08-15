# ADR 0009: Lazy Daily Reset Pattern

**Status:** Accepted  
**Date:** 2026-08-11  
**Context:**  
Phase 3 introduces daily tracking features (e.g., daily commissions, teapot claims) that must be reset at a specific time each day. For Genshin Impact (Asia Server), this reset occurs at 04:00 AM UTC+8 (which is 20:00 UTC the previous day).

Traditionally, daily resets are handled by a background cron job or a task queue that iterates over all users and updates their records at the exact reset time.

**Decision:**  
We will use a **Lazy Reset on Read** pattern instead of a background cron job.
When the user requests their daily state (`GET /api/v1/companion/daily`), the service compares a stored `dailyResetAt` timestamp against the most recent 20:00 UTC boundary. If the boundary has passed since the record was last reset, the service resets the flags and updates the timestamp synchronously before returning the response.

**Rationale:**

1. **Simplicity:** Avoids introducing a job scheduler (like BullMQ, node-cron) or relying on database triggers.
2. **Scalability:** We don't have to update thousands of inactive user records simultaneously at 20:00 UTC, which creates database spikes. Records are only updated when the user actually logs in and views their planner.
3. **Idempotency:** The reset logic is self-healing and purely a function of the current time versus the last recorded time.

**Consequences:**

- **Positive:** Infrastructure remains simple (just an Express server and PostgreSQL). No database spikes at reset time.
- **Negative:** If we ever need to send push notifications or emails _at the exact moment_ of reset (e.g., "Your dailies have reset!"), this pattern will not support it, as it relies on the user initiating a request. We will defer background jobs until such a requirement arises.
