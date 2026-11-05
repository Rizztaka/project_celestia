import type { RotationStep } from '../lib/team-damage/calculator';
import { rotationExecution } from '../lib/team-damage/execution.calculator';
import { explainRotationExecution } from '../lib/team-damage/explainer';
import type { DamageResult } from '../lib/team-damage/service';

export default function RotationExecutionEvidence({
  result,
  steps,
  names,
}: {
  result: DamageResult;
  steps: RotationStep[];
  names: Record<string, string>;
}) {
  return (
    <details className="analysis-disclosure rotation-execution-evidence">
      <summary>Rotation execution and energy</summary>
      <p className="analysis-muted">
        Average counts per sample. Retry checks can occur repeatedly while one action waits; they
        are not seconds or missed Bursts. This test starts at full energy and does not assess
        survival.
      </p>
      <div className="rotation-execution-grid">
        {rotationExecution(result, steps).map((evidence) => (
          <section
            className="rotation-execution-member"
            key={evidence.key}
            aria-label={`${names[evidence.key] ?? evidence.key} rotation evidence`}
          >
            <strong>{names[evidence.key] ?? evidence.key}</strong>
            {evidence.burstCount !== null ? (
              <p>
                {evidence.burstCount.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                {evidence.burstCount === 1 ? 'Burst' : 'Bursts'} executed per sample.
              </p>
            ) : null}
            {explainRotationExecution(evidence).map((message) => (
              <p key={message}>{message}</p>
            ))}
          </section>
        ))}
      </div>
    </details>
  );
}
