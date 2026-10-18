# Owner-local walkthrough — about 15 minutes

This is a blank observation script for the owner, not a public beta invitation.
Actual elapsed time and feedback have not been measured. Use only synthetic data.

## Start and stop

From the project root in an interactive PowerShell terminal, read the
[fixture provenance](../c5c-request-safety/review-fixture-provenance.md) and
[C5d commands/cleanup](../c5d-account-data/commands-and-cleanup.md), then:

```powershell
$env:NODE_ENV='test'
$env:DOTENV_CONFIG_PATH='NUL'
pnpm --filter @celestia/api exec tsx tooling/account-data-browser.mjs --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5c-request-safety\review-fixture.json'
```

Wait for `C5D_BROWSER_READY`, then open `http://127.0.0.1:45449` in a browser.
These credentials exist only in this disposable harness:
`c5b-empty@test.invalid` (no import) or `c5b-a@test.invalid` (returning account),
password `C5d-synthetic-only!`. Do not use or save a personal password.
The fixture is deliberately named C5d; no older harness was rewritten for C5e.

When finished, restore browser zoom to 100% and your previous motion setting,
close the test tab, type `quit` in the harness terminal and wait for a passed result
with all four cleanup flags true. Do not close the terminal while cleanup runs.
If a guard fails, stop and retain its exact error; never substitute a normal DB.
`cleanup-interrupted.mjs` is historical one-run evidence, not a reusable command.

## Core loop

1. **0–3 minutes — no import.** Sign in as empty owner. Explain what is supported
   before selecting Asia. Choose commissions, save choices and record resin 80.
   Check commissions. Can you tell the manual checkpoint from live game data?
2. **3–6 minutes — a useful goal.** Create a manual Base talent goal, Character key
   `HuTao`, normal attack 1→6. Change priority. Attempt the same goal again to see
   a safe failure; inspect retained draft, then cancel. Does focus return somewhere
   useful? What would you expect a goal to do when new data is imported?
3. **6–9 minutes — observations.** Paste the JSON below in Import, select Characters,
   preview and confirm. Inspect Hu Tao, choose focus and return to the exact goal.
   Explain what the receipt dates and what unknown equipment means. The goal should
   remain active at its declared range.
4. **9–12 minutes — navigation and settings.** Use Tab/Shift+Tab/Enter/Space, the skip
   link, Other tools/Escape, browser Back and reload. Open Settings, review export
   and deletion then Cancel both. Do not delete an account for this walkthrough.
5. **12–15 minutes — usefulness.** Sign out and inspect the populated sample account
   if useful. What would you return to use? What was confusing? Which saved/draft,
   unsupported-data or account-data explanation was hard to understand?

```json
{
  "format": "GOOD",
  "version": 2,
  "source": "C5e synthetic",
  "characters": [
    {
      "key": "HuTao",
      "level": 80,
      "ascension": 6,
      "constellation": 0,
      "talent": { "auto": 6, "skill": 6, "burst": 6 }
    }
  ]
}
```

## Essential human checks (additional time as needed)

- Use the browser's actual zoom menu at **200% then 400%**. Record browser, window
  dimensions and displayed zoom. Repeat goal editing, import review/confirmation
  and account cancellation. Essential controls must remain reachable; the counts
  table may scroll horizontally within its labelled region. Return to 100%.
- Turn on the OS reduced-motion preference, reload sign-in and Today, navigate and
  trigger a failed form. Verify fade/movement is suppressed; restore your prior
  preference. Record actual setting and browser, not just CSS inspection.
- With a screen reader you use or know how to test, inspect main/navigation
  landmarks, headings, form labels, checked/disabled states, errors and successful
  saves. Verify goal-editor focus return and import review/completion announcements.
  Record the reader/version and any duplicate, absent or confusing announcement.
  If unavailable, leave this unperformed; do not infer it from DOM roles.

## Blank observation record

- Date / actual minutes / browser / viewport / actual zoom:
- Input method / screen reader / motion preference:
- Tasks completed, stopped or needing help:
- Useful task you would return for:
- Confusing wording or behavior (exact steps):
- Could you distinguish saved data, drafts, failed saves and unavailable advice?
- Accessibility check results (pass / fail / unperformed, with reproduction):
- Evidence or screenshot path, using synthetic data only:
- Proposed smallest correction / owner-local continue-or-hold decision:

Feedback is evidence to review, not authorization for C6/C7 or public invitation.
