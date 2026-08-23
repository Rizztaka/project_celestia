-- CreateEnum
CREATE TYPE "TheaterDifficulty" AS ENUM ('EASY', 'NORMAL', 'HARD', 'VISIONARY');

-- CreateTable
CREATE TABLE "imaginarium_theater_runs" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "difficulty" "TheaterDifficulty" NOT NULL,
    "actsCleared" INTEGER NOT NULL,
    "stars" INTEGER NOT NULL,
    "cast" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imaginarium_theater_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "imaginarium_theater_runs_accountId_seasonId_key" ON "imaginarium_theater_runs"("accountId", "seasonId");

-- AddForeignKey
ALTER TABLE "imaginarium_theater_runs" ADD CONSTRAINT "imaginarium_theater_runs_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "genshin_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
