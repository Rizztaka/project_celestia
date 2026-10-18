import { z } from 'zod';

import { characterKeySchema } from './character-equipment.js';

export const goalTypes = ['CHARACTER_ASCENSION', 'CHARACTER_TALENT', 'WEAPON_ASCENSION'] as const;
export const goalStatuses = ['active', 'paused', 'completed', 'archived'] as const;
export type GoalStatus = (typeof goalStatuses)[number];
export type GoalType = (typeof goalTypes)[number];
export type TalentType = 'normal' | 'skill' | 'burst';
export const goalPrioritySchema = z.number().int().min(1).max(5);
const revision = z.number().int().min(0).max(2147483646);
const range = {
  fromPhase: z.number().int().min(0).max(9),
  toPhase: z.number().int().min(1).max(10),
};
const intent = z.object({
  goalType: z.enum(goalTypes),
  targetKey: characterKeySchema,
  ...range,
  talentType: z.enum(['normal', 'skill', 'burst']).nullable().default(null),
});
function checkIntent(d: z.infer<typeof intent>, ctx: z.RefinementCtx) {
  if (d.fromPhase >= d.toPhase)
    ctx.addIssue({
      code: 'custom',
      path: ['fromPhase'],
      message: 'From must be less than target.',
    });
  if (d.goalType === 'CHARACTER_TALENT') {
    if (d.fromPhase < 1 || d.talentType === null)
      ctx.addIssue({ code: 'custom', message: 'Base talents require a slot and levels 1–10.' });
  } else if (d.talentType !== null) {
    ctx.addIssue({ code: 'custom', message: 'Only talent goals accept a talent slot.' });
  }
  if (d.goalType !== 'CHARACTER_TALENT' && (d.fromPhase > 5 || d.toPhase > 6))
    ctx.addIssue({ code: 'custom', message: 'Ascension supports phases 0–6.' });
}
export const goalIntentSchema = intent.strict().superRefine(checkIntent);
export const createGoalSchema = intent
  .extend({
    contractVersion: z.literal(3),
    requestId: z.string().uuid(),
    priority: goalPrioritySchema.default(3),
  })
  .strict()
  .superRefine(checkIntent);
export type CreateGoalRequest = z.infer<typeof createGoalSchema>;
export type GoalIntent = z.infer<typeof goalIntentSchema>;
const command = { contractVersion: z.literal(3), expectedRevision: revision };
export const goalCommandSchema = z.discriminatedUnion('action', [
  z
    .object({ ...command, action: z.literal('edit'), ...range, priority: goalPrioritySchema })
    .strict(),
  z.object({ ...command, action: z.literal('priority'), priority: goalPrioritySchema }).strict(),
  z.object({ ...command, action: z.literal('pause') }).strict(),
  z.object({ ...command, action: z.literal('resume') }).strict(),
  z.object({ ...command, action: z.literal('archive') }).strict(),
  z
    .object({
      ...command,
      action: z.literal('complete'),
      reason: z.enum(['achieved', 'good_enough']),
    })
    .strict(),
  z
    .object({ ...command, action: z.literal('successor'), ...range, priority: goalPrioritySchema })
    .strict(),
]);
export type GoalCommand = z.infer<typeof goalCommandSchema>;
export interface GoalRecord {
  id: string;
  goalType: GoalType;
  targetKey: string;
  fromPhase: number;
  toPhase: number;
  talentType: string | null;
  createdAt: string;
  updatedAt: string;
  status: GoalStatus;
  priority: number;
  revision: number;
  completedAt: string | null;
  completionReason: 'achieved' | 'good_enough' | null;
  predecessorId: string | null;
  needsReview: boolean;
  limitations: string[];
}
export interface GoalWriteResponse {
  goal: GoalRecord;
  successor: GoalRecord | null;
}
export const focusCommandSchema = z
  .object({
    contractVersion: z.literal(1),
    expectedRevision: revision,
    focused: z.boolean(),
  })
  .strict();
export type FocusCommand = z.infer<typeof focusCommandSchema>;
export interface FocusRecord {
  characterKey: string;
  focused: boolean;
  revision: number;
}
