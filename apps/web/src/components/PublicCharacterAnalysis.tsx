import {
  type ShowcaseCharacter,
  teamCharacterIdentity,
  type TeamSearchPreferences,
} from '@celestia/api-contracts';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { analyzeCharacter, roleOptions } from '../lib/build-analysis/character.calculator';
import { roleLabels, statusLabels } from '../lib/build-analysis/explainer';
import { profileForCharacter, reviewedProfiles } from '../lib/build-analysis/identity';
import { normalizeObservation } from '../lib/build-analysis/snapshot';
import { teamContext } from '../lib/build-analysis/team.calculator';
import type { AnalysisInput, BuildRoleId } from '../lib/build-analysis/types';
import { RULE_PACK_VERSION } from '../lib/build-analysis/types';
import { useUidTeams } from '../lib/build-analysis/use-teams';
import type { CharacterObservation } from '../lib/observed-roster';
import { writeTeamPreferences } from '../lib/team-preferences';
import { useCharacterReadiness, useMarginalInvestment } from '../lib/use-character-readiness';
import { useTeamPreferences } from '../lib/use-team-preferences';
import { useAuthStore } from '../stores/auth.store';
import { BuildAnalysisComparison } from './BuildAnalysisComparison';
import { BuildAnalysisFindings } from './BuildAnalysisFindings';
import { CharacterGuideCard } from './CharacterGuideCard';
import ContextualReadinessBadge from './ContextualReadinessBadge';
import MarginalUpgradeCard from './MarginalUpgradeCard';
import ReadinessDimensionsList from './ReadinessDimensionsList';

