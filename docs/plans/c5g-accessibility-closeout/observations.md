# C5g observations — 2026-10-16–17

This chronological log preserves the observations and uncertainty recorded during
the session. Later entries resolve earlier pending work where actually completed;
see [acceptance results](acceptance-results.md) for final per-check status.

## Initial state and control

- Agent: existing D: master checkout, expected HEAD, empty index; 951 baseline files.
- Owner: “Available now” for a focused session. Inherited reader/operator unavailable;
  no new claim of reader competence.
- Read installed Computer Use skill and guidance/API/confirmation documents.
- Browser API capabilities: viewport override and management only; no zoom/motion
  capability. Native Chrome inspection/input works. No viewport override applied.
- Unchanged guarded harness reached `C5D_BROWSER_READY`; private run root
  `C:/Users/inuzu/AppData/Local/Temp/celestia-recovery-F5UFOp`, terminal session 59382.
- Created test tab 426110881. Initial create reported debugger detachment; inventory
  located the created tab and a fresh binding succeeded. This is a tool interruption.
- Initial native Chrome menu displayed 100%. CSS viewport 767×722, DPR 1.25;
  outer window 782×871. Native screenshot 768×864 logical pixels.
- Agent prepared empty synthetic account and one HuTao normal Base talent 1→6,
  priority 3 using semantic controls. This setup is not keyboard-only evidence.
- Native Ctrl+plus steps displayed 110, 125, 150, 175, 200, 250, 300, 400 percent.
  At 200%: CSS viewport 383×361, DPR 2.5, document client/scroll width 376/376.
  At 400%: CSS viewport 191×180, DPR 5, document client/scroll width 188/188.
  Outer window stayed 782×871. No actual path pass is inferred from widths alone.
- Declined Chrome's synthetic password-save suggestion using No thanks.
- Browser control explicitly handed to owner at 400%; agent inputs stopped.
  First task: find HuTao goal, change priority to 4, save; report any control hard
  to find/help needed.

## Owner task 1 — actual 400%, goal priority

> i completed it, was quite easy

Owner reports completing priority 4 without difficulty. No pointing was provided.
This is a familiar owner, not a first-exposure participant. Later read-only agent
inspection showed one active HuTao normal goal, range 1→6, priority 4; no open form,
focus on Add goal. Browser control remained with the owner.

Task 2 requests a duplicate HuTao Base talent / Normal attack / 1→6 / priority 2,
the exact values remaining after rejection, and cancellation outcome.

## Owner task 2 — duplicate rejection and cancellation

> i tried to add hu tao base talent as instructed and got a yellow message saying there was already one and to check it out then i scrolled back down and canceled the goal i was trying to add

Rejection and cancellation are owner-reported; the owner did not read back exact
retained fields. Do not infer exact human draft inspection. Agent will check the
values technically after control returns. No help or inaccessible control reported.

Task 3: existing C5e character-only GOOD payload, Characters selection, preview and
confirmation at 400%; requested per-control reachability/readability observation.

## Owner task 3 — import at 400%

> i can reach Preview changes and Confirm import without help, and nothing was hard or unreadable

Owner reports both named controls reachable without help, no readability problem.
No agent input intervened. Exact import completion state will be inspected later.

Task 4 requests opening/cancelling both account forms at 400%, without submission,
and whether both Cancel controls were easy to find and use.

## Owner task 4 — account cancellation at 400%

> yes it was easy to find and use

This answers the request covering both export and deletion Cancel controls. No
submission or deletion was requested. No help or unreadable control reported.

Task 5 requests reading Hu Tao equipment information and explaining what it
establishes about in-game equipment, explicitly noting the earlier C5f coaching.

## Owner equipment explanation — retention/use after prior coaching

> it feels like there's no equipment record that's why it's saying that or atleast that what i thought

Owner associates the message with missing equipment records and expresses
uncertainty. The response does not assert equipment presence, unlike C5f's first
answer. It does not explicitly explain both possible in-game states; do not infer
full independent first-exposure comprehension. No new explanation was supplied.

