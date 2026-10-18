import type { PlanRoutineKind } from '@celestia/api-contracts';

export const routineLabels: Record<PlanRoutineKind, string> = {
  commissions: 'Daily commissions',
  teapot: 'Check Teapot',
  transformer: 'Transformer manual record',
  weeklyClaims: 'Weekly reward claims',
};
export const planButton =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 px-3 py-2 text-sm text-indigo-100 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:opacity-40';
