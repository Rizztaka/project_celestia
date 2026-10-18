# C5c follow-up review fixture

Created 2026-10-12 solely for synthetic local verification.

The historical C5b fixture failed before application work because PostgreSQL reported missing internal catalog files (global/6100 and base/4/4171). Its run result records successful cleanup. No repair, deletion or change to that historical descriptor was performed.

This new isolated fixture was initialized with the installed PostgreSQL 18 tools at C:/Users/inuzu/AppData/Local/Temp/celestia-recovery-UgVWJu/data. Its system identifier is 7695828306638942480; the current OS owner is nitro\inuzu. Its parent uses a verified current-user-only protected Windows ACL. It binds only 127.0.0.1:55448; local trust is limited to its synthetic bootstrap administrator celestia_test_c5c_review, with generated rehearsal roles using SCRAM authentication. It contains an empty bootstrap database celestia_test_c5c_review; no ordinary database or account data was copied.

The exact owned process was checked, stopped and the port exclusively rebound after bootstrap. The unchanged recovery command may now create distinct source, restore and verification resources through review-fixture.json. Keep the historical fixture intact. The new stopped synthetic cluster is retained outside Git for repeatable checks; cleanup of per-run resources is recorded separately. No production recovery or deployment claim.
