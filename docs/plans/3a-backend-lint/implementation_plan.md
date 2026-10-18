# 3A backend lint coverage: investigation and implementation handoff

Date: 2026-09-24. Reviewed checkout: `2d8820a48db83d7c62feebd849f2f1c2d3488bb6`.

Status: local implementation completed on September 25 after the owner explicitly authorized implementation today. See [walkthrough](walkthrough.md) for results and deviations discovered during validation. The original investigation below is retained as baseline evidence. No push, deployment, hosting creation, or account-security reimplementation was performed.

## Release evidence

The user supplied completed verification of GitHub master, successful CI run 35900358093 (287 tests in 21 files, including 22 security HTTP tests), successful Vercel deployment, frontend API URL, and production HTTP checks. These were accepted as prior evidence, not rerun.

The Render deployed commit SHA remains **unverified**. The available in-app browser opened `https://dashboard.render.com` and was redirected to `/login`, showing “Sign In to Render.” No Render connector was exposed in the available tools; neither a Render CLI nor Render-named environment credentials were available in the shell. No authenticated browser was available in the browser inventory. These access paths cannot inspect the existing service's deployment record. This does not establish that Render is running an older commit, nor does the successful health check establish its SHA.

To close this evidence item later, read the existing celestia-api service's current live deployment details through authenticated Render access, recording the service/deployment identity, full commit SHA, live status, and observation time. Compare against the reviewed commit. Do not create hosting or redeploy merely to obtain evidence.

## Configuration findings

- Root `package.json` runs `turbo run lint`; `turbo.json` already defines a lint task. API has ESLint dependencies and a flat config but no lint script.
- Turbo's read-only dry run reports API and api-contracts lint commands as `<NONEXISTENT>`; web alone has `eslint .`.
- Existing CI already invokes root lint. Adding the API script is sufficient to include it; a duplicate CI lint job is unnecessary.
- API config enables recommended JS/TypeScript rules, import sorting, Node globals, and boundary policies. Tests already have a boundary-rule override; preserve it unless independently reviewed.
- API config has no global `dist` exclusion. Git ignore rules do not prevent this ESLint run from examining compiled output. CI typechecking runs upstream builds before lint, so build-output independence matters.
- The installed boundary plugin emits a separate migration warning for three legacy entity selectors. This console warning is not included in ESLint's JSON warning counts. No boundary errors in the baseline prove neither correct classification nor complete architecture enforcement.
- There is no dedicated lint script in api-contracts; that separate package is outside this bounded API milestone.

## Measured baseline

Local Node v22.14.0; ESLint v10.8.0. No installs, autofixes, builds, or tests were run. Existing local build output was inspected as-is.

Commands executed from `apps/api` using the installed CLI:

```text
node node_modules/eslint/bin/eslint.js . --format json --output-file <temporary-report>
node node_modules/eslint/bin/eslint.js src eslint.config.js prisma.config.ts vitest.config.ts --format json --output-file <temporary-report>
```

The repository-root task check was `node node_modules/turbo/bin/turbo run lint --dry=json`.

| Scope                                      | Files examined | Errors | JSON warnings | Autofixable errors |
| ------------------------------------------ | -------------: | -----: | ------------: | -----------------: |
| Whole API directory, current configuration |            245 |    135 |             7 |                 83 |
| Maintained source and three root configs   |            123 |     63 |             0 |                 23 |
| Existing generated dist output             |            122 |     72 |             7 |                 60 |

Maintained scope comprises 120 source files (including all 21 test files) and `eslint.config.js`, `prisma.config.ts`, and `vitest.config.ts`. The three config files are clean. There are 36 failing source files. Tests contribute 26 errors; non-test source contributes 37. Generated warnings are unused disable directives. Compiled-output counts depend on the pre-existing local build and are not the source remediation target.

| Source rule                        | Errors | Treatment                                               |
| ---------------------------------- | -----: | ------------------------------------------------------- |
| simple-import-sort/imports         |     23 | Mechanical import sorting, review side-effect imports   |
| @typescript-eslint/no-explicit-any |     22 | Typed fixtures/mocks, inference, unknown with narrowing |
| @typescript-eslint/no-unused-vars  |     12 | Remove dead bindings; preserve deliberate API patterns  |
| no-useless-assignment              |      5 | Remove overwritten initializers with explicit types     |
| @typescript-eslint/no-namespace    |      1 | Preserve Express request type augmentation              |

