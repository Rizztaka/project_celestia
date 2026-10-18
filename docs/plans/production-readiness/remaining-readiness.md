# Remaining scope and release evidence

> Subsequent owner request, 2026-10-17: [farming intelligence](../farming-intelligence/walkthrough.md)
> now implements bounded historical coordinate-stop ordering and approximate
> selected-difficulty resin/calendar projections. This original core-phase list
> remains historical. Current limits are all-region/terrain/live-spawn coverage,
> sampled probability bounds, exceptional targets and actual release evidence;
> see the follow-up's source record and walkthrough.

The owner changed direction from bounded C5h to working core functionality on
2026-10-17. The current implementation is a local candidate for that expanded
core. No production deployment, invitation or human accessibility acceptance has
occurred. The earlier general owner walkthrough must not be repeated or inferred
from these agent checks.

## Product limits

- The pinned community snapshot is attributed and reproducible, but its original
  game version/capture date is unknown. Current-patch completeness is not claimed.
  Source updates need a new pinned revision and cost/schedule regression checks.
- Traveler talent exceptions, Manekin/Manekina costs and three ambiguous temporary
  quest weapons remain unavailable rather than receiving guessed quantities.
- Goals cover ascension phases and declared base talents. Character/weapon level
  EXP, artifact optimization and individual-copy weapon progress are outside this
  calculator. Re-import never silently advances a declared goal range.
- Weekday domain schedules, material source hints and an official map handoff are
  implemented. Optimized coordinate-based enemy/gathering routes are not.
- Resin pacing allocates whole 20-resin reward sets within the selected budget and
  recorded resin estimate. It does not estimate guaranteed drops, required runs,
  completion days or comparative statistical farming efficiency. Those need
  explicit Adventure Rank/yield evidence and a separate model.
- Unknown imported inventory remains unknown. A missing stock entry is never
  converted to a zero observation, even when the full material cost is available.

## Evidence that is still absent

Actual browser-menu 200%/400% checks, effective OS reduced motion and competent
screen-reader use were not performed in this execution. The 320px responsive
check is separately attributed. The owner's previous report of being new to
screen readers does not count as reader evidence. These gaps do not undo the
functional tests or require another general owner walkthrough.

Remote CI for this exact dirty checkout and a deployed environment were not
observed. Production origins/proxy limits, secrets, migration execution, backups,
restore objectives, retention/erasure policy and support/lost-access handling
need evidence from the actual deployment and its operator. Local synthetic
recovery establishes the recovery mechanism, not a production backup service.

## Database compatibility

The new four-server UI/API requires the additive
`20261017150000_support_genshin_servers` migration. Existing thirteen migrations
and rows are preserved. Deploy that forward migration before using the new server
choices against an existing database. This session applied it only to the
explicit disposable fixture; it did not modify an ordinary or production DB.

The recovery snapshot validator now expects the exact fourteen checked-in
migration names and checksums, including this migration. Finished/applied/not
rolled-back validation remains enforced. No minimum-count shortcut or weakened
disposable-database guard was added.
