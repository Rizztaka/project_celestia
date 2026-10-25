import type { ShowcaseCharacter } from '@celestia/api-contracts';
import { Link } from 'react-router-dom';

import { roleOptions } from '../lib/build-analysis/character.calculator';
import { setIdentityForItem, weaponIdentity } from '../lib/build-analysis/equipment';
import { roleLabels } from '../lib/build-analysis/explainer';
import type { AnalysisInput, BuildRoleId, CharacterAnalysis } from '../lib/build-analysis/types';
import { uidCharacterPath } from '../lib/uid-workspace';
import { BuildAnalysisComparison } from './BuildAnalysisComparison';
import { BuildAnalysisFindings } from './BuildAnalysisFindings';
import { ElementCrest, TeamPortrait } from './TeamCharacterPicker';

export default function TeamMemberBuild({
  uid,
  character,
  roleId,
  observedAt,
  analysis,
  input,
  teamId,
  onRole,
  onReplace,
}: {
  uid: string;
  character: ShowcaseCharacter;
  roleId: BuildRoleId;
  observedAt: string;
  analysis: CharacterAnalysis;
  input: AnalysisInput;
  teamId?: string;
  onRole: (role: BuildRoleId) => void;
  onReplace: () => void;
}) {
  const roles = roleOptions(character);
  const stats = ['2000', '2001', '2002', '28', '20', '22', '23'].flatMap((id) => {
    const stat = character.stats.find((s) => s.id === id);
    return stat ? [stat] : [];
  });
  const knownWeapon = character.weapon ? weaponIdentity(character.weapon.id) : null;
  return (
    <div className="team-member-workspace">
      <header className="team-member-heading">
        <div className="team-member-identity">
          <TeamPortrait key={character.portrait} character={character} />
          <div>
            <p className="team-member-element">
              <ElementCrest element={character.element} />
              {character.element ?? 'Element unknown'} · C{character.constellation}
            </p>
            <h2>{character.name}</h2>
            <p>
              Level {character.level ?? 'unknown'} · observed{' '}
              <time dateTime={observedAt}>{new Date(observedAt).toLocaleString()}</time>
            </p>
          </div>
        </div>
        <button type="button" className="button-secondary" onClick={onReplace}>
          Replace character
        </button>
      </header>
      <div className="team-role-row">
        {roles.length || roleId !== 'unspecified' ? (
          <label>
            Build role (optional)
            <select
              value={roleId}
              disabled={!roles.length && roleId === 'unspecified'}
              onChange={(e) => onRole(e.target.value as BuildRoleId)}
            >
              <option value="unspecified">
                {roles.length ? 'Choose a role' : 'General build checks'}
              </option>
              {roleId !== 'unspecified' && !roles.some((r) => r.id === roleId) ? (
                <option value={roleId}>Saved role outside current coverage</option>
              ) : null}
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {roleLabels[r.id]}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="analysis-muted">General build checks</p>
        )}
        <Link
          to={`${uidCharacterPath(uid, character.key)}${teamId ? `?team=${encodeURIComponent(teamId)}` : ''}`}
          className="team-text-link"
        >
          Full character build ↗
        </Link>
      </div>
      {roles.length ? (
        <p className="analysis-muted team-role-help">
          Optional build purpose: this changes main-stat, talent and team advice. It does not add
          damage or buffs. Choose how you actually use {character.name}.
        </p>
      ) : null}
      <dl className="team-stat-strip">
        {stats.map((s) => (
          <div key={s.id}>
            <dt>{s.name}</dt>
            <dd>{s.formatted}</dd>
          </div>
        ))}
      </dl>
      <div className="team-loadout-heading">
        <h3>Observed equipment</h3>
        <span>Recorded build</span>
      </div>
      <div className="team-equipment-grid">
        <div className="team-weapon-tile">
          {character.weapon?.icon ? (
            <img
              src={character.weapon.icon}
              width={64}
              height={64}
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <span aria-hidden="true" className="team-gear-placeholder">
              ◇
            </span>
          )}
          <div>
            <small>WEAPON</small>
            <h4>{knownWeapon?.name ?? character.weapon?.name ?? 'Weapon not reported'}</h4>
            <p>
              {character.weapon
                ? `Lv. ${character.weapon.level ?? '?'} · R${character.weapon.refinement ?? '?'}`
                : 'Details unavailable'}
            </p>
          </div>
        </div>
        {['Flower', 'Plume', 'Sands', 'Goblet', 'Circlet'].map((slot) => {
          const item = character.artifacts.find((a) => a.slot === slot);
          const set = item ? setIdentityForItem(item.id) : null;
          return (
            <div key={slot} className="team-artifact-tile">
              <small>{slot}</small>
              {item?.icon ? (
                <img src={item.icon} width={52} height={52} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span aria-hidden="true" className="team-gear-placeholder">
                  ✧
                </span>
              )}
              <strong>{item?.mainStat?.name ?? 'Not reported'}</strong>
              <span>{item?.mainStat?.formatted ?? '—'}</span>
              <p>{set?.name ?? item?.setName ?? 'Unknown set'}</p>
              {item ? <small>+{item.level ?? '?'}</small> : null}
            </div>
          );
        })}
      </div>
      <div className="team-loadout-heading">
        <h3>Build insights</h3>
        <span>
          {roleId === 'unspecified'
            ? roles.length
              ? 'Select a role to begin'
              : 'General build checks'
            : roleLabels[roleId]}
        </span>
      </div>
      <BuildAnalysisFindings findings={analysis.actions} />
      <details className="analysis-disclosure" open={!analysis.coverage.roleSupported}>
        <summary>All checks ({analysis.findings.length})</summary>
        <BuildAnalysisFindings findings={analysis.findings} />
      </details>
      {analysis.coverage.roleSupported ? <BuildAnalysisComparison input={input} /> : null}
    </div>
  );
}
