# UID-first checklist

- [x] Inspect original application, safe worktree and P1 adapter/components.
- [x] Record original checkout preservation baseline.
- [x] Implement coherent public routes, successful UID persistence and switching.
- [x] Reuse profile/build UI and enforce refresh deadline in the frontend.
- [x] Automated regressions and quality gates (126 tests pass after the UI cleanup).
- [x] Full-flow desktop/mobile verification.
- [x] Handoff launch instructions and evidence.
- [x] Connect UID to the main Today layout, Characters and Equipment views.
- [x] Verify shared data, mobile navigation, switching and Columbina in the main site.
- [x] Remove duplicated Today panels; simplify Public Profile to timer/error feedback and inline builds with clickable character identities.
- [x] Replace numbered talent placeholders with sourced names; retain observed levels, bonuses and unknown-skill fallbacks (131 targeted tests pass).
- [x] Shorten inline builds to an overview, retaining the full breakdown on character detail pages (37 focused client tests pass).
- [x] Supersede the inline overview with full-area character links; remove View build and display full builds directly on their detail pages (37 focused client tests pass).
- [x] Remove showcase refresh controls and countdown from character build pages while retaining Public Profile refresh (37 focused client tests pass).
- [x] Label named talents by Normal Attack, Elemental Skill and Elemental Burst; preserve unknown types and recorded levels (131 targeted tests pass).
- [x] Implement the character build sheet, remove its top-right UID button, and add the shared UID search/preview/Add dialog for first use and switching.
- [x] Validate explicit Add, cancellation, returning users, mobile navigation and error/cache behavior with React DOM interaction tests and existing regressions.
- [x] Add combined element, weapon type and 4★/5★ character filters, URL persistence, counts and Clear filters (146 targeted tests pass).
- [ ] Personal visual review of the new build sheet and native UID dialog (browser automation remains unavailable).
- [ ] Owner acceptance and P1 finalization (intentionally pending).

- [x] Persist roster observations per UID; refresh upserts without deleting absent characters.
- [x] Keep Public Profile current-only; retain labeled builds in Characters, Equipment and details.
- [x] Verify persistence, failures, empty data, concurrency, rollback and the real App refresh/reload flow (153 targeted tests pass).
- [x] Inspect GitHub, Vercel, confirmed Render workspace and Supabase read-only.
- [x] Complete full repository verification and final commit (1,705 tests across 102 files; all quality gates pass).
- [ ] Publish changes (requires explicit authorization under the earlier no-push/no-deploy instruction).

- [x] Route old public login/registration bookmarks to UID entry without session restoration; preserve legacy account access under `/workspace/login` and `/workspace/register`.
- [x] Test Add UID versus Switch UID on both old public URLs and retain private workspace authentication (77 focused client tests pass).
