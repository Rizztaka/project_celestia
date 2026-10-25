import type { RotationStep } from './calculator';
import { actionLabels } from './explainer';

export function describeRotation(steps: RotationStep[], names: Record<string, string>) {
  return steps.map(
    (step) =>
      `${names[step.characterKey] ?? step.characterKey}: ${actionLabels[step.action] ?? step.action}${step.repeat > 1 ? ` ×${step.repeat}` : ''}${step.params ? ` [${step.params}]` : ''}${step.waitFrames ? ` → wait ${Number((step.waitFrames / 60).toFixed(3))}s` : ''}`,
  );
}
