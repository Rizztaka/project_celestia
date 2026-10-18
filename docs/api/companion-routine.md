# Companion routine V2

Local C2a implementation; Asia clock activated 2026-10-02, all four servers enabled 2026-10-17. Not deployed. All routes require the normal bearer token; ownership comes only from its verified subject. Strict schemas reject extra identity, timestamp, or unrelated action fields.

Supported IDs are `asia`, `america`, `europe` and `tw_hk_mo`; null clears selection. Daily resets are 04:00 at fixed UTC offsets +8, −5, +1 and +8 respectively; weeks begin Monday at 04:00. No host timezone or daylight-saving adjustment is applied. Asia period IDs remain compatible. Changing the selected server clears daily and weekly period records, retires plan dismissals and advances revisions atomically; resin and Transformer checkpoints remain. The additive `20261017150000_support_genshin_servers` migration widens the two server CHECK constraints without rewriting existing rows. See [source and observation limits](../plans/production-readiness/sources.md).

C4 integration, 2026-10-06: [Today plan V1](today-plan.md) reuses these observations independently of import. Optional home visibility never deletes routine records. An explicit server selection change clears owned plan dismissals and advances any existing plan-preferences revision inside the same owner-locked settings transaction, preventing old visibility from returning after a server round trip. Routine saves and boundaries invalidate the home plan/advice queries. The V2 request/response contract is unchanged.

## Routes

Base: `/api/v1/companion`.

| Method | Path                         | Purpose                                                                    |
| ------ | ---------------------------- | -------------------------------------------------------------------------- |
| GET    | `/routine?contractVersion=2` | Read-only full snapshot; absent row returns revision 0 without creating it |
| PATCH  | `/routine/settings`          | Select a supported server or null                                          |
| PATCH  | `/routine/checklist`         | Set daily flags, record Transformer use now, or clear its record           |
| PATCH  | `/routine/resin`             | Record explicit integer 0–200 with a server timestamp                      |
| PATCH  | `/routine/weekly-claims`     | Record integer 0–1000 or null for the current week's reward-claim total    |

Every PATCH returns the full snapshot in the normal `{ success, data }` envelope. Its revision increments once, including explicit no-op saves. Read responses never increment it.

Retired `/daily`, `/resin`, `/checklist`, and `/weekly-bosses[/key]` routes return `409 COMPANION_CLIENT_UPDATE_REQUIRED` for their former methods. A `contractVersion=2` query does not reactivate these paths. Update clients to `/routine`.

## Request examples

Settings do not carry period fields:

```json
{ "contractVersion": 2, "expectedRevision": 0, "serverId": "asia" }
```

Manual resin remains available before server selection:

```json
{
  "contractVersion": 2,
  "expectedRevision": 1,
  "serverId": null,
  "dailyPeriodId": null,
  "amount": 0
}
```

Checklist actions are a strict discriminated union:

- `setDaily`: at least one of `commissionsDone`, `teapotChecked`; requires an available selected clock and its current daily period ID.
- `recordTransformerUse`: records the transaction's acceptance time; accepts no flags or client timestamp.
- `clearTransformerUse`: clears the last-use record; accepts no flags or timestamp.

All checklist actions carry `contractVersion`, `expectedRevision`, `serverId`, and `dailyPeriodId`. Manual actions may use a null period only when the provider has no available period; if a clock is available they must carry its current ID too.

Weekly claims additionally require `weeklyPeriodId` and `rewardClaims`, and a non-null supported server/daily period. These IDs must come from a fresh snapshot. Never construct IDs in the browser. Any selected supported server enables daily/weekly writes. Manual writes with a selected server must also carry the fresh daily period ID; an older null-period client receives `409 COMPANION_STALE_PERIOD` and must refresh.

## Snapshot and errors

The shared TypeScript contract is `packages/api-contracts/src/genshin/companion.ts`.

Snapshots include `serverNow`, `clockStatus`, `serverId`, `revision`, `period`, task descriptors, discriminated resin state, weekly claims, and an optional read-only legacy summary. Clock status is `available`, `unselected`, `unverified`, or `unsupported`. Unavailable clocks return null period metadata. All four selected supported servers return `available` with their own offset, day and Monday week; daily and weekly countdowns are shown by the client. [Original Asia evidence](../plans/c2a-clock-task-reliability/sources.md) remains historical; current attribution is linked above.

Known resin exposes the original amount/time, regeneration interval, cap, projected amount/time, and cap ETA. Unknown resin has an explicit reason; it is not zero. Weekly claims null is also distinct from zero. Discount and next-claim cost remain null pending separate evidence.

| Status | Code                               | Recovery                                                                              |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`                 | Correct the strict request body                                                       |
| 400    | `BAD_REQUEST`                      | Supply the exact V2 GET query                                                         |
| 400    | `COMPANION_CLOCK_UNAVAILABLE`      | Daily/weekly actions need a selected, verified clock; manual actions remain available |
| 409    | `COMPANION_STALE_REVISION`         | Refresh, show the changed state, and let the user decide whether to save again        |
| 409    | `COMPANION_STALE_PERIOD`           | Refresh period metadata and let the user reconfirm                                    |
| 409    | `COMPANION_SERVER_MISMATCH`        | Refresh the selected server before retrying                                           |
| 409    | `CONFLICT`                         | Database conflict; refresh, no automatic retry                                        |
| 409    | `COMPANION_CLIENT_UPDATE_REQUIRED` | Reload/update the old client                                                          |

Unsupported server strings fail schema validation. Neither GET nor PATCH accepts caller-selected ownership. Today Domains and Planner Intelligence return actionable `422 UNPROCESSABLE_ENTITY` when their clock prerequisites are unavailable; Planner also requires a known resin checkpoint.

The additive routine migration must precede a separately authorized API/frontend release. Existing legacy and import records are preserved. See [ADR 0013](../adr/0013-versioned-routine-snapshots.md).
