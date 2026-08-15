-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('CHARACTER_ASCENSION', 'CHARACTER_TALENT', 'WEAPON_ASCENSION');

-- CreateTable
CREATE TABLE "genshin_materials" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genshin_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upgrade_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "goalType" "GoalType" NOT NULL,
    "targetKey" TEXT NOT NULL,
    "fromPhase" INTEGER NOT NULL,
    "toPhase" INTEGER NOT NULL,
    "talentType" TEXT,

    CONSTRAINT "upgrade_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "genshin_materials_accountId_itemKey_key" ON "genshin_materials"("accountId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "upgrade_goals_userId_goalType_targetKey_talentType_key" ON "upgrade_goals"("userId", "goalType", "targetKey", "talentType");

-- AddForeignKey
ALTER TABLE "genshin_materials" ADD CONSTRAINT "genshin_materials_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "genshin_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upgrade_goals" ADD CONSTRAINT "upgrade_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
