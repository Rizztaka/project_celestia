# Backend lint implementation handoff

Date: 2026-09-25. Base commit: `2d8820a48db83d7c62feebd849f2f1c2d3488bb6`.

The owner explicitly authorized implementation today. This milestone is implemented locally, without commit, push, deployment, or production database changes. C1a import safety is the next product milestone and has not been implemented.

## Changes

- API now exposes `lint: eslint . --max-warnings 0`, so the existing root Turbo task and CI include the backend. Only generated `dist/**` is excluded.
- Fixed all 63 measured maintained-source lint errors through import sorting, typed test fixtures/mocks, unused-code cleanup, safe unknown-error narrowing, and removal of overwritten initializers.
- Retained Express error middleware's four parameters and both password-hash stripping paths with documented exact-site exceptions. Ambient Express request augmentation uses a declaration-only exception scoped to its middleware file. No rules were disabled globally.
- Migrated boundary selectors to the installed plugin's entity shape. Regression checks revealed that `.js` imports and `@/` aliases previously bypassed policy checks, and the generic game pattern hid Genshin/HSR classification. Added `eslint-import-resolver-typescript` and ordered specific patterns before the fallback.
- `tsconfig.eslint.json` inherits the source compiler configuration but clears project references. The resolver otherwise follows the separate Vitest configuration and loses source aliases. Application TypeScript configuration remains unchanged.
- Added 10 executable lint-configuration regressions for real aliases/extensions, platform/game restrictions, both Genshin/HSR directions, allowed dependencies, and generated-output exclusion. These run in the normal API Vitest suite.
- Added five simulator HTTP error-response cases for Error objects, message-bearing objects, null, empty messages, and non-string messages. Existing simulator success behavior and response shape remain intact.

## Validation

- Full direct API Vitest run: **302 tests passed across 23 files**, including **22 security HTTP tests**. Direct execution preserves the tracked Turbo test log.
- Uncached root lint: API and web both executed; **2 tasks passed**.
- Uncached root build: API contracts, API, and web all executed; **3 tasks passed**. Frontend build emitted a CSS plugin timing advisory.
- API `tsc --noEmit` passed; root check-types also exercised the configured task graph. Web type checking is included in its successful `tsc -b && vite build` command.
- Post-build API lint: zero errors and zero warnings, confirming generated output cannot break the gate.
- Changed source/configuration files formatted with Prettier; whitespace/diff checks performed.
- Frozen-lockfile offline installation succeeded using the existing `D:/.pnpm-store`. The resolver's optional build script is explicitly disabled in workspace policy; its packaged native binding works in the tested Windows environment. CI on Linux has not been run for these unpushed changes.

## Preserved state and limitations

The unrelated `.env.example`, environment configuration, and `core/ai/openrouter.ts` changes were left intact. The existing OpenAI dependency was retained when adding the resolver to the package manifest and lockfile. Do not attribute those pre-existing AI changes to this milestone or discard them when preparing a commit.

The tracked `apps/api/.turbo/turbo-test.log` must retain SHA256 `790D929247252D64703A67C561419E28206DA7A37D2A49F6253CFEEB3ECB0AED`.

Render's deployed SHA remains unverified: available dashboard access redirects to sign-in, and no authenticated Render connector, CLI, or credential was available. No service was created or redeployed to obtain evidence.

Existing boundary test exemptions and the scope of the declared policies remain unchanged. This is not an exhaustive architecture audit, a new NIKKE isolation policy, or a repair of dynamic imports hidden from static analysis.

The companion documentation changes already in the working tree are separate from this lint milestone. Continue with the C1a plan in `../genshin-companion/implementation_plan.md`: explicit import scope, preview/confirmation, owned equipment resolution, and atomicity/concurrency verification. Do not mix that data-writing change into a lint review.