export default function PublicCharacterAnalysis({
  uid,
  character,
  records,
}: {
  uid: string;
  character: ShowcaseCharacter;
  records: CharacterObservation[];
}) {
  const [params, setParams] = useSearchParams();
  const teams = useUidTeams(uid);
  const [localRole, setLocalRole] = useState<BuildRoleId | null>(null);
  const teamId = params.get('team');
  const saved = teams.data?.find(
    (t) => t.id === teamId && t.members.some((m) => m.characterKey === character.key),
  );
  const normalized = useMemo(
    () => records.filter((r) => r.uid === uid).map(normalizeObservation),
    [records, uid],
  );
  const c = normalized.find((r) => r.key === character.key);
  const reviewedProfile = c ? profileForCharacter(c.avatarId, c.skillDepotId) : null;
  const roles = roleOptions(character);
  const requestedRole =
    localRole ??
    saved?.members.find((m) => m.characterKey === character.key)?.roleId ??
    'unspecified';
  const roleId =
    requestedRole === 'general_checks' || roles.some((r) => r.id === requestedRole)
      ? requestedRole
      : 'unspecified';

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

  const selections = saved?.members.map((m) => (m.characterKey === c?.key ? { ...m, roleId } : m));
  const context = selections && c ? teamContext(uid, selections, normalized) : null;

  const teamEnergyContext = useMemo(() => {
    if (!context || !c) return undefined;
    const partyMembers = context.members.map((m) => m.characterKey);
    const sameElementCount = context.members.filter((m) => m.element === c.element).length;
    const favoniusWeaponCount = context.members.filter(
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
  }, [context, c]);

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

  if (!c)
    return (
      <section className="build-panel">
        <h2>Build analysis</h2>
        <p>
          There is no successful observation timestamp for this build. Existing details remain
          available; refresh the showcase when possible.
        </p>
      </section>
    );
  const input: AnalysisInput = {
    rulePackVersion: RULE_PACK_VERSION,
    uid,
    character: c,
    roleId,
    team: context,
    hypothesis: null,
  };
  const analysis = analyzeCharacter(input);

  return (
    <section className="build-panel build-analysis" aria-label="Character build analysis">
      <div className="analysis-section-heading">
        <div>
          <p className="build-kicker">UNDERSTAND THIS BUILD</p>
          <h2>Build analysis</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {readiness.data && (
            <ContextualReadinessBadge
              status={readiness.data.status}
              score={readiness.data.score}
              isGoodEnough={isGoodEnough}
            />
          )}
          <button
            type="button"
            className="button-secondary rounded-full px-3 py-1 text-xs font-medium transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            onClick={toggleGoodEnough}
            title="Mark this character build as Good Enough to mute high-urgency farming alerts"
          >
            {isGoodEnough ? '★ Marked Good Enough' : '☆ Mark as Good Enough'}
          </button>
          <span className="analysis-state">{statusLabels[analysis.status]}</span>
        </div>
      </div>
      <p className="analysis-muted">
        {roleId === 'general_checks'
          ? 'General equipment checks selected. Automatic role assumptions are disabled.'
          : analysis.coverage.roleSupported
            ? analysis.roleAssumed
              ? `Using the reviewed default role: ${roleLabels[analysis.roleId]}. Change it for a different playstyle. Role and team context are assumptions.`
              : 'Using your selected role. Role and team context are analysis assumptions.'
            : 'Tailored role guidance is not reviewed for this build yet. General equipment checks remain available.'}{' '}
        Last observed <time dateTime={c.observedAt}>{new Date(c.observedAt).toLocaleString()}</time>
        .
      </p>
      <div className="analysis-controls">
        {roles.length ? (
          <label>
            Build role (optional)
            <select
              value={roleId}
              disabled={!roles.length}
              onChange={(e) => setLocalRole(e.target.value as BuildRoleId)}
            >
              <option value="unspecified">
                {roles.length ? 'Automatic reviewed role' : 'General build checks'}
              </option>
              <option value="general_checks">General checks only · different playstyle</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {roleLabels[r.id]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label>
          Team context
          <select
            value={saved?.id ?? ''}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              if (e.target.value) next.set('team', e.target.value);
              else next.delete('team');
              setLocalRole(null);
              setParams(next);
            }}
          >
            <option value="">Standalone build</option>
            {teams.data
              ?.filter((t) => t.members.some((m) => m.characterKey === c.key))
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </label>
      </div>
      {teamId && !saved ? (
        <p role="status">
          This local team is unavailable here or does not include this character. Standalone
          analysis is shown.
        </p>
      ) : null}
      {teams.isError ? (
        <p role="status">Saved team context could not load. Existing records were preserved.</p>
      ) : null}
      {saved ? (
        <Link className="analysis-link" to={`/u/${uid}/teams/${encodeURIComponent(saved.id)}`}>
          ← Return to {saved.name}
        </Link>
      ) : (
        <Link className="analysis-link" to={`/u/${uid}/teams`}>
          Build a team →
        </Link>
      )}
      {context &&
      new Set(context.members.flatMap((m) => (m.character ? [m.character.observedAt] : []))).size >
        1 ? (
        <p className="analysis-notice">
          This team combines builds observed at different times; it is not a simultaneous in-game
          snapshot.
        </p>
      ) : null}
      {readiness.data?.dimensions && (
        <div className="my-4">
          <ReadinessDimensionsList
            dimensions={readiness.data.dimensions}
            explanations={readiness.data.explanations}
          />
        </div>
      )}
      <div className="my-4">
        <MarginalUpgradeCard
          marginalData={marginal.data}
          isLoading={marginal.isLoading}
          isGoodEnough={isGoodEnough}
        />
      </div>
      {reviewedProfile && (
        <CharacterGuideCard profile={reviewedProfile} currentRoleId={analysis.roleId} />
      )}
      <h3>Next steps</h3>
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
        <summary>All build checks ({analysis.findings.length})</summary>
        <BuildAnalysisFindings findings={analysis.findings} />
      </details>
      {analysis.coverage.roleSupported ? <BuildAnalysisComparison input={input} /> : null}
      <p className="analysis-muted">
        Roles describe build purpose and guide these recommendations. They do not add damage or
        buffs. Reviewed guidance covers selected patterns for {reviewedProfiles.length} characters.
        Team damage is calculated separately from a chosen rotation on the team details page.
      </p>
    </section>
  );
}
