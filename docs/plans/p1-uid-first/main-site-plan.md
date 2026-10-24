# UID-connected main Celestia experience

User follow-up: after entering a UID, open the main Celestia page and connect its character/data views to that UID.

Continue in the existing isolated branch/worktree. Reuse the existing CompanionLayout, navigation styles and mobile drawer, Today welcome/hero, collection card styles, reported build/equipment components and Enka cache. `/u/:uid` becomes the Celestia Today dashboard; nested Characters, Equipment and Public Profile routes share a UID-scoped data context. Character links stay inside that workspace. The previous showcase remains accessible as Public Profile within the main shell.

No synthetic authentication session and no import into an unrelated registered account. Preserve all previous authenticated features and records. Only publicly returned characters and equipped gear populate UID mode; account routines, bag inventory, private roster and saved account plans cannot be inferred from a UID.

Verify new workspace navigation, shared data across Today/Characters/Equipment/details, direct reload, UID switching, no authenticated requests, errors/empty data, Columbina and mobile navigation. Keep previous 115 targeted regressions passing and run web/API/contracts quality gates as appropriate. Stop for owner review without deployment, push or merge.
