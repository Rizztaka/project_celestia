-- Repair CHECK constraints omitted by the former production prisma db push.
-- Definitions match the checked-in migrations, including four supported servers.
-- No rows are rewritten or deleted; the transaction fails if existing data is invalid.
ALTER TABLE public.genshin_routine_state
  ADD CONSTRAINT genshin_routine_state_revision_check CHECK (revision >= 0),
  ADD CONSTRAINT genshin_routine_state_server_id_check CHECK ("serverId" IS NULL OR "serverId" IN ('asia', 'america', 'europe', 'tw_hk_mo')),
  ADD CONSTRAINT genshin_routine_state_resin_pair_check CHECK (("resinAmount" IS NULL) = ("resinRecordedAt" IS NULL)),
  ADD CONSTRAINT genshin_routine_state_resin_amount_check CHECK ("resinAmount" IS NULL OR "resinAmount" BETWEEN 0 AND 200),
  ADD CONSTRAINT genshin_routine_state_weekly_claims_check CHECK ("weeklyRewardClaims" IS NULL OR "weeklyRewardClaims" BETWEEN 0 AND 1000);
ALTER TABLE public.upgrade_goals
  ADD CONSTRAINT upgrade_goals_priority_check CHECK (priority BETWEEN 1 AND 5),
  ADD CONSTRAINT upgrade_goals_revision_check CHECK (revision >= 0),
  ADD CONSTRAINT upgrade_goals_completion_check CHECK (
    ("completedAt" IS NULL AND "completionReason" IS NULL AND status <> 'completed') OR
    ("completedAt" IS NOT NULL AND "completionReason" IN ('achieved', 'good_enough') AND "completionReason" IS NOT NULL AND status IN ('completed', 'archived'))
  );
ALTER TABLE public.genshin_character_focus
  ADD CONSTRAINT genshin_character_focus_revision_check CHECK (revision >= 0);
ALTER TABLE public.genshin_plan_preferences
  ADD CONSTRAINT genshin_plan_preferences_revision_check CHECK (revision >= 0),
  ADD CONSTRAINT "genshin_plan_preferences_dailyResinBudget_check" CHECK ("dailyResinBudget" BETWEEN 0 AND 200);
ALTER TABLE public.genshin_plan_dismissals
  ADD CONSTRAINT genshin_plan_dismissals_scope_check CHECK (scope IN ('day', 'week')),
  ADD CONSTRAINT "genshin_plan_dismissals_serverId_check" CHECK ("serverId" IN ('asia', 'america', 'europe', 'tw_hk_mo')),
  ADD CONSTRAINT "genshin_plan_dismissals_periodId_check" CHECK (length("periodId") BETWEEN 1 AND 160),
  ADD CONSTRAINT "genshin_plan_dismissals_goalRevision_check" CHECK ("goalRevision" >= 0),
  ADD CONSTRAINT plan_dismissal_source CHECK (
    ("goalId" IS NOT NULL AND "goalRevision" IS NOT NULL AND "routineKind" IS NULL AND "sourceKey" = 'goal:' || "goalId") OR
    ("goalId" IS NULL AND "goalRevision" IS NULL AND "routineKind" IS NOT NULL
      AND "routineKind" IN ('commissions', 'teapot', 'transformer', 'weeklyClaims')
      AND "sourceKey" = 'routine:' || "routineKind"
      AND scope = CASE WHEN "routineKind" IN ('commissions', 'teapot') THEN 'day' ELSE 'week' END)
  );
