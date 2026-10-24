# Named showcase talents

Implemented in the existing isolated `codex/p1-enka-showcase` worktree.

- Build disclosures and detailed character pages now display actual talent names instead of Talent 1/2/3. Removed the extra raw-ID suffix beside known talent names. Base levels and constellation bonus levels still come solely from the public Enka response.
- The metadata acquisition tool reuses the existing character-reference index and verifies each source file's SHA-256 and identity. It projects combat talent names onto the pinned Enka skill IDs using game ID, combat kind and SkillOrder. Traveler variants use Enka's element to select the corresponding reference for either protagonist. The generated `static/enka/talent-names.json` and provenance travel with the packaged API.
- Partial or reordered responses match by skill ID. Unsupported characters, forms and unrecognized skills keep a `Skill <id>` fallback. Missing levels remain missing.

Verification: **131 targeted tests pass** across the showcase API, HTTP boundary, rendered client, UID workspace, legacy journey and importer suites. The tests cover Hu Tao's names and bonus levels, Skirk, Columbina, both Traveler protagonists and multiple elements, partial observations, unknown skill IDs and rendered labels. Evidence: `talent-names-test-results.json`.

API and web production builds (including TypeScript), scoped API/web ESLint, formatting and diff checks pass. A direct import of the packaged API parser resolves Skirk's three names from the copied static data. Original checkout preservation passes for all 3,481 recorded files, branch, HEAD and index. The local launcher was restarted successfully on API 45750 and web 45751 to load the new backend metadata.

The local app uses the same launcher: run `pnpm showcase:dev` from this worktree, then open http://127.0.0.1:45751/. Reload Public Profile and expand View build, or click the character header for its detail page.

Interactive browser verification remains unavailable because Chrome automation was blocked by an open extension UI during the previous follow-up. No new browser screenshot or interactive verification is claimed. No deployment, push, merge, database changes or P1 finalization.