Read-only geometry on the Hu Tao page remained 191×180 CSS, DPR 5, outer 782×871.
Next question asks what the character receipt time establishes about game-data
observation time and present liveness, without supplying the answer.

## Owner receipt and liveness explanation

> it seems that's when it got the data lastest. does it establish about when the game data was observed or whether it is live now?, yes it tells it was received when and i can tell it is live now to be used

“Live now to be used” was ambiguous. A neutral scenario asked what Celestia would
show after changing equipment in-game without another import. No answer or new
explanation was supplied. Owner clarified:

> it shows the data of the past meaning the data when i did the last import for hutao

This supports understanding that Celestia keeps imported observations and does not
automatically follow in-game changes. Receipt time is associated with receiving
the data. It does not explicitly establish the separate age of the original game
export; that narrower distinction remains partial. Preserve both statements.

Next question asks how the owner would finish a goal and where its record would
appear, without asking them to change it.

## Owner goal completion/history explanation

> once the goal is finished i think i will simply delete it cuz i would only wanna see what i have to do rather than waste my time looking at what i have done up until now

Owner prefers seeing unfinished work and expects to remove finished work. This
does not establish understanding of deliberate Mark complete/Good enough,
retained history, or the active-status filter. No deletion action was taken, and
no demonstrated loss of records or inaccessible control follows. Preserve this
preference and comprehension gap; do not turn it into a request for a broad redesign.

Final data-meaning question asks what recording resin 80 would establish/change,
and explicitly requests browser control handback before agent technical inputs.

## Owner manual resin explanation and control handback

> if i were to type 80 i would like it to update the current resin available amount to 80 than to whatever it was before. Browser control returned, although the browser is closed because we hit the usage limit in between

Owner expects the manually entered amount to replace the previous amount. The
answer does not explain subsequent estimation, lack of game synchronization, or
whether this changes in-game state; those meanings remain partial, not failed by
assumption. Browser control explicitly returned. Owner reports tab closure during
a usage-limit interruption. Reinspect live harness/window state before input.

## Agent technical session — October 16, after handback

First tab 426110881 was absent; replacement 426110957 was opened and the same
synthetic account signed in. The harness still responded to `snapshot` then.
Actual zoom remained native 400%, initially 191×180 CSS / outer 782×871 / DPR 5.

Actual keyboard inputs (no locator filling or mouse rescue within this loop):
Shift+Tab from Today main to Other tools, Space to expand, Tab to Intelligence,
Escape to collapse and return to Other tools; nine reverse Tabs to visible Skip
to content, Enter to main, three Tabs to Manage goals, Enter to Planner. Focus
outlines were visually observed on Other tools and Skip. Planner traversed Daily,
Weekly, Goals & materials, Events, Refresh advice, Add goal in order.

At 400%, the original two-column numeric row hid the visible 1 and 6 inside narrow
inputs. Screenshot preserved privately as `c5g-400-goal-before.png` in F5UFOp.
This is an agent-observed essential readability defect, despite the owner's
positive per-control report. Only `GoalForm.tsx` changed: the numeric grid now
stacks by default and uses two columns at `sm`. Synthetic web rebuild passed.

Before reload, keyboard duplicate submission retained Base talent / HuTao /
Normal attack / 1 / 6 / priority 2 and focused the rejection. Eight Tabs reached
Cancel; Enter returned focus to Add goal. After reload, repeated the actual-key
path through type (Down), character text, slot, from, target and priority (Up),
then Enter submission. Values again retained exactly; Cancel returned to Add goal.
Both numeric values were now visibly readable. During this later observation,
window geometry changed without an agent resize: 230×180 CSS, outer 935×871,
DPR 5. Do not claim the after screenshot used the original 191px viewport.

Keyboard edit: four Tabs from Add goal to Edit range / priority, Enter; disabled
identity fields were skipped, focus on Declared from; priority changed 4→3 with
Up, Save with Enter. Confirmed priority 3, original 1→6 range and exact focus
return to Edit range / priority; visible outline observed.

