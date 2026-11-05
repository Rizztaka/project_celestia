CREATE TABLE "genshin_team_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "uid" TEXT,
    "accountId" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genshin_team_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "genshin_team_preferences_userId_scopeKey_key"
ON "genshin_team_preferences"("userId", "scopeKey");
CREATE INDEX "genshin_team_preferences_userId_idx"
ON "genshin_team_preferences"("userId");
ALTER TABLE "genshin_team_preferences"
ADD CONSTRAINT "genshin_team_preferences_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "genshin_team_preferences"
ADD CONSTRAINT "genshin_team_preferences_revision_check" CHECK ("revision" >= 0);
