import { signature } from '../build-analysis/signature';
import { normalizeObservation } from '../build-analysis/snapshot';
import type { SavedUidTeam } from '../build-analysis/teams-storage';
import { canonicalEquipmentStat } from '../build-analysis/units';
import type { CharacterObservation } from '../observed-roster';
import metadata from './engine-metadata.json';

export interface RotationStep {
  characterKey: string;
  action: string;
  repeat: number;
  params: string;
  waitFrames: number;
}
export interface DamageSettings {
  duration: number;
  enemyLevel: number;
  resistance: number;
  samples: number;
  steps: RotationStep[];
}
export interface DamageIssue {
  code:
    | 'missing_build'
    | 'unsupported_character'
    | 'missing_progression'
    | 'missing_talents'
    | 'unsupported_weapon'
    | 'incompatible_weapon'
    | 'incomplete_artifacts'
    | 'unsupported_set'
    | 'unsupported_stat'
    | 'invalid_settings'
    | 'invalid_rotation';
  characterKey?: string;
  detail?: string;
}
type EngineCharacter = {
  key: string;
  weaponClass: string;
  actions: { action: string; note: string | null }[];
};
const characters = metadata.characters as Record<string, EngineCharacter>;
const weapons = metadata.weapons as Record<string, { key: string; weaponClass: string }>;
const sets = metadata.sets as Record<string, string>;
export const engineCharacter = (key: string) => characters[key] ?? null;
export const engineVersion = metadata.version;
const statKeys: Record<string, string> = {
  maxHp: 'hp',
  hpPercent: 'hp%',
  atk: 'atk',
  atkPercent: 'atk%',
  def: 'def',
  defPercent: 'def%',
  elementalMastery: 'em',
  critRate: 'cr',
  critDmg: 'cd',
  energyRecharge: 'er',
  healingBonus: 'heal',
  physicalDmg: 'phys%',
  pyroDmg: 'pyro%',
  hydroDmg: 'hydro%',
  cryoDmg: 'cryo%',
  electroDmg: 'electro%',
  anemoDmg: 'anemo%',
  geoDmg: 'geo%',
  dendroDmg: 'dendro%',
};
const caps = [20, 40, 50, 60, 70, 80, 90];
const whole = (n: number | null, min: number, max: number): n is number =>
  n !== null && Number.isInteger(n) && n >= min && n <= max;
const finiteRange = (n: number, min: number, max: number) =>
  Number.isFinite(n) && n >= min && n <= max;
