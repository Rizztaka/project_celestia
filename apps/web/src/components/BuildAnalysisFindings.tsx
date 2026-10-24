import { explainFinding } from '../lib/build-analysis/explainer';
import type { Finding } from '../lib/build-analysis/types';

export function BuildAnalysisFindings({
  findings,
  empty = 'No supported change was identified.',
  subjects,
}: {
  findings: Finding[];
  empty?: string;
  subjects?: Record<string, string>;
}) {
  if (!findings.length) return <p className="analysis-muted">{empty}</p>;
  return (
    <ul className="analysis-findings">
      {findings.map((finding) => {
        const copy = explainFinding(finding);
        return (
          <li
            key={`${finding.characterKey}:${finding.ruleId}`}
            className={`analysis-finding analysis-${finding.status}`}
          >
            <div className="analysis-finding-heading">
              <h4>
                {finding.characterKey && subjects?.[finding.characterKey]
                  ? `${subjects[finding.characterKey]} · `
                  : ''}
                {copy.title}
              </h4>
              <span className="analysis-state">{copy.status}</span>
            </div>
            <p>{copy.explanation}</p>
            {finding.teamDependent ? <small>Uses the selected team context.</small> : null}
            {finding.hypothesisDependent ? (
              <small>Hypothetical choice; recorded gear is unchanged.</small>
            ) : null}
            {copy.sources.length ? (
              <p className="analysis-source">
                Reference:{' '}
                {copy.sources.map((s) => (
                  <a key={s.id} href={s.url} target="_blank" rel="noreferrer">
                    {s.title}
                  </a>
                ))}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
