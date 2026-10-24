import { analyzeCharacter, findingStatus, orderFindings } from './character.calculator';
import { formIdentity, profileForCharacter, reviewedRole } from './identity';
import { signature } from './signature';
import type { BuildRoleId, NormalizedCharacter, TeamAnalysis, TeamContext } from './types';
import { RULE_PACK_VERSION } from './types';

export interface MemberSelection {
  characterKey: string;
  roleId: BuildRoleId;
}
export function validRole(key: string, role: string) {
  if (!/^[1-9]\d{7}:(?:[1-9]\d{0,7}|unknown)$/.test(key)) return false;
  if (role === 'unspecified') return true;
  const [avatar, depot] = key.split(':');
  const p = profileForCharacter(Number(avatar), Number(depot));
  return !!p && !!reviewedRole(p, role);
}
export function teamContext(
  uid: string,
  selections: MemberSelection[],
  records: NormalizedCharacter[],
): TeamContext {
  if (selections.length > 4) throw new Error('TEAM_MEMBER_LIMIT');
  const forms = selections.map((s) =>
    formIdentity({ avatarId: Number(s.characterKey.split(':')[0]) }),
  );
  if (
    new Set(forms).size !== selections.length ||
    selections.some((s) => !validRole(s.characterKey, s.roleId))
  )
    throw new Error('TEAM_MEMBERS_OR_ROLES_INVALID');
  const members = selections.map((s, slot) => {
    const c = records.find((r) => r.uid === uid && r.key === s.characterKey) ?? null;
    return { ...s, slot, element: c?.element ?? null, character: c };
  });
  return { id: signature({ uid, members, version: RULE_PACK_VERSION }), members };
}
export function analyzeTeam(
  uid: string,
  selections: MemberSelection[],
  records: NormalizedCharacter[],
): TeamAnalysis {
  const context = teamContext(uid, selections, records);
  const members = context.members.flatMap((m) =>
    m.character
      ? [
          {
            slot: m.slot,
            characterKey: m.characterKey,
            roleId: m.roleId,
            observedAt: m.character.observedAt,
            analysis: analyzeCharacter({
              rulePackVersion: RULE_PACK_VERSION,
              uid,
              character: m.character,
              roleId: m.roleId,
              team: context,
              hypothesis: null,
            }),
          },
        ]
      : [],
  );
  const teamFindings = members.flatMap((m) => m.analysis.findings.filter((f) => f.teamDependent));
  const times = [...new Set(members.map((m) => m.observedAt))].sort();
  const missing = context.members.filter((m) => !m.character).map((m) => m.characterKey);
  return {
    rulePackVersion: RULE_PACK_VERSION,
    uid,
    teamId: context.id,
    digest: signature(context),
    members,
    teamFindings,
    actions: orderFindings(members.flatMap((m) => m.analysis.actions)),
    observationTimes: times,
    mixedObservationTimes: times.length > 1,
    missingMembers: missing,
    status:
      missing.length || selections.length < 4
        ? 'not_enough_data'
        : findingStatus(members.flatMap((m) => m.analysis.findings)),
  };
}
