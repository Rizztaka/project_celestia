# Automatic reviewed build guidance

Implemented locally on 2026-10-25. The autonomous companion goal remains active.
This adds automatic role-based build checks; contextual endgame readiness is
still outstanding under [M2](implementation_plan.md).

## Behavior

Reviewed profiles increased from four to twelve. Furina, Sucrose, Skirk and
Xilonen retain their existing patterns. New profiles cover Bennett, Xiangling,
Xingqiu, Fischl, Kazuha, Nahida, Escoffier and Dahlia. Each profile selects one
explicit default role when the player leaves the role on automatic. The UI names
that assumption. Players can choose another reviewed role or select **General
checks only** to remove it. These are selected playstyles, not every valid build.

Talent checks support equal-priority groups. Conditional main stats remain
conditional: reaction-dependent EM, Favonius-oriented CRIT Rate and buff-dependent
ATK choices do not become unconditional endorsements. Added explanations cover
Bennett's base-ATK buff, Nahida's team EM context, Kazuha's rotation-dependent
Burst use and Escoffier's Hydro/Cryo party prerequisite. No arbitrary ER threshold,
mandatory 1,000 EM target or automatic endgame-ready verdict was introduced.

Conflicting build observations block tailored guidance and damage configuration.
Unreviewed forms, changed source hashes, unsupported constellation scopes and old
rule packs retain their existing coverage gates. Rule pack version is now 2.
Existing saved `unspecified` roles remain unchanged and resolve automatically at
analysis time. The new saved `general_checks` value requires a current reader;
older strict clients may reject a team containing that value.

## Source review

Eight KQM pages were acquired and reviewed for the normalized facts used here.
Their displayed guide versions are preserved independently of Celestia's target
patch. The original four accepted hashes were preserved; all eight newly accepted
hashes were compared against the downloaded source bytes. This is agent source
review, not human review, in-game validation or full 7.1 certification.

| Added profile | Source                                                             | Guide version |
| ------------- | ------------------------------------------------------------------ | ------------- |
| Bennett       | [KQM quick guide](https://keqingmains.com/q/bennett-quickguide/)   | 5.7           |
| Xiangling     | [KQM quick guide](https://keqingmains.com/q/xiangling-quickguide/) | 4.5           |
| Xingqiu       | [KQM quick guide](https://keqingmains.com/q/xingqiu-quickguide/)   | 5.7           |
| Fischl        | [KQM quick guide](https://keqingmains.com/q/fischl-quickguide/)    | 4.0           |
| Kazuha        | [KQM quick guide](https://keqingmains.com/q/kazuha-quickguide/)    | 7.1           |
| Nahida        | [KQM quick guide](https://keqingmains.com/q/nahida-quickguide/)    | 5.6           |
| Escoffier     | [KQM quick guide](https://keqingmains.com/q/escoffier-quickguide/) | 7.1           |
| Dahlia        | [KQM quick guide](https://keqingmains.com/q/dahlia-quickguide/)    | 5.7           |

Only normalized facts, source metadata, hashes and original short explanations
are included in project source. Downloaded pages stay in ignored
`.local-maintenance/role-guides/`. Source acquisition now follows the manifest
instead of a hardcoded list; acquisition cannot approve a changed hash.

`pnpm companion:status` reports 12/131 catalog entries with reviewed role
patterns. Other inventory counts remain 129 intact description references,
119 entries with at least one exact listed simulation form and ten entries
without resolved depot identity. These counts do not prove a complete release
roster or complete executable mechanics.

## Verification

- **126 tests passed across 14 files**, including account context, persistence,
  preferences, generated teams, build analysis, both new role suites and the real
  pinned WASM damage engine. The new suites contain 14 calculator cases and five
  rendered-client cases. They exercise defaults, opt-out, source/form/version
  gates, conflicts, conditional stats, team prerequisites and input immutability.
- `pnpm --filter @celestia/web build`: passed, including TypeScript.
- `pnpm --filter @celestia/web lint`: passed; scoped API tooling lint passed.
- Source review check: original four approvals preserved, eight new byte hashes
  matched, twelve sources total.
- Real browser with isolated synthetic UID `800000005`: Dahlia automatically
  received the shield-support pattern, the synthetic CRIT DMG circlet prompted
  advice, and links displayed guide v5.7. General checks removed tailored advice;
  returning to automatic restored it. No warning/error browser logs; no
  horizontal overflow at the inspected 1265px width. Mobile layout was not
  verified in this change.

Browser evidence is ignored local output:
`.local-maintenance/automatic-role-browser.png` and
`.local-maintenance/automatic-role-browser.txt`. The preview used fixture data and
an isolated environment. No production account or database was changed.

## Remaining work

Implement readiness against a role, team, rotation and target encounter, including
energy, support output and marginal investment. Complete release-to-7.1 knowledge
and mechanics validation. The damage input currently accepts character levels
only through 90; broader current-version progression is unverified. Improve
generated rotations and bound large-roster search memory/computation. Endgame
assignment, account-value pull comparisons and the separate fun simulator remain
open. None of the passing checks certifies those unfinished requirements.
