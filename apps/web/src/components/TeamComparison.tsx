import { useState } from 'react';

import { formIdentity } from '../lib/build-analysis/identity';
import type { MemberSelection } from '../lib/build-analysis/team.calculator';
import { analyzeTeam } from '../lib/build-analysis/team.calculator';
import type { NormalizedCharacter, TeamAnalysis } from '../lib/build-analysis/types';
import { BuildAnalysisFindings } from './BuildAnalysisFindings';
export default function TeamComparison({
  uid,
  members,
  records,
}: {
  uid: string;
  members: MemberSelection[];
  records: NormalizedCharacter[];
}) {
  const [slot, setSlot] = useState(0);
  const [candidate, setCandidate] = useState('');
  const [comparison, setComparison] = useState<{
    before: TeamAnalysis;
    after: TeamAnalysis;
  } | null>(null);
  const choices = records.filter(
    (r) =>
      !members.some(
        (m, i) =>
          i !== slot &&
          formIdentity(r) === formIdentity({ avatarId: Number(m.characterKey.split(':')[0]) }),
      ) && r.key !== members[slot]?.characterKey,
  );
  const subjects = Object.fromEntries(records.map((r) => [r.key, r.name]));
  return (
    <section className="analysis-disclosure" aria-label="Compare a teammate">
      <h3>Compare a teammate</h3>
      <p className="analysis-muted">
        Capture both lineups from the same observed records. The saved team stays unchanged.
      </p>
      <div className="analysis-controls">
        <label>
          Replace member
          <select
            value={slot}
            onChange={(e) => {
              setSlot(Number(e.target.value));
              setCandidate('');
              setComparison(null);
            }}
          >
            {members.map((m, i) => (
              <option key={m.characterKey} value={i}>
                {records.find((r) => r.key === m.characterKey)?.name ?? m.characterKey}
              </option>
            ))}
          </select>
        </label>
        <label>
          Candidate
          <select
            value={choices.some((c) => c.key === candidate) ? candidate : ''}
            onChange={(e) => {
              setCandidate(e.target.value);
              setComparison(null);
            }}
          >
            <option value="">Choose a character</option>
            {choices.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        className="button-secondary"
        disabled={!choices.some((c) => c.key === candidate) || !members.length}
        onClick={() => {
          const frozen = structuredClone(records);
          const next = members.map((m, i) =>
            i === slot ? { characterKey: candidate, roleId: 'unspecified' as const } : m,
          );
          setComparison({
            before: analyzeTeam(uid, members, frozen),
            after: analyzeTeam(uid, next, frozen),
          });
        }}
      >
        Compare change
      </button>
      {comparison ? (
        <div className="analysis-comparison-grid" aria-live="polite">
          <div>
            <h3>Original lineup</h3>
            <BuildAnalysisFindings
              findings={comparison.before.teamFindings}
              subjects={subjects}
              empty="No reviewed team interaction applies to this lineup."
            />
          </div>
          <div>
            <h3>With replacement</h3>
            <p className="analysis-muted">
              The new member has no assumed role. Choose their role in the draft to assess their
              build.
            </p>
            <BuildAnalysisFindings
              findings={comparison.after.teamFindings}
              subjects={subjects}
              empty="No reviewed team interaction applies to this lineup."
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
