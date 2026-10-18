# Section 4 — UI, artwork and accessibility

Implemented on 2026-10-18 in the existing checkout.

- Shared `GenshinAvatar` and `GenshinWeaponIcon` replace all four named surfaces'
  raw image/initials handling. Pinned icon IDs and rarity metadata cover the whole
  supported progression catalog, including Traveler variants. Names are readable,
  images load lazily and decode asynchronously, and local element motifs remain
  available through failed or stalled CDN requests. See [sources](sources.md).
- Priority goals, Original Resin and unfinished daily reminders use elevated
  indigo gradients and category badges. Passive/completed cards are quieter.
  Roster cards distinguish four/five-star rarity. Resin changes emerald → amber
  → rose at 120/160, with a bounded alert pulse. The actual resource cap remains
  the server-provided 200; 160 is an urgency threshold, never labeled as the cap.
- Below 640px, one compact brand/Menu row replaces the desktop rows. A native
  modal drawer groups every destination, cycles Tab/Shift+Tab, closes on Escape,
  link navigation, other route changes or widening the viewport, and restores
  focus. Desktop navigation and its Other tools disclosure remain available.
- The existing inline export/deletion confirmation forms now use a bounded,
  responsive container and compact controls. Their session/credential handling,
  explicit confirmation requirements and cancellation focus behavior remain.
- Planner and Inventory share linked ARIA tabs and panels, roving tab focus,
  Left/Right/Home/End support and URL-backed Planner selection. Countdown live
  regions announce complete human-readable phrases at minute boundaries.
  Named meters expose resin and manual daily-reminder progress. Visible focus
  outlines, neutral unknown metadata and reduced-motion overrides are retained.

Validation and limitations are recorded in `validation-results.json`. The browser
script uses synthetic read-only intercepted API responses against the normal
production bundle; it never submits account, routine, goal or inventory writes.
These checks are evidence for the named behaviors, not WCAG AAA certification or
an experienced screen-reader usability assessment.
