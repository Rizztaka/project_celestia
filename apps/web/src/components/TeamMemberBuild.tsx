import {
  type ShowcaseCharacter,
  teamCharacterIdentity,
  type TeamSearchPreferences,
} from '@celestia/api-contracts';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { roleOptions } from '../lib/build-analysis/character.calculator';
import { setIdentityForItem, weaponIdentity } from '../lib/build-analysis/equipment';
import { roleLabels } from '../lib/build-analysis/explainer';
import type { AnalysisInput, BuildRoleId, CharacterAnalysis } from '../lib/build-analysis/types';
import { writeTeamPreferences } from '../lib/team-preferences';
import { uidCharacterPath } from '../lib/uid-workspace';
import { useCharacterReadiness, useMarginalInvestment } from '../lib/use-character-readiness';
import { useTeamPreferences } from '../lib/use-team-preferences';
import { useAuthStore } from '../stores/auth.store';
import { BuildAnalysisComparison } from './BuildAnalysisComparison';
import { BuildAnalysisFindings } from './BuildAnalysisFindings';
import ContextualReadinessBadge from './ContextualReadinessBadge';
import MarginalUpgradeCard from './MarginalUpgradeCard';
import ReadinessDimensionsList from './ReadinessDimensionsList';
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
  compact = false,
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
  compact?: boolean;
}) {
  const roles = roleOptions(character);
  const stats = ['2000', '2001', '2002', '28', '20', '22', '23'].flatMap((id) => {
    const stat = character.stats.find((s) => s.id === id);
    return stat ? [stat] : [];
  });
  const knownWeapon = character.weapon ? weaponIdentity(character.weapon.id) : null;
  const Equipment = compact ? 'details' : 'div';

  const ownerId = useAuthStore((state) => state.user?.id ?? null);
  const preferenceScope = useMemo(() => ({ ownerId, accountId: null }), [ownerId]);
  const { preferences, saveAuthenticated, raw, isServerBacked, revision } = useTeamPreferences(
    uid,
    preferenceScope,
  );
  const charIdentity = teamCharacterIdentity(character.id);
  const isGoodEnough = preferences.goodEnoughCharacters?.includes(charIdentity) ?? false;

  const toggleGoodEnough = async () => {
    const currentList = preferences.goodEnoughCharacters ?? [];
    const nextList = currentList.includes(charIdentity)
      ? currentList.filter((id) => id !== charIdentity)
      : [...currentList, charIdentity];
    const nextPreferences: TeamSearchPreferences = {
      ...preferences,
      goodEnoughCharacters: nextList,
    };
    try {
      if (isServerBacked) {
        await saveAuthenticated(nextPreferences, revision);
      } else {
        writeTeamPreferences(uid, nextPreferences, raw, undefined, preferenceScope);
      }
    } catch {
      // Handled gracefully
    }
  };

  const teamEnergyContext = useMemo(() => {
    if (!input.team) return undefined;
    const partyMembers = input.team.members.map((m) => m.characterKey);
    const sameElementCount = input.team.members.filter(
      (m) => m.element === character.element,
    ).length;
    const favoniusWeaponCount = input.team.members.filter(
      (m) =>
        m.character?.weapon?.name?.toLowerCase().includes('favonius') ||
        m.character?.weapon?.referenceKey?.toLowerCase().includes('favonius'),
    ).length;
    return {
      partyMembers,
      sameElementCount: Math.max(1, sameElementCount),
      favoniusWeaponCount,
      particlesPerRotation: 15,
      rotationLengthSeconds: 20,
    };
  }, [input.team, character.element]);

  const roleForReadiness =
    roleId !== 'unspecified' && roleId !== 'general_checks'
      ? roleId
      : roles.length > 0
        ? roles[0].id
        : undefined;

  const readiness = useCharacterReadiness(character, {
    roleId: roleForReadiness,
    encounterId: 'abyss_12',
    difficulty: 'abyss_12',
    teamEnergyContext,
  });
  const marginal = useMarginalInvestment(character, {
    roleId: roleForReadiness,
    encounterId: 'abyss_12',
    difficulty: 'abyss_12',
    teamEnergyContext,
  });

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
            {readiness.data && (
              <div
                className="team-readiness-row"
                style={{
                  marginTop: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <ContextualReadinessBadge
                  status={readiness.data.status}
                  score={readiness.data.score}
                  isGoodEnough={isGoodEnough}
                />
                <button
                  type="button"
                  className="button-secondary"
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '1rem' }}
                  onClick={toggleGoodEnough}
                  title="Mark this character build as Good Enough to mute high-urgency farming alerts"
                >
                  {isGoodEnough ? '★ Marked Good Enough' : '☆ Mark as Good Enough'}
                </button>
              </div>
            )}
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
                {roles.length ? 'Automatic reviewed role' : 'General build checks'}
              </option>
              <option value="general_checks">General checks only · different playstyle</option>
              {roleId !== 'unspecified' &&
              roleId !== 'general_checks' &&
              !roles.some((r) => r.id === roleId) ? (
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
      {roles.length && !compact ? (
        <p className="analysis-muted team-role-help">
          Optional build purpose: this changes main-stat, talent and team advice. It does not add
          damage or buffs.{' '}
          {analysis.roleAssumed
            ? `Current default: ${roleLabels[analysis.roleId]}. Change it if you use a different playstyle.`
            : `Choose how you actually use ${character.name}.`}
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
      <Equipment className="team-member-full-build">
        {compact ? (
          <summary>
            Equipment & build advice <span aria-hidden="true">＋</span>
          </summary>
        ) : null}
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
          <h3>Build insights & Readiness</h3>
          <span>
            {roleId === 'unspecified'
              ? analysis.coverage.roleSupported
                ? `Default: ${roleLabels[analysis.roleId]}`
                : 'General build checks'
              : roleLabels[roleId]}
          </span>
        </div>
        {readiness.data?.dimensions && (
          <div style={{ marginBlock: '0.75rem' }}>
            <ReadinessDimensionsList
              dimensions={readiness.data.dimensions}
              explanations={readiness.data.explanations}
            />
          </div>
        )}
        <div style={{ marginBlock: '0.75rem' }}>
          <MarginalUpgradeCard
            marginalData={marginal.data}
            isLoading={marginal.isLoading}
            isGoodEnough={isGoodEnough}
          />
        </div>
        {isGoodEnough ? (
          <details className="analysis-disclosure" open={false}>
            <summary>
              High-urgency farming alerts ({analysis.actions.length}) · Muted (Good Enough)
            </summary>
            <BuildAnalysisFindings findings={analysis.actions} />
          </details>
        ) : (
          <BuildAnalysisFindings findings={analysis.actions} />
        )}
        <details className="analysis-disclosure" open={!analysis.coverage.roleSupported}>
          <summary>All checks ({analysis.findings.length})</summary>
          <BuildAnalysisFindings findings={analysis.findings} />
        </details>
        {analysis.coverage.roleSupported ? <BuildAnalysisComparison input={input} /> : null}
      </Equipment>
    </div>
  );
}
