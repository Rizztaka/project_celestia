import { sourceCurrent } from './coverage';
import { setIdentityForSetId, weaponIdentity } from './equipment';
import { profileForCharacter, reviewedRole } from './identity';
import { signature } from './signature';
import { artifactInSlot, setPieceCount } from './snapshot';
import type {
  AnalysisInput,
  CharacterAnalysis,
  Finding,
  FindingCategory,
  FindingStatus,
  FindingValue,
  TriState,
} from './types';
import { artifactSlots, findingCategoryOrder, RULE_PACK_VERSION } from './types';
import { canonicalEquipmentStat } from './units';

const text = (code: string): FindingValue => ({ kind: 'text', code });
export function orderFindings(findings: Finding[]) {
  return [...findings].sort(
    (a, b) =>
      findingCategoryOrder.indexOf(a.category) - findingCategoryOrder.indexOf(b.category) ||
      (a.slot ?? 0) - (b.slot ?? 0) ||
      a.order - b.order ||
      a.ruleId.localeCompare(b.ruleId, 'en'),
  );
}
export function findingStatus(findings: Finding[]): FindingStatus {
  if (findings.some((f) => f.status === 'needs_attention')) return 'needs_attention';
  if (findings.some((f) => f.status === 'not_enough_data')) return 'not_enough_data';
  if (findings.some((f) => f.status === 'depends_on_conditions')) return 'depends_on_conditions';
  return 'fits';
}
export function analyzeCharacter(
  input: AnalysisInput,
  sourceOverrides?: Record<string, string>,
): CharacterAnalysis {
  const { character: c, roleId, team, hypothesis } = input;
  const hypotheticalSet = hypothesis?.kind === 'set_pieces' ? hypothesis : null;
  const selectedReference = hypotheticalSet ? setReference(hypotheticalSet.setId) : null;
  const effectivePieces = (reference: string) =>
    hypotheticalSet
      ? selectedReference === reference
        ? hypotheticalSet.pieces
        : 0
      : c.equipmentAvailable
        ? setPieceCount(c, reference)
        : 0;
  if (input.uid !== c.uid || input.rulePackVersion !== RULE_PACK_VERSION)
    throw new Error('ANALYSIS_CONTEXT_MISMATCH');
  const profile = c.metadataAvailable ? profileForCharacter(c.avatarId, c.skillDepotId) : null;
  const sourceReady =
    !!profile && profile.evidenceIds.every((id) => sourceCurrent(id, sourceOverrides));
  // C6 Furina/Xilonen alter the scope of the support patterns modeled here.
  const scopeReady = !([10000089, 10000103].includes(c.avatarId) && c.constellation >= 6);
  const role = profile && sourceReady && scopeReady ? reviewedRole(profile, roleId) : null;
  const findings: Finding[] = [];
  function add(
    ruleId: string,
    category: FindingCategory,
    condition: TriState,
    status: FindingStatus,
    values: Record<string, FindingValue> = {},
    options: { team?: boolean; hypothesis?: boolean; source?: boolean } = {},
  ) {
    findings.push({
      ruleId,
      category,
      condition,
      status,
      characterKey: c.key,
      slot: team?.members.find((m) => m.characterKey === c.key)?.slot ?? null,
      roleId,
      values,
      evidenceIds: options.source === false ? [] : (profile?.evidenceIds ?? []),
      teamDependent: options.team ?? false,
      hypothesisDependent: options.hypothesis ?? false,
      order: findings.length,
    });
  }
  if (!role)
    add(
      'coverage',
      'missing_data',
      'unknown',
      'not_enough_data',
      {
        reason: text(
          !sourceReady && profile
            ? 'source_changed'
            : !scopeReady
              ? 'constellation_scope'
              : profile && roleId === 'unspecified'
                ? 'choose_role'
                : 'unsupported',
        ),
      },
      { source: false },
    );
  const weapon = c.equipmentAvailable && c.weapon ? weaponIdentity(c.weapon.itemId) : null;
  const compatible = c.weaponType && weapon ? c.weaponType === weapon.weaponType : null;
  add(
    'weapon-type',
    compatible === false
      ? 'verified_incompatibility'
      : compatible === null
        ? 'missing_data'
        : 'conditional_alternative',
    compatible === null ? 'unknown' : compatible ? 'true' : 'false',
    compatible === null ? 'not_enough_data' : compatible ? 'fits' : 'needs_attention',
    {},
    { source: false },
  );
  const uniqueSlots = new Set(c.artifacts.map((a) => a.slot));
  const exactArtifacts =
    c.equipmentAvailable &&
    c.artifacts.length === 5 &&
    uniqueSlots.size === 5 &&
    !uniqueSlots.has(null);
  const identityGaps = c.artifacts.filter((a) => !a.set?.referenceKey).map((a) => String(a.itemId));
  if (!exactArtifacts || identityGaps.length)
    add(
      'equipment-gaps',
      'missing_data',
      'unknown',
      'not_enough_data',
      { pieces: { kind: 'count', value: c.artifacts.length, of: 5 } },
      { source: false },
    );
  if (role && profile) {
    if ([10000089, 10000043].includes(c.avatarId) && (c.level === null || c.level < 90)) {
      add(
        'character-level',
        c.level === null ? 'missing_data' : 'progression',
        c.level === null ? 'unknown' : 'false',
        c.level === null ? 'not_enough_data' : 'depends_on_conditions',
        {
          level: { kind: 'level', base: c.level ?? 0, bonus: null },
          character: text(profile.referenceKey),
        },
      );
    }
    for (const slot of ['Sands', 'Goblet', 'Circlet'] as const) {
      const artifact = c.equipmentAvailable ? artifactInSlot(c, slot) : null;
      const changed = hypothesis?.kind === 'main_stat' && hypothesis.slot === slot;
      const id = changed ? hypothesis.statId : artifact?.mainStat?.id;
      const stat = id ? canonicalEquipmentStat(id) : null;
      const accepted = [...(role.mainStats[slot] ?? [])];
      // KQM explicitly permits CRIT Rate with Favonius for Xilonen; not a universal target.
      if (c.avatarId === 10000103 && slot === 'Circlet' && weapon?.referenceKey === 'FavoniusSword')
        accepted.push('critRate');
      // Skirk ATK circlet is a conditional alternative with a CRIT-granting set.
      if (
        c.avatarId === 10000114 &&
        slot === 'Circlet' &&
        effectivePieces('MarechausseeHunter') >= 4
      )
        accepted.push('atkPercent');
      const matches = stat ? accepted.includes(stat) : null;
      add(
        `main-stat-${slot}`,
        matches === false
          ? 'source_mismatch'
          : matches === null
            ? 'missing_data'
            : 'conditional_alternative',
        matches === null ? 'unknown' : matches ? 'true' : 'false',
        matches === null ? 'not_enough_data' : matches ? 'fits' : 'needs_attention',
        { slot: text(slot), actual: text(stat ?? 'unknown'), accepted: text(accepted.join(',')) },
        { hypothesis: changed },
      );
    }
    const talents = role.talentPriority.map((kind) => c.talents.find((t) => t.kind === kind));
    add(
      'talent-priority',
      'progression',
      talents.every(Boolean) ? 'true' : 'unknown',
      talents.every(Boolean) ? 'depends_on_conditions' : 'not_enough_data',
      {
        priority: text(role.talentPriority.join(',')),
        character: text(profile.referenceKey),
        ...Object.fromEntries(
          talents.flatMap((t) =>
            t
              ? [[t.kind!, { kind: 'level' as const, base: t.baseLevel, bonus: t.bonusLevel }]]
              : [],
          ),
        ),
      },
    );
    add('stat-priority', 'conditional_alternative', 'true', 'depends_on_conditions', {
      priority: text(role.priorityStats.join(',')),
      character: text(profile.referenceKey),
    });
    add(
      c.avatarId === 10000114
        ? 'no-energy-burst'
        : c.avatarId === 10000043
          ? 'sucrose-energy'
          : 'energy-context',
      'conditional_alternative',
      'unknown',
      'depends_on_conditions',
    );
    const preferred =
      role.sets.find((s) => effectivePieces(s.referenceKey) >= s.pieces) ?? role.sets[0];
    const pieces = effectivePieces(preferred.referenceKey);
    const setKnown = hypotheticalSet || (exactArtifacts && !identityGaps.length);
    add(
      'set-profile',
      pieces >= preferred.pieces
        ? 'conditional_alternative'
        : setKnown
          ? 'source_mismatch'
          : 'missing_data',
      pieces >= preferred.pieces ? 'true' : setKnown ? 'false' : 'unknown',
      pieces >= preferred.pieces ? 'fits' : setKnown ? 'depends_on_conditions' : 'not_enough_data',
      { set: text(preferred.referenceKey), pieces: { kind: 'pieces', count: pieces } },
      { hypothesis: !!hypotheticalSet },
    );
    if (team) {
      const others = team.members.filter((m) => m.characterKey !== c.key);
      const unknown = others.some((m) => !m.character || !m.element) || team.members.length < 4;
      if (c.avatarId === 10000114) {
        const invalid = others.some((m) => m.element && !['Hydro', 'Cryo'].includes(m.element));
        const truth = invalid
          ? 'false'
          : unknown
            ? 'unknown'
            : others.some((m) => m.element === 'Hydro')
              ? 'true'
              : 'false';
        add(
          'skirk-team',
          truth === 'false' ? 'source_mismatch' : 'conditional_alternative',
          truth,
          truth === 'false'
            ? 'needs_attention'
            : truth === 'unknown'
              ? 'not_enough_data'
              : 'depends_on_conditions',
          {},
          { team: true },
        );
      }
      if (c.avatarId === 10000103) {
        const eligible = others.filter(
          (m) => m.element && ['Pyro', 'Hydro', 'Electro', 'Cryo'].includes(m.element),
        ).length;
        const truth = eligible >= 2 ? 'true' : unknown ? 'unknown' : 'false';
        add(
          'xilonen-samples',
          truth === 'false' ? 'source_mismatch' : 'conditional_alternative',
          truth,
          truth === 'false'
            ? 'needs_attention'
            : truth === 'unknown'
              ? 'not_enough_data'
              : 'depends_on_conditions',
          { count: { kind: 'count', value: eligible, of: 2 } },
          { team: true },
        );
      }
      if (
        c.avatarId === 10000043 &&
        (hypotheticalSet
          ? selectedReference === 'ViridescentVenerer' && hypotheticalSet.pieces >= 4
          : setPieceCount(c, 'ViridescentVenerer') >= 4)
      ) {
        const target = others.some(
          (m) => m.element && ['Pyro', 'Hydro', 'Electro', 'Cryo'].includes(m.element),
        );
        const truth = target ? 'true' : unknown ? 'unknown' : 'false';
        add(
          'vv-target',
          'conditional_alternative',
          truth,
          truth === 'unknown' ? 'not_enough_data' : 'depends_on_conditions',
          {},
          { team: true, hypothesis: !!hypotheticalSet },
        );
      }
      if (
        c.avatarId === 10000114 &&
        (hypotheticalSet
          ? selectedReference === 'MarechausseeHunter' && hypotheticalSet.pieces >= 4
          : setPieceCount(c, 'MarechausseeHunter') >= 4)
      ) {
        const furina = others.find(
          (m) => m.character?.avatarId === 10000089 && m.character.skillDepotId === 8901,
        );
        add(
          'skirk-hunter',
          'conditional_alternative',
          furina ? 'true' : unknown ? 'unknown' : 'false',
          'depends_on_conditions',
          {},
          { team: true, hypothesis: !!hypotheticalSet },
        );
      }
    }
  }
  const ordered = orderFindings(findings);
  return {
    rulePackVersion: RULE_PACK_VERSION,
    uid: input.uid,
    characterKey: c.key,
    roleId,
    teamId: team?.id ?? null,
    hypothesis,
    digest: signature({ input, sourceOverrides }),
    findings: ordered,
    actions: ordered.filter(
      (f) =>
        f.status === 'needs_attention' ||
        (['set-profile', 'character-level'].includes(f.ruleId) && f.condition === 'false'),
    ),
    status: findingStatus(ordered),
    coverage: {
      characterProfile: !!profile && sourceReady && scopeReady,
      roleSupported: !!role,
      equipmentAvailable: c.equipmentAvailable,
      identityGaps,
    },
    observedAt: c.observedAt,
  };
}
function setReference(id: number) {
  return setIdentityForSetId(id)?.referenceKey ?? null;
}
export function roleOptions(c: {
  id: number;
  skillDepotId: number | null;
  metadataAvailable: boolean;
  constellation: number;
}) {
  const p = c.metadataAvailable ? profileForCharacter(c.id, c.skillDepotId) : null;
  return p &&
    !([10000089, 10000103].includes(c.id) && c.constellation >= 6) &&
    p.evidenceIds.every((id) => sourceCurrent(id))
    ? p.roles
    : [];
}
export { artifactSlots };