See `baseline.json` for every finding and line number, including generated-output findings. The count reflects currently enabled rules and existing suppressions; this is not a claim of exhaustive architectural or type-safety coverage.

## Bounded implementation sequence

1. **Define maintained-file coverage and wire the task.** Add API `lint: "eslint . --max-warnings 0"`. Add a global ignore for API `dist/**` (and only evidenced generated output if another directory is found). Keep source, tests, and root JS/TS configs in scope. Keep recommended rules, import rules, and architecture policies enabled. Do not edit generated files. No dependency upgrade is needed.
2. **Apply mechanical cleanup.** Sort the 23 offending import blocks. Remove genuinely unused imports and abandoned test constants. Review diffs to preserve import side effects and fixture semantics. Do not use a repository-wide autofix.
3. **Repair types and assignments.** Replace the 19 test `any` findings in character/team/progression intelligence with complete typed fixtures and `vi.mocked` calls, retaining scenario assertions. Remove the redundant `any` annotation from the progression roster callback. Use `unknown` and appropriate narrowing in the two controller catches; retain existing response contracts and simulator fallback behavior for thrown values. Replace the five overwritten initializers in planner and pull simulator with correctly typed declarations, preserving branch assignment and deterministic calculations. Avoid `unknown as T` casts that merely hide incomplete fixtures.
4. **Handle deliberate patterns narrowly.** Keep the Express error handler's fourth parameter: removing it changes error-handler recognition. Prefer an exact-site documented unused-parameter exception rather than broadly ignoring underscore variables. Keep password removal in both auth and user services; use an exact-site justified exception or a reviewed safe projection that preserves the response fields and never returns password. Remove the unused character `.map` destructuring binding and team explainer argument with caller review. Preserve request augmentation using a compatible module augmentation or a declaration-only rule option scoped to its file; verify all `req.user` consumers still typecheck. Do not disable namespace checking globally.
5. **Resolve the boundary compatibility warning without changing policy meaning.** Use the installed plugin's documented entity-selector shape for the three reported policies. Before accepting the change, use isolated in-memory lint fixtures to demonstrate representative allowed imports still pass and prohibited platform-to-game / Genshin-to-HSR imports still fail. If classification/resolution is already ineffective, document that separately and limit any repair to making the existing declared policies effective; defer expansion to new game policies or architecture redesign.
6. **Validate and review one coherent milestone.** Run API lint and root lint uncached; confirm root output actually executes API and web. Run typechecking, formatting checks, existing full API tests, and build; rerun API lint after the build to confirm generated files cannot affect results. Preserve the unrelated tracked Turbo test log: prefer direct Vitest execution (with the existing non-production test environment) rather than the Turbo test task that overwrites it. Use existing security tests to guard error-handler classification and password exclusion. Add focused controller error-path tests only if catch narrowing alters or exposes behavior not already covered. Record actual counts rather than assuming the previous 287 remains unchanged.

## Acceptance and scope limits

- Full maintained API scope: zero lint errors and zero warnings, no blanket rule disabling or exclusions of failing source/test files.
- Root task visibly runs API plus web; lint is invariant to the presence of build output.
- Existing security and intelligence behavior remains intact; typecheck, relevant tests, formatting, and build pass.
- No auth redesign, endpoint expansion, schema migration, dependency churn, frontend cleanup, or new hosting work.
- If boundary-policy repair becomes architectural work or type cleanup requires behavior changes, stop that expansion and document a separate follow-up rather than broadening this milestone silently.
- Implement in one Wednesday/Sunday session if feasible; carry unfinished work to the next such session. No automatic scheduling was created.
- The starting sole local change was `apps/api/.turbo/turbo-test.log`, SHA256 `790D929247252D64703A67C561419E28206DA7A37D2A49F6253CFEEB3ECB0AED`. Preserve it exactly. This investigation adds only planning/evidence artifacts.
