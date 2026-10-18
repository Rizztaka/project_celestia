-- Preserve every original row/field/timestamp, including malformed and duplicate intent.
CREATE TYPE "GoalStatus" AS ENUM ('active', 'paused', 'completed', 'archived');
ALTER TABLE "upgrade_goals"
  ADD COLUMN "status" "GoalStatus" NOT NULL DEFAULT 'active',
  ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "completionReason" TEXT,
  ADD COLUMN "createRequestId" TEXT,
  ADD COLUMN "predecessorId" TEXT;
DROP INDEX "upgrade_goals_userId_goalType_targetKey_talentType_key";
CREATE UNIQUE INDEX "upgrade_goals_userId_createRequestId_key" ON "upgrade_goals"("userId", "createRequestId");
CREATE UNIQUE INDEX "upgrade_goals_predecessorId_key" ON "upgrade_goals"("predecessorId");
CREATE INDEX "upgrade_goals_userId_status_priority_createdAt_id_idx" ON "upgrade_goals"("userId", "status", "priority", "createdAt", "id");
ALTER TABLE "upgrade_goals"
  ADD CONSTRAINT "upgrade_goals_predecessorId_fkey" FOREIGN KEY ("predecessorId") REFERENCES "upgrade_goals"("id") ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT "upgrade_goals_priority_check" CHECK ("priority" BETWEEN 1 AND 5),
  ADD CONSTRAINT "upgrade_goals_revision_check" CHECK ("revision" >= 0),
  ADD CONSTRAINT "upgrade_goals_completion_check" CHECK (
    ("completedAt" IS NULL AND "completionReason" IS NULL AND "status" <> 'completed') OR
    ("completedAt" IS NOT NULL AND "completionReason" IN ('achieved', 'good_enough') AND "completionReason" IS NOT NULL AND "status" IN ('completed', 'archived'))
  );
CREATE TABLE "genshin_character_focus" (
  "accountId" TEXT NOT NULL,
  "characterKey" TEXT NOT NULL,
  "focused" BOOLEAN NOT NULL DEFAULT false,
  "revision" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "genshin_character_focus_pkey" PRIMARY KEY ("accountId", "characterKey"),
  CONSTRAINT "genshin_character_focus_revision_check" CHECK ("revision" >= 0),
  CONSTRAINT "genshin_character_focus_accountId_characterKey_fkey" FOREIGN KEY ("accountId", "characterKey") REFERENCES "genshin_characters"("accountId", "characterKey") ON DELETE CASCADE ON UPDATE CASCADE
);
