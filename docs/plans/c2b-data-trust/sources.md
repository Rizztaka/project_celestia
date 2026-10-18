# C2b evidence manifest and supported coverage

Reviewed 2026-10-02 by Codex. Game version and original game observation/capture time are unknown and stored as null. Retrieval/review happened in this implementation session; no screenshot or firsthand player observation is claimed.

## Accepted primary evidence

[HoYoLAB's official Enhancement Progression Calculator API](https://sg-public-api.hoyolab.com/event/e20200928calculate/v2/compute) returned `retcode=0` to anonymous calculations, without account data or inventory synchronization. The [readable saved request/response record](evidence/hutao-talents-primary.json) includes the complete 15 responses for Hu Tao's normal attack (`4631`), skill (`4632`), and burst (`4639`), each independently queried for 1→2 through 5→6. Avatar `10000046` was identified by the official calculator's avatar list; the saved [identity response](evidence/hutao-identity-primary.json) records that join. Requests hold character level constant at 20; only `avatar_skill_consume` establishes the talent costs. Response `lack_num=0` is **not inventory evidence** and is never used.

The API returned these exact costs identically for all three talents:

| Base talent action | Books                     | Common material         | Mora   |
| ------------------ | ------------------------- | ----------------------- | ------ |
| 1→2                | Teachings of Diligence ×3 | Whopperflower Nectar ×6 | 12,500 |
| 2→3                | Guide to Diligence ×2     | Shimmering Nectar ×3    | 17,500 |
| 3→4                | Guide to Diligence ×4     | Shimmering Nectar ×4    | 25,000 |
| 4→5                | Guide to Diligence ×6     | Shimmering Nectar ×6    | 30,000 |
| 5→6                | Guide to Diligence ×9     | Shimmering Nectar ×9    | 37,500 |

Independent sum for one talent 1→6: 3 Teachings, 21 Guides, 6 Whopperflower Nectar, 22 Shimmering Nectar, 122,500 Mora. The tests assert these transcribed values; they do not generate expectations from catalogs/calculators. Three distinct selected talent goals sum to three times those costs. Leveling/EXP and crafting/conversion are excluded.

Canonical import keys are explicit mappings to the returned material names and game item IDs: Mora/202, TeachingsOfDiligence/104313, GuideToDiligence/104314, WhopperflowerNectar/112038, ShimmeringNectar/112039. No synthetic `DiligenceBookT1` or plural `GuidesToDiligence` key is substituted. The importer still accepts unknown keys without alias conversion.

The verified change is HuTao's talent group Ballad → Diligence. Costs/common-material joins already match the primary results; the previous arithmetic omitted Mora and resolved common materials incorrectly. No other target or archived talent-tier correction is claimed.

## Candidate and route disposition

| Candidate / fields                                                                                                                           | Evidence / limitation                                                                                                                                                                                                               | Runtime status                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| HuTao: book, common materials, exact per-step counts/Mora for base talents 1–6, all three talent selections, consumed material ID/name joins | Official calculator requests and identity response above; verifier Codex; review 2026-10-02; game version/observation time null                                                                                                     | Verified costs, including a positive supported material result.                                          |
| HuTao ascension phases 0–6, gem/boss/local mappings                                                                                          | No primary ascension-only request/response accepted in this pass. Constant-level requests prove talent costs only.                                                                                                                  | Unavailable; stored goals preserved.                                                                     |
| Sethos ascension/talents and dependencies                                                                                                    | Existing raw keys/group have no accepted source record. No correction inferred from community guides or similarity to another character.                                                                                            | Unavailable; stored goals preserved.                                                                     |
| StaffOfHoma ascension tiers/families/group                                                                                                   | No accepted complete primary per-phase evidence. Legacy billet field/three domain tiers omit required representation.                                                                                                               | Unavailable; stored goals preserved.                                                                     |
| HuTao talent routes                                                                                                                          | Calculator responses include Taishan Mansion and raw calendar indices `[1,4,6]`. This is partial primary route evidence; this pass does not establish location, index semantics, or resin-per-claim rules sufficiently for a route. | Route/Today unavailable independently of verified cost totals. No resin budget is offered in production. |
| Events / weekly bosses                                                                                                                       | Existing labeled placeholders, historical event dates; no accepted current sources                                                                                                                                                  | Unavailable, no per-boss/cost/discount estimates. V2 manual aggregate claims usable.                     |

No unresolved conflict exists within the accepted 15 cost responses. Conflicts between legacy mappings and secondary pages are audit leads, not independent verification. Manifest conflicts fail closed if recorded. HoYoWiki's publisher-hosted pages are community edited and were not promoted to primary evidence: [official tool notice stating that limitation](https://www.hoyolab.com/article/31158449). The owner reported not owning Hu Tao and requested online research; that reply is not cost verification.

The old denied `genshin.hoyoverse.com` browser restriction was preserved. No alternate-browser, raw-HTTP, or proxy workaround was used for that denied page. The accessible official calculator is a separate public tool, not a mirror of the denied notice.

## Binding and invalidation

The checked-in runtime manifest is `apps/api/src/games/genshin/static/catalog-evidence.json`. Its verified claim lists exact fields/range, sources, verifier/review date, unknown dates/version, conflicts, and SHA256. Cost content is projected as `{targetKey,goalType,from,to,group,steps,references}`. Steps contain every consumed canonical key and positive count, including Mora. References contain the exact consumed key, primary name and numeric game item ID. Object keys are recursively sorted lexically with the English comparator; array order is retained; SHA256 uses UTF-8 JSON. Reformatting does not change eligibility. A changed count, group, consumed-key mapping, name/ID dependency, missing join, or malformed supported row does.

Archived unsupported tiers and unrelated target fields are not fingerprint dependencies. Supported phase/talent rows must be unique and contiguous; costs must be finite nonnegative safe integers. Weapon validation explicitly requires all four domain tiers and all three elite/common tiers. Shape validation never creates a source claim.

Routes require their own schema, exact material/group joins, source attribution and fingerprint over `{domain,costFingerprint}`. Domain keys/names/locations, explicit weekday indices (including Sunday), and resin per claim are separate from upgrade totals. A changed route disables routing while preserving independent valid costs. Empty route evidence is never replaced with the historical 20/40 constants. Tests use clearly synthetic route fixtures to exercise validation/allocation, not to establish game facts.
