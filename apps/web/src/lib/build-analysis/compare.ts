import { analyzeCharacter } from './character.calculator';
import type { AnalysisInput, CharacterAnalysis, Hypothesis } from './types';

export function changedFindings(before: CharacterAnalysis, after: CharacterAnalysis) {
  return after.findings.filter((f) => {
    const previous = before.findings.find((p) => p.ruleId === f.ruleId);
    return (
      !previous ||
      previous.condition !== f.condition ||
      previous.status !== f.status ||
      JSON.stringify(previous.values) !== JSON.stringify(f.values)
    );
  });
}
export function compareCharacter(input: AnalysisInput, hypothesis: Hypothesis) {
  const before = analyzeCharacter({ ...input, hypothesis: null });
  const after = analyzeCharacter({ ...input, hypothesis });
  return { before, after, changed: changedFindings(before, after) };
}