export function damageInput(
  uid: string,
  team: SavedUidTeam,
  records: CharacterObservation[],
  settings: DamageSettings,
) {
  const issues: DamageIssue[] = [];
  const lines: string[] = [];
  const memberKeys: Record<string, string> = {};
  if (
    team.uid !== uid ||
    team.members.length !== 4 ||
    !whole(settings.duration, 10, 180) ||
    !whole(settings.enemyLevel, 1, 200) ||
    !finiteRange(settings.resistance, -100, 300) ||
    !whole(settings.samples, 1, 50)
  )
    issues.push({ code: 'invalid_settings' });
  for (const member of team.members) {
    const observation = records.find(
      (r) => r.uid === uid && r.character.key === member.characterKey,
    );
    const profile = engineCharacter(member.characterKey);
    const issue = (code: DamageIssue['code'], detail?: string) =>
      issues.push({ code, characterKey: member.characterKey, detail });
    if (!observation) {
      issue('missing_build');
      continue;
    }
    if (!profile) {
      issue('unsupported_character');
      continue;
    }
    const c = normalizeObservation(observation);
    memberKeys[member.characterKey] = profile.key;
    if (
      !c.metadataAvailable ||
      !c.equipmentAvailable ||
      !whole(c.level, 1, 90) ||
      !whole(c.ascension, 0, 6) ||
      c.level > caps[c.ascension] ||
      !whole(c.constellation, 0, 6)
    ) {
      issue('missing_progression');
      continue;
    }
    const talents = (['normal', 'skill', 'burst'] as const).map(
      (kind) => c.talents.find((t) => t.kind === kind)?.baseLevel ?? null,
    );
    if (talents.some((t) => !whole(t, 1, 10))) {
      issue('missing_talents');
      continue;
    }
    lines.push(
      `${profile.key} char lvl=${c.level}/${caps[c.ascension]} cons=${c.constellation} talent=${talents.join(',')};`,
    );
    const weapon = c.weapon;
    const weaponProfile = weapon ? weapons[String(weapon.itemId)] : null;
    if (
      !weapon ||
      !weaponProfile ||
      !whole(weapon.level, 1, 90) ||
      !whole(weapon.ascension, 0, 6) ||
      !whole(weapon.refinement, 1, 5) ||
      !whole(weapon.rarity, 1, 5) ||
      weapon.level >
        Math.min(caps[weapon.ascension], weapon.rarity !== null && weapon.rarity <= 2 ? 70 : 90)
    ) {
      issue('unsupported_weapon');
      continue;
    }
    if (weaponProfile.weaponClass !== profile.weaponClass) {
      issue('incompatible_weapon');
      continue;
    }
    const weaponCap = Math.min(
      caps[weapon.ascension],
      weapon.rarity !== null && weapon.rarity <= 2 ? 70 : 90,
    );
    lines.push(
      `${profile.key} add weapon="${weaponProfile.key}" refine=${weapon.refinement} lvl=${weapon.level}/${weaponCap};`,
    );
    const slots = new Set(c.artifacts.map((a) => a.slot));
    if (
      c.artifacts.length !== 5 ||
      slots.size !== 5 ||
      slots.has(null) ||
      c.artifacts.some((a) => !a.mainStat)
    ) {
      issue('incomplete_artifacts');
      continue;
    }
    const totals: Record<string, number> = {};
    const setCounts: Record<string, number> = {};
    for (const artifact of c.artifacts) {
      const set = artifact.set ? sets[String(artifact.set.setId)] : null;
      if (!set) issue('unsupported_set', String(artifact.itemId));
      else setCounts[set] = (setCounts[set] ?? 0) + 1;
      for (const stat of [artifact.mainStat!, ...artifact.substats]) {
        const canonical = canonicalEquipmentStat(stat.id);
        const key = canonical ? statKeys[canonical] : null;
        const value =
          stat.unit === 'flat'
            ? stat.flat
            : stat.unit === 'percentage_points' && stat.percentPoints !== null
              ? stat.percentPoints / 100
              : null;
        if (!key || value === null || !finiteRange(value, 0, 100000))
          issue('unsupported_stat', stat.id);
        else totals[key] = (totals[key] ?? 0) + value;
      }
    }
    for (const [set, count] of Object.entries(setCounts).sort())
      lines.push(`${profile.key} add set="${set}" count=${count};`);
    lines.push(
      `${profile.key} add stats ${Object.entries(totals)
        .sort()
        .map(([key, value]) => `${key}=${Number(value.toFixed(8))}`)
        .join(' ')};`,
    );
  }
  const script: string[] = [];
  let actions = 0;
  if (settings.steps.length < 1 || settings.steps.length > 64)
    issues.push({ code: 'invalid_rotation' });
  for (const step of settings.steps) {
    const profile = engineCharacter(step.characterKey);
    const paramsValid =
      step.params.length <= 160 &&
      (!step.params.trim() ||
        /^[a-z_][a-z_0-9%]*=-?\d+(?:\.\d+)?(?:,[a-z_][a-z_0-9%]*=-?\d+(?:\.\d+)?)*$/.test(
          step.params,
        ));
    if (
      !memberKeys[step.characterKey] ||
      !profile?.actions.some((a) => a.action === step.action) ||
      !whole(step.repeat, 1, 20) ||
      !whole(step.waitFrames, 0, 1800) ||
      !paramsValid
    ) {
      issues.push({ code: 'invalid_rotation', characterKey: step.characterKey });
      continue;
    }
    actions += step.repeat;
    for (let i = 0; i < step.repeat; i++)
      script.push(`${profile.key} ${step.action}${step.params ? `[${step.params}]` : ''};`);
    if (step.waitFrames) script.push(`wait(${step.waitFrames});`);
  }
  if (actions > 200) issues.push({ code: 'invalid_rotation' });
  const first = memberKeys[settings.steps[0]?.characterKey];
  const config = issues.length
    ? null
    : [
        `options iteration=1 duration=${settings.duration} swap_delay=12;`,
        ...lines,
        `target lvl=${settings.enemyLevel} resist=${settings.resistance / 100} pos=0,0 radius=1;`,
        `active ${first};`,
        'while 1 {',
        ...script,
        'wait(1);',
        '}',
      ].join('\n');
  return {
    config,
    issues,
    memberKeys,
    signature: signature({
      uid,
      team,
      records: records.filter(
        (r) => r.uid === uid && team.members.some((m) => m.characterKey === r.character.key),
      ),
      settings,
      engine: engineVersion,
    }),
  };
}
export interface EngineRun {
  seed: string;
  durationFrames: number;
  totalDamage: number;
  dps: number;
  members: {
    key: string;
    damage: number;
    activeFrames: number;
    actions: number;
    failedIntervals: number;
  }[];
}
export function summarizeRuns(runs: EngineRun[]) {
  if (
    !runs.length ||
    runs.some(
      (run) =>
        !Number.isFinite(run.dps) ||
        !Number.isFinite(run.totalDamage) ||
        !Number.isFinite(run.durationFrames) ||
        run.durationFrames <= 0 ||
        run.dps < 0 ||
        run.totalDamage < 0 ||
        run.members.length !== 4 ||
        new Set(run.members.map((member) => member.key)).size !== 4 ||
        run.members.some(
          (member) =>
            !Number.isFinite(member.damage) ||
            member.damage < 0 ||
            !Number.isFinite(member.actions) ||
            member.actions < 0 ||
            !Number.isFinite(member.failedIntervals) ||
            member.failedIntervals < 0,
        ) ||
        Math.abs(run.members.reduce((sum, member) => sum + member.damage, 0) - run.totalDamage) >
          Math.max(1, run.totalDamage) * 0.000001,
    )
  )
    throw new Error('INVALID_SIMULATION_RESULT');
  const count = runs.length;
  const keys = runs[0].members.map((m) => m.key);
  return {
    samples: count,
    damage: runs.reduce((s, r) => s + r.totalDamage, 0) / count,
    dps: runs.reduce((s, r) => s + r.dps, 0) / count,
    minDps: Math.min(...runs.map((r) => r.dps)),
    maxDps: Math.max(...runs.map((r) => r.dps)),
    members: keys.map((key) => {
      const rows = runs.map((r) => r.members.find((m) => m.key === key));
      if (rows.some((r) => !r)) throw new Error('SIMULATION_MEMBER_MISMATCH');
      return {
        key,
        damage: rows.reduce((s, r) => s + r!.damage, 0) / count,
        dps: rows.reduce((s, r, i) => s + r!.damage / (runs[i].durationFrames / 60), 0) / count,
        actions: rows.reduce((s, r) => s + r!.actions, 0) / count,
        waits: rows.reduce((s, r) => s + r!.failedIntervals, 0) / count,
      };
    }),
  };
}
