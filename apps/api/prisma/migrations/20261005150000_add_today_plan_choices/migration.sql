-- C4 adds user choices only; no backfill or changes to existing intent/observations.
CREATE UNIQUE INDEX "upgrade_goals_userId_id_key" ON "upgrade_goals"("userId", "id");
CREATE TABLE "genshin_plan_preferences" (
  "userId" TEXT PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "revision" INTEGER NOT NULL DEFAULT 0 CHECK ("revision" >= 0),
  "dailyResinBudget" INTEGER CHECK ("dailyResinBudget" BETWEEN 0 AND 200),
  "commissions" BOOLEAN NOT NULL DEFAULT false,
  "teapot" BOOLEAN NOT NULL DEFAULT false,
  "transformer" BOOLEAN NOT NULL DEFAULT false,
  "weeklyClaims" BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE "genshin_plan_dismissals" (
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "sourceKey" TEXT NOT NULL,
  "scope" TEXT NOT NULL CHECK ("scope" IN ('day', 'week')),
  "serverId" TEXT NOT NULL CHECK ("serverId" = 'asia'),
  "periodId" TEXT NOT NULL CHECK (length("periodId") BETWEEN 1 AND 160),
  "goalId" TEXT,
  "goalRevision" INTEGER CHECK ("goalRevision" >= 0),
  "routineKind" TEXT,
  CONSTRAINT "genshin_plan_dismissals_pkey" PRIMARY KEY ("userId", "sourceKey", "scope"),
  CONSTRAINT "genshin_plan_dismissals_userId_goalId_fkey" FOREIGN KEY ("userId", "goalId")
    REFERENCES "upgrade_goals"("userId", "id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "plan_dismissal_source" CHECK (
    ("goalId" IS NOT NULL AND "goalRevision" IS NOT NULL AND "routineKind" IS NULL
      AND "sourceKey" = 'goal:' || "goalId") OR
    ("goalId" IS NULL AND "goalRevision" IS NULL AND "routineKind" IS NOT NULL
      AND "routineKind" IN ('commissions', 'teapot', 'transformer', 'weeklyClaims')
      AND "sourceKey" = 'routine:' || "routineKind"
      AND "scope" = CASE WHEN "routineKind" IN ('commissions', 'teapot') THEN 'day' ELSE 'week' END)
  )
);
CREATE INDEX "genshin_plan_dismissals_userId_goalId_idx" ON "genshin_plan_dismissals"("userId", "goalId");
