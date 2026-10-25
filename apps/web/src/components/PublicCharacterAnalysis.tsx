import type { ShowcaseCharacter } from '@celestia/api-contracts';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { analyzeCharacter, roleOptions } from '../lib/build-analysis/character.calculator';
import { roleLabels, statusLabels } from '../lib/build-analysis/explainer';
import { normalizeObservation } from '../lib/build-analysis/snapshot';
import { teamContext } from '../lib/build-analysis/team.calculator';
import type { AnalysisInput, BuildRoleId } from '../lib/build-analysis/types';
import { RULE_PACK_VERSION } from '../lib/build-analysis/types';
import { useUidTeams } from '../lib/build-analysis/use-teams';
import type { CharacterObservation } from '../lib/observed-roster';
import { BuildAnalysisComparison } from './BuildAnalysisComparison';
import { BuildAnalysisFindings } from './BuildAnalysisFindings';

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
  const roles = roleOptions(character);
  const requestedRole =
    localRole ??
    saved?.members.find((m) => m.characterKey === character.key)?.roleId ??
    'unspecified';
  const roleId = roles.some((r) => r.id === requestedRole) ? requestedRole : 'unspecified';
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
  const selections = saved?.members.map((m) => (m.characterKey === c.key ? { ...m, roleId } : m));
  const context = selections ? teamContext(uid, selections, normalized) : null;
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
        <span className="analysis-state">{statusLabels[analysis.status]}</span>
      </div>
      <p className="analysis-muted">
        {roles.length
          ? 'Choose how you use this character. Roles and team context are analysis assumptions.'
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
                {roles.length ? 'Choose a role' : 'General build checks'}
              </option>
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
      <h3>Next steps</h3>
      <BuildAnalysisFindings findings={analysis.actions} />
      <details className="analysis-disclosure" open={!analysis.coverage.roleSupported}>
        <summary>All build checks ({analysis.findings.length})</summary>
        <BuildAnalysisFindings findings={analysis.findings} />
      </details>
      {analysis.coverage.roleSupported ? <BuildAnalysisComparison input={input} /> : null}
      <p className="analysis-muted">
        Roles describe build purpose and guide these recommendations. They do not add damage or
        buffs. Reviewed guidance covers Furina, Sucrose, Skirk and Xilonen. Team damage is
        calculated separately from a chosen rotation on the team details page.
      </p>
    </section>
  );
}
