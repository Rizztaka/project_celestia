-- CreateTable
CREATE TABLE "weekly_boss_state" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defeatedBossKeys" JSONB NOT NULL DEFAULT '[]',
    "weeklyResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_boss_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_boss_state_userId_key" ON "weekly_boss_state"("userId");

-- AddForeignKey
ALTER TABLE "weekly_boss_state" ADD CONSTRAINT "weekly_boss_state_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
