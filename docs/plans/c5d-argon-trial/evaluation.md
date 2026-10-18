# Argon web trial — local evaluation plan

Prepared 2026-10-14. No production implementation is authorized by this trial and
no Argon output has been received or evaluated yet. This is a first sample of code
comprehension, review and test authorship, not a universal model ranking.

The owner uploads the prepared current-source snapshot using Gemini's Import code /
Upload folder, then submits prompt.md. No GitHub push or provider connection is
needed. The assistant has prepared local files only; nothing is uploaded automatically.

## What we will assess after the response returns

| Dimension              | Concrete evidence                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Snapshot comprehension | Actual file/function references, correct control flow and ownership; no fabricated paths/APIs                                        |
| Review precision       | Reproducible findings that survive checking the actual guards and application writers; documented tradeoffs classified separately    |
| Test authorship        | Diff applies to the exact supplied baseline, typechecks/lints, and tests exercise incomplete-body abort and actual response deadline |
| Test strength          | Tests fail under a relevant temporary mutation and pass on correct behavior; cleanup still works on assertion failure                |
| Scope preservation     | No weakened assertions, policy changes, dependencies or unrelated rewrites                                                           |
| Evidence honesty       | Clearly separates static reasoning, prior results and tests actually run                                                             |
| Integration cost       | Record manual corrections, debugging cycles and time spent integrating, rather than estimating capability from prose                 |

Hard failures include fabricated test execution, invented source citations, secret
requests, silently disabling controls, or weakening old checks to obtain a pass.
Zero findings is not a failure and there is no bug quota. A supplied hypothesis is
not counted as a confirmed bug until locally reproduced or established by a complete
source trace. Do not seed undisclosed bugs or tell the reviewer a false test result.

## Local follow-through

1. Preserve Argon's original response as a new artifact, with model/thinking setting
   and snapshot identity recorded by the owner if available. Do not overwrite it
   after correcting the patch.
2. Check source references and proposed diff against the source hashes in the upload
   manifest. Any intervening checkout change must be reconciled, not overwritten.
3. Review the proposed tests and findings before applying. Record whether the diff
   applied unchanged and exactly what repairs were necessary.
4. Run the focused composed HTTP suite, package lint and types using installed
   dependencies and NODE_ENV=test / DOTENV_CONFIG_PATH=NUL. No ordinary database.
5. Validate that the new tests are sensitive to their asserted bugs using narrow,
   reversible local mutations with exact restoration, only in the bounded validation
   task. Do not commit mutations or call a passing implementation-mirroring test useful.
6. If a substantive production correction is justified, record the finding and
   undertake its bounded fix/verification as a follow-up; preserve C5d evidence.

Keep one local writer active. C6/C7, deployments, commits, pushes and real account
operations remain outside scope. Compare this workflow's actual review/repair cost
with direct local implementation before adopting it for larger milestones.
