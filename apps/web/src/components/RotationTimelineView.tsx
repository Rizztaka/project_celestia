import type { RotationStep } from '../lib/team-damage/calculator';

interface TimelineProps {
  steps: RotationStep[];
  names?: Record<string, string>;
}

const ACTION_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  burst: { bg: 'rgba(217, 119, 6, 0.25)', text: '#fbbf24', label: 'Burst' },
  skill: { bg: 'rgba(6, 182, 212, 0.25)', text: '#38bdf8', label: 'Skill' },
  attack: { bg: 'rgba(148, 163, 184, 0.2)', text: '#e2e8f0', label: 'Normal' },
  charge: { bg: 'rgba(245, 158, 11, 0.25)', text: '#fde047', label: 'Charged' },
  high_plunge: { bg: 'rgba(16, 185, 129, 0.25)', text: '#34d399', label: 'Plunge' },
  low_plunge: { bg: 'rgba(16, 185, 129, 0.25)', text: '#34d399', label: 'Plunge' },
};

export default function RotationTimelineView({ steps, names = {} }: TimelineProps) {
  if (!steps.length) return null;

  return (
    <div className="rotation-timeline-wrapper">
      <div className="rotation-timeline-header">
        <span className="rotation-timeline-title">Synthesized Defensible Rotation ({steps.length} steps)</span>
      </div>
      <div className="rotation-timeline-scroll" role="list" aria-label="Rotation timeline">
        {steps.map((step, idx) => {
          const config = ACTION_COLORS[step.action] ?? {
            bg: 'rgba(100, 116, 139, 0.2)',
            text: '#cbd5e1',
            label: step.action,
          };
          const charName = names[step.characterKey] ?? step.characterKey.split(':')[0];

          return (
            <div
              key={`${step.characterKey}-${step.action}-${idx}`}
              className="rotation-timeline-step"
              role="listitem"
            >
              <span className="step-char-name" title={charName}>
                {charName}
              </span>
              <span
                className="step-action-badge"
                style={{ backgroundColor: config.bg, color: config.text, borderColor: config.text }}
              >
                {config.label}
                {step.repeat > 1 ? ` ×${step.repeat}` : ''}
              </span>
              {step.params ? <span className="step-params-tag">{step.params}</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