Keyboard import at 400%: navigate via reverse Tab to Import, Enter; three Tabs
to GOOD textarea; type existing C5e payload, Tab/Space selects Characters, Tab/
Enter previews. Focus on Review your changes. Tab to labelled counts region;
Right keys scrolled from 0 to 295.8px (client 152, scroll width 448), and final
After column was visually reachable. Tab to visible Confirm import, Enter;
focus Import complete, Characters count 1. Four Tabs and Enter on Import another
file returned to the cleared GOOD textarea. Four reverse Tabs and Enter opened
Settings. Keyboard export and deletion review both opened on Current password;
Tab (export) / two Tabs (deletion) reached visible Cancel; Enter restored each
exact trigger. No account operation was submitted.

Native Ctrl+minus produced 300%, 250%, 200%; 250% needed a fresh state after a
delayed native snapshot. At 200%, observed CSS 518×347, outer 1051×846, DPR 2.5,
client/scroll 510/510; no agent window resize/viewport override. Both account
forms were opened/cancelled again with keyboard, visible Cancel, exact trigger
return. Keyboard import preview reached Review your changes with the same payload
and Characters checked. This 200% confirmation had not occurred before interruption.

Fresh focused tests after correction: `tooling/goal-session.test.js` 14 and
`tooling/journey-client.test.js` 17, total 31/2, no failures/skips. Test environment
explicit NODE_ENV=test and DOTENV_CONFIG_PATH=NUL. No class-mirroring test added.

## October 17 interruption recovery

Browser tab inventory empty; terminal session 59382 no longer exists. All three
loopback ports closed; prior recorded PIDs 32040/37000/37144 absent. No normal
browser result was written. Exact lease f507cef30d100e0c, source resource directory,
postmaster PID record/start timestamp 1792154967 and known fixture identity remain.
A new C5g one-run reconciliation is constrained to this run and uses the unchanged
existing ownership/quiescence/cleanup guards. Earlier historical scripts are not
executed or altered. Remaining work will use a fresh guarded harness after cleanup.

## October 17 final UI boundary and owner decision

Reconciliation passed: exact source OID 53607, zero owned resources remaining,
owned PostgreSQL stopped and exact lease removed. Fresh unchanged harness Gwsf8Z
reached READY; no new acceptance path completed in it. Windows Settings launch
timed out and no Settings window appeared. Opening the test page before READY
reported connection refused; this was startup timing, not an application defect.
Native capture then stopped Computer Use because the current Chrome URL could not
be determined confidently enough for policy enforcement. No further UI input or
alternate UI route was attempted. Reduced motion remains unperformed.

Owner asked to restore original 100% and close the test tab:

> was already on 100% zoom so i just closed it

This is owner-reported final restoration, not independently verified. No motion
preference or browser viewport override was changed by the agent. The owner was
then separately asked to choose local HOLD or CONTINUE, with missing 200%, motion,
reader and partial comprehension evidence explicitly visible. Answer:

> Local CONTINUE with recorded gaps

No deployment/invitation/C6/C7 authorization follows. The agent readiness
recommendation is separately HOLD because essential evidence remains missing.

Fresh harness quit produced all four cleanup flags true and exit 0. Its result is
`C:/Users/inuzu/AppData/Local/Temp/celestia-recovery-Gwsf8Z/c5d-browser-result.json`.
Running Chrome executable metadata on October 17 reported 155.0.8059.82; this is
not a browser-UI version observation or proof of the version used October 16.

## Tool limits

Read-only browser evaluation does not expose navigator. A version/media expression
failed before setup input; the corrected DOM viewport expression succeeded. No
browser version or reduced-motion state is inferred from that failed expression.

## Final non-UI verification

The unchanged guarded recovery/full verification command passed after the final
application change: 1,006 tests / 55 files / 133 actual PostgreSQL cases, no failures
or skips. All schema, lint, type, build, repository-format and diff checks passed.
The raw reports are hash-referenced in [validation](validation-results.json).
Owned cleanup passed; an independent check found all three test ports free, no
fixture process/lease/PID record and no generated pgpass files. These technical
results do not supply the missing human or accessibility evidence.
